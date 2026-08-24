"""Testes MVP LavaSeguro — fluxo sem foto + reclamação opcional com foto.

Mutações exigem autenticação (Bearer JWT via /api/v1/auth/pin ou X-Pin).
"""

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


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Seed -> Lavador Demo -> pin-do-dia -> /auth/pin -> Bearer token."""
    client.post("/api/v1/seed")
    lavs = client.get("/api/v1/lavadores").json()
    demo = next(l for l in lavs if l["nome"] == "Lavador Demo")
    pin = client.post(f"/api/v1/lavadores/{demo['id']}/pin-do-dia").json()["pin"]
    r = client.post("/api/v1/auth/pin", json={"pin": pin})
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_fluxo_atendimento_sem_foto(client: TestClient, auth_headers: dict[str, str]):
    servicos = client.get("/api/v1/servicos").json()
    assert len(servicos) >= 1
    servico_id = servicos[0]["id"]

    lav = client.post(
        "/api/v1/lavadores",
        json={"nome": "João", "comissao_pct": 40},
        headers=auth_headers,
    ).json()
    pin = client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia").json()
    assert len(pin["pin"]) == 4
    assert pin["qr_payload"].startswith("lavaseguro://pin/")

    auth = client.post("/api/v1/auth/pin", json={"pin": pin["pin"]})
    assert auth.status_code == 200

    # criar atendimento — sem foto
    body = {"placa": "ABC1D23", "servico_id": servico_id, "lavador_id": lav["id"]}
    assert "foto" not in body
    at = client.post("/api/v1/atendimentos", json=body, headers=auth_headers)
    assert at.status_code == 201
    data = at.json()
    assert data["status"] == "na_fila"
    assert data["placa"] == "ABC1D23"

    aid = data["id"]
    assert (
        client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "lavando"}, headers=auth_headers).status_code
        == 200
    )
    assert (
        client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "pronto"}, headers=auth_headers).status_code
        == 200
    )

    providers = client.get("/api/v1/payments/providers").json()
    assert "manual" in providers["providers"]

    pay = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
        headers=auth_headers,
    )
    assert pay.status_code == 200
    assert pay.json()["status"] == "pago"
    assert "manual" in (pay.json().get("meio_pagamento") or "")

    caixa = client.get("/api/v1/caixa/dia").json()
    assert caixa["total_pagos"] == 1
    assert caixa["bruto_centavos"] == servicos[0]["preco_centavos"]
    assert caixa["comissao_centavos"] == servicos[0]["preco_centavos"] * 40 // 100


def test_criar_atendimento_vincula_lavador_do_token(client: TestClient, auth_headers: dict[str, str]):
    """POST sem lavador_id no body deve vincular o lavador autenticado (token/PIN)."""
    client.post("/api/v1/seed")
    lavs = client.get("/api/v1/lavadores").json()
    demo = next(l for l in lavs if l["nome"] == "Lavador Demo")
    sid = client.get("/api/v1/servicos").json()[0]["id"]

    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "TOK0E01", "servico_id": sid},
        headers=auth_headers,
    )
    assert at.status_code == 201
    data = at.json()
    assert data["lavador_id"] == demo["id"]


def test_reclamacao_foto_opcional(client: TestClient, auth_headers: dict[str, str]):
    servico_id = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "XYZ9Z99", "servico_id": servico_id},
        headers=auth_headers,
    ).json()

    sem_foto = client.post(
        "/api/v1/reclamacoes",
        json={"atendimento_id": at["id"], "texto": "Arranhão na porta"},
        headers=auth_headers,
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
        headers=auth_headers,
    )
    assert com_foto.status_code == 201
    assert com_foto.json()["foto_url"] == "https://example.com/foto.jpg"


def test_crud_servicos(client: TestClient, auth_headers: dict[str, str]):
    r = client.post(
        "/api/v1/servicos",
        json={"nome": "Teste", "preco_centavos": 1000},
        headers=auth_headers,
    )
    assert r.status_code == 201
    sid = r.json()["id"]
    assert client.patch(f"/api/v1/servicos/{sid}", json={"preco_centavos": 1500}, headers=auth_headers).json()[
        "preco_centavos"
    ] == 1500
    assert client.delete(f"/api/v1/servicos/{sid}", headers=auth_headers).status_code == 204


def test_seed_cria_lavador_demo(client: TestClient, auth_headers: dict[str, str]):
    r = client.post("/api/v1/seed")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    lavs = client.get("/api/v1/lavadores").json()
    assert any(l["nome"] == "Lavador Demo" for l in lavs)
    # idempotente
    r2 = client.post("/api/v1/seed")
    assert r2.json()["lavadores_criados"] == 0


def test_transicao_invalida(client: TestClient, auth_headers: dict[str, str]):
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "AAA1A11", "servico_id": sid},
        headers=auth_headers,
    ).json()
    # na_fila -> pronto inválido
    r = client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pronto"}, headers=auth_headers)
    assert r.status_code in (400, 422)
    # cancelado a partir de pronto inválido
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "lavando"}, headers=auth_headers)
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pronto"}, headers=auth_headers)
    r = client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "cancelado"}, headers=auth_headers)
    assert r.status_code in (400, 422)


def test_payment_exige_status_pronto(client: TestClient, auth_headers: dict[str, str]):
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    lav = client.post(
        "/api/v1/lavadores",
        json={"nome": "Xico", "comissao_pct": 30},
        headers=auth_headers,
    ).json()
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "PAY0001", "servico_id": sid, "lavador_id": lav["id"]},
        headers=auth_headers,
    ).json()
    aid = at["id"]
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
        headers=auth_headers,
    )
    assert r.status_code in (400, 422)
    client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "lavando"}, headers=auth_headers)
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
        headers=auth_headers,
    )
    assert r.status_code in (400, 422)
    client.patch(f"/api/v1/atendimentos/{aid}/status", json={"status": "pronto"}, headers=auth_headers)
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": aid, "meio": "pix", "provider": "manual"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "pago"


def test_mutacao_sem_auth_401(client: TestClient):
    """Toda mutação protegida deve retornar 401 sem Authorization/X-Pin."""
    client.post("/api/v1/seed")
    sid = client.get("/api/v1/servicos").json()[0]["id"]

    assert client.post("/api/v1/atendimentos", json={"placa": "AAA0000", "servico_id": sid}).status_code == 401
    assert client.patch("/api/v1/atendimentos/1/status", json={"status": "lavando"}).status_code == 401
    assert client.post("/api/v1/payments/charge", json={"atendimento_id": 1, "meio": "pix"}).status_code == 401
    assert client.post("/api/v1/payments/stub", json={"atendimento_id": 1, "meio": "pix"}).status_code == 401
    assert client.post("/api/v1/servicos", json={"nome": "X", "preco_centavos": 100}).status_code == 401
    assert client.patch("/api/v1/servicos/1", json={"preco_centavos": 200}).status_code == 401
    assert client.delete("/api/v1/servicos/1").status_code == 401
    assert client.post("/api/v1/lavadores", json={"nome": "Y", "comissao_pct": 30}).status_code == 401
    assert client.patch("/api/v1/lavadores/1", json={"nome": "Z"}).status_code == 401
    assert client.delete("/api/v1/lavadores/1").status_code == 401
    assert client.post("/api/v1/reclamacoes", json={"atendimento_id": 1, "texto": "t"}).status_code == 401

    # Abertos continuam acessíveis sem auth
    assert client.get("/health").status_code == 200
    assert client.get("/api/v1/servicos").status_code == 200
    assert client.get("/api/v1/lavadores").status_code == 200
    assert client.get("/api/v1/payments/providers").status_code == 200
    assert client.get("/api/v1/caixa/dia").status_code == 200
    assert client.post("/api/v1/seed").status_code == 200
    assert client.post("/api/v1/lavadores/1/pin-do-dia").status_code == 200
