import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LavaSeguro",
  description: "Atendimento e caixa para lava-jato — Tech42",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main>
          <nav>
            <Link href="/">Início</Link>
            <Link href="/entrar">Entrar</Link>
            <Link href="/atender">Atender</Link>
            <Link href="/painel">Painel</Link>
            <Link href="/caixa">Caixa</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
