from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    atendimentos,
    caixa,
    health,
    lavadores,
    payments,
    reclamacoes,
    seed,
    servicos,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="LavaSeguro API",
    version="0.1.0",
    description="Atendimento e caixa para lava-jato. Foto só em reclamação.",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(lavadores.router)
app.include_router(servicos.router)
app.include_router(atendimentos.router)
app.include_router(caixa.router)
app.include_router(reclamacoes.router)
app.include_router(payments.router)
app.include_router(seed.router)
