from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Atendimento, Lavador, Servico, StatusAtendimento
from app.schemas import AtendimentoCreate, AtendimentoOut, StatusUpdate

router = APIRouter(prefix="/api/v1/atendimentos", tags=["atendimentos"])

TRANSICOES = {
    StatusAtendimento.na_fila: {StatusAtendimento.lavando, StatusAtendimento.cancelado},
    StatusAtendimento.lavando: {StatusAtendimento.pronto, StatusAtendimento.cancelado},
    StatusAtendimento.pronto: {
        StatusAtendimento.pago,
        StatusAtendimento.cancelado,
        StatusAtendimento.lavando,
    },
    StatusAtendimento.pago: set(),
    StatusAtendimento.cancelado: set(),
}


@router.get("", response_model=list[AtendimentoOut])
def list_atendimentos(
    db: Session = Depends(get_db),
    status: str | None = None,
    data: date | None = Query(default=None),
):
    q = db.query(Atendimento)
    if status:
        try:
            st = StatusAtendimento(status)
        except ValueError as exc:
            raise HTTPException(422, "Status inválido.") from exc
        q = q.filter(Atendimento.status == st)
    if data:
        q = q.filter(Atendimento.created_at >= datetime.combine(data, datetime.min.time()))
        q = q.filter(Atendimento.created_at < datetime.combine(data, datetime.max.time()))
    return q.order_by(Atendimento.id.desc()).all()


@router.post("", response_model=AtendimentoOut, status_code=201)
def create_atendimento(body: AtendimentoCreate, db: Session = Depends(get_db)):
    # Fluxo normal: só placa + serviço. Sem foto.
    servico = db.get(Servico, body.servico_id)
    if not servico or not servico.ativo:
        raise HTTPException(404, "Serviço não encontrado.")
    if body.lavador_id is not None:
        lavador = db.get(Lavador, body.lavador_id)
        if not lavador or not lavador.ativo:
            raise HTTPException(404, "Lavador não encontrado.")
    placa = body.placa.upper().replace(" ", "").replace("-", "")
    row = Atendimento(
        placa=placa,
        servico_id=body.servico_id,
        lavador_id=body.lavador_id,
        status=StatusAtendimento.na_fila,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{atendimento_id}", response_model=AtendimentoOut)
def get_atendimento(atendimento_id: int, db: Session = Depends(get_db)):
    row = db.get(Atendimento, atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    return row


@router.patch("/{atendimento_id}/status", response_model=AtendimentoOut)
def update_status(atendimento_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    row = db.get(Atendimento, atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    novo = StatusAtendimento(body.status)
    if novo == row.status:
        return row
    permitidos = TRANSICOES.get(row.status, set())
    if novo not in permitidos:
        raise HTTPException(
            422,
            f"Não é possível ir de '{row.status.value}' para '{novo.value}'.",
        )
    row.status = novo
    if novo == StatusAtendimento.pago:
        row.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row
