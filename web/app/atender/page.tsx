"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Atendimento, Servico, api, brl } from "@/lib/api";

export default function AtenderPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [placa, setPlaca] = useState("");
  const [servicoId, setServicoId] = useState<number | "">("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await api("/api/v1/seed", { method: "POST" }).catch(() => undefined);
        const list = await api<Servico[]>("/api/v1/servicos");
        setServicos(list.filter((s) => s.ativo));
        if (list[0]) setServicoId(list[0].id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao carregar serviços");
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!servicoId) return;
    try {
      const sessao =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("lavaseguro_sessao") || "null")
          : null;
      const created = await api<Atendimento>("/api/v1/atendimentos", {
        method: "POST",
        body: JSON.stringify({
          placa: placa.toUpperCase().replace(/\s/g, ""),
          servico_id: servicoId,
          lavador_id: sessao?.lavador_id ?? null,
        }),
      });
      setMsg(`Atendimento #${created.id} na fila — placa ${created.placa}.`);
      setPlaca("");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao criar atendimento");
    }
  }

  return (
    <section>
      <p>
        <Link href="/">LavaSeguro</Link> · Atender
      </p>
      <h1>Atendimento rápido</h1>
      <p className="lead">Placa + serviço. Sem foto neste fluxo.</p>
      <form className="card row" onSubmit={onSubmit}>
        <label>
          Placa
          <input
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            required
            minLength={5}
            maxLength={10}
            placeholder="ABC1D23"
          />
        </label>
        <label>
          Serviço
          <select
            value={servicoId}
            onChange={(e) => setServicoId(Number(e.target.value))}
            required
          >
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} · {brl(s.preco_centavos)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Colocar na fila</button>
      </form>
      <p>
        <Link href="/painel">Ver painel da fila →</Link>
      </p>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}
    </section>
  );
}
