# Contributing to StoragePilot

Thanks for your interest in contributing!

## Development setup

1. Fork and clone the repo
2. `cd app && pnpm install`
3. Start emulators: `docker compose -f docker-compose.stack.yml up fake-gcs minio azurite -d`
4. Run the dev server: `pnpm run dev`

## Code style

- TypeScript strict mode
- ESLint + Prettier (run `pnpm run lint` before opening a PR)
- Match existing patterns — read `docs/` for architecture and provider conventions

## Tests

All tests live under `app/tests/`:

| Path | Runner | Purpose |
|------|--------|---------|
| `tests/unit/<feature>/` | `pnpm test` | Unit + component tests grouped by UI feature or `api/` |
| `tests/integration/api/` | `pnpm test:integration` | Provider adapters against real emulators |
| `tests/e2e/` | `pnpm test:e2e` | Playwright end-to-end flows |

Place new tests in the folder that matches the feature you changed (`browser`, `layout`, `modals`, etc.). Import source with `@/lib/...`, `@/api/...`, or `@/features/...`.

```bash
cd app
pnpm test              # unit tests
pnpm test:integration  # requires emulators (STORAGEPILOT_INTEGRATION=1)
pnpm test:e2e          # Playwright
```

## Pull requests

1. Open an issue for large changes first
2. Keep PRs focused on one concern
3. Include tests for new behaviour where practical
4. Ensure CI passes: lint, typecheck, unit tests, build

## Provider changes

All storage calls go through the `StorageProvider` interface. Never call emulator APIs from UI components. See `docs/providers.md` for details.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
