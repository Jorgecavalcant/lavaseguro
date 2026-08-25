"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";

type Atendimento = {
  id: number;
  placa: string;
  servico_id: number;
  lavador_id: number | null;
  status: string;
  servico_nome?: string;
  lavador_nome?: string;
};

type Servico = { id: number; nome: string; preco_centavos: number; ativo: boolean };

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

function hojeISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

const STATUS_ABERTOS = new Set(["na_fila", "lavando", "pronto"]);

export default function PainelPage() {
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editPlaca, setEditPlaca] = useState("");
  const [editServicoId, setEditServicoId] = useState("");
  const [meioPagamento, setMeioPagamento] = useState<Record<number, string>>({});
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const rows = await apiFetch<Atendimento[]>(`/api/v1/atendimentos?data=${hojeISO()}`);
      setAtendimentos(rows);
      setErro("");
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Não conseguimos carregar os atendimentos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const visiveis = mostrarTodos
    ? atendimentos
    : atendimentos.filter((a) => STATUS_ABERTOS.has(a.status));

  useEffect(() => {
    if (!getToken()) {
      router.replace("/entrar");
      return;
    }
    carregar();
    apiFetch<Servico[]>("/api/v1/servicos")
      .then((rows) => {
        setServicos(rows.filter((s) => s.ativo));
      })
      .catch(() => {});
  }, [carregar, router]);

  async function mudarStatus(id: number, status: string) {
    setErro("");
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

  async function cancelar(id: number) {
    await mudarStatus(id, "cancelado");
  }

  function iniciarEdicao(a: Atendimento) {
    setEditandoId(a.id);
    setEditPlaca(a.placa);
    setEditServicoId(String(a.servico_id));
  }

  async function salvarEdicao(id: number) {
    setErro("");
    try {
      await apiFetch(`/api/v1/atendimentos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          placa: editPlaca.toUpperCase(),
          servico_id: Number(editServicoId),
        }),
      });
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para salvar a edição.");
    }
  }

  async function receberManual(id: number) {
    setErro("");
    try {
      await apiFetch("/api/v1/payments/charge", {
        method: "POST",
        body: JSON.stringify({
          atendimento_id: id,
          meio: meioPagamento[id] ?? "pix",
          provider: "manual",
        }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para registrar o pagamento.");
    }
  }

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Fila ao vivo · hoje</p>
        <h1>Painel</h1>
        <p className="muted" style={{ margin: 0 }}>
          Status na ponta do polegar: fila → lavando → pronto → pago.
        </p>
      </header>

      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", maxWidth: "fit-content" }}>
        <input
          type="checkbox"
          checked={mostrarTodos}
          onChange={(e) => setMostrarTodos(e.target.checked)}
          aria-label="Mostrar também pagos e cancelados de hoje"
        />
        Mostrar também pagos e cancelados de hoje
      </label>

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      {loading && <p className="empty">Carregando a fila…</p>}

      {!loading && (
        <ul className="queue-list">
          {visiveis.map((a) => (
            <li key={a.id} className="queue-item">
              <div className="meta">
                <span className="id">#{a.id}</span>
                <span className="placa">{a.placa}</span>
                <span>{a.servico_nome ?? `serviço ${a.servico_id}`}</span>
                <span className="muted">
                  {a.lavador_nome ?? "sem lavador"}
                </span>
                <span className={`badge ${a.status}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>

              {a.status === "na_fila" && editandoId === a.id ? (
                <div className="queue-actions form-stack">
                  <label className="field">
                    Placa
                    <input
                      value={editPlaca}
                      onChange={(e) => setEditPlaca(e.target.value.toUpperCase())}
                      minLength={5}
                      maxLength={10}
                    />
                  </label>
                  <label className="field">
                    Serviço
                    <select
                      value={editServicoId}
                      onChange={(e) => setEditServicoId(e.target.value)}
                    >
                      {servicos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} — {brl(s.preco_centavos)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="queue-actions">
                    <button type="button" className="ok" onClick={() => salvarEdicao(a.id)}>
                      Salvar
                    </button>
                    <button type="button" onClick={() => setEditandoId(null)}>
                      Cancelar edição
                    </button>
                  </div>
                </div>
              ) : (
                <div className="queue-actions">
                  {a.status === "na_fila" && (
                    <>
                      <button
                        type="button"
                        className="warn"
                        onClick={() => mudarStatus(a.id, "lavando")}
                      >
                        Lavando
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => cancelar(a.id)}
                      >
                        Cancelar
                      </button>
                      <button type="button" onClick={() => iniciarEdicao(a)}>
                        Editar
                      </button>
                    </>
                  )}

                  {a.status === "lavando" && (
                    <>
                      <button
                        type="button"
                        className="ok"
                        onClick={() => mudarStatus(a.id, "pronto")}
                      >
                        Pronto
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => cancelar(a.id)}
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {a.status === "pronto" && (
                    <>
                      <label className="field">
                        Meio
                        <select
                          value={meioPagamento[a.id] ?? "pix"}
                          onChange={(e) =>
                            setMeioPagamento((prev) => ({
                              ...prev,
                              [a.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="pix">Pix</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ok"
                        onClick={() => receberManual(a.id)}
                      >
                        Receber (manual)
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!loading && visiveis.length === 0 && !erro && (
        <p className="empty">
          {atendimentos.length === 0
            ? "Nenhum atendimento hoje ainda. Abra um em Atender."
            : "Fila vazia — tudo pago ou cancelado hoje. Marque \"Mostrar também pagos e cancelados\" para ver."}
        </p>
      )}
    </section>
  );
}
