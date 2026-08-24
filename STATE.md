# STATE — LavaSeguro

## Feito
- MVP base: lavadores, PIN do dia, serviços, atendimentos, caixa, reclamações (foto só aqui), seed
- **JWT operador**: `/auth/pin` emite JWT HS256 (`access_token` em AuthPinOut); `get_current_lavador` aceita Bearer OU X-Pin; config `jwt_secret` (herda `app_secret`) + `jwt_expire_minutes`
- **Payments**: PaymentProvider + registry com `manual`, `pix_manual` (stub), `cartao_pos` (stub); GET /providers, POST /charge(atendimento_id, meio, provider); sem Asaas
- Testes novos: test_auth_jwt.py, test_payments_plugins.py
- Compatibilidade: mutações ainda sem Depends obrigatório para não quebrar os 4 testes do test_api (documentado em SPEC)

## Não feito / Próximo
- Forçar Depends(get_current_lavador) nas mutações após alinhar web
- Deploy (após definição de DNS)
- Provedores de pagamento reais (substituir stubs quando cliente definir adquirente)
- Restringir CORS para domínio de produção
- Nunca usar Asaas como core
