# SPEC — LavaSeguro MVP

**Escopo:** scaffold rodável. Integração adquirente = fase 2.

---

## Telas (web)

| Rota | Objetivo |
|---|---|
| `/` | Landing: o que é o LavaSeguro + CTA para atender / entrar |
| `/entrar` | Login do lavador com **PIN do dia** |
| `/atender` | Fluxo rápido: placa + serviço → cria atendimento (`na_fila`) |
| `/painel` | Lista/fila com status e ações (lavando → pronto → pago / cancelado) |
| `/caixa` | Caixa do dia: totais por lavador + comissão |

**Foto:** nenhuma dessas telas pede foto. Foto só aparece no fluxo de **reclamação** (API + UI mínima via painel/ação).

---

## Endpoints (API)

Base: `/api/v1`  
Auth MVP: header `X-Pin` (PIN do dia) onde aplicável; health público.

### Health

| Método | Path | Descrição |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |

### Lavadores

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/v1/lavadores` | Lista lavadores |
| POST | `/api/v1/lavadores` | Cria lavador `{ nome, comissao_pct }` |
| GET | `/api/v1/lavadores/{id}` | Detalhe |
| PATCH | `/api/v1/lavadores/{id}` | Atualiza |
| DELETE | `/api/v1/lavadores/{id}` | Soft/hard delete |
| POST | `/api/v1/lavadores/{id}/pin-do-dia` | Gera PIN + QR payload do dia |
| POST | `/api/v1/auth/pin` | Valida PIN do dia → sessão simples |

### Serviços (catálogo)

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/v1/servicos` | Lista (ex.: lava simples, completa) |
| POST | `/api/v1/servicos` | Cria `{ nome, preco_centavos, ativo }` |
| PATCH | `/api/v1/servicos/{id}` | Atualiza |
| DELETE | `/api/v1/servicos/{id}` | Desativa |

### Atendimentos

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/v1/atendimentos` | Filtros: `status`, `data` |
| POST | `/api/v1/atendimentos` | `{ placa, servico_id, lavador_id? }` → `na_fila` |
| GET | `/api/v1/atendimentos/{id}` | Detalhe |
| PATCH | `/api/v1/atendimentos/{id}/status` | `{ status }` |

Status válidos: `na_fila` | `lavando` | `pronto` | `pago` | `cancelado`

**Sem campo de foto neste recurso.**

### Caixa do dia

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/v1/caixa/dia?data=YYYY-MM-DD` | Totais gerais + por lavador (bruto, comissão, líquido) |

### Reclamações (único lugar com foto no MVP)

| Método | Path | Descrição |
|---|---|---|
| POST | `/api/v1/reclamacoes` | `{ atendimento_id, texto, foto_url? }` |
| GET | `/api/v1/reclamacoes` | Lista |
| GET | `/api/v1/reclamacoes/{id}` | Detalhe |

`foto_url` é **opcional**. Upload binário real = fase 2 (MVP aceita URL ou omitido).

### Pagamento (stub)

| Método | Path | Descrição |
|---|---|---|
| POST | `/api/v1/payments/stub` | `{ atendimento_id, meio: pix\|cartao }` → marca atendimento `pago` |

Adquirente real (banco/adquirente do cliente) = fase 2.

---

## Modelo de dados (resumo)

- **lavador:** id, nome, comissao_pct, ativo, created_at
- **pin_dia:** lavador_id, data, pin_hash, qr_payload
- **servico:** id, nome, preco_centavos, ativo
- **atendimento:** id, placa, servico_id, lavador_id, status, created_at, paid_at
- **reclamacao:** id, atendimento_id, texto, foto_url (nullable), created_at

---

## Critérios de aceite (MVP)

1. `GET /health` retorna ok  
2. CRUD lavadores + gerar PIN do dia  
3. Catálogo de serviços seedável  
4. Criar atendimento só com placa + serviço (sem foto)  
5. Transicionar status até `pago` via stub  
6. Caixa do dia soma pagos e aplica comissão  
7. Reclamação aceita sem foto e com `foto_url`  
8. `make up` sobe stack; `make test` e `make ci` passam  
9. Docs PRD enfatizam: foto não obrigatória no fluxo normal  
