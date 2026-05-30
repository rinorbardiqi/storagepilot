# Contributing to StoragePilot

Thanks for your interest in contributing!

## Development setup

1. Fork and clone the repo
2. `cd app && npm install`
3. Start emulators: `docker compose up fake-gcs minio azurite -d`
4. Run the dev server: `npm run dev`

## Code style

- TypeScript strict mode
- ESLint + Prettier (run `npm run lint` before opening a PR)
- Match existing patterns — read `docs/` for architecture and provider conventions

## Pull requests

1. Open an issue for large changes first
2. Keep PRs focused on one concern
3. Include tests for new behaviour where practical
4. Ensure CI passes: lint, typecheck, unit tests, build

## Provider changes

All storage calls go through the `StorageProvider` interface. Never call emulator APIs from UI components. See `docs/providers.md` for details.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
