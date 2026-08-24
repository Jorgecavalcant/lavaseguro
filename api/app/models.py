from __future__ import annotations

from typing import List, Optional

import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusAtendimento(str, enum.Enum):
    na_fila = "na_fila"
    lavando = "lavando"
    pronto = "pronto"
    pago = "pago"
    cancelado = "cancelado"


class Lavador(Base):
    __tablename__ = "lavadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    comissao_pct: Mapped[int] = mapped_column(Integer, default=40)  # 0-100
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pins: Mapped[List[PinDia]] = relationship(back_populates="lavador")
    atendimentos: Mapped[List[Atendimento]] = relationship(back_populates="lavador")


class PinDia(Base):
    __tablename__ = "pins_dia"
    __table_args__ = (UniqueConstraint("lavador_id", "data", name="uq_pin_lavador_dia"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lavador_id: Mapped[int] = mapped_column(ForeignKey("lavadores.id"), nullable=False)
    data: Mapped[date] = mapped_column(Date, nullable=False)
    pin: Mapped[str] = mapped_column(String(8), nullable=False)  # MVP: PIN em claro no DB local
    qr_payload: Mapped[str] = mapped_column(String(255), nullable=False)

    lavador: Mapped[Lavador] = relationship(back_populates="pins")


class Servico(Base):
    __tablename__ = "servicos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    preco_centavos: Mapped[int] = mapped_column(Integer, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    atendimentos: Mapped[List[Atendimento]] = relationship(back_populates="servico")


class Atendimento(Base):
    __tablename__ = "atendimentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    placa: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    servico_id: Mapped[int] = mapped_column(ForeignKey("servicos.id"), nullable=False)
    lavador_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lavadores.id"), nullable=True)
    status: Mapped[StatusAtendimento] = mapped_column(
        Enum(StatusAtendimento), default=StatusAtendimento.na_fila
    )
    meio_pagamento: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    servico: Mapped[Servico] = relationship(back_populates="atendimentos")
    lavador: Mapped[Optional[Lavador]] = relationship(back_populates="atendimentos")
    reclamacoes: Mapped[List[Reclamacao]] = relationship(back_populates="atendimento")


class Reclamacao(Base):
    __tablename__ = "reclamacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    atendimento_id: Mapped[int] = mapped_column(ForeignKey("atendimentos.id"), nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    # Único lugar do MVP onde foto entra — opcional
    foto_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    atendimento: Mapped[Atendimento] = relationship(back_populates="reclamacoes")
