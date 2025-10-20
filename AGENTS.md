# Agent Guidelines for Occupy Monorepo

## Build/Lint/Test Commands
- **Full build**: `pnpm build` (turbo orchestrated)
- **Full lint**: `pnpm lint` (biome + ruff)
- **Full format**: `pnpm format` (biome + ruff)
- **Full typecheck**: `pnpm typecheck` (tsc + mypy)
- **Full test**: `pnpm test` (jest + pytest)
- **Single test (Python)**: `cd apps/api && poetry run pytest path/to/test.py::test_function`
- **Single test (JS/TS)**: `pnpm test -- --testPathPattern=testfile --testNamePattern=testname`

## Code Style Guidelines
- **Formatting**: Biome (tabs, double quotes, auto-organize imports)
- **TypeScript**: Strict mode, ES2021 target, react-jsx, noUncheckedIndexedAccess
- **Python**: Ruff (100 char lines, import sorting), mypy strict
- **Naming**: camelCase (JS/TS), snake_case (Python)
- **Error handling**: Throw descriptive Error objects in TS; use appropriate exceptions in Python
- **Imports**: Auto-organized; prefer absolute imports over relative
- **Types**: Always use explicit types; avoid `any`; use interfaces for objects
- **Components**: Functional components with hooks; use TypeScript generics for reusability