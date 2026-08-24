"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginComPin } from "@/lib/api";

export default function EntrarPage() {
  const router = useRouter();
  const [lavadorId, setLavadorId] = useState("1");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await loginComPin(Number(lavadorId), pin);
      router.push("/atender");
    } catch {
      setErro("PIN inválido ou expirado. Peça o PIN do dia ao responsável do ponto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="auth-card form-stack" noValidate>
        <div>
          <p className="eyebrow">Acesso do dia</p>
          <h1>Entrar</h1>
          <p className="hint">
            Use o PIN do dia do ponto. Muda todo dia — alta rotatividade, zero
            senha pessoal.
          </p>
        </div>

        <label className="field">
          ID do lavador
          <input
            value={lavadorId}
            onChange={(e) => setLavadorId(e.target.value)}
            placeholder="Ex.: 1"
            inputMode="numeric"
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          PIN do dia <span className="req">*</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            placeholder="••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </label>

        {erro && (
          <p className="err" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
