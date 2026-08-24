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
};

const STATUS_LABEL: Record<string, string> = {
  na_fila: "Na fila",
  lavando: "Lavando",
  pronto: "Pronto",
  pago: "Pago",
  cancelado: "Cancelado",
};

export default function PainelPage() {
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const rows = await apiFetch<Atendimento[]>("/api/v1/atendimentos");
      setAtendimentos(rows);
      setErro("");
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não conseguimos carregar os atendimentos."
      );
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

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Fila ao vivo</p>
        <h1>Painel</h1>
        <p className="muted" style={{ margin: 0 }}>
          Status na ponta do polegar: fila → lavando → pronto.
        </p>
      </header>

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
                      onClick={() => mudarStatus(a.id, "cancelado")}
                    >
                      Cancelar
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
                      onClick={() => mudarStatus(a.id, "cancelado")}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && atendimentos.length === 0 && !erro && (
        <p className="empty">
          Nenhum atendimento registrado. Abra um em Atender.
        </p>
      )}
    </section>
  );
}
