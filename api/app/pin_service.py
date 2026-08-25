"""Geração do PIN do dia — único globalmente (não só por lavador).

Dois lavadores nunca recebem o mesmo PIN no mesmo dia: `/auth/pin` busca só por
`data + pin` (sem lavador_id), então uma colisão tornaria o login ambíguo.
Por isso a geração tenta um PIN novo até achar um livre para aquele dia
(retry), e uma constraint única em (data, pin) cobre a corrida entre
requisições concorrentes.
"""

from __future__ import annotations

import secrets
from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import PinDia

MAX_TENTATIVAS = 25


def gerar_ou_obter_pin_do_dia(db: Session, lavador_id: int) -> PinDia:
    """Retorna o PIN do dia do lavador, criando um novo e único se necessário."""
    hoje = date.today()
    existing = (
        db.query(PinDia).filter(PinDia.lavador_id == lavador_id, PinDia.data == hoje).one_or_none()
    )
    if existing:
        return existing

    for _ in range(MAX_TENTATIVAS):
        pin = f"{secrets.randbelow(10_000):04d}"
        colisao = db.query(PinDia).filter(PinDia.data == hoje, PinDia.pin == pin).first()
        if colisao:
            continue
        qr = f"lavaseguro://pin/{hoje.isoformat()}/{pin}"
        row = PinDia(lavador_id=lavador_id, data=hoje, pin=pin, qr_payload=qr)
        db.add(row)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(row)
        return row

    raise RuntimeError("Não foi possível gerar um PIN único para hoje. Tente novamente.")
