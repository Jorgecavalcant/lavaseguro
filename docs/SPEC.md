# LavaSeguro — SPEC (MVP v0.2)

## Auth
- `POST /api/v1/auth/pin` → valida PIN do dia e retorna JWT HS256 (`AuthPinOut.access_token`).
  - Claims: `sub=lavador_id`, `role=lavador`, `iat`, `exp`.
- Config: `JWT_SECRET` (se vazio, herda `APP_SECRET`), `JWT_EXPIRE_MINUTES` (default 480), `JWT_ALGORITHM` (HS256).
- Dependency `auth_jwt.get_current_lavador`: aceita `Authorization: Bearer <jwt>` OU `X-Pin` (compatibilidade MVP).
- **Decisão de compatibilidade:** mutações de atendimentos/caixa/payments NÃO forçam `Depends(get_current_lavador)` ainda, para não quebrar os 4 testes do `test_api`. A web já envia Bearer JWT; a proteção obrigatória entra no próximo passo de hardening.

## Pagamentos
- Interface `PaymentProvider` + registry plugável (`payments/provider.py`).
- Providers atuais:
  - `manual` — real (confirma pagamento recebido fora do sistema);
  - `pix_manual` — STUB (registra localmente, mensagem clara de stub);
  - `cartao_pos` — STUB (registra localmente, mensagem clara de stub).
- **NUNCA Asaas como core.** O cliente escolhe o adquirente/banco dele; a Tech42 apenas pluga novos providers (Cielo, Stone, PagSeguro, API do banco do cliente etc.) sem mudar o fluxo.
- `GET /api/v1/payments/providers` lista disponíveis + default; `POST /api/v1/payments/charge` recebe `{atendimento_id, meio, provider}`.

## Web
- `/entrar`: PIN → JWT salvo em localStorage → chamadas com `Authorization: Bearer`.
- Foto permitida **somente** em reclamações.

## DNS / Deploy
- DNS: apenas documentado (não implementado no MVP). Próximo passo após escolha de provedor/VPS.
