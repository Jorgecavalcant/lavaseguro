"""PIN → JWT → rota protegida.

`/lavadores/{id}/pin-do-dia` exige auth; aqui usamos o bootstrap_pin que
`/seed` garante para permitir o primeiro login sem token (ver docs/TESTE.md).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.auth_jwt import create_access_token, decode_token
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def pin_criado():
    lavadores = client.get("/api/v1/lavadores").json()
    if not lavadores:
        client.post("/api/v1/seed")
        lavadores = client.get("/api/v1/lavadores").json()
    lavador_id = lavadores[0]["id"]
    seed = client.post("/api/v1/seed").json()
    return {"lavador_id": lavador_id, "pin": seed["bootstrap_pin"]}


@pytest.fixture(scope="module")
def token(pin_criado):
    r = client.post("/api/v1/auth/pin", json={"pin": pin_criado["pin"]})
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert isinstance(data["access_token"], str) and len(data["access_token"]) > 0
    return data["access_token"]


def test_auth_pin_emite_access_token(token):
    # token já validado no fixture; sanity check de formato JWT (3 partes)
    assert len(token.split(".")) == 3


def test_decode_token_role_lavador(token):
    claims = decode_token(token)
    assert claims["role"] == "lavador"
    assert int(claims["sub"]) == int(claims["sub"]) > 0
    assert "exp" in claims


def test_create_access_token_direto(pin_criado):
    tok = create_access_token(pin_criado["lavador_id"])
    claims = decode_token(tok)
    assert claims["sub"] == str(pin_criado["lavador_id"])
    assert claims["role"] == "lavador"


def test_get_atendimentos_com_bearer(token):
    r = client.get("/api/v1/atendimentos", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_decode_token_invalido_levanta():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        decode_token("abc.def.ghi")
    assert exc.value.status_code == 401
