install:
	poetry install --sync

lint:
	poetry run ruff check .

format:
	poetry run ruff format .

typecheck:
	poetry run mypy app

test:
	poetry run pytest

migrate:
	poetry run alembic upgrade head

revision:
ifndef M
	$(error Usage: make revision M="your message")
endif
	@cd $(API_DIR) && \
		poetry run alembic revision --autogenerate -m "$(M)"

seed:
	poetry run python -m app.scripts.seed

clear:
	 poetry run python -m app.scripts.clear

dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
