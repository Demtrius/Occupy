# Occupy Project Makefile
# Manages both mobile (Expo/React Native) and backend (Django) components

.DEFAULT_GOAL := help
.PHONY: help setup clean dev build test lint check docker migrate

# Colors for output
RED    = \033[31m
GREEN  = \033[32m
YELLOW = \033[33m
BLUE   = \033[34m
RESET  = \033[0m

##@ Help

help: ## Show this help message
	@echo "$(BLUE)Occupy Project Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(YELLOW)<target>$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

setup: setup-mobile setup-backend ## Setup both mobile and backend dependencies
	@echo "$(GREEN)✅ Setup completed for both mobile and backend!$(RESET)"

setup-mobile: ## Install mobile dependencies
	@echo "$(BLUE)📱 Setting up mobile dependencies...$(RESET)"
	@cd mobile && yarn install
	@echo "$(GREEN)✅ Mobile dependencies installed!$(RESET)"

setup-backend: ## Install backend dependencies and run migrations
	@echo "$(BLUE)🔧 Setting up backend dependencies...$(RESET)"
	@cd backend && pip install -r requirements/development.txt
	@cd backend && cp env.example .env || echo "$(YELLOW)⚠️  .env file already exists$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py migrate
	@echo "$(GREEN)✅ Backend dependencies installed and migrations applied!$(RESET)"

##@ Development

dev: ## Start both mobile and backend development servers
	@echo "$(BLUE)🚀 Starting full development environment...$(RESET)"
	@npx concurrently \
		--names "Backend,Mobile" \
		--prefix-colors "red,blue" \
		"make dev-backend" \
		"make dev-mobile"

dev-mobile: ## Start Expo development server
	@echo "$(BLUE)📱 Starting mobile development server...$(RESET)"
	@cd mobile && npx expo start

dev-backend: ## Start Django development server with Docker
	@echo "$(BLUE)🔧 Starting Django development server with Docker...$(RESET)"
	@cd backend && docker compose -f docker-compose.yml up --build

start: dev ## Alias for dev

##@ Build & Deploy

build: build-mobile ## Build mobile app for all platforms
	@echo "$(GREEN)✅ Build completed!$(RESET)"

build-mobile: ## Build mobile app for all platforms
	@echo "$(BLUE)📱 Building mobile app for all platforms...$(RESET)"
	@cd mobile && eas build --platform all

build-android: ## Build mobile app for Android only
	@echo "$(BLUE)🤖 Building mobile app for Android...$(RESET)"
	@cd mobile && eas build --platform android

build-ios: ## Build mobile app for iOS only
	@echo "$(BLUE)🍎 Building mobile app for iOS...$(RESET)"
	@cd mobile && eas build --platform ios

update-mobile: ## Deploy mobile app update
	@echo "$(BLUE)📱 Deploying mobile app update...$(RESET)"
	@cd mobile && eas update

##@ Testing & Quality

test: test-mobile backend-test ## Run all tests
	@echo "$(GREEN)✅ All tests completed!$(RESET)"

test-mobile: ## Run mobile tests
	@echo "$(BLUE)📱 Running mobile tests...$(RESET)"
	@cd mobile && npm test

lint: lint-mobile backend-lint ## Run all linters
	@echo "$(GREEN)✅ Linting completed!$(RESET)"

lint-mobile: ## Lint mobile code
	@echo "$(BLUE)📱 Linting mobile code...$(RESET)"
	@cd mobile && npx expo lint

format: backend-format ## Format all code
	@echo "$(GREEN)✅ Code formatting completed!$(RESET)"

format-check: backend-format-check ## Check all code formatting
	@echo "$(GREEN)✅ Code formatting check completed!$(RESET)"

check: check-mobile check-backend ## Run health checks on both projects
	@echo "$(GREEN)✅ Health checks completed!$(RESET)"

check-mobile: ## Run mobile health check (Expo Doctor)
	@echo "$(BLUE)📱 Running mobile health check...$(RESET)"
	@cd mobile && npx expo-doctor

check-backend: ## Run backend health check (Django Check)
	@echo "$(BLUE)🔧 Running backend health check...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py check

##@ Database & Backend Management

migrate: ## Apply Django database migrations
	@echo "$(BLUE)🔄 Applying database migrations...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py migrate
	@echo "$(GREEN)✅ Migrations applied!$(RESET)"

makemigrations: ## Create new Django database migrations
	@echo "$(BLUE)🔄 Creating new database migrations...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py makemigrations
	@echo "$(GREEN)✅ Migrations created!$(RESET)"

superuser: ## Create Django superuser
	@echo "$(BLUE)👤 Creating Django superuser...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py createsuperuser

shell: ## Open Django shell
	@echo "$(BLUE)🐍 Opening Django shell...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py shell_plus

collectstatic: ## Collect static files
	@echo "$(BLUE)📁 Collecting static files...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=production python manage.py collectstatic --noinput
	@echo "$(GREEN)✅ Static files collected!$(RESET)"

##@ Backend Development Tools

backend-install: ## Install backend dependencies only
	@echo "$(BLUE)🔧 Installing backend dependencies...$(RESET)"
	@cd backend && pip install -r requirements/development.txt
	@echo "$(GREEN)✅ Backend dependencies installed!$(RESET)"

backend-install-prod: ## Install production backend dependencies
	@echo "$(BLUE)🔧 Installing production backend dependencies...$(RESET)"
	@cd backend && pip install -r requirements/production.txt
	@echo "$(GREEN)✅ Production dependencies installed!$(RESET)"

backend-test: ## Run backend tests
	@echo "$(BLUE)🧪 Running backend tests...$(RESET)"
	@cd backend && DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
	@echo "$(GREEN)✅ Backend tests completed!$(RESET)"

backend-test-cov: ## Run backend tests with coverage
	@echo "$(BLUE)🧪 Running backend tests with coverage...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=test python -m pytest --cov=apps --cov-report=html --cov-report=term-missing
	@echo "$(GREEN)✅ Backend tests with coverage completed!$(RESET)"

backend-lint: ## Run backend linting
	@echo "$(BLUE)🔍 Running backend linting...$(RESET)"
	@cd backend && flake8 .
	@cd backend && mypy .
	@echo "$(GREEN)✅ Backend linting completed!$(RESET)"

backend-format: ## Format backend code
	@echo "$(BLUE)✨ Formatting backend code...$(RESET)"
	@cd backend && black .
	@cd backend && isort .
	@echo "$(GREEN)✅ Backend code formatted!$(RESET)"

backend-format-check: ## Check backend code formatting
	@echo "$(BLUE)🔍 Checking backend code formatting...$(RESET)"
	@cd backend && black --check .
	@cd backend && isort --check-only .
	@echo "$(GREEN)✅ Backend code formatting checked!$(RESET)"

backend-clean: ## Clean backend cache and temporary files
	@echo "$(BLUE)🧹 Cleaning backend cache...$(RESET)"
	@cd backend && find . -name "*.pyc" -delete
	@cd backend && find . -name "__pycache__" -delete
	@cd backend && rm -rf .coverage htmlcov/ .pytest_cache/ .mypy_cache/
	@echo "$(GREEN)✅ Backend cache cleaned!$(RESET)"

backend-reset-db: ## Reset backend database (development only)
	@echo "$(BLUE)🔄 Resetting backend database...$(RESET)"
	@cd backend && rm -f db.sqlite3
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py migrate
	@echo "$(GREEN)✅ Backend database reset!$(RESET)"

backend-seed: ## Seed backend database with sample data
	@echo "$(BLUE)🌱 Seeding backend database...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python manage.py loaddata fixtures/sample_data.json || echo "$(YELLOW)⚠️  No sample data fixtures found$(RESET)"
	@echo "$(GREEN)✅ Backend database seeded!$(RESET)"

backend-check-deploy: ## Check backend deployment readiness
	@echo "$(BLUE)🔍 Checking backend deployment readiness...$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=production python manage.py check --deploy
	@echo "$(GREEN)✅ Backend deployment check completed!$(RESET)"

backend-logs: ## Show backend logs directory
	@echo "$(BLUE)📋 Backend logs location:$(RESET)"
	@cd backend && mkdir -p logs && ls -la logs/ || echo "$(YELLOW)⚠️  No log files found$(RESET)"

##@ Docker

docker: ## Start backend with Docker (development)
	@echo "$(BLUE)🐳 Starting backend with Docker (development)...$(RESET)"
	@cd backend && docker compose -f docker-compose.yml up --build

docker-prod: ## Start backend with Docker (production)
	@echo "$(BLUE)🐳 Starting backend with Docker (production)...$(RESET)"
	@cd backend && docker compose -f docker-compose.prod.yml up --build

docker-stop: ## Stop Docker containers
	@echo "$(BLUE)🐳 Stopping Docker containers...$(RESET)"
	@cd backend && docker compose down

docker-clean: ## Clean Docker containers and images
	@echo "$(BLUE)🐳 Cleaning Docker containers and images...$(RESET)"
	@cd backend && docker compose down --volumes --remove-orphans
	@docker system prune -f

##@ Maintenance

clean: clean-mobile backend-clean ## Clean all caches and dependencies
	@echo "$(GREEN)✅ Cleanup completed!$(RESET)"

clean-mobile: ## Clean mobile dependencies and cache
	@echo "$(BLUE)📱 Cleaning mobile dependencies and cache...$(RESET)"
	@cd mobile && rm -rf node_modules .expo
	@cd mobile && npm install
	@echo "$(GREEN)✅ Mobile cleanup completed!$(RESET)"

clean-backend: backend-clean ## Alias for backend-clean

clean-all: clean ## Alias for clean

reset: clean setup ## Reset project (clean + setup)
	@echo "$(GREEN)✅ Project reset completed!$(RESET)"

##@ Logs & Monitoring

logs: ## View application logs
	@echo "$(BLUE)📋 Viewing application logs...$(RESET)"
	@tail -f logs/*.log 2>/dev/null || echo "$(YELLOW)⚠️  No log files found in logs/ directory$(RESET)"

logs-backend: ## View Django logs only
	@echo "$(BLUE)📋 Viewing Django logs...$(RESET)"
	@tail -f logs/django*.log 2>/dev/null || echo "$(YELLOW)⚠️  No Django log files found$(RESET)"

##@ Information

status: ## Show project status
	@echo "$(BLUE)📊 Project Status$(RESET)"
	@echo "$(YELLOW)Mobile:$(RESET)"
	@cd mobile && npm list --depth=0 2>/dev/null | head -5 || echo "  Dependencies not installed"
	@echo "$(YELLOW)Backend:$(RESET)"
	@cd backend && DJANGO_ENVIRONMENT=development python -c "import django; print(f'  Django: {django.get_version()}')" 2>/dev/null || echo "  Django not installed"
	@cd backend && DJANGO_ENVIRONMENT=development python -c "from config.settings import INSTALLED_APPS; print(f'  Apps: {len([app for app in INSTALLED_APPS if app.startswith(\"apps.\")])}')" 2>/dev/null || echo "  Apps not configured"
	@echo "$(YELLOW)Python Virtual Environment:$(RESET)"
	@if [ -d "backend/.venv" ] || [ -d ".venv" ]; then echo "  ✅ Virtual environment found"; else echo "  ❌ Virtual environment not found"; fi
	@echo "$(YELLOW)Environment Configuration:$(RESET)"
	@if [ -f "backend/.env" ]; then echo "  ✅ .env file found"; else echo "  ❌ .env file missing"; fi

info: ## Show project information
	@echo "$(BLUE)📋 Occupy Project Information$(RESET)"
	@echo "$(YELLOW)Structure:$(RESET)"
	@echo "  📱 Mobile: Expo SDK 52 + React Native"
	@echo "  🔧 Backend: Django REST API (Refactored Architecture)"
	@echo "  🏗️  Apps: accounts, social, common"
	@echo "  ⚙️  Settings: Environment-based configuration"
	@echo "  🐳 Docker: Available for backend"
	@echo "$(YELLOW)Quick Start:$(RESET)"
	@echo "  1. make setup           # Install all dependencies"
	@echo "  2. make dev             # Start development servers"
	@echo "  3. make check           # Verify everything works"
	@echo "$(YELLOW)Backend Development:$(RESET)"
	@echo "  • make backend-test     # Run tests"
	@echo "  • make backend-lint     # Run linting"
	@echo "  • make backend-format   # Format code"
	@echo "  • make shell            # Open Django shell"
	@echo "  • make migrate          # Apply migrations"
