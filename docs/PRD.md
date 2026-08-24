# PRD — LavaSeguro (mínimo)

**Produto:** LavaSeguro  
**Dono:** Tech42 LTDA  
**Domínio:** lavaseguro.tech42.com.br  
**Versão deste PRD:** MVP scaffold — 2026-08-24

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

## Solução (MVP)

| Funcionalidade | Descrição simples |
|---|---|
| Atender | Digita placa + escolhe serviço → entra na fila |
| Painel | Vê status: na fila, lavando, pronto, pago, cancelado |
| Cobrança | Marca como pago (Pix/cartão via adquirente = fase 2; hoje é stub) |
| Caixa do dia | Totais e comissão por lavador |
| Entrar | Lavador usa PIN ou QR do dia (alta rotatividade) |
| Reclamação | Se o cliente reclamar, pode anexar foto — **único lugar com foto** |

### Regra de ouro — fotos

- **Fluxo normal (atender / fila / pagar):** foto **NÃO** é pedida nem obrigatória.
- **Reclamação:** foto é **opcional** (ajuda a provar o caso).

---

## Quem usa

| Papel | O que faz |
|---|---|
| Operador / dono do ponto | Configura serviços, vê caixa, escolhe adquirente (fase 2) |
| Lavador | Entra com PIN do dia, atende, atualiza status |
| Cliente final | Não usa o app no MVP (só é atendido) |

---

## Fora do MVP (fase 2+)

- Integração real com o banco/adquirente que o cliente escolher (plugin)
- App do cliente / link de pagamento automático
- Foto obrigatória no atendimento (propositalmente fora)
- Multi-unidade avançado / franquia

---

## Sucesso do MVP

1. Em menos de 30 segundos: placa + serviço → na fila  
2. Painel mostra a fila ao vivo  
3. Caixa do dia fecha com total e comissão por lavador  
4. Reclamação pode ter foto; atendimento normal nunca exige foto  

---

## Compliance (Tech42)

- LGPD: placa é dado operacional; não guardar CPF/telefone sem necessidade
- Sem recomendação financeira (produto de operação de lava-jato, não investimento)
- Segredos só em `.env` (nunca no código)
