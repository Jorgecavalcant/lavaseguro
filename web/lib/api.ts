export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Servico = {
  id: number;
  nome: string;
  preco_centavos: number;
  ativo: boolean;
};

export type Atendimento = {
  id: number;
  placa: string;
  servico_id: number;
  lavador_id: number | null;
  status: string;
  meio_pagamento: string | null;
  created_at: string;
  paid_at: string | null;
};

export type CaixaDia = {
  data: string;
  total_pagos: number;
  bruto_centavos: number;
  comissao_centavos: number;
  liquido_centavos: number;
  por_lavador: Array<{
    lavador_id: number | null;
    lavador_nome: string;
    qtd_pagos: number;
    bruto_centavos: number;
    comissao_centavos: number;
    liquido_centavos: number;
  }>;
};

export function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
