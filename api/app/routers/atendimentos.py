from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth_jwt import get_current_lavador
from app.database import get_db
from app.models import Atendimento, Lavador, Servico, StatusAtendimento
from app.schemas import AtendimentoCreate, AtendimentoOut, AtendimentoUpdate, StatusUpdate

router = APIRouter(prefix="/api/v1/atendimentos", tags=["atendimentos"])

TRANSICOES = {
    StatusAtendimento.na_fila: {StatusAtendimento.lavando, StatusAtendimento.cancelado},
    StatusAtendimento.lavando: {StatusAtendimento.pronto, StatusAtendimento.cancelado},
    # pronto -> pago NÃO passa por aqui: só via POST /payments/charge, que
    # registra o provedor/meio de pagamento. PATCH /status não pode "pular"
    # o pagamento.
    StatusAtendimento.pronto: set(),
    StatusAtendimento.pago: set(),
    StatusAtendimento.cancelado: set(),
}


def _enrich(row: Atendimento, db: Session) -> AtendimentoOut:
    serv = db.get(Servico, row.servico_id) if row.servico_id else None
    lav = db.get(Lavador, row.lavador_id) if row.lavador_id else None
    return AtendimentoOut(
        id=row.id, placa=row.placa, servico_id=row.servico_id, lavador_id=row.lavador_id,
        status=row.status.value if hasattr(row.status, "value") else row.status,
        meio_pagamento=row.meio_pagamento, created_at=row.created_at, paid_at=row.paid_at,
        servico_nome=serv.nome if serv else None, lavador_nome=lav.nome if lav else None,
    )


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
    rows = q.order_by(Atendimento.id.desc()).all()
    return [_enrich(r, db) for r in rows]


@router.post("", response_model=AtendimentoOut, status_code=201)
def create_atendimento(
    body: AtendimentoCreate,
    db: Session = Depends(get_db),
    current: dict = Depends(get_current_lavador),
):
    # Fluxo normal: só placa + serviço. Sem foto.
    servico = db.get(Servico, body.servico_id)
    if not servico or not servico.ativo:
        raise HTTPException(404, "Serviço não encontrado.")
    # lavador efetivo: body.lavador_id se informado, senão o do token/PIN
    lavador_id_efetivo = body.lavador_id if body.lavador_id is not None else current["lavador_id"]
    lavador = db.get(Lavador, lavador_id_efetivo)
    if not lavador or not lavador.ativo:
        raise HTTPException(404, "Lavador não encontrado.")
    placa = body.placa.upper().replace(" ", "").replace("-", "")
    row = Atendimento(
        placa=placa,
        servico_id=body.servico_id,
        lavador_id=lavador_id_efetivo,
        status=StatusAtendimento.na_fila,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _enrich(row, db)


@router.get("/{atendimento_id}", response_model=AtendimentoOut)
def get_atendimento(atendimento_id: int, db: Session = Depends(get_db)):
    row = db.get(Atendimento, atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    return _enrich(row, db)


@router.patch("/{atendimento_id}", response_model=AtendimentoOut)
def patch_atendimento(
    atendimento_id: int,
    body: AtendimentoUpdate,
    db: Session = Depends(get_db),
    _lavador: dict = Depends(get_current_lavador),
):
    """Edita placa/serviço/lavador somente enquanto o atendimento está na fila."""
    row = db.get(Atendimento, atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    if row.status != StatusAtendimento.na_fila:
        raise HTTPException(422, "Só é possível editar atendimentos na fila.")

    if body.placa is not None:
        row.placa = body.placa.upper().strip().replace(" ", "").replace("-", "")
    if body.servico_id is not None:
        servico = db.get(Servico, body.servico_id)
        if not servico or not servico.ativo:
            raise HTTPException(404, "Serviço não encontrado.")
        row.servico_id = body.servico_id
    if body.lavador_id is not None:
        lavador = db.get(Lavador, body.lavador_id)
        if not lavador or not lavador.ativo:
            raise HTTPException(404, "Lavador não encontrado.")
        row.lavador_id = body.lavador_id

    db.commit()
    db.refresh(row)
    return _enrich(row, db)


@router.patch("/{atendimento_id}/status", response_model=AtendimentoOut)
def update_status(
    atendimento_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    _lavador: dict = Depends(get_current_lavador),
):
    row = db.get(Atendimento, atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    novo = StatusAtendimento(body.status)
    if novo == row.status:
        return _enrich(row, db)
    if novo == StatusAtendimento.pago:
        raise HTTPException(
            422,
            "Pagamento não é feito por aqui. Use POST /payments/charge para registrar o recebimento.",
        )
    permitidos = TRANSICOES.get(row.status, set())
    if novo not in permitidos:
        raise HTTPException(
            422,
            f"Não é possível ir de '{row.status.value}' para '{novo.value}'.",
        )
    row.status = novo
    db.commit()
    db.refresh(row)
    return _enrich(row, db)
