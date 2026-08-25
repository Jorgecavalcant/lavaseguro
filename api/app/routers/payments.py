from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_jwt import get_current_lavador
from app.database import get_db
from app.models import Atendimento, Servico, StatusAtendimento
from app.payments.provider import ChargeRequest, get_provider, list_providers
from app.schemas import AtendimentoOut, PaymentChargeIn, ProvidersOut

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.get("/providers", response_model=ProvidersOut)
def providers():
    """Lista provedores de cobrança disponíveis (pluggable; cliente escolhe o adquirente)."""
    return ProvidersOut(providers=list_providers(), default="manual")


@router.post("/charge", response_model=AtendimentoOut)
def charge(
    body: PaymentChargeIn,
    db: Session = Depends(get_db),
    _lavador: dict = Depends(get_current_lavador),
):
    """Registra cobrança via provedor configurável (cliente escolhe o adquirente)."""
    row = db.get(Atendimento, body.atendimento_id)
    if not row:
        raise HTTPException(404, "Atendimento não encontrado.")
    if row.status == StatusAtendimento.cancelado:
        raise HTTPException(422, "Atendimento cancelado não pode ser pago.")
    if row.status == StatusAtendimento.pago:
        return row
    if row.status != StatusAtendimento.pronto:
        raise HTTPException(422, "Só cobra atendimento com status pronto.")

    servico = db.get(Servico, row.servico_id)
    valor = servico.preco_centavos if servico else 0
    try:
        provider = get_provider(body.provider)
    except KeyError as exc:
        raise HTTPException(422, str(exc)) from exc

    result = provider.charge(
        ChargeRequest(
            atendimento_id=row.id,
            meio=body.meio,
            valor_centavos=valor,
            referencia=f"atendimento-{row.id}-{row.placa}",
        )
    )
    if not result.ok:
        raise HTTPException(502, result.message or "Falha no provedor de pagamento.")

    row.status = StatusAtendimento.pago
    row.meio_pagamento = f"{body.meio}:{result.provider}"
    row.paid_at = datetime.now()
    db.commit()
    db.refresh(row)
    return row


@router.post("/stub", response_model=AtendimentoOut, deprecated=True)
def payment_stub(
    body: PaymentChargeIn,
    db: Session = Depends(get_db),
    _lavador: dict = Depends(get_current_lavador),
):
    """Alias legado de /charge (MVP manual). Preferir POST /charge."""
    return charge(body, db)
