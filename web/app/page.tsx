import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <p className="eyebrow">Lava-jato · operação rápida</p>
        <h1>
          <span className="shine">LavaSeguro</span>
        </h1>
        <p className="lead">
          Placa na fila, status no painel, caixa fechado. Atendimento street para
          lava-jato e lavadores de rua — <strong>sem foto no fluxo normal</strong>
          (foto só se houver reclamação).
        </p>

        <div className="flow-strip" aria-label="Fluxo">
          <span className="flow-chip">
            <span>1</span> Placa
          </span>
          <span className="flow-chip">
            <span>2</span> Fila
          </span>
          <span className="flow-chip">
            <span>3</span> Pago
          </span>
        </div>

        <div className="cta-row">
          <Link href="/atender" className="btn">
            Começar atendimento
          </Link>
          <Link href="/entrar" className="btn secondary">
            Entrar com PIN do dia
          </Link>
        </div>

        <div className="card" style={{ marginTop: "2rem" }}>
          <p className="muted" style={{ margin: 0 }}>
            Um próximo passo por vez. PIN do dia para time rotativo. Cobrança
            plugável — MVP com confirmação manual.
          </p>
        </div>
      </div>
    </section>
  );
}
