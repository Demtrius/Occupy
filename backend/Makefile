.PHONY: help install install-dev test lint format migrate run shell clean

# Default environment
ENV ?= development

help:
	@echo "Available commands:"
	@echo "  install      - Install production dependencies"
	@echo "  install-dev  - Install development dependencies"
	@echo "  test         - Run tests with coverage"
	@echo "  lint         - Run linting (flake8, mypy)"
	@echo "  format       - Format code (black, isort)"
	@echo "  migrate      - Run database migrations"
	@echo "  run          - Run development server"
	@echo "  shell        - Open Django shell"
	@echo "  clean        - Clean cache and temporary files"
	@echo "  setup        - Initial setup for development"

install:
	pip install -r requirements/production.txt

install-dev:
	pip install -r requirements/development.txt

test:
	DJANGO_ENVIRONMENT=test python -m pytest

test-cov:
	DJANGO_ENVIRONMENT=test python -m pytest --cov=apps --cov-report=html --cov-report=term-missing

lint:
	flake8 .
	mypy .

format:
	black .
	isort .

format-check:
	black --check .
	isort --check-only .

migrate:
	DJANGO_ENVIRONMENT=$(ENV) python manage.py makemigrations
	DJANGO_ENVIRONMENT=$(ENV) python manage.py migrate

run:
	DJANGO_ENVIRONMENT=development python manage.py runserver

shell:
	DJANGO_ENVIRONMENT=development python manage.py shell_plus

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .coverage htmlcov/ .pytest_cache/ .mypy_cache/

setup: install-dev
	@echo "Creating .env file from example..."
	@if [ ! -f .env ]; then cp env.example .env; fi
	@echo "Running initial migrations..."
	@make migrate ENV=development
	@echo "Creating superuser (optional)..."
	@DJANGO_ENVIRONMENT=development python manage.py createsuperuser --noinput || true
	@echo "Setup complete! Run 'make run' to start the development server."

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Production commands
collect-static:
	DJANGO_ENVIRONMENT=production python manage.py collectstatic --noinput

check-deploy:
	DJANGO_ENVIRONMENT=production python manage.py check --deploy
