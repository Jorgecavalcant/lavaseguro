"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type Servico = {
  id: number;
  nome: string;
  preco_centavos: number;
  ativo: boolean;
};

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ServicosPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const rows = await apiFetch<Servico[]>("/api/v1/servicos?ativos=false");
      setServicos(rows);
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não conseguimos carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    carregar();
  }, [carregar, router]);

  function precoParaCentavos(valor: string): number | null {
    const limpo = valor.replace(",", ".").trim();
    if (!limpo) return null;
    const n = Number(limpo);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const centavos = precoParaCentavos(preco);
    if (centavos === null) {
      setErro("Informe um preço válido em reais (ex.: 49,90).");
      return;
    }
    try {
      await apiFetch("/api/v1/servicos", {
        method: "POST",
        body: JSON.stringify({ nome, preco_centavos: centavos }),
      });
      setNome("");
      setPreco("");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para criar o serviço.");
    }
  }

  function iniciarEdicao(s: Servico) {
    setEditandoId(s.id);
    setEditNome(s.nome);
    setEditPreco((s.preco_centavos / 100).toFixed(2));
  }

  async function salvarEdicao(id: number) {
    setErro("");
    const centavos = precoParaCentavos(editPreco);
    if (centavos === null) {
      setErro("Informe um preço válido em reais (ex.: 49,90).");
      return;
    }
    try {
      await apiFetch(`/api/v1/servicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nome: editNome, preco_centavos: centavos }),
      });
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para salvar a edição.");
    }
  }

  async function desativar(id: number) {
    setErro("");
    try {
      await apiFetch(`/api/v1/servicos/${id}`, { method: "DELETE" });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para desativar o serviço.");
    }
  }

  async function reativar(id: number) {
    setErro("");
    try {
      await apiFetch(`/api/v1/servicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: true }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para reativar o serviço.");
    }
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Catálogo</p>
        <h1>Serviços</h1>
        <p className="muted" style={{ margin: 0 }}>
          Preço em reais, salvo em centavos.
        </p>
      </header>

      <form onSubmit={criar} className="card form-stack">
        <label className="field">
          Nome <span className="req">*</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Lavagem simples"
            required
          />
        </label>
        <label className="field">
          Preço R$ <span className="req">*</span>
          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            inputMode="decimal"
            placeholder="49,90"
            required
          />
        </label>
        <button type="submit" className="btn">
          Criar serviço
        </button>
      </form>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {loading && <p className="empty">Carregando serviços…</p>}

      {!loading && (
        <ul className="queue-list">
          {servicos.map((s) =>
            editandoId === s.id ? (
              <li key={s.id} className="queue-item">
                <div className="form-stack">
                  <label className="field">
                    Nome
                    <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                  </label>
                  <label className="field">
                    Preço R$
                    <input
                      value={editPreco}
                      onChange={(e) => setEditPreco(e.target.value)}
                      inputMode="decimal"
                    />
                  </label>
                  <div className="queue-actions">
                    <button type="button" className="ok" onClick={() => salvarEdicao(s.id)}>
                      Salvar
                    </button>
                    <button type="button" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              <li key={s.id} className="queue-item">
                <div className="meta">
                  <span className="id">#{s.id}</span>
                  <span>{s.nome}</span>
                  <span className="data">{brl(s.preco_centavos)}</span>
                  <span className={`badge ${s.ativo ? "pago" : "cancelado"}`}>
                    {s.ativo ? "ativo" : "inativo"}
                  </span>
                </div>
                <div className="queue-actions">
                  <button type="button" onClick={() => iniciarEdicao(s)}>
                    Editar
                  </button>
                  {s.ativo ? (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => desativar(s.id)}
                    >
                      Desativar
                    </button>
                  ) : (
                    <button type="button" className="ok" onClick={() => reativar(s.id)}>
                      Reativar
                    </button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {!loading && servicos.length === 0 && !erro && (
        <p className="empty">Nenhum serviço cadastrado ainda.</p>
      )}
    </section>
  );
}
