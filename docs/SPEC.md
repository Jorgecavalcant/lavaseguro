# LavaSeguro — SPEC

**Versão:** Salto UX 2026-08 (v0.3)  
**Base:** MVP v0.2 (auth JWT + payments plugáveis)  
**Produto:** lavaseguro.tech42.com.br  
**Repo:** `PROJETOS/lavaseguro`

Este documento é o contrato técnico para implementação. O PRD de negócio está em `docs/PRD.md`.

---

## Auth (MVP — vigente)

- `POST /api/v1/auth/pin` → valida PIN do dia e retorna JWT HS256 (`AuthPinOut.access_token`).
  - Claims: `sub=lavador_id`, `role=lavador`, `iat`, `exp`.
  - Body: `{ "pin": "1234" }` — **sem** `lavador_id` (API já resolve lavador pelo PIN).
- Config: `JWT_SECRET` (se vazio, herda `APP_SECRET`), `JWT_EXPIRE_MINUTES` (default 480), `JWT_ALGORITHM` (HS256).
- Dependency `auth_jwt.get_current_lavador`: aceita `Authorization: Bearer <jwt>` OU `X-Pin` (compatibilidade).
- Mutações protegidas: atendimentos (create/status), payments (charge), servicos CRUD, lavadores CRUD, reclamações criar.
- Abertos (leitura/ops): GETs, seed, health, providers, caixa, pin-do-dia, auth/pin.

## Pagamentos (MVP — vigente)

- Interface `PaymentProvider` + registry (`payments/provider.py`).
- Providers: `manual` (real neste salto); `pix_manual` / `cartao_pos` (STUB — **não** expor como CTA principal na UI do Salto UX).
- **NUNCA Asaas como core.**
- `GET /api/v1/payments/providers` · `POST /api/v1/payments/charge` `{atendimento_id, meio, provider}`.

## Web (MVP — inventário atual)

| Rota | Hoje | Gap Salto UX |
|---|---|---|
| `/` | Landing marketing | Home gerencial se autenticado |
| `/entrar` | PIN + **ID lavador morto** | Só PIN; redirect home |
| `/atender` | Criar + status parcial | Manter; enriquecer nomes |
| `/painel` | Lista + status | Nomes serviço/lavador + pagar |
| `/caixa` | Totais do dia | Métricas + data |
| — | Sem cadastros | `/servicos`, `/lavadores` |
| — | Sem settings | `/configuracoes` (SHOULD) |

## DNS / Deploy

- Ver `docs/DNS-CADDY.md` e `docs/DEPLOY-VPS.md`. Fora do escopo de código deste doc.

---

# Salto UX 2026-08

Prioridade 2. **Sem código neste documento** — apenas especificação para ox-alpha.

## 0. Mapa de rotas alvo

| Rota | Auth | Papel |
|---|---|---|
| `/` | Opcional | Sem token = landing curta + CTA Entrar; com token = **home gerencial** |
| `/entrar` | Público | Login PIN |
| `/atender` | JWT | Inserção de atendimento + mini-fila |
| `/painel` | JWT | Fila ao vivo + ações |
| `/caixa` | JWT | Dashboard métricas + fechamento |
| `/servicos` | JWT | CRUD serviços |
| `/lavadores` | JWT | CRUD lavadores + PIN do dia |
| `/configuracoes` | JWT | SHOULD — prefs + PIN + provider |

Nav (`layout`): marca · Atender · Painel · Caixa · Serviços · Lavadores · Config · Sair (se autenticado). Em mobile: menu compacto (SHOULD: mesmo padrão PedidoMesa — links em linha ou overflow).

## 1. Shell visual (SHOULD — alinhamento PedidoMesa)

**Manter** tokens LavaSeguro (`docs/BRAND_SYSTEM_DESIGNER.md`): fundo `#0B1220`, accent `#2DD4BF`, Space Grotesk + Source Sans 3.

**Copiar anatomia** do PedidoMesa (não as cores):

- Container `.shell` com largura máx. ~920–1100px
- `.topnav` sticky: brand à esquerda, links à direita
- Páginas internas: `.page-head` (eyebrow + h1 + muted)
- Estados: `.empty` / `.err` / loading textual (sem spinner obrigatório)
- Cards / `stat-grid` para métricas
- Alvos ≥ 44px; `prefers-reduced-motion`

Não portar açafrão/charcoal do PedidoMesa. Não inventar tema roxo.

## 2. Home gerencial (`/`) — MUST

### Comportamento

```
SE localStorage tem token
  ENTÃO renderiza HomeGerencial
SENÃO renderiza LandingAtual (CTAs Entrar + Atender)
```

### HomeGerencial — layout

1. **Cabeçalho:** “Olá, {lavador_nome}” (nome do JWT/login persistido) · data de hoje · botão Sair
2. **Stat grid (4 cards mínimos):**

| Card | Fonte | Formato |
|---|---|---|
| Na fila / abertos | `GET /atendimentos` filtrar `na_fila`+`lavando`+`pronto` | inteiro |
| Pagos hoje | `GET /caixa/dia` → `total_pagos` | inteiro |
| Bruto hoje | `caixa.bruto_centavos` | BRL |
| Comissão hoje | `caixa.comissao_centavos` | BRL |

3. **Atalhos (botões grandes):** Atender · Painel · Caixa · Serviços · Lavadores · Configurações
4. **Lista curta (opcional MUST-lite):** até 5 atendimentos abertos (placa + badge status) com link “Ver painel”

### Estados

| Estado | UI |
|---|---|
| Loading | “Carregando o dia…” |
| Erro API | Mensagem humana + “Tentar de novo” |
| Zero movimento | Cards zerados + CTA “Abrir atendimento” |

## 3. Dashboard métricas (`/caixa` + cards home) — MUST

### API existente

- `GET /api/v1/caixa/dia?data=YYYY-MM-DD` → `CaixaDiaOut`

### UI obrigatória

1. Seletor de data (default hoje) → refetch
2. Stat grid: Bruto · Comissões · Líquido · Pagos · **Ticket médio** (`bruto / total_pagos` se total>0, senão R$ 0)
3. Tabela por lavador (já existe): nome, qtd, bruto, comissão, líquido
4. **Bloco “Fila agora”** (métrica operacional): contagens por status a partir de `GET /atendimentos?data={dia}`:

| Status | Label |
|---|---|
| na_fila | Na fila |
| lavando | Lavando |
| pronto | Pronto |
| pago | Pago |
| cancelado | Cancelado |

### API gap (opcional — só se UX ficar pesada)

Se o front precisar de um único payload:

```
GET /api/v1/caixa/dia/resumo?data=
→ { ...CaixaDiaOut, ticket_medio_centavos, contagem_status: { na_fila, lavando, ... } }
```

**Preferência:** calcular no front no Salto UX (menos mudança de API). Endpoint agregado = nice-to-have.

## 4. Login / PIN usável (`/entrar`) — MUST

### Mudanças UI

1. Remover campo “ID do lavador” (API não usa; `loginComPin` já ignora).
2. Um campo: **PIN do dia** — `inputMode="numeric"`, `autoComplete="one-time-code"`, máx. 8, autofocus.
3. Erro: “PIN inválido ou expirado. Peça o PIN do dia ao responsável do ponto.”
4. Sucesso: salvar `access_token` + `lavador_nome` / `lavador_id` no localStorage → `router.replace("/")` (home gerencial), **não** `/atender`.
5. Nav: se autenticado, link “Sair” limpa token e vai para `/entrar`.

### Critérios de teste

- [ ] Entrar com PIN válido sem digitar ID
- [ ] PIN inválido não deixa residual de token
- [ ] Após login, `/` mostra home gerencial

## 5. Serviços — CRUD (`/servicos`) — MUST

### API (já existe)

| Método | Path | Auth | Nota |
|---|---|---|---|
| GET | `/api/v1/servicos?ativos=true\|false` | — | Listagem; na tela admin usar `ativos=false` para ver inativos |
| POST | `/api/v1/servicos` | JWT | `{nome, preco_centavos, ativo}` |
| PATCH | `/api/v1/servicos/{id}` | JWT | nome / preço / ativo |
| DELETE | `/api/v1/servicos/{id}` | JWT | soft-delete `ativo=false` |

### UI

1. Lista: nome · preço BRL · badge Ativo/Inativo
2. **Inserção:** formulário no topo — Nome + Preço (R$) → converter para centavos → POST
3. **Editar:** inline ou modal — PATCH
4. **Desativar:** DELETE com confirmação “O serviço some da escolha do atender, mas o histórico fica.”
5. **Reativar:** PATCH `{ativo: true}` na linha inativa

### Validações

- Nome ≥ 2 chars; preço > 0
- Erros API em português

## 6. Lavadores / users — CRUD (`/lavadores`) — MUST

### API (já existe)

| Método | Path | Auth | Nota |
|---|---|---|---|
| GET | `/api/v1/lavadores` | — | Todos |
| POST | `/api/v1/lavadores` | JWT | `{nome, comissao_pct}` |
| GET | `/api/v1/lavadores/{id}` | — | Detalhe |
| PATCH | `/api/v1/lavadores/{id}` | JWT | nome / comissao_pct / ativo |
| DELETE | `/api/v1/lavadores/{id}` | JWT | soft-delete |
| POST | `/api/v1/lavadores/{id}/pin-do-dia` | — | Gera/retorna PIN + qr_payload |

### UI

1. Lista: nome · comissão % · Ativo/Inativo · ações
2. **Inserção:** Nome + Comissão % (default 40) → POST
3. **Editar:** PATCH nome/% 
4. **Desativar / reativar:** DELETE ou PATCH ativo
5. **PIN do dia:** botão “Gerar PIN” → chama pin-do-dia → mostra PIN em destaque (copiar) + payload QR (texto; QR visual = SHOULD)

### Fluxo inserção (lavador)

```
Abrir /lavadores
→ preencher Nome + Comissão
→ Salvar
→ (opcional) Gerar PIN do dia
→ mostrar PIN ao lavador / anotar no quadro do ponto
```

## 7. Atendimentos — CRUD + fluxos de inserção — MUST

### API vigente

| Método | Path | Auth |
|---|---|---|
| GET | `/api/v1/atendimentos?status=&data=` | — |
| POST | `/api/v1/atendimentos` | JWT | body `{placa, servico_id, lavador_id?}` — se omitir lavador, usa o do token |
| PATCH | `/api/v1/atendimentos/{id}/status` | JWT | transição |
| GET | `/api/v1/atendimentos/{id}` | — |

### Gap API (MUST se UI de edição for exigida)

Adicionar:

```
PATCH /api/v1/atendimentos/{id}
Auth: JWT
Body: { placa?: str, servico_id?: int, lavador_id?: int }
Regra: só se status == na_fila; senão 422
```

Soft-cancel já existe via status `cancelado` — **não** precisa DELETE físico.

### Fluxo inserção (atender) — MUST

```
1. JWT ok (senão /entrar)
2. Carregar serviços ativos (GET /servicos)
3. Digitar placa (upper, 5–10) + escolher serviço
4. POST /atendimentos → status na_fila
5. Limpar placa; lista atualiza
6. Sem foto em nenhum passo
```

### Painel — MUST

Para cada item exibir:

- `#id` · **placa** · **nome do serviço** · **nome do lavador** · badge status
- Ações conforme transição:
  - `na_fila`: Lavando · Cancelar · Editar (placa/serviço)
  - `lavando`: Pronto · Cancelar
  - `pronto`: **Receber (manual)** → `POST /payments/charge` `{atendimento_id, meio:"pix"|"cartao", provider:"manual"}` (meio = seletor simples; provider fixo manual)
  - `pago` / `cancelado`: só leitura

Resolução de nomes: join no front via maps de `GET /servicos?ativos=false` + `GET /lavadores` (ou enriquecer `AtendimentoOut` no backend — SHOULD).

### Preferência analista-soluções

Enriquecer `AtendimentoOut` com `servico_nome` e `lavador_nome` (nullable) reduz N+1 no front. **SHOULD** no mesmo PR se esforço baixo; senão maps no client.

## 8. Configurações (`/configuracoes`) — SHOULD

| Campo | Persistência | UI |
|---|---|---|
| Nome do ponto | `localStorage` (MVP) | Input texto |
| Provider padrão | `localStorage` → default `manual` | Select (só `manual` habilitado; stubs disabled + label “em breve”) |
| Atalho PIN | Link para `/lavadores` | “Gerar PIN do dia no cadastro de lavadores” |
| Versão / domínio | estático | `lavaseguro.tech42.com.br` |

Sem multi-tenant neste salto.

## 9. Contratos de dados (resumo)

### Persistência web (localStorage)

| Chave | Conteúdo |
|---|---|
| `lavaseguro_token` | JWT (já existe) |
| `lavaseguro_lavador_id` | int (novo) |
| `lavaseguro_lavador_nome` | string (novo) |
| `lavaseguro_ponto_nome` | string (SHOULD settings) |
| `lavaseguro_provider_default` | `"manual"` (SHOULD) |

### Formatação

- Dinheiro: `(centavos/100).toLocaleString("pt-BR", {style:"currency", currency:"BRL"})`
- Placa: `toUpperCase()`, strip espaço/hífen antes do POST

## 10. Matriz MUST → ox-alpha (checklist de aceite)

Usar esta lista como Definition of Done do Salto UX. Cada item = demonstrável em `https://lavaseguro.tech42.com.br` (ou local `make up`).

### M1 — Painel + home

- [ ] Com JWT, `/` mostra home gerencial (não só marketing)
- [ ] Home tem ≥ 4 cards (fila/abertos, pagos, bruto, comissão)
- [ ] Home tem atalhos para Atender, Painel, Caixa, Serviços, Lavadores
- [ ] `/painel` lista placa + status + ações de transição
- [ ] `/painel` mostra nome do serviço e do lavador (não só IDs)

### M2 — CRUD

- [ ] `/servicos`: criar serviço com nome e preço
- [ ] `/servicos`: editar nome/preço
- [ ] `/servicos`: desativar (some do select em Atender) e reativar
- [ ] `/lavadores`: criar com nome e comissão %
- [ ] `/lavadores`: editar nome/% 
- [ ] `/lavadores`: desativar / reativar
- [ ] `/lavadores`: gerar e exibir PIN do dia
- [ ] Atendimento: criar em `/atender` (placa + serviço) em ≤ 30 s
- [ ] Atendimento `na_fila`: editar placa e/ou serviço
- [ ] Atendimento: cancelar a partir do painel
- [ ] Atendimento `pronto`: receber pagamento **manual** e status vira `pago`

### M3 — Caixa métricas

- [ ] `/caixa` mostra bruto, comissão, líquido, qtd pagos
- [ ] Ticket médio calculado e visível
- [ ] Tabela por lavador preenchida após ≥ 1 pagamento
- [ ] Contagem por status (fila agora) visível
- [ ] Seletor de data altera o período

### M4 — Login / PIN usável

- [ ] `/entrar` tem **somente** campo PIN (sem ID lavador)
- [ ] PIN válido → redireciona para home gerencial
- [ ] PIN inválido → mensagem clara, sem token
- [ ] Sair limpa sessão e exige PIN de novo
- [ ] Teclado numérico em mobile (`inputMode`)

### SHOULD (não bloqueia, mas registrar)

- [ ] Shell/nav alinhados anatomicamente ao PedidoMesa
- [ ] `/configuracoes` com nome do ponto + provider default manual
- [ ] QR visual do PIN (além do payload texto)
- [ ] `AtendimentoOut` enriquecido com nomes

### WON'T (reprovar se aparecer no PR)

- [ ] Nenhum PIX/cartão real / SDK de adquirente
- [ ] Nenhuma fila drag-and-drop / ETA / multi-box
- [ ] Nenhum app ou área do cliente final
- [ ] Nenhuma foto no atender/painel/caixa

## 11. Ordem de implementação sugerida (ox-alpha)

1. Login PIN (remover ID + redirect home + logout) — desbloqueia o resto  
2. Home gerencial (cards + atalhos)  
3. `/servicos` + `/lavadores` CRUD + PIN  
4. Painel enriquecido + charge manual  
5. Caixa métricas + data  
6. PATCH atendimento (se edição)  
7. Shell polish + `/configuracoes` (SHOULD)

## 12. Fora de escopo desta SPEC

- Deploy/DNS (docs separados)
- Providers reais além de `manual`
- App cliente, push, WhatsApp
- Multi-unidade / franquia
- Hardening CORS produção (pode acompanhar deploy, não é Salto UX)

---

*Tech42 LTDA — LavaSeguro SPEC · Salto UX 2026-08.*
