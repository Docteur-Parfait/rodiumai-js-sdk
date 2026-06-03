import { AsyncHTTPClient } from '../_http.js';

export interface Delta {
  role?: string | null;
  content?: string | null;
}

export interface ChunkChoice {
  index: number;
  delta: Delta;
  finish_reason?: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChunkChoice[];
}

export interface Message {
  role: string;
  content: string | null;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason?: string | null;
}

export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage?: CompletionUsage | null;
}

interface ChatOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  timeout?: number;
}

export class Completions {
  private http: AsyncHTTPClient;

  constructor(http: AsyncHTTPClient) {
    this.http = http;
  }

  async create(opts: ChatOptions): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk>> {
    if (!opts.messages || opts.messages.length === 0) {
      throw new Error('messages must not be empty');
    }

    const body: Record<string, unknown> = {
      model: opts.model ?? 'auto',
      messages: opts.messages,
      stream: opts.stream ?? false,
    };

    if (opts.temperature !== undefined) {
      if (opts.temperature < 0 || opts.temperature > 2) {
        throw new Error('temperature must be between 0 and 2');
      }
      body.temperature = opts.temperature;
    }
    if (opts.max_tokens !== undefined) {
      if (opts.max_tokens <= 0) throw new Error('max_tokens must be greater than 0');
      body.max_tokens = opts.max_tokens;
    }
    if (opts.top_p !== undefined) body.top_p = opts.top_p;
    if (opts.stop !== undefined) body.stop = opts.stop;

    if (opts.stream) {
      return this.streamCreate(body, opts.timeout);
    }

    const { data } = await this.http.request({
      method: 'POST',
      path: '/chat/completions',
      body,
      timeout: opts.timeout,
    });

    const choices: Choice[] = (data.choices as any[] ?? []).map((c: any) => ({
      index: c.index ?? 0,
      message: {
        role: c.message?.role ?? '',
        content: c.message?.content ?? null,
      },
      finish_reason: c.finish_reason ?? null,
    }));

    const usageData = data.usage as Record<string, number> | undefined;
    const usage: CompletionUsage | undefined = usageData
      ? {
          prompt_tokens: usageData.prompt_tokens ?? 0,
          completion_tokens: usageData.completion_tokens ?? 0,
          total_tokens: usageData.total_tokens ?? 0,
        }
      : undefined;

    return {
      id: (data.id as string) ?? '',
      object: (data.object as string) ?? 'chat.completion',
      created: (data.created as number) ?? 0,
      model: (data.model as string) ?? (opts.model ?? 'auto'),
      choices,
      usage,
    };
  }

  private async *streamCreate(
    body: Record<string, unknown>,
    timeout?: number
  ): AsyncGenerator<ChatCompletionChunk> {
    const gen = this.http.stream('/chat/completions', body, timeout);
    for await (const chunk of gen) {
      const rawChoices = (chunk.choices as any[]) ?? [];
      if (rawChoices.length === 0) continue;
      const choices: ChunkChoice[] = rawChoices.map((c: any) => ({
        index: c.index ?? 0,
        delta: {
          role: c.delta?.role ?? null,
          content: c.delta?.content ?? null,
        },
        finish_reason: c.finish_reason ?? null,
      }));

      yield {
        id: (chunk.id as string) ?? '',
        object: (chunk.object as string) ?? 'chat.completion.chunk',
        created: (chunk.created as number) ?? 0,
        model: (chunk.model as string) ?? '',
        choices,
      };
    }
  }
}

export class Chat {
  public completions: Completions;

  constructor(http: AsyncHTTPClient) {
    this.completions = new Completions(http);
  }
}
