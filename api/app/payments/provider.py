"""Provedores de pagamento plugáveis — o cliente escolhe o banco/adquirente.

MVP: `manual` (real) + stubs `pix_manual` e `cartao_pos` (registram localmente,
mensagem clara de stub; nenhuma transação externa).
NUNCA Asaas como core. Provedores reais (Cielo, Stone, PagSeguro, API do banco
do cliente, etc.) entram como novos módulos sem mudar o fluxo de atendimento.
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


class PixManualProvider(PaymentProvider):
    """STUB PIX manual — registra o pagamento localmente, sem integração real."""

    name = "pix_manual"

    def charge(self, req: ChargeRequest) -> ChargeResult:
        return ChargeResult(
            ok=True,
            provider=self.name,
            external_id=f"stub-pix-{req.atendimento_id}",
            message=(
                "STUB pix_manual: pagamento registrado apenas localmente "
                "(nenhuma transação externa foi executada)."
            ),
        )


class CartaoPosProvider(PaymentProvider):
    """STUB cartão POS — registra o pagamento localmente, sem integração real."""

    name = "cartao_pos"

    def charge(self, req: ChargeRequest) -> ChargeResult:
        return ChargeResult(
            ok=True,
            provider=self.name,
            external_id=f"stub-pos-{req.atendimento_id}",
            message=(
                "STUB cartao_pos: pagamento registrado apenas localmente "
                "(nenhuma transação externa foi executada)."
            ),
        )


_REGISTRY: dict[str, PaymentProvider] = {
    ManualProvider.name: ManualProvider(),
    PixManualProvider.name: PixManualProvider(),
    CartaoPosProvider.name: CartaoPosProvider(),
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
