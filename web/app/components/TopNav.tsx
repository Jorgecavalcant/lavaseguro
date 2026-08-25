"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/api";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/atender", label: "Atender" },
  { href: "/painel", label: "Painel" },
  { href: "/caixa", label: "Caixa" },
  { href: "/servicos", label: "Serviços" },
  { href: "/lavadores", label: "Lavadores" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function TopNav() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getToken());
    const sync = () => setToken(getToken());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <nav className="topnav" aria-label="Principal">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          LS
        </span>
        LavaSeguro
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        {token ? (
          <button
            type="button"
            className="btn secondary"
            style={{ marginLeft: "0.5rem", minHeight: "44px", padding: "0.3rem 0.9rem" }}
            onClick={() => {
              clearSession();
              setToken(null);
              router.replace("/entrar");
            }}
          >
            Sair
          </button>
        ) : (
          <Link href="/entrar">Entrar</Link>
        )}
      </div>
    </nav>
  );
}
