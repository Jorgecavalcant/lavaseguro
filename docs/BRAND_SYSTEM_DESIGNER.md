# Brand System — LavaSeguro

| Campo | Valor |
|:---|:---|
| Produto | LavaSeguro |
| Versão deste doc | 1.0 vigente |
| Dono | CEO + designer-visual |
| Última atualização | 2026-08-24 |
| Status | [x] vigente para peça pública |

---

## 1. Para que este arquivo existe

Contrato visual e de experiência do **LavaSeguro** — landing, PIN do dia, atender, painel e caixa.

Implementação: `web/app/globals.css` + App Router.

---

## 2. Escopo

**Vale para:** `lavaseguro.tech42.com.br`, telas `/`, `/entrar`, `/atender`, `/painel`, `/caixa`.

**Não vale para:** institucional Tech 42 e demais produtos da casa.

**Público:** dono do ponto; lavadores (alta rotatividade, PIN do dia). Cliente final não usa o app no MVP.

---

## 3. DNA da casa vs voz deste produto

**Base:** DNA Cerbasi — acolher, educar, um próximo passo, sem pressão.

**Voz deste produto:**

- Tom: rápido, street, operacional de pátio
- Trata o leitor de: **você**
- Palavras que usamos: placa, fila, atender, PIN do dia, caixa, comissão
- Palavras que não usamos: “enterprise”, urgência falsa, “foto obrigatória” no fluxo normal
- Promessa: **PIN do dia, atende em segundos, fecha o caixa sem briga de comissão.**

---

## 4. UX — como funciona

### 4.1 Princípios

1. Uma ação óbvia: atender
2. PIN do dia (rotatividade)
3. Foto só em reclamação
4. Caixa do dia por lavador
5. Alvos grandes no polegar

### 4.2 Próximo passo

**Entrar com PIN** → **Começar atendimento** (placa + serviço) → painel → caixa

### 4.3 Estados obrigatórios

| Estado | O que a pessoa vê | O que pode fazer |
|:---|:---|:---|
| Carregando | “Carregando fila…” | Esperar |
| Vazio | “Nenhum atendimento ainda” + CTA atender | Atender |
| Erro | “PIN inválido ou expirado” / causa humana | Corrigir |
| Sucesso | Status atualizado / pago | Próximo da fila |

### 4.4 Acessibilidade

- Teal `#2DD4BF` = accent/CTA só; body em `#E8EEFC` / muted `#B6C4DE`
- Foco visível; alvos ≥ 44px; `prefers-reduced-motion`

### 4.5 Confiança e dado

- Sem foto no fluxo normal; sem PII em logs

---

## 5. UI — como aparece

### 5.1 Logo

| Uso | Arquivo | Fundo |
|:---|:---|:---|
| Marca tipográfica | **LavaSeguro** (Space Grotesk) | escuro |

### 5.2 Cor — 70 / 20 / 10

| Fatia | Papel | Hex | Onde |
|:---|:---|:---|:---|
| 70% | Fundo | `#0B1220` | Página |
| 20% | Marca | `#1E3A5F` / panel `#152038` | Nav, cards |
| 10% | Acento | `#2DD4BF` | CTA |

| Nome | Hex | Uso |
|:---|:---|:---|
| Texto | `#E8EEFC` | body |
| Muted | `#B6C4DE` | auxiliar |
| Linha | `#243352` | bordas |
| Sucesso | `#4ADE80` | pago |
| Alerta | `#F87171` | erro |

### 5.3 Tipografia

| Papel | Família | Pesos | Fallback |
|:---|:---|:---|:---|
| Título | Space Grotesk | 600–700 | system-ui |
| UI | Source Sans 3 | 400–600 | system-ui |

### 5.4 Espaço / canto

Base 8px; canto 12px; largura máx. 920px.

### 5.5 Peças

Botão principal = gradiente teal (único por vista). Secundário = contorno. Badges por status de fila.

---

## 6–7. Pode / não pode

**Pode:** asfalto molhado, teal em CTA, Space Grotesk.

**Não pode:** roxo/indigo, Tailwind default azul genérico em telas internas, Inter/Roboto, foto no fluxo normal.

---

## 8. Inventário

| Arquivo | Onde |
|:---|:---|
| Este documento | `docs/BRAND_SYSTEM_DESIGNER.md` |
| Tokens | `web/app/globals.css` |

---

## 9–10. Governança + checklist

Vigente 2026-08-24. Contraste AA validado nos tokens acima.

---

*Tech 42 LTDA — LavaSeguro.*
