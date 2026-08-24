"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Atendimento, api } from "@/lib/api";

const NEXT: Record<string, string | null> = {
  na_fila: "lavando",
  lavando: "pronto",
  pronto: null,
  pago: null,
  cancelado: null,
};

export default function PainelPage() {
  const [itens, setItens] = useState<Atendimento[]>([]);
  const [err, setErr] = useState("");

  const carregar = useCallback(async () => {
    try {
      const data = await api<Atendimento[]>("/api/v1/atendimentos");
      setItens(data.filter((a) => !["pago", "cancelado"].includes(a.status)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao carregar fila");
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 4000);
    return () => clearInterval(id);
  }, [carregar]);

  async function avancar(a: Atendimento) {
    const next = NEXT[a.status];
    if (!next) return;
    setErr("");
    try {
      await api(`/api/v1/atendimentos/${a.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await carregar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao atualizar");
    }
  }

  async function marcarPago(a: Atendimento) {
    setErr("");
    try {
      await api("/api/v1/payments/charge", {
        method: "POST",
        body: JSON.stringify({
          atendimento_id: a.id,
          meio: "pix",
          provider: "manual",
        }),
      });
      await carregar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no pagamento");
    }
  }

  return (
    <section>
      <p>
        <Link href="/">LavaSeguro</Link> · Painel
      </p>
      <h1>Fila</h1>
      <p className="lead">Status: na fila → lavando → pronto → pago.</p>
      {err && <p className="err">{err}</p>}
      <div className="card">
        {itens.length === 0 && <p>Fila vazia.</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {itens.map((a) => (
            <li
              key={a.id}
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                alignItems: "center",
                padding: "0.75rem 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <strong>{a.placa}</strong>
              <span>#{a.id}</span>
              <span>{a.status}</span>
              {NEXT[a.status] && (
                <button type="button" onClick={() => avancar(a)}>
                  → {NEXT[a.status]}
                </button>
              )}
              {a.status === "pronto" && (
                <button type="button" onClick={() => marcarPago(a)}>
                  Marcar pago (manual)
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p>
        <Link href="/caixa">Caixa do dia →</Link>
      </p>
    </section>
  );
}
