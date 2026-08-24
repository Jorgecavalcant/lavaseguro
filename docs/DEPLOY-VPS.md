# Deploy VPS — lavaseguro

Padrão Tech42 (igual GIC e demais):

- Pasta na VPS: `/srv/projetos/clientes/lavaseguro`
- Domínio: `lavaseguro.tech42.com.br` (DNS criado pelo CEO — ver DNS-CADDY.md)
- Stack: Docker Compose + Caddy

Passos (ops): clonar repo → copiar `.env.example` → `docker compose up -d` → ligar Caddy.
