import type { Metadata } from "next";
import TopNav from "./components/TopNav";
import ThemeToggle from "./components/ThemeToggle";
import { Archivo, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
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

const themeBoot = `(function(){try{var t=localStorage.getItem('ls_theme');if(t!=='light'&&t!=='dark')t='light';var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <div className="shell">
          <TopNav />
          {children}
        </div>
        <ThemeToggle />
      </body>
    </html>
  );
}
