"""Registry com manual + stubs; fluxo charge completo; asaas rejeitado."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def setup():
    lavadores = client.get("/api/v1/lavadores").json()
    if not lavadores:
        client.post("/api/v1/seed")
        lavadores = client.get("/api/v1/lavadores").json()
    servicos = client.get("/api/v1/servicos").json()
    if not servicos:
        servicos = [
            client.post(
                "/api/v1/servicos",
                json={"nome": "Lavagem simples", "preco_centavos": 3000},
            ).json()
        ]
    return {"servico_id": servicos[0]["id"]}


def _atendimento_ate_pronto(servico_id: int, placa: str) -> int:
    att = client.post(
        "/api/v1/atendimentos", json={"placa": placa, "servico_id": servico_id}
    ).json()
    client.patch(f"/api/v1/atendimentos/{att['id']}/status", json={"status": "lavando"})
    client.patch(f"/api/v1/atendimentos/{att['id']}/status", json={"status": "pronto"})
    return att["id"]


def test_lista_providers_inclui_tres(setup):
    r = client.get("/api/v1/payments/providers")
    assert r.status_code == 200
    providers = set(r.json()["providers"])
    assert {"manual", "pix_manual", "cartao_pos"} <= providers
    assert "asaas" not in providers


def test_charge_pix_manual_fluxo_completo(setup):
    att_id = _atendimento_ate_pronto(setup["servico_id"], "ABC-1234")
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "pix", "provider": "pix_manual"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "pago"
    assert data["meio_pagamento"].startswith("pix:pix_manual")


def test_charge_cartao_pos_fluxo_completo(setup):
    att_id = _atendimento_ate_pronto(setup["servico_id"], "XYZ-9999")
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "cartao", "provider": "cartao_pos"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "pago"
    assert data["meio_pagamento"].startswith("cartao:cartao_pos")


def test_charge_asaas_rejeitado(setup):
    att_id = _atendimento_ate_pronto(setup["servico_id"], "ASA-0001")
    r = client.post(
        "/api/v1/payments/charge",
        json={"atendimento_id": att_id, "meio": "pix", "provider": "asaas"},
    )
    assert r.status_code == 422
