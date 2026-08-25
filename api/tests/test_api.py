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
    """Seed (bootstrap_pin do Lavador Demo, aberto) -> /auth/pin -> Bearer token.

    /lavadores/{id}/pin-do-dia agora exige auth; o primeiro acesso vem do PIN
    de bootstrap que o próprio /seed garante.
    """
    seed = client.post("/api/v1/seed").json()
    pin = seed["bootstrap_pin"]
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
    pin = client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia", headers=auth_headers).json()
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
    assert client.patch("/api/v1/atendimentos/1", json={"placa": "BBB0000"}).status_code == 401
    assert client.post("/api/v1/payments/charge", json={"atendimento_id": 1, "meio": "pix"}).status_code == 401
    assert client.post("/api/v1/payments/stub", json={"atendimento_id": 1, "meio": "pix"}).status_code == 401
    assert client.post("/api/v1/servicos", json={"nome": "X", "preco_centavos": 100}).status_code == 401
    assert client.patch("/api/v1/servicos/1", json={"preco_centavos": 200}).status_code == 401
    assert client.delete("/api/v1/servicos/1").status_code == 401
    assert client.post("/api/v1/lavadores", json={"nome": "Y", "comissao_pct": 30}).status_code == 401
    assert client.patch("/api/v1/lavadores/1", json={"nome": "Z"}).status_code == 401
    assert client.delete("/api/v1/lavadores/1").status_code == 401
    assert client.post("/api/v1/reclamacoes", json={"atendimento_id": 1, "texto": "t"}).status_code == 401
    assert client.post("/api/v1/lavadores/1/pin-do-dia").status_code == 401

    # Abertos continuam acessíveis sem auth
    assert client.get("/health").status_code == 200
    assert client.get("/api/v1/servicos").status_code == 200
    assert client.get("/api/v1/lavadores").status_code == 200
    assert client.get("/api/v1/payments/providers").status_code == 200
    assert client.get("/api/v1/caixa/dia").status_code == 200
    assert client.post("/api/v1/seed").status_code == 200


def test_patch_atendimento_na_fila_edita_placa(client: TestClient, auth_headers: dict[str, str]):
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "EDT0001", "servico_id": sid},
        headers=auth_headers,
    ).json()
    r = client.patch(
        f"/api/v1/atendimentos/{at['id']}",
        json={"placa": " edt-9999 "},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["placa"] == "EDT9999"
    assert data["status"] == "na_fila"


def test_patch_atendimento_nao_na_fila_422(client: TestClient, auth_headers: dict[str, str]):
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "LCK0001", "servico_id": sid},
        headers=auth_headers,
    ).json()
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "lavando"}, headers=auth_headers)
    r = client.patch(
        f"/api/v1/atendimentos/{at['id']}",
        json={"placa": "LCK0002"},
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_list_atendimentos_inclui_servico_nome(client: TestClient, auth_headers: dict[str, str]):
    servicos = client.get("/api/v1/servicos").json()
    sid = servicos[0]["id"]
    client.post(
        "/api/v1/atendimentos",
        json={"placa": "NOM0001", "servico_id": sid},
        headers=auth_headers,
    )
    lista = client.get("/api/v1/atendimentos").json()
    alvo = next(a for a in lista if a["placa"] == "NOM0001")
    assert alvo["servico_nome"] == servicos[0]["nome"]
    assert alvo["lavador_nome"] is not None


def test_pin_do_dia_exige_auth(client: TestClient, auth_headers: dict[str, str]):
    """Sem token, pin-do-dia é 401; com token, gera/retorna o PIN normalmente."""
    lav = client.post(
        "/api/v1/lavadores",
        json={"nome": "Sem Token", "comissao_pct": 30},
        headers=auth_headers,
    ).json()
    assert client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia").status_code == 401
    r = client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["pin"]) == 4


def test_pin_do_dia_unico_globalmente(client: TestClient, auth_headers: dict[str, str]):
    """Dois lavadores nunca recebem o mesmo PIN no mesmo dia."""
    a = client.post(
        "/api/v1/lavadores", json={"nome": "Ana", "comissao_pct": 30}, headers=auth_headers
    ).json()
    b = client.post(
        "/api/v1/lavadores", json={"nome": "Bia", "comissao_pct": 30}, headers=auth_headers
    ).json()
    pin_a = client.post(f"/api/v1/lavadores/{a['id']}/pin-do-dia", headers=auth_headers).json()["pin"]
    pin_b = client.post(f"/api/v1/lavadores/{b['id']}/pin-do-dia", headers=auth_headers).json()["pin"]
    assert pin_a != pin_b
    # gerar de novo no mesmo dia é idempotente (retorna o mesmo PIN)
    pin_a2 = client.post(f"/api/v1/lavadores/{a['id']}/pin-do-dia", headers=auth_headers).json()["pin"]
    assert pin_a2 == pin_a


def test_login_rejeita_lavador_inativo(client: TestClient, auth_headers: dict[str, str]):
    lav = client.post(
        "/api/v1/lavadores",
        json={"nome": "Vai Sair", "comissao_pct": 30},
        headers=auth_headers,
    ).json()
    pin = client.post(f"/api/v1/lavadores/{lav['id']}/pin-do-dia", headers=auth_headers).json()["pin"]
    client.delete(f"/api/v1/lavadores/{lav['id']}", headers=auth_headers)
    r = client.post("/api/v1/auth/pin", json={"pin": pin})
    assert r.status_code == 403


def test_patch_status_pronto_para_pago_bloqueado(client: TestClient, auth_headers: dict[str, str]):
    """PATCH /status não pode pular o pagamento — só POST /payments/charge paga."""
    sid = client.get("/api/v1/servicos").json()[0]["id"]
    at = client.post(
        "/api/v1/atendimentos",
        json={"placa": "BLK0001", "servico_id": sid},
        headers=auth_headers,
    ).json()
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "lavando"}, headers=auth_headers)
    client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pronto"}, headers=auth_headers)
    r = client.patch(f"/api/v1/atendimentos/{at['id']}/status", json={"status": "pago"}, headers=auth_headers)
    assert r.status_code == 422

    pay = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": at["id"], "meio": "pix", "provider": "manual"},
        headers=auth_headers,
    )
    assert pay.status_code == 200
    assert pay.json()["status"] == "pago"
