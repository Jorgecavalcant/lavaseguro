# LavaSeguro

**Sistema de atendimento e caixa para lava-jato e lavadores de rua.**

**Repositório:** GitHub Tech42 (`lavaseguro`)  
**VPS (padrão):** `/srv/projetos/clientes/lavaseguro`  
**Domínio:** `lavaseguro.tech42.com.br` (DNS criado pelo CEO)

O LavaSeguro ajuda o operador a registrar rápido quem está lavando o quê (placa + serviço), acompanhar a fila, cobrar (Pix ou cartão — adquirente escolhida pelo operador) e fechar o caixa do dia com comissão por lavador.

Fotos **não** entram no fluxo normal. Só aparecem se houver reclamação.

---

## O que já existe (MVP scaffold)

- API FastAPI com health, lavadores, serviços, atendimentos, caixa, reclamações e pagamento stub
- Web Next.js: landing, atender, painel, caixa e login por PIN do dia
- Docker Compose (api + web + postgres)
- Documentação em linguagem simples (PRD, SPEC, DNS/Caddy)
- CI no GitHub Actions

Cobrança **plugável**: o operador escolhe o banco/adquirente. MVP = provedor `manual`. Sem vendor fixo (Asaas não é core).

---

## Stack

| Peça | Tecnologia |
|---|---|
| Web | Next.js 14 (App Router) |
| API | FastAPI (Python 3.12) |
| Banco | PostgreSQL 16 |
| Infra local | Docker Compose |
| Proxy produção | Caddy |
| Domínio alvo | `lavaseguro.tech42.com.br` |

---

## Como rodar (local)

```bash
cd PROJETOS/lavaseguro
cp .env.example .env
make up
```

| Serviço | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| Docs API (Swagger) | http://localhost:8000/docs |
| Postgres | localhost:5432 |

### Comandos úteis

| Comando | O que faz |
|---|---|
| `make up` | Sobe api + web + postgres |
| `make down` | Para os containers |
| `make test` | Testes da API (pytest) |
| `make ci` | Mesmo fluxo do CI (lint/testes básicos) |

---

## Onde ficam os documentos

| Arquivo | Para quê |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | Índice de toda a documentação |
| [docs/PRD.md](docs/PRD.md) | O que o produto faz (negócio) |
| [docs/SPEC.md](docs/SPEC.md) | Telas e endpoints do MVP |
| [docs/DNS-CADDY.md](docs/DNS-CADDY.md) | DNS + Caddy para o domínio |
| [STATE.md](STATE.md) | Estado atual do projeto |
| [STATE.min.md](STATE.min.md) | Resumo do estado (1 tela) |

---

## Segurança

- Nenhum segredo no repositório — use `.env` local (modelo em `.env.example`)
- Não versionar `.env`
- PIN/QR do dia: pensado para alta rotatividade de lavadores

---

## Licença / dono

Produto Tech42 LTDA. Domínio: `lavaseguro.tech42.com.br`.
