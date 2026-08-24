# DNS + Caddy — LavaSeguro

Domínio alvo: **lavaseguro.tech42.com.br**

Linguagem simples: o DNS diz “para onde o nome aponta”; o Caddy é o porteiro HTTPS na VPS.

---

## 1. DNS (Cloudflare / provedor do tech42.com.br)

Crie um registro:

| Tipo | Nome | Conteúdo | Proxy |
|---|---|---|---|
| A | `lavaseguro` | IP da VPS (`$VPS_HOST` no `.env` da infra Tech42 — nunca hardcodar no repo) | DNS only ou Proxied (decisão ops) |

Resultado: `lavaseguro.tech42.com.br` → VPS.

Checklist:

- [ ] Registro A criado
- [ ] TTL baixo na primeira vez (ex.: 5 min) até validar
- [ ] `dig lavaseguro.tech42.com.br` resolve o IP certo

---

## 2. Caddy (HTTPS automático)

Use o arquivo de exemplo na raiz do repo: [`Caddyfile.example`](../Caddyfile.example).

Ideia:

- Tráfego em `lavaseguro.tech42.com.br` → web (Next.js)
- `/api/*` → API FastAPI

Variáveis (no ambiente da VPS, não no git):

- porta/host da web
- porta/host da api
- e-mail para Let’s Encrypt (se necessário)

---

## 3. Ordem sugerida de go-live

1. Subir containers na VPS (`docker compose`)
2. Validar health local na VPS (`curl http://127.0.0.1:8000/health`)
3. Apontar DNS
4. Ativar Caddy com o Caddyfile
5. Testar `https://lavaseguro.tech42.com.br` e `https://lavaseguro.tech42.com.br/api/v1/...` via proxy

---

## 4. O que NÃO fazer

- Não colocar IP da VPS neste repositório
- Não versionar certificados ou `.env` de produção
- Não expor Postgres na internet


## 4. Layout VPS (padrão Tech42)

Igual aos outros produtos (ex.: GIC):

| Item | Valor |
|---|---|
| Código / compose | `/srv/projetos/clientes/lavaseguro` |
| Domínio | `lavaseguro.tech42.com.br` |
| Proxy | Caddy (trecho neste doc + `Caddyfile.example`) |

DNS é criado **pelo CEO**. Deploy na VPS só depois do registro propagar.
