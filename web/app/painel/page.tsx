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

  const carregar = useCallback(async () => {
    try {
      const rows = await apiFetch<Atendimento[]>("/api/v1/atendimentos");
      setAtendimentos(rows);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar atendimentos.");
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
      setErro(err instanceof Error ? err.message : "Erro ao mudar status.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Painel de Atendimentos</h1>

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      <ul className="space-y-2">
        {atendimentos.map((a) => (
          <li
            key={a.id}
            className="bg-slate-800 p-3 rounded flex flex-wrap justify-between items-center gap-2"
          >
            <span>
              #{a.id} — {a.placa} ·{" "}
              <strong>{STATUS_LABEL[a.status] ?? a.status}</strong>
            </span>
            <span className="flex gap-2">
              {a.status === "na_fila" && (
                <>
                  <button
                    onClick={() => mudarStatus(a.id, "lavando")}
                    className="px-3 py-1 rounded bg-yellow-600 text-sm hover:bg-yellow-500"
                  >
                    Lavando
                  </button>
                  <button
                    onClick={() => mudarStatus(a.id, "cancelado")}
                    className="px-3 py-1 rounded bg-red-700 text-sm hover:bg-red-600"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {a.status === "lavando" && (
                <>
                  <button
                    onClick={() => mudarStatus(a.id, "pronto")}
                    className="px-3 py-1 rounded bg-green-600 text-sm hover:bg-green-500"
                  >
                    Pronto
                  </button>
                  <button
                    onClick={() => mudarStatus(a.id, "cancelado")}
                    className="px-3 py-1 rounded bg-red-700 text-sm hover:bg-red-600"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {(a.status === "pronto" || a.status === "pago" || a.status === "cancelado") && (
                <span className="text-slate-500 text-sm">—</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {atendimentos.length === 0 && !erro && (
        <p className="text-slate-400">Nenhum atendimento registrado.</p>
      )}
    </main>
  );
}
