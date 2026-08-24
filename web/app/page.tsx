import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>LavaSeguro</h1>
      <p className="lead">
        Atendimento rápido para lava-jato e lavadores de rua: placa + serviço,
        fila, cobrança e caixa do dia. <strong>Sem foto no fluxo normal</strong> —
        foto só se houver reclamação.
      </p>
      <div className="cta">
        <Link href="/atender">Começar atendimento</Link>
        <Link href="/entrar" style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }}>
          Entrar com PIN do dia
        </Link>
      </div>
      <div className="card" style={{ marginTop: "2rem" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Produto Tech42 · Domínio alvo: lavaseguro.tech42.com.br · Cobrança
          plugável (banco/adquirente do cliente). MVP: provedor manual.
        </p>
      </div>
    </section>
  );
}
