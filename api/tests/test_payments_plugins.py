"""Registry com manual + stubs; fluxo charge completo; asaas rejeitado."""

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
    """Bootstrap via /seed (PIN aberto do Lavador Demo) -> JWT."""
    seed = client.post("/api/v1/seed").json()
    pin = seed["bootstrap_pin"]
    token = client.post("/api/v1/auth/pin", json={"pin": pin}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup(client: TestClient, auth_headers: dict[str, str]):
    servicos = client.get("/api/v1/servicos").json()
    if not servicos:
        servicos = [
            client.post(
                "/api/v1/servicos",
                json={"nome": "Lavagem simples", "preco_centavos": 3000},
                headers=auth_headers,
            ).json()
        ]
    return {"servico_id": servicos[0]["id"], "headers": auth_headers, "client": client}


def _atendimento_ate_pronto(setup: dict, placa: str) -> int:
    client: TestClient = setup["client"]
    headers = setup["headers"]
    att = client.post(
        "/api/v1/atendimentos",
        json={"placa": placa, "servico_id": setup["servico_id"]},
        headers=headers,
    ).json()
    client.patch(
        f"/api/v1/atendimentos/{att['id']}/status",
        json={"status": "lavando"},
        headers=headers,
    )
    client.patch(
        f"/api/v1/atendimentos/{att['id']}/status",
        json={"status": "pronto"},
        headers=headers,
    )
    return att["id"]


def test_lista_providers_inclui_tres(setup):
    r = setup["client"].get("/api/v1/payments/providers")
    assert r.status_code == 200
    providers = set(r.json()["providers"])
    assert {"manual", "pix_manual", "cartao_pos"} <= providers
    assert "asaas" not in providers


def test_charge_pix_manual_fluxo_completo(setup):
    att_id = _atendimento_ate_pronto(setup, "ABC-1234")
    r = setup["client"].post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "pix", "provider": "pix_manual"},
        headers=setup["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "pago"
    assert data["meio_pagamento"].startswith("pix:pix_manual")


def test_charge_cartao_pos_fluxo_completo(setup):
    att_id = _atendimento_ate_pronto(setup, "XYZ-9999")
    r = setup["client"].post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "cartao", "provider": "cartao_pos"},
        headers=setup["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "pago"
    assert data["meio_pagamento"].startswith("cartao:cartao_pos")


def test_charge_asaas_rejeitado(setup):
    att_id = _atendimento_ate_pronto(setup, "ASA-0001")
    r = setup["client"].post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "pix", "provider": "asaas"},
        headers=setup["headers"],
    )
    assert r.status_code == 422
