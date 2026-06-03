import { AsyncHTTPClient } from './_http.js';
import { VERSION } from './_version.js';
import { InvalidAPIKeyError } from './errors.js';
import { RodiumAILogger } from './logger.js';
import { Audio, Chat, Embeddings, Images, Video } from './resources/index.js';
import { UsageStats } from './usage.js';

export interface RodiumAIOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  streamTimeout?: number;
  maxRetries?: number;
  logLevel?: string;
}

const MAX_RETRIES_LIMIT = 5;

export class RodiumAI {
  public chat: Chat;
  public embeddings: Embeddings;
  public images: Images;
  public audio: Audio;
  public video: Video;

  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private streamTimeout: number;
  private maxRetries: number;
  private logLevel?: string;
  private _logger: RodiumAILogger;
  private _usage: UsageStats;
  private _http: AsyncHTTPClient;

  constructor(opts: RodiumAIOptions = {}) {
    const resolvedKey = opts.apiKey ?? (typeof process !== 'undefined' ? process.env.RODIUMAI_API_KEY : '') ?? '';

    if (!resolvedKey || !resolvedKey.trim()) {
      throw new InvalidAPIKeyError();
    }

    // Reject header injection characters
    if (/[\r\n\x00]/.test(resolvedKey)) {
      throw new Error('API key contains invalid characters.');
    }

    this.apiKey = resolvedKey;
    this.baseURL = opts.baseURL ?? 'https://api.rodiumai.io/v1';
    this.timeout = opts.timeout ?? 30_000;
    this.streamTimeout = opts.streamTimeout ?? 600_000;
    // Cap maxRetries to prevent DoS-style abuse
    this.maxRetries = Math.min(opts.maxRetries ?? 3, MAX_RETRIES_LIMIT);
    this.logLevel = opts.logLevel;

    this._logger = new RodiumAILogger(this.logLevel);
    this._usage = new UsageStats();

    if (!/^[A-Za-z0-9@._-]+$/.test(this.apiKey)) {
      this._logger.logAlert('invalid_api_key_format', 'API key format is invalid. Expected format: rdk-... or alphanumeric token', {
        sdkVersion: VERSION,
      });
    }

    this._http = new AsyncHTTPClient({
      apiKey: this.apiKey,
      baseUrl: this.baseURL,
      timeout: this.timeout,
      streamTimeout: this.streamTimeout,
      maxRetries: this.maxRetries,
    });

    this.chat = new Chat(this._http);
    this.embeddings = new Embeddings(this._http);
    this.images = new Images(this._http);
    this.audio = new Audio(this._http);
    this.video = new Video();
  }

  get usage(): UsageStats {
    return this._usage;
  }

  get logger(): RodiumAILogger {
    return this._logger;
  }

  toJSON(): Record<string, unknown> {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      streamTimeout: this.streamTimeout,
      maxRetries: this.maxRetries,
      apiKey: '****',
    };
  }
}
