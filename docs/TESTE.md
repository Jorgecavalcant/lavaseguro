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

## Fluxo feliz

1. `/entrar` com o PIN do dia.
2. `/atender` → placa + serviço → criar atendimento.
3. Acompanhar no `/painel` e fechar no `/caixa`.
4. Pagamento: provedor **manual** (demo).

## Sem PIN?

Também dá para abrir `/atender` direto no MVP (mutações ainda permissivas) — o PIN é o caminho “oficial” de operador.
