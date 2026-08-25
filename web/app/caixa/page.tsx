"use client";

import { useCallback, useEffect, useState } from "react";
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

type Atendimento = { id: number; status: string };

function hojeISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CaixaPage() {
  const router = useRouter();
  const [data, setData] = useState(hojeISO());
  const [caixa, setCaixa] = useState<CaixaDia | null>(null);
  const [fila, setFila] = useState({ na_fila: 0, lavando: 0, pronto: 0, pago: 0, cancelado: 0 });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(
    async (d: string) => {
      setLoading(true);
      try {
        const cx = await apiFetch<CaixaDia>(`/api/v1/caixa/dia?data=${d}`);
        setCaixa(cx);
        setErro("");
        try {
          const rows = await apiFetch<Atendimento[]>(`/api/v1/atendimentos?data=${d}`);
          const cont = { na_fila: 0, lavando: 0, pronto: 0, pago: 0, cancelado: 0 };
          for (const r of rows) {
            if (r.status in cont) cont[r.status as keyof typeof cont]++;
          }
          setFila(cont);
        } catch {
          // contagem da fila é best-effort
        }
      } catch (err) {
        setErro(
          err instanceof Error ? err.message : "Não conseguimos carregar o caixa."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    carregar(data);
  }, [data, carregar, router]);

  const ticket =
    caixa && caixa.total_pagos > 0
      ? Math.round(caixa.bruto_centavos / caixa.total_pagos)
      : 0;

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Fechamento</p>
        <h1>Caixa do dia</h1>
        <p className="muted" style={{ margin: 0 }}>
          Totais e comissão por lavador — sem briga no fim do turno.
        </p>
      </header>

      <label className="field" style={{ maxWidth: 220 }}>
        Data
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {(loading || (!caixa && !erro)) && <p className="empty">Carregando o caixa…</p>}

      {caixa && !loading && (
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
            <div className="stat">
              <p className="label">Pagos</p>
              <p className="value">{caixa.total_pagos}</p>
            </div>
            <div className="stat">
              <p className="label">Ticket médio</p>
              <p className="value">{ticket > 0 ? brl(ticket) : "—"}</p>
            </div>
          </div>

          <p className="muted" style={{ marginBottom: "1rem" }}>
            {caixa.data} · {caixa.total_pagos} pagamento(s) confirmado(s)
          </p>

          <div className="card">
            <h2>Por lavador</h2>
            {caixa.por_lavador.length === 0 ? (
              <p className="empty" style={{ paddingBottom: 0 }}>
                Nenhum pagamento nesta data ainda.
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

          <div className="card">
            <h2>Fila agora ({caixa.data})</h2>
            <div className="stat-grid">
              <div className="stat">
                <p className="label">Na fila</p>
                <p className="value">{fila.na_fila}</p>
              </div>
              <div className="stat">
                <p className="label">Lavando</p>
                <p className="value">{fila.lavando}</p>
              </div>
              <div className="stat">
                <p className="label">Pronto</p>
                <p className="value">{fila.pronto}</p>
              </div>
              <div className="stat">
                <p className="label">Pago</p>
                <p className="value">{fila.pago}</p>
              </div>
              <div className="stat">
                <p className="label">Cancelado</p>
                <p className="value">{fila.cancelado}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
