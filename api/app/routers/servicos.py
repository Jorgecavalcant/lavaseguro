from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Servico
from app.schemas import ServicoCreate, ServicoOut, ServicoUpdate

router = APIRouter(prefix="/api/v1/servicos", tags=["servicos"])


@router.get("", response_model=list[ServicoOut])
def list_servicos(db: Session = Depends(get_db), ativos: bool = True):
    q = db.query(Servico)
    if ativos:
        q = q.filter(Servico.ativo.is_(True))
    return q.order_by(Servico.id).all()


@router.post("", response_model=ServicoOut, status_code=201)
def create_servico(body: ServicoCreate, db: Session = Depends(get_db)):
    row = Servico(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{servico_id}", response_model=ServicoOut)
def update_servico(servico_id: int, body: ServicoUpdate, db: Session = Depends(get_db)):
    row = db.get(Servico, servico_id)
    if not row:
        raise HTTPException(404, "Serviço não encontrado.")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{servico_id}", status_code=204)
def delete_servico(servico_id: int, db: Session = Depends(get_db)):
    row = db.get(Servico, servico_id)
    if not row:
        raise HTTPException(404, "Serviço não encontrado.")
    row.ativo = False
    db.commit()
