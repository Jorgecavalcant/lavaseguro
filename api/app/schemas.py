from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

StatusLiteral = Literal["na_fila", "lavando", "pronto", "pago", "cancelado"]
MeioLiteral = Literal["pix", "cartao"]


class LavadorCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    comissao_pct: int = Field(default=40, ge=0, le=100)


class LavadorUpdate(BaseModel):
    nome: str | None = None
    comissao_pct: int | None = Field(default=None, ge=0, le=100)
    ativo: bool | None = None


class LavadorOut(BaseModel):
    id: int
    nome: str
    comissao_pct: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PinDiaOut(BaseModel):
    lavador_id: int
    data: date
    pin: str
    qr_payload: str


class AuthPinIn(BaseModel):
    pin: str = Field(min_length=4, max_length=8)


class AuthPinOut(BaseModel):
    ok: bool
    lavador_id: int
    lavador_nome: str
    data: date


class ServicoCreate(BaseModel):
    nome: str
    preco_centavos: int = Field(gt=0)
    ativo: bool = True


class ServicoUpdate(BaseModel):
    nome: str | None = None
    preco_centavos: int | None = Field(default=None, gt=0)
    ativo: bool | None = None


class ServicoOut(BaseModel):
    id: int
    nome: str
    preco_centavos: int
    ativo: bool

    model_config = {"from_attributes": True}


class AtendimentoCreate(BaseModel):
    placa: str = Field(min_length=5, max_length=10)
    servico_id: int
    lavador_id: int | None = None


class StatusUpdate(BaseModel):
    status: StatusLiteral


class AtendimentoOut(BaseModel):
    id: int
    placa: str
    servico_id: int
    lavador_id: int | None
    status: StatusLiteral
    meio_pagamento: str | None
    created_at: datetime
    paid_at: datetime | None

    model_config = {"from_attributes": True}


class CaixaLavador(BaseModel):
    lavador_id: int | None
    lavador_nome: str
    qtd_pagos: int
    bruto_centavos: int
    comissao_centavos: int
    liquido_centavos: int


class CaixaDiaOut(BaseModel):
    data: date
    total_pagos: int
    bruto_centavos: int
    comissao_centavos: int
    liquido_centavos: int
    por_lavador: list[CaixaLavador]


class ReclamacaoCreate(BaseModel):
    atendimento_id: int
    texto: str = Field(min_length=3)
    foto_url: str | None = None  # opcional — único ponto de foto no MVP


class ReclamacaoOut(BaseModel):
    id: int
    atendimento_id: int
    texto: str
    foto_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentChargeIn(BaseModel):
    atendimento_id: int
    meio: MeioLiteral
    provider: str | None = "manual"  # pluggable — cliente escolhe o adquirente/banco


class ProvidersOut(BaseModel):
    providers: list[str]
    default: str = "manual"


# Alias legado
PaymentStubIn = PaymentChargeIn
