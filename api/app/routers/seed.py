from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Servico

router = APIRouter(prefix="/api/v1", tags=["seed"])

DEFAULT_SERVICOS = [
    ("Lava simples", 4000),
    ("Lava completa", 7000),
    ("Motor", 3500),
    ("Cera", 2500),
]


@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    created = 0
    for nome, preco in DEFAULT_SERVICOS:
        exists = db.query(Servico).filter(Servico.nome == nome).one_or_none()
        if not exists:
            db.add(Servico(nome=nome, preco_centavos=preco, ativo=True))
            created += 1
    db.commit()
    return {"ok": True, "servicos_criados": created}
