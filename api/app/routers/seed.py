from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lavador, Servico
from app.pin_service import gerar_ou_obter_pin_do_dia

router = APIRouter(prefix="/api/v1", tags=["seed"])

DEFAULT_SERVICOS = [
    ("Lava simples", 4000),
    ("Lava completa", 7000),
]
DEFAULT_LAVADOR = ("Lavador Demo", 40)


@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    """Popula 2 serviços + 1 lavador apenas se as tabelas estiverem vazias.

    Bootstrap de acesso: como `/lavadores/{id}/pin-do-dia` agora exige login,
    o seed garante o PIN do dia do primeiro lavador (Lavador Demo) para permitir
    o primeiro `/auth/pin` sem token — ver docs/TESTE.md. Continua aberto
    (sem auth) de propósito.
    """
    servicos_criados = 0
    if db.query(Servico).count() == 0:
        for nome, preco in DEFAULT_SERVICOS:
            db.add(Servico(nome=nome, preco_centavos=preco, ativo=True))
            servicos_criados += 1
    lavadores_criados = 0
    if db.query(Lavador).count() == 0:
        nome, pct = DEFAULT_LAVADOR
        db.add(Lavador(nome=nome, comissao_pct=pct, ativo=True))
        lavadores_criados += 1
    db.commit()

    bootstrap_pin = None
    primeiro_lavador = (
        db.query(Lavador).filter(Lavador.ativo.is_(True)).order_by(Lavador.id).first()
    )
    if primeiro_lavador:
        pin_row = gerar_ou_obter_pin_do_dia(db, primeiro_lavador.id)
        bootstrap_pin = pin_row.pin

    return {
        "ok": True,
        "servicos_criados": servicos_criados,
        "lavadores_criados": lavadores_criados,
        "bootstrap_pin": bootstrap_pin,
    }
