"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CaixaDia, api, brl } from "@/lib/api";

export default function CaixaPage() {
  const [caixa, setCaixa] = useState<CaixaDia | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<CaixaDia>("/api/v1/caixa/dia");
        setCaixa(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao carregar caixa");
      }
    })();
  }, []);

  return (
    <section>
      <p>
        <Link href="/">LavaSeguro</Link> · Caixa
      </p>
      <h1>Caixa do dia</h1>
      <p className="lead">Totais e comissão por lavador.</p>
      {err && <p className="err">{err}</p>}
      {caixa && (
        <div className="card">
          <p>
            <strong>Data:</strong> {caixa.data}
          </p>
          <p>
            Pagos: {caixa.total_pagos} · Bruto: {brl(caixa.bruto_centavos)} ·
            Comissão: {brl(caixa.comissao_centavos)} · Líquido:{" "}
            {brl(caixa.liquido_centavos)}
          </p>
          <h2>Por lavador</h2>
          <ul>
            {caixa.por_lavador.map((l) => (
              <li key={String(l.lavador_id)}>
                {l.lavador_nome}: {l.qtd_pagos} · {brl(l.bruto_centavos)} ·
                comissão {brl(l.comissao_centavos)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
