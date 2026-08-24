"""Provedores de pagamento plugáveis — o cliente escolhe o banco/adquirente.

MVP: só o provedor `manual` (marca como pago no sistema).
Provedores reais (Cielo, Stone, PagSeguro, API do banco do cliente, etc.)
entram como novos módulos sem mudar o fluxo de atendimento.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

Meio = Literal["pix", "cartao"]


@dataclass
class ChargeRequest:
    atendimento_id: int
    meio: Meio
    valor_centavos: int
    referencia: str


@dataclass
class ChargeResult:
    ok: bool
    provider: str
    external_id: str | None = None
    message: str = ""


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    def charge(self, req: ChargeRequest) -> ChargeResult:
        ...


class ManualProvider(PaymentProvider):
    """Confirma pagamento já recebido fora do sistema (dinheiro/Pix no app do banco)."""

    name = "manual"

    def charge(self, req: ChargeRequest) -> ChargeResult:
        return ChargeResult(
            ok=True,
            provider=self.name,
            external_id=f"manual-{req.atendimento_id}",
            message="Pagamento registrado manualmente.",
        )


_REGISTRY: dict[str, PaymentProvider] = {
    ManualProvider.name: ManualProvider(),
}


def get_provider(name: str | None) -> PaymentProvider:
    key = (name or "manual").strip().lower()
    if key not in _REGISTRY:
        raise KeyError(
            f"Provedor '{key}' não configurado. "
            f"Disponíveis no MVP: {', '.join(sorted(_REGISTRY))}."
        )
    return _REGISTRY[key]


def list_providers() -> list[str]:
    return sorted(_REGISTRY)
