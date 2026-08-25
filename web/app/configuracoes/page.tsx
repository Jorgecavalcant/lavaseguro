"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

const KEY_PONTO = "lavaseguro_ponto_nome";
const KEY_PROVIDER = "lavaseguro_provider_default";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [pontoNome, setPontoNome] = useState("");
  const [providerDefault] = useState("manual");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    setPontoNome(localStorage.getItem(KEY_PONTO) ?? "");
  }, [router]);

  function salvarPonto(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(KEY_PONTO, pontoNome.trim());
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Ajustes locais</p>
        <h1>Configurações</h1>
        <p className="muted" style={{ margin: 0 }}>
          Preferências deste dispositivo (salvas no navegador).
        </p>
      </header>

      <form onSubmit={salvarPonto} className="card form-stack">
        <label className="field">
          Nome do ponto / unidade
          <input
            value={pontoNome}
            onChange={(e) => setPontoNome(e.target.value)}
            placeholder="Salto Centro"
          />
        </label>
        <button type="submit" className="btn">
          Salvar ponto
        </button>
      </form>

      <div className="card form-stack">
        <h2>Pagamentos</h2>
        <p className="muted">
          Provedor padrão deste dispositivo:{" "}
          <span className="data">{providerDefault}</span>
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            localStorage.setItem(KEY_PROVIDER, "manual");
            alert("Provedor padrão definido como manual neste dispositivo.");
          }}
        >
          Definir provedor manual
        </button>
      </div>

      <div className="card form-stack">
        <h2>Equipe</h2>
        <p className="muted">
          Cadastre lavadores, comissões e PINs de acesso.
        </p>
        <Link href="/lavadores" className="btn">
          Ir para Lavadores
        </Link>
      </div>
    </section>
  );
}
