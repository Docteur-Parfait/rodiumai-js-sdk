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
    this.apiKey = opts.apiKey ?? (typeof process !== 'undefined' ? process.env.RODIUMAI_API_KEY : '') ?? '';
    this.baseURL = opts.baseURL ?? 'https://api.rodiumai.io/v1';
    this.timeout = opts.timeout ?? 30_000;
    this.streamTimeout = opts.streamTimeout ?? 600_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.logLevel = opts.logLevel;

    if (!this.apiKey) {
      throw new InvalidAPIKeyError();
    }

    this._logger = new RodiumAILogger(this.logLevel);
    this._usage = new UsageStats();

    if (!this.apiKey.startsWith('rdk-')) {
      this._logger.logAlert('invalid_api_key_format', 'API key format is invalid. Expected format: rdk-...', {
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
}
