"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type Lavador = {
  id: number;
  nome: string;
  comissao_pct: number;
  ativo: boolean;
};

type PinResposta = { pin: string; qr_payload: string };

export default function LavadoresPage() {
  const router = useRouter();
  const [lavadores, setLavadores] = useState<Lavador[]>([]);
  const [nome, setNome] = useState("");
  const [comissao, setComissao] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editComissao, setEditComissao] = useState("");
  const [pins, setPins] = useState<Record<number, PinResposta>>({});
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const rows = await apiFetch<Lavador[]>("/api/v1/lavadores");
      setLavadores(rows);
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não conseguimos carregar os lavadores.");
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

  function pctValido(valor: string): number | null {
    const limpo = valor.replace(",", ".").trim();
    if (!limpo) return null;
    const n = Number(limpo);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return n;
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const pct = pctValido(comissao);
    if (pct === null) {
      setErro("Informe uma comissão válida entre 0 e 100 (%).");
      return;
    }
    try {
      await apiFetch("/api/v1/lavadores", {
        method: "POST",
        body: JSON.stringify({ nome, comissao_pct: pct }),
      });
      setNome("");
      setComissao("");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para criar o lavador.");
    }
  }

  function iniciarEdicao(l: Lavador) {
    setEditandoId(l.id);
    setEditNome(l.nome);
    setEditComissao(String(l.comissao_pct));
  }

  async function salvarEdicao(id: number) {
    setErro("");
    const pct = pctValido(editComissao);
    if (pct === null) {
      setErro("Informe uma comissão válida entre 0 e 100 (%).");
      return;
    }
    try {
      await apiFetch(`/api/v1/lavadores/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nome: editNome, comissao_pct: pct }),
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
      await apiFetch(`/api/v1/lavadores/${id}`, { method: "DELETE" });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para desativar o lavador.");
    }
  }

  async function reativar(id: number) {
    setErro("");
    try {
      await apiFetch(`/api/v1/lavadores/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: true }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para reativar o lavador.");
    }
  }

  async function gerarPin(id: number) {
    setErro("");
    try {
      const resp = await apiFetch<PinResposta>(`/api/v1/lavadores/${id}/pin-do-dia`, {
        method: "POST",
      });
      setPins((prev) => ({ ...prev, [id]: resp }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para gerar o PIN.");
    }
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Equipe</p>
        <h1>Lavadores</h1>
        <p className="muted" style={{ margin: 0 }}>
          Cadastro, comissão e PIN de login do dia.
        </p>
      </header>

      <form onSubmit={criar} className="card form-stack">
        <label className="field">
          Nome <span className="req">*</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Maria"
            required
          />
        </label>
        <label className="field">
          Comissão % <span className="req">*</span>
          <input
            value={comissao}
            onChange={(e) => setComissao(e.target.value)}
            inputMode="decimal"
            placeholder="40"
            required
          />
        </label>
        <button type="submit" className="btn">
          Criar lavador
        </button>
      </form>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {loading && <p className="empty">Carregando lavadores…</p>}

      {!loading && (
        <ul className="queue-list">
          {lavadores.map((l) => (
            <li key={l.id} className="queue-item">
              {editandoId === l.id ? (
                <div className="form-stack">
                  <label className="field">
                    Nome
                    <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                  </label>
                  <label className="field">
                    Comissão %
                    <input
                      value={editComissao}
                      onChange={(e) => setEditComissao(e.target.value)}
                      inputMode="decimal"
                    />
                  </label>
                  <div className="queue-actions">
                    <button type="button" className="ok" onClick={() => salvarEdicao(l.id)}>
                      Salvar
                    </button>
                    <button type="button" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="meta">
                    <span className="id">#{l.id}</span>
                    <span>{l.nome}</span>
                    <span className="muted">{l.comissao_pct}% comissão</span>
                    <span className={`badge ${l.ativo ? "pago" : "cancelado"}`}>
                      {l.ativo ? "ativo" : "inativo"}
                    </span>
                  </div>
                  <div className="queue-actions">
                    <button type="button" className="warn" onClick={() => gerarPin(l.id)}>
                      Gerar PIN
                    </button>
                    <button type="button" onClick={() => iniciarEdicao(l)}>
                      Editar
                    </button>
                    {l.ativo ? (
                      <button type="button" className="danger" onClick={() => desativar(l.id)}>
                        Desativar
                      </button>
                    ) : (
                      <button type="button" className="ok" onClick={() => reativar(l.id)}>
                        Reativar
                      </button>
                    )}
                  </div>
                  {pins[l.id] && (
                    <div className="card form-stack" style={{ marginTop: "0.75rem" }}>
                      <p>
                        <strong>PIN do dia:</strong>{" "}
                        <span className="data">{pins[l.id].pin}</span>
                      </p>
                      <p className="muted">
                        QR payload: <code>{pins[l.id].qr_payload}</code>
                      </p>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!loading && lavadores.length === 0 && !erro && (
        <p className="empty">Nenhum lavador cadastrado ainda.</p>
      )}
    </section>
  );
}
