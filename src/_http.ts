import fetch, { Response, Headers } from 'node-fetch';
import { VERSION } from './_version.js';
import {
  NetworkError,
  RateLimitError,
  RodiumAIError,
  TimeoutError,
  mapHttpStatus,
} from './errors.js';

interface RequestOptions {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  files?: Record<string, Buffer | string>;
  timeout?: number;
  stream?: boolean;
}

interface RequestResult {
  status: number;
  data: Record<string, unknown>;
  requestId: string;
}

export class AsyncHTTPClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private streamTimeout: number;
  private maxRetries: number;

  constructor({
    apiKey,
    baseUrl = 'https://api.rodiumai.io/v1',
    timeout = 30_000,
    streamTimeout = 600_000,
    maxRetries = 3,
  }: {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    streamTimeout?: number;
    maxRetries?: number;
  }) {
    if (baseUrl.startsWith('http://')) {
      throw new Error(
        'HTTPS is required. Use \'https://\' URL scheme. See: https://docs.rodiumai.io/security'
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeout = timeout;
    this.streamTimeout = streamTimeout;
    this.maxRetries = maxRetries;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'X-RodiumAI-SDK': `javascript/${VERSION}`,
      'X-RodiumAI-Version': VERSION,
      'Content-Type': 'application/json',
      'User-Agent': `RodiumAI-JS-SDK/${VERSION}`,
    };
  }

  private requestId(): string {
    return crypto.randomUUID();
  }

  private async doFetch(
    url: string,
    opts: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<Response> {
    try {
      return await fetch(url, { ...opts, signal });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TimeoutError(this.timeout / 1000);
      }
      throw new NetworkError((err as Error).message);
    }
  }

  async request(opts: RequestOptions): Promise<RequestResult> {
    const url = `${this.baseUrl}${opts.path}`;
    const headers = this.getHeaders();
    const rid = this.requestId();
    let retryCount = 0;

    const fetchOpts: Record<string, unknown> = {
      method: opts.method,
      headers,
    };

    if (opts.body) {
      fetchOpts.body = JSON.stringify(opts.body);
    }

    const effectiveTimeout = opts.timeout ?? this.timeout;

    while (retryCount <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), effectiveTimeout);

      try {
        const response = await this.doFetch(url, fetchOpts, controller.signal);
        clearTimeout(timer);
        const respRid = response.headers.get('X-Request-ID') ?? rid;
        const text = await response.text();
        const data: Record<string, unknown> = text ? JSON.parse(text) : {};

        if (response.status < 400) {
          return { status: response.status, data, requestId: respRid };
        }

        const error = mapHttpStatus(response.status, respRid);

        if ([429, 500, 502, 503, 504].includes(response.status)) {
          if (retryCount < this.maxRetries) {
            retryCount++;
            const sleepMs = Math.pow(2, retryCount - 1) * 1000 * (0.9 + Math.random() * 0.2);
            await new Promise((r) => setTimeout(r, sleepMs));
            continue;
          }
        }

        return { status: response.status, data, requestId: respRid };
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof RodiumAIError) {
          if (err instanceof TimeoutError || err instanceof NetworkError) {
            if (retryCount < this.maxRetries) {
              retryCount++;
              const sleepMs = Math.pow(2, retryCount - 1) * 1000 * (0.9 + Math.random() * 0.2);
              await new Promise((r) => setTimeout(r, sleepMs));
              continue;
            }
            throw err;
          }
          throw err;
        }
        throw err;
      }
    }

    throw new RodiumAIError({ message: 'Request failed after retries', code: 0 });
  }

  async *stream(
    path: string,
    body: Record<string, unknown>,
    timeout?: number
  ): AsyncGenerator<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders();
    const effectiveTimeout = timeout ?? this.streamTimeout;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        const rid = response.headers.get('X-Request-ID') ?? this.requestId();
        throw mapHttpStatus(response.status, rid);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new NetworkError('No response body for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6).trim();
            if (payload === '[DONE]') return;
            if (payload) {
              yield JSON.parse(payload);
            }
          }
        }
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TimeoutError(effectiveTimeout / 1000);
      }
      if (err instanceof RodiumAIError) throw err;
      throw new NetworkError((err as Error).message);
    }
  }
}
