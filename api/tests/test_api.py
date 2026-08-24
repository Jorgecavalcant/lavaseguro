"""Testes MVP LavaSeguro — fluxo sem foto + reclamação opcional com foto."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine, init_db
from app.main import app


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_fluxo_atendimento_sem_foto(client: TestClient):
    # seed serviços
    client.post("/api/v1/seed")
    servicos = client.get("/api/v1/servicos").json()
    assert len(servicos) >= 1
    servico_id = servicos[0]["id"]

    lav = client.post("/api/v1/lavadores", json={"nome": "João", "comissao_pct": 40}).json()
    pin = client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia").json()
    assert len(pin["pin"]) == 4
    assert pin["qr_payload"].startswith("lavaseguro://pin/")

    auth = client.post("/api/v1/auth/pin", json={"pin": pin["pin"]})
    assert auth.status_code == 200

    # criar atendimento — sem foto
    body = {"placa": "ABC1D23", "servico_id": servico_id, "lavador_id": lav["id"]}
    assert "foto" not in body
    at = client.post("/api/v1/atendimentos", json=body)
    assert at.status_code == 201
    data = at.json()
    assert data["status"] == "na_fila"
    assert data["placa"] == "ABC1D23"

    aid = data["id"]
    assert client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "lavando"}).status_code == 200
    assert client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "pronto"}).status_code == 200

    providers = client.get("/api/v1/payments/providers").json()
    assert "manual" in providers["providers"]

    pay = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
    )
    assert pay.status_code == 200
    assert pay.json()["status"] == "pago"
    assert "manual" in (pay.json().get("meio_pagamento") or "")

    caixa = client.get("/api/v1/caixa/dia").json()
    assert caixa["total_pagos"] == 1
    assert caixa["bruto_centavos"] == servicos[0]["preco_centavos"]
    assert caixa["comissao_centavos"] == servicos[0]["preco_centavos"] * 40 // 100


def test_reclamacao_foto_opcional(client: TestClient):
    client.post("/api/v1/seed")
    servico_id = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "XYZ9Z99", "servico_id": servico_id},
    ).json()

    sem_foto = client.post(
        "/api/v1/reclamacoes",
        json={"atendimento_id": at["id"], "texto": "Arranhão na porta"},
    )
    assert sem_foto.status_code == 201
    assert sem_foto.json()["foto_url"] is None

    com_foto = client.post(
        "/api/v1/reclamacoes",
        json={
            "atendimento_id": at["id"],
            "texto": "Mesmo caso com prova",
            "foto_url": "https://example.com/foto.jpg",
        },
    )
    assert com_foto.status_code == 201
    assert com_foto.json()["foto_url"] == "https://example.com/foto.jpg"


def test_crud_servicos(client: TestClient):
    r = client.post(
        "/api/v1/servicos",
        json={"nome": "Teste", "preco_centavos": 1000},
    )
    assert r.status_code == 201
    sid = r.json()["id"]
    assert client.patch(f"/api/v1/servicos/{sid}", json={"preco_centavos": 1500}).json()[
        "preco_centavos"
    ] == 1500
    assert client.delete(f"/api/v1/servicos/{sid}").status_code == 204


def test_seed_cria_lavador_demo(client: TestClient):
    r = client.post("/api/v1/seed")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    lavs = client.get("/api/v1/lavadores").json()
    assert any(l["nome"] == "Lavador Demo" for l in lavs)
    # idempotente
    r2 = client.post("/api/v1/seed")
    assert r2.json()["lavadores_criados"] == 0


def test_transicao_invalida(client: TestClient):
    client.post("/api/v1/seed")
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post("/api/v1/atendimentos", json={"placa": "AAA1A11", "servico_id": sid}).json()
    # na_fila -> pronto inválido
    r = client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pronto"})
    assert r.status_code in (400, 422)
    # cancelado a partir de pronto inválido
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "lavando"})
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pronto"})
    r = client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "cancelado"})
    assert r.status_code in (400, 422)


def test_payment_exige_status_pronto(client: TestClient):
    client.post("/api/v1/seed")
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    lav = client.post("/api/v1/lavadores", json={"nome": "Xico", "comissao_pct": 30}).json()
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "PAY0001", "servico_id": sid, "lavador_id": lav["id"]},
    ).json()
    aid = at["id"]
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
    )
    assert r.status_code in (400, 422)
    client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "lavando"})
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
    )
    assert r.status_code in (400, 422)
    client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "pronto"})
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "pago"
