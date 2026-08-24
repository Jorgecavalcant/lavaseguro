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
        setErro(
          err instanceof Error ? err.message : "Não conseguimos carregar o caixa."
        )
      );
  }, [router]);

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Fechamento</p>
        <h1>Caixa do dia</h1>
        <p className="muted" style={{ margin: 0 }}>
          Totais e comissão por lavador — sem briga no fim do turno.
        </p>
      </header>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {!caixa && !erro && <p className="empty">Carregando o caixa…</p>}

      {caixa && (
        <>
          <div className="stat-grid">
            <div className="stat">
              <p className="label">Bruto</p>
              <p className="value">{brl(caixa.bruto_centavos)}</p>
            </div>
            <div className="stat">
              <p className="label">Comissões</p>
              <p className="value">{brl(caixa.comissao_centavos)}</p>
            </div>
            <div className="stat">
              <p className="label">Líquido</p>
              <p className="value ok">{brl(caixa.liquido_centavos)}</p>
            </div>
          </div>

          <p className="muted" style={{ marginBottom: "1rem" }}>
            {caixa.data} · {caixa.total_pagos} pagamento(s) confirmado(s)
          </p>

          <div className="card">
            <h2>Por lavador</h2>
            {caixa.por_lavador.length === 0 ? (
              <p className="empty" style={{ paddingBottom: 0 }}>
                Nenhum pagamento hoje ainda.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Lavador</th>
                      <th>Pagos</th>
                      <th>Bruto</th>
                      <th>Comissão</th>
                      <th>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caixa.por_lavador.map((l, i) => (
                      <tr key={`${l.lavador_id ?? "sem"}-${i}`}>
                        <td>{l.lavador_nome}</td>
                        <td>{l.qtd_pagos}</td>
                        <td>{brl(l.bruto_centavos)}</td>
                        <td>{brl(l.comissao_centavos)}</td>
                        <td className="ok-msg">{brl(l.liquido_centavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
