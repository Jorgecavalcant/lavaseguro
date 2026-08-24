from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Atendimento, Lavador, Servico, StatusAtendimento
from app.schemas import CaixaDiaOut, CaixaLavador

router = APIRouter(prefix="/api/v1/caixa", tags=["caixa"])


@router.get("/dia", response_model=CaixaDiaOut)
def caixa_do_dia(data: date | None = Query(default=None), db: Session = Depends(get_db)):
    dia = data or date.today()
    inicio = datetime.combine(dia, datetime.min.time())
    fim = datetime.combine(dia, datetime.max.time())

    pagos = (
        db.query(Atendimento)
        .filter(
            Atendimento.status == StatusAtendimento.pago,
            Atendimento.paid_at >= inicio,
            Atendimento.paid_at <= fim,
        )
        .all()
    )

    buckets: dict[int | None, CaixaLavador] = {}
    bruto = comissao = 0

    for a in pagos:
        servico = db.get(Servico, a.servico_id)
        preco = servico.preco_centavos if servico else 0
        pct = 0
        nome = "Sem lavador"
        if a.lavador_id:
            lav = db.get(Lavador, a.lavador_id)
            if lav:
                pct = lav.comissao_pct
                nome = lav.nome
        com = preco * pct // 100
        liq = preco - com
        bruto += preco
        comissao += com

        key = a.lavador_id
        if key not in buckets:
            buckets[key] = CaixaLavador(
                lavador_id=key,
                lavador_nome=nome,
                qtd_pagos=0,
                bruto_centavos=0,
                comissao_centavos=0,
                liquido_centavos=0,
            )
        b = buckets[key]
        b.qtd_pagos += 1
        b.bruto_centavos += preco
        b.comissao_centavos += com
        b.liquido_centavos += liq

    return CaixaDiaOut(
        data=dia,
        total_pagos=len(pagos),
        bruto_centavos=bruto,
        comissao_centavos=comissao,
        liquido_centavos=bruto - comissao,
        por_lavador=list(buckets.values()),
    )
