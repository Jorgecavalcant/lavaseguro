from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Atendimento, Reclamacao
from app.schemas import ReclamacaoCreate, ReclamacaoOut

router = APIRouter(prefix="/api/v1/reclamacoes", tags=["reclamacoes"])


@router.post("", response_model=ReclamacaoOut, status_code=201)
def criar_reclamacao(body: ReclamacaoCreate, db: Session = Depends(get_db)):
    # Único lugar do MVP onde foto entra — e é opcional.
    atendimento = db.get(Atendimento, body.atendimento_id)
    if not atendimento:
        raise HTTPException(404, "Atendimento não encontrado.")
    row = Reclamacao(
        atendimento_id=body.atendimento_id,
        texto=body.texto,
        foto_url=body.foto_url,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[ReclamacaoOut])
def list_reclamacoes(db: Session = Depends(get_db)):
    return db.query(Reclamacao).order_by(Reclamacao.id.desc()).all()


@router.get("/{reclamacao_id}", response_model=ReclamacaoOut)
def get_reclamacao(reclamacao_id: int, db: Session = Depends(get_db)):
    row = db.get(Reclamacao, reclamacao_id)
    if not row:
        raise HTTPException(404, "Reclamação não encontrada.")
    return row
