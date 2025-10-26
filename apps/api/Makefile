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

seed:
	poetry run python app/scripts/seed.py

clear:
	poetry run python app/scripts/clear.py

dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
