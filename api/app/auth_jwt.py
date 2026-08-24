"""JWT de operador (lavador) + dependency compatível com X-Pin do MVP.

- create_access_token(lavador_id) -> JWT HS256 com sub/role/exp
- get_current_lavador aceita `Authorization: Bearer <jwt>` OU `X-Pin` (PIN do dia)
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request

from app.config import get_settings


def create_access_token(lavador_id: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(lavador_id),
        "role": "lavador",
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.effective_jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.effective_jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(401, "Token expirado.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(401, "Token inválido.") from exc


def _lavador_id_via_pin(pin: str) -> int:
    from app.database import SessionLocal
    from app.models import PinDia

    with SessionLocal() as db:
        row = db.query(PinDia).filter(PinDia.data == date.today(), PinDia.pin == pin).one_or_none()
        if not row:
            raise HTTPException(401, "PIN inválido ou expirado.")
        return row.lavador_id


def get_current_lavador(request: Request) -> dict:
    """Bearer JWT OU X-Pin (compatibilidade MVP)."""
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        claims = decode_token(auth.split(" ", 1)[1].strip())
        if claims.get("role") != "lavador":
            raise HTTPException(403, "Role inválida.")
        try:
            lavador_id = int(claims["sub"])
        except (KeyError, ValueError) as exc:
            raise HTTPException(401, "Token sem subject válido.") from exc
        return {"lavador_id": lavador_id, "via": "jwt"}

    pin = request.headers.get("X-Pin")
    if pin:
        return {"lavador_id": _lavador_id_via_pin(pin), "via": "pin"}

    raise HTTPException(401, "Autenticação ausente (Authorization: Bearer ou X-Pin).")
