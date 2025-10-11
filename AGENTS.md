# Agent Guidelines for Occupy Project

## Build/Lint/Test Commands

### Mobile (React Native/TypeScript)
- **Type check**: `cd mobile && npm run type-check`
- **Lint**: `cd mobile && npm run lint`
- **Format**: `cd mobile && npm run format`
- **Test**: `cd mobile && npm test`
- **Single test**: `cd mobile && npm test -- --testNamePattern="test name"`

### Backend (Django/Python)
- **Test all**: `make backend-test` or `cd backend && python manage.py test`
- **Single test**: `cd backend && python manage.py test <app>.tests.<TestClass>.<test_method>`
- **Test with coverage**: `make backend-test-cov`
- **Lint**: `make backend-lint` (flake8 + mypy)
- **Format**: `make backend-format` (black + isort)
- **Format check**: `make backend-format-check`

## Code Style Guidelines

### TypeScript/React Native (Biome)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Imports**: Auto-organize imports enabled
- **Line length**: Default (120 chars)
- **Rules**: Recommended Biome rules

### Python/Django
- **Line length**: 88 characters (Black)
- **Imports**: isort with Black profile, sections: FUTURE, STDLIB, DJANGO, THIRDPARTY, FIRSTPARTY, LOCALFOLDER
- **Formatting**: Black with target Python 3.9+
- **Linting**: flake8 with max complexity 10, ignores E203, E501, W503
- **Type checking**: mypy with Django stubs, strict checking enabled
- **Naming**: Follow Django conventions (snake_case for variables/functions, PascalCase for classes)
- **Error handling**: Use Django's exception handling patterns, raise appropriate Django exceptions
- **Database**: Use Django ORM, avoid raw SQL unless necessary