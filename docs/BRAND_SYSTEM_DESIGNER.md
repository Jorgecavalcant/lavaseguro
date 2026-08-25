# Brand System — LavaSeguro

| Campo | Valor |
|:---|:---|
| Produto | LavaSeguro |
| Versão deste doc | **2.0** vigente |
| Dono | CEO + diretor-design-ux + designer-visual |
| Última atualização | 2026-08-24 |
| Status | [x] vigente para peça pública e produto |

---

## 1. Para que este arquivo existe

Contrato visual e de experiência do **LavaSeguro** — landing, PIN do dia, atender, painel, caixa e área gerencial.

Implementação: `web/app/globals.css` (tokens `:root`) + App Router. Este doc manda; o CSS obedece.

---

## 2. Escopo

**Vale para:** `lavaseguro.tech42.com.br` — `/`, `/entrar`, `/atender`, `/painel`, `/caixa`, home gerencial, dashboard, settings, users.

**Não vale para:** institucional Tech 42 e demais produtos da casa.

**Público:** dono do ponto; lavadores (alta rotatividade, PIN do dia). Cliente final não usa o app no MVP.

---

## 3. Chassis Tech42 (comum) + pele LavaSeguro (distinta)

### 3.1 Chassis — o que não muda entre produtos da casa

| Camada | Regra |
|:---|:---|
| UX | 1 ação óbvia por vista; DNA Cerbasi; mobile-first; alvos ≥ 44px; contraste WCAG AA |
| Escala tipográfica | Display → H1 → H2 → H3 → Body → Small → Caption |
| Estados UI | hover / focus / disabled / error / success / loading |
| Spacing | base **8px**; múltiplos 4/8/12/16/24/32/48 |
| Canto | **10–12px** em controles (não pill 999px como padrão) |
| Card | só quando há interação ou agrupamento acionável |
| Layouts | home gerencial, dashboard, settings, users (§8) |

### 3.2 Pele — o que é só LavaSeguro

| Dimensão | Decisão |
|:---|:---|
| Atmosfera | Pátio de dia: concreto claro, asfalto, água/cloro |
| Paleta | Concreto + tinta asfalto + cloro (teal operacional) |
| Display | **Archivo** (street, condensada no título) |
| UI | **Source Sans 3** |
| Voz | Rápido, operacional de pátio, sem “enterprise” |

**Nota de direção:** produto **claro** (luz de rua). Não herda dark SaaS azul/teal genérico.

---

## 4. DNA da casa vs voz deste produto

**Base:** DNA Cerbasi — acolher, educar, um próximo passo, sem pressão.

**Voz LavaSeguro:**

- Tom: rápido, street, operacional de pátio
- Trata o leitor de: **você**
- Palavras que usamos: placa, fila, atender, PIN do dia, caixa, comissão
- Palavras que não usamos: enterprise, urgência falsa, “foto obrigatória” no fluxo normal
- Promessa: **PIN do dia, atende em segundos, fecha o caixa sem briga de comissão.**

---

## 5. UX — como funciona

### 5.1 Princípios

1. Uma ação óbvia: **Atender**
2. PIN do dia (rotatividade alta)
3. Foto só em reclamação
4. Caixa do dia por lavador
5. Alvos grandes no polegar (sol, luva, pressa)

### 5.2 Próximo passo padrão

**Entrar com PIN** → **Começar atendimento** (placa + serviço) → painel → caixa

### 5.3 Estados obrigatórios (comportamento)

| Estado | O que a pessoa vê | O que pode fazer |
|:---|:---|:---|
| Carregando | “Carregando fila…” | Esperar |
| Vazio | “Nenhum atendimento ainda” + CTA atender | Atender |
| Erro | “PIN inválido ou expirado” / causa humana | Corrigir |
| Sucesso | Status atualizado / pago | Próximo da fila |

### 5.4 Acessibilidade (piso)

- Cloro (`--color-accent`) = CTA e badges curtos; texto longo em `--color-text` no concreto
- Contraste AA texto/muted no fundo claro
- Foco visível `--ring`; alvos ≥ 44px; `prefers-reduced-motion`

### 5.5 Confiança e dado

- Sem foto no fluxo normal; sem PII em logs

---

## 6. UI — pele LavaSeguro

### 6.1 Logo

| Uso | Arquivo | Fundo |
|:---|:---|:---|
| Marca tipográfica | **LavaSeguro** em Archivo | claro / faixa asfalto |
| Favicon | pendente | — |

### 6.2 Cor — regra 70 / 20 / 10

| Fatia | Papel | Hex | Token |
|:---|:---|:---|:---|
| 70% | Fundo | `#E4E2DC` | `--color-bg` |
| 20% | Marca / tinta | `#1A222C` / superfície `#F7F6F3` | `--color-brand` / `--color-surface` |
| 10% | Acento / CTA | `#008F7A` | `--color-accent` |

| Nome | Hex | Token | Uso |
|:---|:---|:---|:---|
| Texto | `#1A222C` | `--color-text` | body no claro |
| Texto auxiliar | `#5B6570` | `--color-muted` | auxiliar |
| Texto em marca | `#E8EEF2` | `--color-on-brand` | nav/faixa escura |
| Linha | `#C9C5BC` | `--color-border` | bordas |
| Sucesso | `#1F8A4C` | `--color-success` | pago |
| Erro | `#C23B3B` | `--color-error` | erro |
| Hover accent | `#00A891` | `--color-accent-hover` | CTA hover |
| Disabled | `#9AA1A8` | `--color-disabled` | inativo |

### 6.3 Tipografia

| Papel | Família | Pesos | Token | Fallback |
|:---|:---|:---|:---|:---|
| Display / títulos | Archivo | 600–700 | `--font-display` | system-ui, sans-serif |
| UI / corpo | Source Sans 3 | 400–600 | `--font-ui` | system-ui, sans-serif |

**Escala (chassis):** Display 40 → H1 32 → H2 24 → H3 20 → Body 16 → Small 14 → Caption 12 (mesmos papéis do chassis Tech42).

### 6.4 Espaço, canto, elevação

| Token | Valor | Uso |
|:---|:---|:---|
| `--space-unit` | 8px | base |
| `--radius-control` | 10px | botão, input (ângulo street) |
| `--radius-surface` | 12px | painéis |
| `--shadow-soft` | `0 4px 16px rgba(26,34,44,.08)` | elevação leve, sem glow |
| `--max-width` | 960px | conteúdo |

### 6.5 Estados visuais de controle

| Estado | Botão primário | Input |
|:---|:---|:---|
| Default | bg accent, texto branco | bg surface, border |
| Hover | accent-hover | border mais escuro |
| Focus | ring 2px accent | ring 2px accent |
| Disabled | disabled + opacity 0.55 | idem |
| Error | — | border error + texto |
| Success | — | feedback success |
| Loading | spinner + disabled | — |

### 6.6 Peças de interface

| Peça | Regra |
|:---|:---|
| Botão principal | Um por vista; cloro; verbo; radius 10px |
| Botão secundário | Contorno brand ou border; nunca compete |
| Campo / PIN | Digitos grandes; fundo surface; rótulo muted |
| Badges de fila | status em small + cor semântica (sem pill excessivo) |
| Tabela (caixa) | header brand claro; totais em H2 |
| Card | só fila/atendimento acionável |

### 6.7 Movimento

Trocas ≤ 180ms; nada de glow teal nem pulse. `prefers-reduced-motion` off.

---

## 7. Layouts gerenciais (padrões)

### 7.1 Home gerencial

- Shell: marca + ponto + status do PIN do dia
- Centro: CTA único **Atender** + atalho Caixa
- KPI secundário: atendimentos do dia (número grande)

### 7.2 Dashboard

- Fila ao vivo → por lavador → resumo do dia
- Operação no polegar: lista vertical, card = um atendimento

### 7.3 Settings

- Seções: Ponto, Serviços/preços, PIN do dia, Comissões
- Salvar = único primário; PIN regenerado com confirmação explícita

### 7.4 Users (lavadores)

- Tabela: nome/apelido, PIN ativo?, comissão %, status
- CTA: **Adicionar lavador**
- Alta rotatividade: fluxo curto, sem onboarding pesado

---

## 8. Tokens CSS concretos (`web/app/globals.css`)

```css
:root {
  /* Pele LavaSeguro */
  --color-bg: #E4E2DC;
  --color-surface: #F7F6F3;
  --color-brand: #1A222C;
  --color-accent: #008F7A;
  --color-accent-hover: #00A891;
  --color-text: #1A222C;
  --color-muted: #5B6570;
  --color-on-brand: #E8EEF2;
  --color-border: #C9C5BC;
  --color-success: #1F8A4C;
  --color-error: #C23B3B;
  --color-disabled: #9AA1A8;
  --color-ring: #008F7A;
  --color-on-accent: #FFFFFF;

  --font-display: "Archivo", system-ui, sans-serif;
  --font-ui: "Source Sans 3", system-ui, sans-serif;

  /* Chassis */
  --space-unit: 8px;
  --radius-control: 10px;
  --radius-surface: 12px;
  --shadow-soft: 0 4px 16px rgba(26, 34, 44, 0.08);
  --max-width: 960px;
  --touch-min: 44px;
}
```

---

## 9. Aplicações fora da tela

| Peça | Como vestir |
|:---|:---|
| Post | Concreto + faixa asfalto + um detalhe cloro |
| WhatsApp | Voz §4; instrução PIN curta |

---

## 10. Pode / não pode

**Pode:** concreto de pátio, Archivo, CTA cloro, PIN em destaque tipográfico.

**Não pode:** dark-mode obrigatório, roxo/indigo, teal-glow, Inter/Roboto, foto no fluxo normal, paleta de outro produto.

---

## 11. Inventário

| Arquivo | Onde |
|:---|:---|
| Este documento | `docs/BRAND_SYSTEM_DESIGNER.md` |
| Tokens CSS | `web/app/globals.css` |
| Layout + fontes | `web/app/layout.tsx` |

---

## 12. Governança

Vigente 2026-08-24 (v2.0). Mudança de cor/tipo: este doc + `:root` juntos.

---

## 13. Checklist

- [x] Doc v2.0 vigente
- [x] Chassis + pele (pátio claro)
- [x] Layouts home/dashboard/settings/users
- [x] Tokens CSS nomeados
- [x] Uma ação óbvia; distinto dos outros 3

---

*Tech 42 LTDA — LavaSeguro · Brand System 2.0 · 2026-08-24*
