"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type Servico = { id: number; nome: string; preco_centavos: number; ativo: boolean };
type Atendimento = {
  id: number;
  placa: string;
  servico_id: number;
  lavador_id: number | null;
  status: string;
  servico_nome?: string;
  lavador_nome?: string;
};

const STATUS_LABEL: Record<string, string> = {
  na_fila: "Na fila",
  lavando: "Lavando",
  pronto: "Pronto",
  pago: "Pago",
  cancelado: "Cancelado",
};

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AtenderPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [placa, setPlaca] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarFila = useCallback(async () => {
    try {
      const rows = await apiFetch<Atendimento[]>("/api/v1/atendimentos");
      setAtendimentos(rows);
    } catch {
      // silencioso — lista é best-effort
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    apiFetch<Servico[]>("/api/v1/servicos")
      .then((rows) => {
        const ativos = rows.filter((s) => s.ativo);
        setServicos(ativos);
        if (ativos.length > 0) setServicoId(String(ativos[0].id));
      })
      .catch(() => setErro("Não conseguimos carregar os serviços. Tente de novo."))
      .finally(() => setLoading(false));
    carregarFila();
  }, [router, carregarFila]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      await apiFetch("/api/v1/atendimentos", {
        method: "POST",
        body: JSON.stringify({
          placa,
          servico_id: Number(servicoId),
        }),
      });
      setPlaca("");
      await carregarFila();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para abrir o atendimento.");
    }
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Operação</p>
        <h1>Atender</h1>
        <p className="muted" style={{ margin: 0 }}>
          Placa + serviço → na fila. Sem foto neste fluxo.
        </p>
      </header>

      <form onSubmit={submit} className="card form-stack">
        <label className="field">
          Placa <span className="req">*</span>
          <input
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="ABC1D23"
            minLength={5}
            maxLength={10}
            required
            autoComplete="off"
          />
        </label>
        <label className="field">
          Serviço
          <select
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            required
          >
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {brl(s.preco_centavos)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn">
          Abrir atendimento
        </button>
      </form>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {loading && <p className="empty">Carregando a fila…</p>}

      {!loading && (
        <ul className="queue-list">
          {atendimentos.slice(0, 10).map((a) => (
            <li key={a.id} className="queue-item">
              <div className="meta">
                <span className="id">#{a.id}</span>
                <span className="placa">{a.placa}</span>
                <span>{a.servico_nome ?? ""}</span>
                <span className={`badge ${a.status}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && atendimentos.length === 0 && !erro && (
        <p className="empty">
          Nenhum atendimento na fila. Digite a placa para começar.
        </p>
      )}
    </section>
  );
}
