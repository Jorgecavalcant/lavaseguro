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

export default function AtenderPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [placa, setPlaca] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [erro, setErro] = useState("");

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
      .catch(() => setErro("Falha ao carregar serviços."));
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
      setErro(err instanceof Error ? err.message : "Erro ao abrir atendimento.");
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
      setErro(err instanceof Error ? err.message : "Erro ao mudar status.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Atender</h1>

      <form onSubmit={submit} className="flex flex-wrap gap-2 mb-8">
        <input
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="Placa (ex.: ABC-1234)"
          minLength={5}
          maxLength={10}
          required
          className="p-2 rounded bg-slate-800 border border-slate-700 flex-1 min-w-[180px]"
        />
        <select
          value={servicoId}
          onChange={(e) => setServicoId(e.target.value)}
          className="p-2 rounded bg-slate-800 border border-slate-700"
        >
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} — R$ {(s.preco_centavos / 100).toFixed(2)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 font-semibold hover:bg-blue-500"
        >
          Abrir atendimento
        </button>
      </form>

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      <ul className="space-y-2">
        {atendimentos.map((a) => (
          <li
            key={a.id}
            className="bg-slate-800 p-3 rounded flex justify-between items-center"
          >
            <span>
              #{a.id} — {a.placa} ·{" "}
              <strong className="capitalize">{a.status.replace("_", " ")}</strong>
            </span>
            <span className="flex gap-2">
              {a.status === "na_fila" && (
                <button
                  onClick={() => mudarStatus(a.id, "lavando")}
                  className="px-3 py-1 rounded bg-yellow-600 text-sm hover:bg-yellow-500"
                >
                  Iniciar lavagem
                </button>
              )}
              {a.status === "lavando" && (
                <button
                  onClick={() => mudarStatus(a.id, "pronto")}
                  className="px-3 py-1 rounded bg-green-600 text-sm hover:bg-green-500"
                >
                  Marcar pronto
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {atendimentos.length === 0 && (
        <p className="text-slate-400">Nenhum atendimento aberto.</p>
      )}
    </main>
  );
}
