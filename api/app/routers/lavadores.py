from __future__ import annotations

import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_jwt import create_access_token
from app.database import get_db
from app.models import Lavador, PinDia
from app.schemas import AuthPinIn, AuthPinOut, LavadorCreate, LavadorOut, LavadorUpdate, PinDiaOut

router = APIRouter(prefix="/api/v1", tags=["lavadores"])


@router.get("/lavadores", response_model=list[LavadorOut])
def list_lavadores(db: Session = Depends(get_db)):
    return db.query(Lavador).order_by(Lavador.id).all()


@router.post("/lavadores", response_model=LavadorOut, status_code=201)
def create_lavador(body: LavadorCreate, db: Session = Depends(get_db)):
    row = Lavador(nome=body.nome, comissao_pct=body.comissao_pct)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/lavadores/{lavador_id}", response_model=LavadorOut)
def get_lavador(lavador_id: int, db: Session = Depends(get_db)):
    row = db.get(Lavador, lavador_id)
    if not row:
        raise HTTPException(404, "Lavador não encontrado.")
    return row


@router.patch("/lavadores/{lavador_id}", response_model=LavadorOut)
def update_lavador(lavador_id: int, body: LavadorUpdate, db: Session = Depends(get_db)):
    row = db.get(Lavador, lavador_id)
    if not row:
        raise HTTPException(404, "Lavador não encontrado.")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/lavadores/{lavador_id}", status_code=204)
def delete_lavador(lavador_id: int, db: Session = Depends(get_db)):
    row = db.get(Lavador, lavador_id)
    if not row:
        raise HTTPException(404, "Lavador não encontrado.")
    row.ativo = False
    db.commit()


@router.post("/lavadores/{lavador_id}/pin-do-dia", response_model=PinDiaOut)
def gerar_pin_do_dia(lavador_id: int, db: Session = Depends(get_db)):
    lavador = db.get(Lavador, lavador_id)
    if not lavador or not lavador.ativo:
        raise HTTPException(404, "Lavador não encontrado.")
    hoje = date.today()
    existing = (
        db.query(PinDia).filter(PinDia.lavador_id == lavador_id, PinDia.data == hoje).one_or_none()
    )
    if existing:
        return PinDiaOut(
            lavador_id=lavador_id,
            data=hoje,
            pin=existing.pin,
            qr_payload=existing.qr_payload,
        )
    pin = f"{secrets.randbelow(10_000):04d}"
    qr = f"lavaseguro://pin/{hoje.isoformat()}/{pin}"
    row = PinDia(lavador_id=lavador_id, data=hoje, pin=pin, qr_payload=qr)
    db.add(row)
    db.commit()
    return PinDiaOut(lavador_id=lavador_id, data=hoje, pin=pin, qr_payload=qr)


@router.post("/auth/pin", response_model=AuthPinOut)
def auth_pin(body: AuthPinIn, db: Session = Depends(get_db)):
    """Valida PIN do dia e emite JWT HS256 de operador."""
    hoje = date.today()
    row = db.query(PinDia).filter(PinDia.data == hoje, PinDia.pin == body.pin).one_or_none()
    if not row:
        raise HTTPException(401, "PIN inválido ou expirado. Peça o PIN do dia ao operador.")
    lavador = db.get(Lavador, row.lavador_id)
    token = create_access_token(row.lavador_id)
    return AuthPinOut(
        ok=True,
        lavador_id=row.lavador_id,
        lavador_nome=lavador.nome if lavador else "",
        data=hoje,
        access_token=token,
    )
