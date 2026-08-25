# Como testar — LavaSeguro (3 min)

**URL:** https://lavaseguro.tech42.com.br
**Local:** `make up` → http://localhost:3000 · API http://localhost:8000/docs

## Seed + login (PIN do dia)

1. Seed (só se ainda não rodou):

```bash
curl -X POST https://lavaseguro.tech42.com.br/api/v1/seed
```

Cria serviços + **Lavador Demo**.

2. Gerar PIN do dia (troque `1` pelo `id` do lavador se necessário):

```bash
curl -X POST https://lavaseguro.tech42.com.br/api/v1/lavadores/1/pin-do-dia
```

Resposta traz `pin` (4 dígitos) — **muda a cada dia**.

3. No site: https://lavaseguro.tech42.com.br/entrar → informar o PIN.

## Autenticação nas mutações

Mutations (criar/mudar status/editar atendimento, cobrar pagamento, CRUD de serviços e lavadores, criar reclamação) **exigem** `Authorization: Bearer <jwt>` (ou `X-Pin` para compatibilidade).

Obter o token:

```bash
TOKEN=$(curl -s -X POST https://lavaseguro.tech42.com.br/api/v1/auth/pin \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -X POST https://lavaseguro.tech42.com.br/api/v1/atendimentos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"placa":"ABC1D23","servico_id":1}'
```

Sem token em mutação → **401**. Endpoints abertos: GETs, `/seed`, `/health`, `/payments/providers`, `/caixa/dia`, `/lavadores/{id}/pin-do-dia`, `/auth/pin`.

> **Nota:** ao criar atendimento **sem** `lavador_id` no body, o atendimento é vinculado automaticamente ao **lavador autenticado** (token JWT ou PIN). Se `lavador_id` vier explícito no body, ele tem prioridade.

## Fluxo feliz

1. `/entrar` com o PIN do dia (emite JWT).
2. `/atender` → placa + serviço → criar atendimento (com Bearer; lavador = quem logou).
3. Acompanhar no `/painel` e fechar no `/caixa`.
4. Pagamento: provedor **manual** (demo).

## Fluxo Salto UX (web M1–M4)

1. **Seed + PIN:** rodar `/seed`, gerar pin-do-dia (`{pin, qr_payload}`), entrar só com PIN em `/entrar`.
2. **Home → Atender:** `/atender` exige JWT; abrir atendimento com placa + serviço ativo → formulário limpa a placa e o item aparece na mini-lista (sem foto).
3. **Painel:** `/painel` mostra `#id`, placa, `servico_nome`, `lavador_nome` e badge por status.
   - `na_fila`: **Editar** (inline placa + select serviço via PATCH só permitido na_fila) → **Lavando** → **Cancelar**.
   - `lavando`: **Pronto** → **Cancelar**.
   - `pronto`: selecionar meio (**pix**/**cartão**) → **Receber (manual)** via `POST /payments/charge {atendimento_id, meio, provider:"manual"}` → vira **pago**.
   - `pago` / `cancelado`: read-only.
4. **Serviços:** `/servicos` lista com ativos e inativos (`GET ?ativos=false`); criar com preço em R$ (converte p/ centavos), editar inline (PATCH), desativar (DELETE) e reativar (PATCH `{ativo:true}`).
5. **Lavadores:** `/lavadores` CRUD completo; botão **Gerar PIN** destaca o PIN do dia e mostra o `qr_payload`.
6. **Caixa:** `/caixa` com input date (default hoje) → `GET /caixa/dia?data=` mostra Bruto, Comissões, Líquido, Pagos, Ticket médio (bruto/pagos ou 0), tabela `por_lavador` e bloco Fila agora (contagens via `GET /atendimentos?data=`).
7. **Configurações:** `/configuracoes` salva `lavaseguro_ponto_nome` no localStorage e define `lavaseguro_provider_default=manual`; link para `/lavadores`.

Critério de aceite: todo o passo 3–7 sem erro visível, badge muda ao vivo após cada ação e caixa reflete o recebimento manual do dia corrente.


## Ambiente nesta entrega (2026-08-25)

- **GitHub `main` (após merge desta PR):** rotas Salto UX + light/dark + gaps desta missão.
- **Produção `*.tech42.com.br`:** ainda pode estar no build antigo enquanto secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` não estiverem no GitHub Actions. Sem esses secrets o CD não atualiza a VPS.
- **Como testar agora sem Docker Desktop:** na pasta do produto, API com venv (`make test` valida API) e `cd web && npm run dev` (aponta `NEXT_PUBLIC_API_URL` se a API não estiver em :8000).
