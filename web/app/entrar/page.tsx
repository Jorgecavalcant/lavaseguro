"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginComPin } from "@/lib/api";

export default function EntrarPage() {
  const router = useRouter();
  const [lavadorId, setLavadorId] = useState("1");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      await loginComPin(Number(lavadorId), pin);
      router.push("/atender");
    } catch {
      setErro("PIN inválido ou expirado.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form onSubmit={submit} className="bg-slate-800 p-8 rounded-xl w-80 space-y-4">
        <h1 className="text-xl font-bold">LavaSeguro — Entrar</h1>
        <input value={lavadorId} onChange={(e) => setLavadorId(e.target.value)}
               placeholder="ID do lavador" inputMode="numeric"
               className="w-full p-2 rounded bg-slate-700" />
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password"
               placeholder="PIN do dia" inputMode="numeric"
               className="w-full p-2 rounded bg-slate-700" />
        {erro && <p className="text-red-400 text-sm">{erro}</p>}
        <button className="w-full p-2 rounded bg-blue-600 font-semibold">Entrar</button>
      </form>
    </main>
  );
}
