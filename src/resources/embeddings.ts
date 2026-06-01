import { AsyncHTTPClient } from '../_http.js';

export interface EmbeddingObject {
  object: string;
  index: number;
  embedding: number[];
}

export interface EmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface EmbeddingsResponse {
  object: string;
  data: EmbeddingObject[];
  model: string;
  usage?: EmbeddingUsage | null;
}

export class Embeddings {
  private http: AsyncHTTPClient;

  constructor(http: AsyncHTTPClient) {
    this.http = http;
  }

  async create({
    model = 'auto',
    input,
    timeout,
  }: {
    model?: string;
    input: string | string[];
    timeout?: number;
  }): Promise<EmbeddingsResponse> {
    const { data } = await this.http.request({
      method: 'POST',
      path: '/embeddings',
      body: { model, input },
      timeout,
    });

    const embeddings: EmbeddingObject[] = ((data.data ?? []) as any[]).map((item: any) => ({
      object: item.object ?? 'embedding',
      index: item.index ?? 0,
      embedding: item.embedding ?? [],
    }));

    const usageData = data.usage as Record<string, number> | undefined;
    const usage: EmbeddingUsage | undefined = usageData
      ? {
          prompt_tokens: usageData.prompt_tokens ?? 0,
          total_tokens: usageData.total_tokens ?? 0,
        }
      : undefined;

    return {
      object: (data.object as string) ?? 'list',
      data: embeddings,
      model: (data.model as string) ?? model,
      usage,
    };
  }
}
