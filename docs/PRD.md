# PRD — LavaSeguro

**Produto:** LavaSeguro  
**Dono:** Tech42 LTDA  
**Domínio:** lavaseguro.tech42.com.br  
**Versão deste PRD:** Salto UX 2026-08 (prioridade 2)  
**Base:** MVP scaffold 2026-08-24

---

## Em uma frase

App para lava-jato e lavadores de rua registrarem atendimento rápido, cobrarem o cliente e fecharem o caixa do dia por lavador — **sem foto no fluxo normal**.

---

## Problema

Lavadores e operadores perdem tempo e dinheiro porque:

1. Anotam placa e serviço no papel ou WhatsApp
2. Não sabem quem está na fila e o que já foi pago
3. Comissão do dia vira briga no final do turno
4. Alta rotatividade: cada dia um time diferente de lavadores

---

## Solução (MVP — já entregue em scaffold)

| Funcionalidade | Descrição simples |
|---|---|
| Atender | Digita placa + escolhe serviço → entra na fila |
| Painel | Vê status: na fila, lavando, pronto, pago, cancelado |
| Cobrança | Marca como pago (Pix/cartão via adquirente = fase 2; hoje é stub/manual) |
| Caixa do dia | Totais e comissão por lavador |
| Entrar | Lavador usa PIN do dia (alta rotatividade) |
| Reclamação | Se o cliente reclamar, pode anexar foto — **único lugar com foto** |

### Regra de ouro — fotos

- **Fluxo normal (atender / fila / pagar):** foto **NÃO** é pedida nem obrigatória.
- **Reclamação:** foto é **opcional** (ajuda a provar o caso).

---

## Quem usa

| Papel | O que faz |
|---|---|
| Operador / dono do ponto | Configura serviços e lavadores, vê métricas/caixa, gera PIN do dia |
| Lavador | Entra com PIN do dia, atende, atualiza status |
| Cliente final | Não usa o app (só é atendido) |

---

## Fora do MVP / fase 2+ (inalterado)

- Integração real com o banco/adquirente que o cliente escolher (plugin)
- App do cliente / link de pagamento automático
- Foto obrigatória no atendimento (propositalmente fora)
- Multi-unidade avançado / franquia

---

## Sucesso do MVP (baseline)

1. Em menos de 30 segundos: placa + serviço → na fila  
2. Painel mostra a fila ao vivo  
3. Caixa do dia fecha com total e comissão por lavador  
4. Reclamação pode ter foto; atendimento normal nunca exige foto  

---

## Compliance (Tech42)

- LGPD: placa é dado operacional; não guardar CPF/telefone sem necessidade
- Sem recomendação financeira (produto de operação de lava-jato, não investimento)
- Segredos só em `.env` (nunca no código)

---

# Salto UX 2026-08

> **Prioridade 2** no portfólio Tech42. Objetivo: transformar o scaffold operacional em **casa gerencial usável** — home, métricas, CRUD e login sem fricção — sem inventar PIX real, fila avançada nem app do cliente.

## 1. Problema (métrica de impacto)

O MVP scaffold já registra fila e caixa via API, mas a **web não fecha o ciclo gerencial**:

| Lacuna observada (hoje) | Impacto no dono do ponto |
|---|---|
| `/` é landing de marketing, não hub de operação | Operador não vê “como está o dia” ao abrir o app |
| Sem telas de serviços / lavadores | CRUD existe na API, mas o dono não cadastra preço nem time na UI |
| Login pede “ID do lavador” (campo morto) | Fricção e erro na porta de entrada (PIN sozinho já autentica) |
| Caixa só lista totais; painel sem nomes de serviço/lavador | Fechamento e fila exigem memória / outro canal |
| Sem settings | PIN do dia, provider padrão e preferências ficam escondidos |

**Job-to-be-Done**

> Quando o dono abre o LavaSeguro no início do turno, quer ver o estado do dia e cadastrar time/preços em poucos toques, para o lavador só digitar placa e avançar status — sem briga de comissão no fim.

**Métrica de impacto alvo (Salto UX)**

| Métrica | Baseline (scaffold) | Meta Salto UX |
|---|---|---|
| Tempo até 1º atendimento útil após login | ~2–3 min (PIN + adivinhar IDs / seed) | ≤ 60 s (PIN → home → Atender) |
| Cadastro de serviço/lavador na UI | 0% (só API/seed) | 100% dos fluxos MUST via telas |
| Erros de login por “ID do lavador” | Campo obrigatório inútil | Campo removido; só PIN |
| Visão do dia (fila + caixa) na home | Não existe | Cards + atalhos na 1ª tela autenticada |

## 2. Objetivos

1. **Home gerencial** autenticada: resumo do dia + atalhos (Atender, Painel, Caixa, Cadastros, Config).
2. **Dashboard de métricas** no caixa (e espelhado em cards na home): pagos, bruto, comissão, líquido, fila aberta, ticket médio.
3. **CRUD usável** de serviços e lavadores (criar / editar / desativar) + fluxos de inserção claros.
4. **Login/PIN usável**: só PIN; feedback humano; destino pós-login = home gerencial.
5. **Shell visual alinhado ao PedidoMesa** (SHOULD): mesma anatomia de shell/nav/estados, mantendo tokens LavaSeguro (teal / asfalto).

## 3. Conselho MUST / SHOULD / WON'T

### MUST (bloqueia aceite)

| # | Item | Critério de aceite |
|---|---|---|
| M1 | **Painel + home gerencial** | `/` autenticado = hub do dia; `/painel` mostra placa, serviço (nome), lavador (nome), status e ações de transição |
| M2 | **CRUD atendimento / serviços / lavadores** | UI cria e edita; soft-delete (desativar); atendimento: criar + editar placa/serviço (quando `na_fila`) + cancelar + marcar pago (manual) |
| M3 | **Caixa com métricas** | Totais do dia + por lavador + ticket médio + contagem por status aberto; seletor de data |
| M4 | **Login / PIN usável** | Só campo PIN; teclado numérico; erro claro; sucesso → home; saída (logout) na nav |

### SHOULD

| # | Item | Critério |
|---|---|---|
| S1 | Shell visual alinhado PedidoMesa | `shell` + `topnav` + estados vazio/erro/loading no mesmo ritmo; tipografia/cores = brand LavaSeguro |
| S2 | Configurações | Tela `/configuracoes`: gerar/mostrar PIN do dia, provider padrão (`manual`), nome do ponto (localStorage ou config mínima) |

### WON'T (explícito — não implementar neste salto)

| # | Item | Motivo |
|---|---|---|
| W1 | PIX / cartão reais (gateway) | Continua plugin stub; provider `manual` é o caminho de produção deste salto |
| W2 | Fila avançada (drag-and-drop, prioridade, estimativa de tempo, multi-box) | Complexidade sem validação de PMF |
| W3 | App / portal do cliente final | Fora do escopo; cliente não usa o produto |

## 4. User Stories

### Operador / dono

1. Como dono, quero abrir o app e ver **quantos estão na fila, quanto já entrou e comissão do dia**, para decidir se preciso de mais gente no pátio.
2. Como dono, quero **cadastrar/editar/desativar serviços** (nome + preço), para o lavador não escolher preço errado.
3. Como dono, quero **cadastrar/editar/desativar lavadores** (nome + % comissão) e **gerar o PIN do dia**, para o time rotativo entrar sem senha pessoal.
4. Como dono, quero **corrigir placa ou serviço** de um atendimento ainda na fila, sem cancelar e reabrir.
5. Como dono, quero **fechar o caixa do dia por lavador** com números claros, para pagar comissão sem discussão.

### Lavador

6. Como lavador, quero **entrar só com o PIN do dia** (sem ID numérico), para começar a atender em segundos.
7. Como lavador, quero **placa + serviço → fila** e avançar status no polegar, sem foto.
8. Como lavador, quero **marcar pronto e confirmar pagamento manual**, para o caixa refletir o que realmente entrou.

## 5. Regras de negócio (Salto UX)

1. Foto continua **proibida** no fluxo normal; só reclamação (opcional).
2. Soft-delete: `DELETE` de lavador/serviço = `ativo=false`; não apaga histórico de atendimentos.
3. Transições de status permanecem: `na_fila → lavando|cancelado`; `lavando → pronto|cancelado`; `pronto → pago`; `pago` e `cancelado` terminais.
4. Edição de placa/serviço só se status = `na_fila`.
5. Pagamento neste salto = `POST /payments/charge` com `provider=manual` (ou transição explícita para `pago` via charge). Sem PIX real.
6. Auth: JWT via PIN; mutações protegidas. PIN do dia é por lavador/data (já na API).
7. Placa: upper, sem espaços/hífen; LGPD — sem CPF/telefone nesta fase.
8. Home pública (sem token) pode continuar com CTAs Entrar / Atender; com token, `/` vira hub gerencial (ou redirect).

## 6. Métricas de sucesso (Salto UX)

| # | Sucesso | Como medir |
|---|---|---|
| 1 | Login em 1 campo → home em ≤ 3 toques | Teste manual |
| 2 | Criar serviço e lavador sem Swagger | Checklist UI |
| 3 | Ciclo completo: atender → lavando → pronto → pago manual → aparece no caixa | E2E manual |
| 4 | Home mostra ≥ 4 cards: fila aberta, pagos hoje, bruto, comissão | Screenshot / QA |
| 5 | Nenhum fluxo pede foto fora de reclamação | Revisão de telas |

## 7. Checklist LGPD / CVM 175

- [x] Sem consultoria financeira / “retorno garantido”
- [x] Placa = dado operacional mínimo; sem CPF/telefone neste salto
- [x] Soft-delete preserva histórico; sem log de PII
- [x] PIN do dia local ao ponto — não é senha pessoal permanente
- [x] Sem gateway externo neste salto (menos superfície de dado de pagamento)

## 8. Contexto técnico básico

| Peça | Estado atual | Salto UX |
|---|---|---|
| Stack | Next.js 14 + FastAPI + Postgres | Mantém |
| Auth | `POST /auth/pin` → JWT; Bearer | Remover ID na UI; logout |
| API lavadores/serviços | CRUD completo | Expor nas telas |
| API atendimentos | create + status | + PATCH campos (placa/serviço) se `na_fila` |
| API caixa | `GET /caixa/dia?data=` | Consumir data + enriquecer UI |
| Payments | manual + stubs | Só manual na UI |
| Brand | Teal / Space Grotesk | Manter; alinhar shell ao PedidoMesa (SHOULD) |

## 9. Dependências e próximo passo

- **Dependência:** API já cobre a maior parte; SPEC detalha gaps (PATCH atendimento, métricas agregadas opcionais).
- **Implementação:** somente após aprovação deste PRD pelo CEO.
- **Fora desta entrega:** código — apenas docs (`PRD.md` + `SPEC.md`).

## 10. Aprovação

| Papel | Status |
|---|---|
| diretor-produto + analista-solucoes | Documento proposto 2026-08-24 |
| CEO (Jorge) | Pendente — necessário antes da SPEC virar sprint |

---

*Tech42 LTDA — LavaSeguro PRD.*
