# -------- Settings --------
SHELL := /bin/bash
API_DIR := apps/api
MOBILE_DIR := apps/mobile
COMPOSE_DEV := infra/docker/compose.dev.yml
COMPOSE_PROD := infra/docker/compose.prod.yml

# Optional filters (use like: make lint PNPM_FILTER=@clique/ui)
PNPM_FILTER ?=
ifdef PNPM_FILTER
	PNPMF := -F $(PNPM_FILTER)
else
	PNPMF :=
endif

# -------- Meta --------
.PHONY: help
help:
	@echo ""
	@echo "Clique — Monorepo shortcuts"
	@echo "Usage: make <target>"
	@echo ""
	@echo "Bootstrap:"
	@echo "  install          Install all JS deps (pnpm) and API deps (Poetry)"
	@echo "  init             install + build dev containers"
	@echo ""
	@echo "Dev (Docker):"
	@echo "  up               Start dev stack (db, redis, minio, api)"
	@echo "  down             Stop dev stack"
	@echo "  logs             Tail dev logs (all)  | use S=api|db|redis|minio"
	@echo "  ps               Show running dev services"
	@echo "  health           Hit API & Nginx health endpoints"
	@echo ""
	@echo "API (inside containers unless noted):"
	@echo "  migrate          Apply Alembic migrations (dev)"
	@echo "  revision M=\"msg\"  Create new Alembic revision with message"
	@echo "  seed             Run seed script (if present)"
	@echo "  api-shell        Bash into API container"
	@echo ""
	@echo "Mobile:"
	@echo "  mobile           Start Expo dev server"
	@echo ""
	@echo "Quality:"
	@echo "  lint             Biome (TS) + Ruff (py)"
	@echo "  format           Biome format + Ruff format"
	@echo "  typecheck        tsc (TS) + mypy (py)"
	@echo "  test             Jest/placeholder (TS) + pytest (py)"
	@echo ""
	@echo "Types:"
	@echo "  gen-types        Generate OpenAPI TS client (@clique/types)"
	@echo ""
	@echo "Prod (Docker):"
	@echo "  up-prod          Start prod stack behind Nginx"
	@echo "  down-prod        Stop prod stack"
	@echo "  migrate-prod     Apply Alembic migrations (prod)"
	@echo "  logs-prod        Tail prod logs (all) | use S=nginx|api|db|redis|minio"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean            Remove node_modules, .venv, pyc, dist; keep DB volumes"
	@echo ""

# -------- Bootstrap --------
.PHONY: install init
install:
	pnpm i
	cd $(API_DIR) && poetry install --sync

init: install up migrate
	@echo "✅ Dev stack is up. Next: cd $(MOBILE_DIR) && pnpm dev"

# -------- Dev Stack --------
.PHONY: up down logs ps health
up:
	docker compose -f $(COMPOSE_DEV) up --build -d

down:
	docker compose -f $(COMPOSE_DEV) down

logs:
ifneq ($(S),)
	docker compose -f $(COMPOSE_DEV) logs -f $(S)
else
	docker compose -f $(COMPOSE_DEV) logs -f
endif

ps:
	docker compose -f $(COMPOSE_DEV) ps

health:
	@echo "Nginx (if running in prod):"
	-@curl -sf http://localhost/nginx/health || true
	@echo "\nAPI:"
	-@curl -sf http://localhost:8000/health || true
	@echo ""

# -------- API (Dev) --------
.PHONY: migrate revision seed api-shell
migrate:
	docker compose -f $(COMPOSE_DEV) exec api alembic upgrade head

revision:
ifndef M
	$(error Usage: make revision M="your message")
endif
	docker compose -f $(COMPOSE_DEV) exec -e MESSAGE="$(M)" api \
		bash -lc 'alembic revision --autogenerate -m "$$MESSAGE"'

seed:
	docker compose -f $(COMPOSE_DEV) exec api python -m app.scripts.seed

api-shell:
	docker compose -f $(COMPOSE_DEV) exec api bash

# -------- Mobile --------
.PHONY: mobile
mobile:
	cd $(MOBILE_DIR) && pnpm dev

# -------- Quality Gates --------
.PHONY: lint format typecheck test
lint:
	# TypeScript / packages + apps (Biome)
	pnpm -r $(PNPMF) run lint || true
	# Python (Ruff)
	cd $(API_DIR) && poetry run ruff check .

format:
	# TypeScript (Biome)
	pnpm -r $(PNPMF) run format || true
	# Python (Ruff)
	cd $(API_DIR) && poetry run ruff format .

typecheck:
	# TypeScript (tsc)
	pnpm -r $(PNPMF) run typecheck || true
	# Python (mypy)
	cd $(API_DIR) && poetry run mypy app

test:
	# TS placeholder (adjust if you add Jest to mobile)
	- pnpm -r $(PNPMF) run test
	# Python tests
	cd $(API_DIR) && poetry run pytest -q

# -------- Types (OpenAPI) --------
.PHONY: gen-types
gen-types:
	pnpm -F @clique/types run generate

# -------- Prod Stack --------
.PHONY: up-prod down-prod migrate-prod logs-prod
up-prod:
	docker compose -f $(COMPOSE_PROD) up --build -d

down-prod:
	docker compose -f $(COMPOSE_PROD) down

migrate-prod:
	docker compose -f $(COMPOSE_PROD) exec api alembic upgrade head

logs-prod:
ifneq ($(S),)
	docker compose -f $(COMPOSE_PROD) logs -f $(S)
else
	docker compose -f $(COMPOSE_PROD) logs -f
endif

# -------- Maintenance --------
.PHONY: clean
clean:
	@echo "Cleaning JS artifacts…"
	@find . -name "node_modules" -type d -prune -print -exec rm -rf {} +
	@find . -name "dist" -type d -prune -print -exec rm -rf {} +
	@find . -name "build" -type d -prune -print -exec rm -rf {} +
	@echo "Cleaning Python artifacts…"
	@find . -name ".mypy_cache" -type d -prune -print -exec rm -rf {} +
	@find . -name ".ruff_cache" -type d -prune -print -exec rm -rf {} +
	@find . -name "__pycache__" -type d -prune -print -exec rm -rf {} +
	@find . -name "*.pyc" -delete
	@echo "Done. (Docker volumes left intact)"
