# Como testar — LavaSeguro (3 min)

**URL:** https://lavaseguro.tech42.com.br
**Local:** `make up` → http://localhost:3000 · API http://localhost:8000/docs

## Seed + login (PIN do dia)

1. Seed (só se ainda não rodou — continua **aberto**, sem token):

```bash
curl -X POST https://lavaseguro.tech42.com.br/api/v1/seed
```

Cria serviços + **Lavador Demo** e retorna `bootstrap_pin`: o PIN do dia já
gerado para o Lavador Demo. É o jeito de entrar pela primeira vez, sem token
(ver nota de bootstrap abaixo).

2. No site: https://lavaseguro.tech42.com.br/entrar → informar o `bootstrap_pin`.

3. Depois de logado, gerar PIN do dia para **outros** lavadores (ex.: um recém-cadastrado) — agora exige token:

```bash
curl -X POST https://lavaseguro.tech42.com.br/api/v1/lavadores/2/pin-do-dia \
  -H "Authorization: Bearer $TOKEN"
```

Resposta traz `pin` (4 dígitos) — **muda a cada dia** e é **único entre todos os lavadores** no mesmo dia (se por acaso sortear um PIN já usado por outro lavador hoje, a API tenta de novo automaticamente).

> **Bootstrap:** `POST /lavadores/{id}/pin-do-dia` exige lavador autenticado — não dá pra "puxar" o PIN de qualquer um sem estar logado. O primeiro acesso do dia (sem ninguém logado ainda) vem do `bootstrap_pin` que `/seed` sempre garante para o lavador de menor `id` (o Lavador Demo, na prática). Depois disso, quem já entrou consegue criar novos lavadores e gerar o PIN deles normalmente — é o mesmo fluxo do botão **Gerar PIN** em `/lavadores`.

## Autenticação nas mutações

Mutations (criar/mudar status/editar atendimento, cobrar pagamento, CRUD de serviços e lavadores, gerar PIN do dia, criar reclamação) **exigem** `Authorization: Bearer <jwt>` (ou `X-Pin` para compatibilidade).

Obter o token:

```bash
TOKEN=$(curl -s -X POST https://lavaseguro.tech42.com.br/api/v1/auth/pin \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -X POST https://lavaseguro.tech42.com.br/api/v1/atendimentos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"placa":"ABC1D23","servico_id":1}'
```

Sem token em mutação → **401**. `/auth/pin` também rejeita (**403**) PIN válido de lavador que foi desativado (`ativo=false`) no meio tempo.

Endpoints abertos: GETs, `/seed` (com bootstrap do PIN do primeiro lavador), `/health`, `/payments/providers`, `/caixa/dia`, `/auth/pin`.

> **Nota:** ao criar atendimento **sem** `lavador_id` no body, o atendimento é vinculado automaticamente ao **lavador autenticado** (token JWT ou PIN). Se `lavador_id` vier explícito no body, ele tem prioridade.

> **Nota:** `PATCH /atendimentos/{id}/status` não deixa ir de `pronto` direto para `pago` (422) — pagamento só é registrado por `POST /payments/charge`, que grava o provedor/meio usado.

## Fluxo feliz

1. `/entrar` com o PIN do dia (emite JWT).
2. `/atender` → placa + serviço → criar atendimento (com Bearer; lavador = quem logou).
3. Acompanhar no `/painel` e fechar no `/caixa`.
4. Pagamento: provedor **manual** (demo).

## Fluxo Salto UX (web M1–M4)

1. **Seed + PIN:** rodar `/seed` (retorna `bootstrap_pin` do Lavador Demo), entrar só com esse PIN em `/entrar`. Para os demais lavadores, gerar PIN pelo botão **Gerar PIN** em `/lavadores` (exige estar logado).
2. **Home → Atender:** `/atender` exige JWT; abrir atendimento com placa + serviço ativo → formulário limpa a placa e o item aparece na mini-lista (sem foto).
3. **Painel:** `/painel` mostra só a fila de **hoje** (`GET /atendimentos?data=hoje`) e, por padrão, só status abertos (`na_fila`, `lavando`, `pronto`) — checkbox "Mostrar também pagos e cancelados de hoje" revela os demais. Cada item traz `#id`, placa, `servico_nome`, `lavador_nome` e badge por status.
   - `na_fila`: **Editar** (inline placa + select serviço via PATCH só permitido na_fila) → **Lavando** → **Cancelar**.
   - `lavando`: **Pronto** → **Cancelar**.
   - `pronto`: selecionar meio (**pix**/**cartão**) → **Receber (manual)** via `POST /payments/charge {atendimento_id, meio, provider:"manual"}` → vira **pago**. (`PATCH /status` para `pago` direto é bloqueado — 422.)
   - `pago` / `cancelado`: read-only.
4. **Serviços:** `/servicos` lista com ativos e inativos (`GET ?ativos=false`); criar com preço em R$ (converte p/ centavos), editar inline (PATCH), desativar com confirmação (DELETE) e reativar (PATCH `{ativo:true}`).
5. **Lavadores:** `/lavadores` CRUD completo; desativar pede confirmação; botão **Gerar PIN** destaca o PIN do dia, mostra o `qr_payload` e tem botão **Copiar PIN** (clipboard).
6. **Caixa:** `/caixa` com input date (default hoje) → `GET /caixa/dia?data=` mostra Bruto, Comissões, Líquido, Pagos, Ticket médio (bruto/pagos ou 0), tabela `por_lavador` e bloco Fila agora (contagens via `GET /atendimentos?data=`).
7. **Configurações:** `/configuracoes` salva `lavaseguro_ponto_nome` no localStorage e define `lavaseguro_provider_default=manual`; link para `/lavadores`.
8. **Sessão expirada:** qualquer chamada autenticada que volte 401 (token expirado/inválido) limpa a sessão local e redireciona para `/entrar` automaticamente — não trava tela.

Critério de aceite: todo o passo 3–8 sem erro visível, badge muda ao vivo após cada ação e caixa reflete o recebimento manual do dia corrente.


## Ambiente nesta entrega (2026-08-25)

- **GitHub `main` (após merge desta PR):** rotas Salto UX + light/dark + gaps desta missão.
- **Produção `*.tech42.com.br`:** ainda pode estar no build antigo enquanto secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` não estiverem no GitHub Actions. Sem esses secrets o CD não atualiza a VPS.
- **Como testar agora sem Docker Desktop:** na pasta do produto, API com venv (`make test` valida API) e `cd web && npm run dev` (aponta `NEXT_PUBLIC_API_URL` se a API não estiver em :8000).
