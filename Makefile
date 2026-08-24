# LavaSeguro — Makefile
.DEFAULT_GOAL := help
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

COMPOSE ?= docker compose

.PHONY: help up down logs test ci seed

help: ## Lista comandos
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN { FS = ":.*?## " } { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }'

up: ## Sobe api + web + postgres
	@test -f .env || cp .env.example .env
	$(COMPOSE) up --build -d

down: ## Para containers
	$(COMPOSE) down

logs: ## Logs da stack
	$(COMPOSE) logs -f --tail=100

test: ## Testes da API (pytest, SQLite em memória)
	cd api && (test -d .venv || python3 -m venv .venv) && \
		. .venv/bin/activate && pip install -q -U pip && pip install -q -r requirements.txt && \
		PYTHONPATH=. DATABASE_URL=sqlite+pysqlite:///:memory: pytest -q

ci: ## Fluxo CI local (testes API)
	cd api && (test -d .venv || python3 -m venv .venv) && \
		. .venv/bin/activate && pip install -q -U pip && pip install -q -r requirements.txt && \
		python -m compileall app && \
		PYTHONPATH=. DATABASE_URL=sqlite+pysqlite:///:memory: pytest -q
	@echo "CI local OK"

seed: ## Seed via API (requer stack no ar)
	curl -s -X POST http://localhost:8000/api/v1/seed | python3 -m json.tool
