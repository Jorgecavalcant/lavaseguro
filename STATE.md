# STATE — LavaSeguro

**Atualizado:** 2026-08-24

## Status
Scaffold MVP rodável. Foto só em reclamação. Pagamento plugável (`manual` no MVP).

## Decisões do CEO (2026-08-24)
- DNS: CEO cria
- VPS: `/srv/projetos/clientes/lavaseguro`
- Pagamentos: pluggable — cliente escolhe banco/adquirente; **não** usar Asaas como core

## Feito
- [x] API: lavadores, PIN do dia, serviços, atendimentos, caixa, reclamações, payments plugável
- [x] Web: landing, atender, painel, caixa, entrar
- [x] Docker + CI + docs

## Próximo
- [ ] Implementar provedores reais (Stone/Cielo/banco do cliente) como plugins
- [ ] Deploy VPS após DNS
- [ ] JWT operador
