import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "LavaSeguro",
  description:
    "Atendimento e caixa para lava-jato — placa, fila e pago. Sem foto no fluxo normal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${sourceSans.variable}`}>
      <body>
        <div className="shell">
          <nav className="topnav" aria-label="Principal">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden>
                LS
              </span>
              LavaSeguro
            </Link>
            <div className="nav-links">
              <Link href="/entrar">Entrar</Link>
              <Link href="/atender">Atender</Link>
              <Link href="/painel">Painel</Link>
              <Link href="/caixa">Caixa</Link>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
