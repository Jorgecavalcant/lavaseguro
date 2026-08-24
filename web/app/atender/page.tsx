"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type Servico = { id: number; nome: string; preco_centavos: number };
type Atendimento = {
  id: number;
  placa: string;
  servico_id: number;
  status: string;
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

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    apiFetch<Servico[]>("/api/v1/servicos")
      .then((rows) => {
        setServicos(rows);
        if (rows.length > 0) setServicoId(String(rows[0].id));
      })
      .catch(() => setErro("Não conseguimos carregar os serviços. Tente de novo."))
      .finally(() => setLoading(false));
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar() {
    try {
      const rows = await apiFetch<Atendimento[]>("/api/v1/atendimentos");
      setAtendimentos(rows);
    } catch {
      // silencioso — lista é best-effort
    }
  }

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
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para abrir o atendimento.");
    }
  }

  async function mudarStatus(id: number, status: string) {
    try {
      await apiFetch(`/api/v1/atendimentos/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para mudar o status.");
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

      <form onSubmit={submit} className="card form-row">
        <label className="field">
          Placa <span className="req">*</span>
          <input
            className="placa-input"
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
        <button type="submit">Abrir atendimento</button>
      </form>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {loading && <p className="empty">Carregando a fila…</p>}

      {!loading && (
        <ul className="queue-list">
          {atendimentos.map((a) => (
            <li key={a.id} className="queue-item">
              <div className="meta">
                <span className="id">#{a.id}</span>
                <span className="placa">{a.placa}</span>
                <span className={`badge ${a.status}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
              <div className="queue-actions">
                {a.status === "na_fila" && (
                  <button
                    type="button"
                    className="warn"
                    onClick={() => mudarStatus(a.id, "lavando")}
                  >
                    Iniciar lavagem
                  </button>
                )}
                {a.status === "lavando" && (
                  <button
                    type="button"
                    className="ok"
                    onClick={() => mudarStatus(a.id, "pronto")}
                  >
                    Marcar pronto
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && atendimentos.length === 0 && (
        <p className="empty">
          Nenhum atendimento na fila. Digite a placa para começar.
        </p>
      )}
    </section>
  );
}
