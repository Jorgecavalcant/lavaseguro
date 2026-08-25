"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginComPin } from "@/lib/api";

export default function EntrarPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await loginComPin(pin.trim());
      router.replace("/");
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
            Digite só o PIN do dia do ponto. Ele muda todo dia — sem senha pessoal.
          </p>
        </div>

        <label className="field">
          PIN do dia <span className="req">*</span>
          <input
            ref={inputRef}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={8}
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

        <button type="submit" disabled={loading || !pin.trim()}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
