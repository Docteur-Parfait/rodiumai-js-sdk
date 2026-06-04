# Changelog

## 0.2.0 (2026-06-04)

### Security & CI Improvements

- Security tests: header injection, API key validation, HTTPS enforcement, DoS caps
- Max retries capped at 5 globally to prevent abuse
- Header injection protection (`\r`, `\n`, `\x00`) in API key
- `toJSON()` added to `RodiumAIError` for proper error serialization
- Split CI/CD: `ci.yml` (test+lint+security) and `publish.yml` (npm publish)
- ESLint + TypeScript strict mode configured
- `tests/` tracked in git for CI compatibility
- `package-lock.json` committed
- Stable test suite: 88 unit tests, 0 failures
- Coverage reporting fixed with `--coverage` flag
- Branch protection rules for `main` and `before-develop`
- `CODECOV_TOKEN` required for coverage upload

## 0.1.0 (2026-06-01)

### Initial Release

- Chat Completions (standard + streaming SSE)
- Embeddings (single + batch)
- Image Generation (text-to-image)
- Audio (speech-to-text + text-to-speech)
- Video stub (future-ready, throws Error)
- Full error hierarchy (8 custom errors)
- Structured JSON logging with alerts
- Usage statistics per session
- Automatic retry with exponential backoff
- OpenAI drop-in replacement syntax
- HTTPS enforced
- TypeScript-first with full type definitions
- Multi-architecture Docker support (node:22-alpine)
