"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

type AuthOut = { ok: boolean; lavador_id: number; lavador_nome: string; data: string };

export default function EntrarPage() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const data = await api<AuthOut>("/api/v1/auth/pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "lavaseguro_sessao",
          JSON.stringify({ lavador_id: data.lavador_id, nome: data.lavador_nome })
        );
      }
      setMsg(`Olá, ${data.lavador_nome}. PIN válido para ${data.data}.`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha no login");
    }
  }

  return (
    <section>
      <h1>Entrar</h1>
      <p className="lead">Use o PIN do dia (ou QR) entregue pelo operador. Alta rotatividade, sem senha fixa.</p>
      <form className="card row" onSubmit={onSubmit}>
        <label>
          PIN do dia
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={8}
            inputMode="numeric"
            required
            placeholder="1234"
          />
        </label>
        <button type="submit">Entrar</button>
      </form>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}
    </section>
  );
}
