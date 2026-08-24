# Como testar — LavaSeguro (2 min)

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

Mutations (criar/mudar status de atendimento, cobrar pagamento, CRUD de serviços e lavadores, criar reclamação) **exigem** `Authorization: Bearer <jwt>` (ou `X-Pin` para compatibilidade).

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

## Fluxo feliz

1. `/entrar` com o PIN do dia (emite JWT).
2. `/atender` → placa + serviço → criar atendimento (com Bearer).
3. Acompanhar no `/painel` e fechar no `/caixa`.
4. Pagamento: provedor **manual** (demo).
