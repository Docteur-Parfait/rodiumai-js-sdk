# RodiumAI JavaScript SDK

Official TypeScript/JavaScript SDK for the [Rodium AI](https://www.rodiumai.io) API — unified access to AI models (OpenAI, Anthropic, Google, DeepSeek…) with **RODI** credit billing and **Mobile Money** top-ups.

> **OpenAI-compatible** REST API: same endpoints and payloads as documented at [rodiumai.io/docs](https://www.rodiumai.io/docs).

[![npm version](https://img.shields.io/npm/v/rodiumai)](https://www.npmjs.com/package/rodiumai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://github.com/Docteur-Parfait/rodiumai-js-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Docteur-Parfait/rodiumai-js-sdk/actions)

## Links

| Resource | URL |
|----------|-----|
| **npm** | [npmjs.com/package/rodiumai](https://www.npmjs.com/package/rodiumai) |
| **Source code** | [github.com/Docteur-Parfait/rodiumai-js-sdk](https://github.com/Docteur-Parfait/rodiumai-js-sdk) |
| **JavaScript SDK guide** | [rodiumai.io/docs/guides/javascript-sdk](https://www.rodiumai.io/docs/guides/javascript-sdk) |
| **API documentation** | [rodiumai.io/docs](https://www.rodiumai.io/docs) |
| **Dashboard & API keys** | [rodiumai.io/dashboard](https://www.rodiumai.io/dashboard) |

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Three ways to call the API](#three-ways-to-call-the-api)
- [Quick start](#quick-start)
- [Chat completions](#chat-completions)
- [Streaming (SSE)](#streaming-sse)
- [Models](#models)
- [Embeddings](#embeddings)
- [Images & videos](#images--videos)
- [Audio](#audio)
- [Anthropic Messages](#anthropic-messages)
- [Wallet & pricing](#wallet--pricing)
- [Error handling](#error-handling)
- [SDK reference](#sdk-reference)
- [OpenAI migration](#openai-migration)
- [Local development](#local-development)
- [Migration 0.2.x → 0.3.0](#migration-02x--030)
- [Testing](#testing)
- [License](#license)

## Requirements

- Node.js **18+** (or any runtime with `fetch` and `FormData`)
- Rodium AI account + API key (`rd_sk_…`): [dashboard](https://www.rodiumai.io/dashboard)

## Installation

```bash
npm install rodiumai
# or
pnpm add rodiumai
# or
yarn add rodiumai
```

## Configuration

Environment variables (recommended):

```bash
export RODIUMAI_API_KEY=rd_sk_your_secret_key
export RODIUMAI_BASE_URL=https://api.rodiumai.io/v1   # optional
export RODIUMAI_DEFAULT_MODEL=openai/gpt-4o          # optional
```

Constructor options:

```typescript
import { RodiumAI } from 'rodiumai';

const client = new RodiumAI({
  apiKey: 'rd_sk_...',              // or RODIUMAI_API_KEY env
  baseURL: 'https://api.rodiumai.io/v1',
  defaultModel: 'openai/gpt-4o',
  timeout: 30_000,                  // ms
  streamTimeout: 600_000,           // ms (streaming / long jobs)
  maxRetries: 3,
});
```

| Variable / option | Default | Description |
|-------------------|---------|-------------|
| `RODIUMAI_API_KEY` | — | Secret key from the dashboard |
| `RODIUMAI_BASE_URL` | `https://api.rodiumai.io/v1` | Gateway base URL (`http://localhost:8001/v1` for local dev) |
| `RODIUMAI_DEFAULT_MODEL` | `openai/gpt-4o` | Default model slug |
| `timeout` | `30000` | HTTP timeout in ms |
| `streamTimeout` | `600000` | Timeout for streams and long requests |

Never commit API keys or `.env` files.

## Three ways to call the API

| Style | When to use | Example |
|-------|-------------|---------|
| **Flat API** | Recommended — parity with Laravel SDK | `await client.chat('Hello')` |
| **Fluent builder** | Chain model / decoding options | `await client.model('openai/gpt-4o').temperature(0.7).chat('Hi')` |
| **OpenAI nested** | Drop-in for existing OpenAI code | `await client.chat.completions.create({ ... })` |

All three hit the same gateway endpoints.

## Quick start

```typescript
import { RodiumAI } from 'rodiumai';

const client = new RodiumAI();

// Flat API (recommended)
const response = await client.chat('Explain RODI credits in one sentence.');
console.log(response.choices[0].message.content);
console.log(response.cost_rodi);

// Fluent builder
const fluent = await client.model('openai/gpt-4o').temperature(0.7).chat('Hello!');
```

## Chat completions

Aligned with [docs/api/chat-completions](https://www.rodiumai.io/docs/api/chat-completions).

```typescript
// Shorthand string
const response = await client.chat('What is Rodium AI?');

// Full message list
const response2 = await client.chat(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain Laravel Service Providers.' },
  ],
  { maxTokens: 500, temperature: 0.5 },
);

// Passthrough (tools, responseFormat, stop, …)
const response3 = await client.chat(messages, { tools: [...], responseFormat: { type: 'json_object' } });
```

### Smart routing

```typescript
const response = await client.model('rodiumai/smart').chat('Summarize RODI credits.');
console.log(response.routing); // resolved model metadata from gateway
```

See [Smart routing guide](https://www.rodiumai.io/docs/guides/smart).

### OpenAI nested (drop-in)

```typescript
const response = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Streaming (SSE)

```typescript
for await (const delta of client.stream('Tell a short story about Lagos.')) {
  process.stdout.write(delta);
}
```

Nested equivalent:

```typescript
const stream = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

## Models

```typescript
const catalogue = await client.models();                    // GET /v1/models
const info = await client.modelInfo('openai/gpt-4o');       // GET /v1/models/{id}
const coding = await client.codingModels();                 // GET /v1/models/coding

// Nested
const list = await client.models.list();
const detail = await client.models.retrieve('openai/gpt-4o');
```

Use catalogue IDs (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4-6`) — not legacy `auto`.

## Embeddings

```typescript
const result = await client.embeddings('Hello world', { model: 'openai/text-embedding-3-small' });
const vector = result.data[0].embedding;

// Batch
const batch = await client.embeddings(['Hello', 'World'], { model: 'openai/text-embedding-3-small' });
```

## Images & videos

```typescript
const image = await client.images({
  model: 'openai/gpt-image-1',
  prompt: 'A sunset over Lomé',
  size: '1024x1024',
});
console.log(image.data[0].url);

const video = await client.videos({
  model: 'google/veo-3.1-generate-preview',
  prompt: 'Ocean waves at golden hour',
  durationSeconds: 8,
  timeout: 600_000,
});
console.log(video.data[0].url);
```

## Audio

```typescript
import fs from 'node:fs';

// Transcription (multipart upload — path, Blob, File, or Buffer)
const transcript = await client.transcribe('recording.mp3', {
  model: 'google/gemini-2.5-flash',
  language: 'fr',
});
console.log(transcript.text);

// Text-to-speech (returns ArrayBuffer)
const audioBytes = await client.speech({
  model: 'openai/tts-1',
  input: 'Hello from RodiumAI',
  voice: 'alloy',
});
fs.writeFileSync('speech.mp3', audioBytes);
```

Nested:

```typescript
const transcript = await client.audio.transcriptions.create({ model: '...', file: blob });
const speech = await client.audio.speech.create({ model: '...', input: 'Hello', voice: 'alloy' });
```

## Anthropic Messages

Drop-in for [POST /v1/messages](https://www.rodiumai.io/docs/api/messages):

```typescript
const result = await client.messages({
  model: 'anthropic/claude-sonnet-4-6',
  maxTokens: 1024,
  messages: [{ role: 'user', content: 'Explain RODI credits.' }],
});
console.log(result);
```

## Wallet & pricing

RodiumAI extensions:

```typescript
const wallet = await client.wallet();
console.log(wallet);

const pricing = await client.pricing();
const pricingModel = await client.pricing('openai/gpt-4o');
```

## Error handling

See [docs/api/errors](https://www.rodiumai.io/docs/api/errors).

| HTTP | Exception | `error_code` |
|------|-----------|--------------|
| 401 | `InvalidAPIKeyError` | `invalid_api_key` |
| 402 | `InsufficientRODIError` | `insufficient_balance` |
| 403 | `PermissionDeniedError` | `permission_denied` |
| 404 | `ModelNotFoundError` | `model_not_found` |
| 429 | `RateLimitError` | `rate_limit_exceeded` — use `retryAfter` |
| 500 | `InternalServerError` | `internal_error` |
| 503 | `ServiceUnavailableError` | `service_unavailable` |
| Timeout | `TimeoutError` | `timeout` |
| Network | `NetworkError` | `network_error` |

Both OpenAI-shaped and Anthropic-shaped error envelopes are parsed from the gateway.

```typescript
import { RodiumAI, InsufficientRODIError, RateLimitError } from 'rodiumai';

const client = new RodiumAI();

try {
  await client.chat('Test');
} catch (err) {
  if (err instanceof InsufficientRODIError) {
    console.error(err.errorCode, err.requestId);
  } else if (err instanceof RateLimitError) {
    await new Promise((r) => setTimeout(r, (err.retryAfter ?? 1) * 1000));
  }
}
```

## SDK reference

| Flat method | Nested equivalent | Gateway route |
|-------------|-------------------|---------------|
| `chat(messages, opts?)` | `chat.completions.create(...)` | `POST /v1/chat/completions` |
| `stream(messages, opts?)` | `chat.completions.create({ stream: true })` | `POST /v1/chat/completions` (SSE) |
| `models()` | `models.list()` | `GET /v1/models` |
| `modelInfo(id)` | `models.retrieve(id)` | `GET /v1/models/{id}` |
| `codingModels()` | `models.listCoding()` | `GET /v1/models/coding` |
| `embeddings(input, opts?)` | `embeddings.create(...)` | `POST /v1/embeddings` |
| `images(opts)` | `images.generate(...)` | `POST /v1/images/generations` |
| `videos(opts)` | `video.generations.create(...)` | `POST /v1/videos/generations` |
| `transcribe(file, opts?)` | `audio.transcriptions.create(...)` | `POST /v1/audio/transcriptions` |
| `speech(opts)` → `ArrayBuffer` | `audio.speech.create(...)` | `POST /v1/audio/speech` |
| `messages(opts)` | `messages.create(...)` | `POST /v1/messages` |
| `wallet()` | — | `GET /v1/wallet` |
| `pricing(opts?)` | — | `GET /v1/pricing` |

Fluent builder: `model()`, `temperature()`, `topP()`, `maxTokens()`, `systemPrompt()`.

Response extensions on `ChatCompletion`: `cost_rodi`, `routing`, `raw`.

Technical mapping: [docs/api-alignment.md](docs/api-alignment.md).

## OpenAI migration

```typescript
// Before (OpenAI)
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: 'sk-...' });

// After (RodiumAI) — nested API unchanged
import { RodiumAI } from 'rodiumai';
const client = new RodiumAI({ apiKey: 'rd_sk_...' });

const response = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

Or use the flat API: `await client.chat('Hello!')`.

## Local development

Point the SDK at a local gateway (e.g. Docker Compose on port 8001):

```bash
export RODIUMAI_BASE_URL=http://localhost:8001/v1
export RODIUMAI_API_KEY=rd_sk_dev_...
```

## Migration 0.2.x → 0.3.0

| Change | Action |
|--------|--------|
| Default model | `auto` → `openai/gpt-4o` (override via `RODIUMAI_DEFAULT_MODEL`) |
| Flat + fluent API | New recommended surface: `client.chat()`, `client.stream()`, … |
| Video | Implemented (`client.videos()`) — was stub in 0.2.x |
| 402 error code | `insufficient_rodi` → `insufficient_balance` |
| Speech | Returns binary `ArrayBuffer` (not JSON envelope) |
| New resources | `models`, `messages`, `wallet`, `pricing` |

Require `rodiumai@^0.3` in your dependencies.

## Testing

```bash
git clone https://github.com/Docteur-Parfait/rodiumai-js-sdk.git
cd rodiumai-js-sdk
npm install
npm test
npm run build
```

## License

MIT — see [LICENSE](LICENSE).
