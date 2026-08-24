"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type CaixaLavador = {
  lavador_id: number | null;
  lavador_nome: string;
  qtd_pagos: number;
  bruto_centavos: number;
  comissao_centavos: number;
  liquido_centavos: number;
};

type CaixaDia = {
  data: string;
  total_pagos: number;
  bruto_centavos: number;
  comissao_centavos: number;
  liquido_centavos: number;
  por_lavador: CaixaLavador[];
};

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CaixaPage() {
  const router = useRouter();
  const [caixa, setCaixa] = useState<CaixaDia | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    apiFetch<CaixaDia>("/api/v1/caixa/dia")
      .then(setCaixa)
      .catch((err) =>
        setErro(err instanceof Error ? err.message : "Erro ao carregar caixa.")
      );
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Caixa do Dia</h1>

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      {!caixa && !erro && <p className="text-slate-400">Carregando…</p>}

      {caixa && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Bruto</p>
              <p className="text-2xl font-bold">{brl(caixa.bruto_centavos)}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Comissões</p>
              <p className="text-2xl font-bold">{brl(caixa.comissao_centavos)}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Líquido</p>
              <p className="text-2xl font-bold text-green-400">
                {brl(caixa.liquido_centavos)}
              </p>
            </div>
          </div>

          <p className="text-slate-400 mb-4">
            {caixa.data} · {caixa.total_pagos} pagamento(s) confirmado(s)
          </p>

          <h2 className="text-lg font-semibold mb-2">Por lavador</h2>
          <ul className="space-y-2">
            {caixa.por_lavador.map((l, i) => (
              <li
                key={`${l.lavador_id ?? "sem"}-${i}`}
                className="bg-slate-800 p-3 rounded flex flex-wrap justify-between items-center gap-2"
              >
                <span>{l.lavador_nome}</span>
                <span className="flex gap-4 text-sm">
                  <span>{l.qtd_pagos} pago(s)</span>
                  <span>Bruto: {brl(l.bruto_centavos)}</span>
                  <span>Comissão: {brl(l.comissao_centavos)}</span>
                  <span className="font-semibold text-green-400">
                    Líquido: {brl(l.liquido_centavos)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {caixa.por_lavador.length === 0 && (
            <p className="text-slate-400">Nenhum pagamento hoje ainda.</p>
          )}
        </>
      )}
    </main>
  );
}
