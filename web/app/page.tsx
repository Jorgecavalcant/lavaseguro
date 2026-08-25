"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken, getLavadorNome } from "@/lib/api";

type Atendimento = {
  id: number;
  placa: string;
  status: string;
  servico_nome?: string | null;
};

type CaixaDia = {
  total_pagos: number;
  bruto_centavos: number;
  comissao_centavos: number;
  liquido_centavos: number;
};

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const STATUS_LABEL: Record<string, string> = {
  na_fila: "Na fila",
  lavando: "Lavando",
  pronto: "Pronto",
  pago: "Pago",
  cancelado: "Cancelado",
};

function HomeGerencial() {
  const nome = getLavadorNome();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [caixa, setCaixa] = useState<CaixaDia | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const [ats, cx] = await Promise.all([
        apiFetch<Atendimento[]>("/api/v1/atendimentos"),
        apiFetch<CaixaDia>("/api/v1/caixa/dia"),
      ]);
      setAtendimentos(ats);
      setCaixa(cx);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não conseguimos carregar o dia. Tente de novo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  const abertos = atendimentos.filter((a) =>
    ["na_fila", "lavando", "pronto"].includes(a.status)
  );

  if (loading) return <p className="empty">Carregando o dia…</p>;

  if (erro) {
    return (
      <div className="empty">
        <p className="err" role="alert">
          {erro}
        </p>
        <button type="button" className="btn" onClick={carregar}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Operação do dia</p>
        <h1>Olá, {nome || "time"}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {hoje}
        </p>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <p className="label">Na fila / abertos</p>
          <p className="value">{abertos.length}</p>
        </div>
        <div className="stat">
          <p className="label">Pagos hoje</p>
          <p className="value">{caixa?.total_pagos ?? 0}</p>
        </div>
        <div className="stat">
          <p className="label">Bruto hoje</p>
          <p className="value">{brl(caixa?.bruto_centavos ?? 0)}</p>
        </div>
        <div className="stat">
          <p className="label">Comissão hoje</p>
          <p className="value">{brl(caixa?.comissao_centavos ?? 0)}</p>
        </div>
      </div>

      <div className="shortcut-grid" aria-label="Atalhos">
        <Link className="btn" href="/atender">
          Atender
        </Link>
        <Link className="btn secondary" href="/painel">
          Painel
        </Link>
        <Link className="btn secondary" href="/caixa">
          Caixa
        </Link>
        <Link className="btn secondary" href="/servicos">
          Serviços
        </Link>
        <Link className="btn secondary" href="/lavadores">
          Lavadores
        </Link>
        <Link className="btn secondary" href="/configuracoes">
          Configurações
        </Link>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Fila aberta</h2>
      {abertos.length === 0 ? (
        <div className="empty">
          <p>Nenhum atendimento aberto.</p>
          <Link className="btn" href="/atender">
            Abrir atendimento
          </Link>
        </div>
      ) : (
        <ul className="queue-list">
          {abertos.slice(0, 5).map((a) => (
            <li key={a.id} className="queue-item">
              <div className="meta">
                <span className="id">#{a.id}</span>
                <span className="placa">{a.placa}</span>
                <span className={`badge ${a.status}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
              <div className="queue-actions">
                <Link className="btn secondary" href="/painel">
                  Ver painel
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Landing() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <p className="eyebrow">Lava-jato · operação rápida</p>
        <h1>
          <span className="shine">LavaSeguro</span>
        </h1>
        <p className="lead">
          Placa na fila, status no painel, caixa fechado. Atendimento street para
          lava-jato e lavadores de rua — <strong>sem foto no fluxo normal</strong>
          (foto só se houver reclamação).
        </p>

        <div className="flow-strip" aria-label="Fluxo">
          <span className="flow-chip">
            <span>1</span> Placa
          </span>
          <span className="flow-chip">
            <span>2</span> Fila
          </span>
          <span className="flow-chip">
            <span>3</span> Pago
          </span>
        </div>

        <div className="cta-row">
          <Link href="/atender" className="btn">
            Começar atendimento
          </Link>
          <Link href="/entrar" className="btn secondary">
            Entrar com PIN do dia
          </Link>
        </div>

        <div className="card" style={{ marginTop: "2rem" }}>
          <p className="muted" style={{ margin: 0 }}>
            Um próximo passo por vez. PIN do dia para time rotativo. Cobrança
            plugável — MVP com confirmação manual.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [token, setTokenState] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setChecked(true);
  }, []);

  if (!checked) return <p className="empty">Carregando…</p>;
  if (!token) return <Landing />;
  return <HomeGerencial />;
}
