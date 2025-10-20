install:
	poetry install --sync

lint:
	poetry run ruff check .

format:
	poetry run ruff format .

typecheck:
	poetry run mypy app

dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
