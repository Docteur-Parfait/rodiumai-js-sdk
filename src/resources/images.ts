import { AsyncHTTPClient } from '../_http.js';

export interface ImageData {
  url?: string | null;
  b64_json?: string | null;
}

export interface ImagesResponse {
  created: number;
  data: ImageData[];
}

export class Images {
  private http: AsyncHTTPClient;

  constructor(http: AsyncHTTPClient) {
    this.http = http;
  }

  async generate({
    model = 'auto',
    prompt,
    n = 1,
    size = '1024x1024',
    quality,
    timeout,
  }: {
    model?: string;
    prompt: string;
    n?: number;
    size?: string;
    quality?: string;
    timeout?: number;
  }): Promise<ImagesResponse> {
    const body: Record<string, unknown> = { model, prompt, n, size };
    if (quality !== undefined) body.quality = quality;

    const { data } = await this.http.request({
      method: 'POST',
      path: '/images/generations',
      body,
      timeout,
    });

    const images: ImageData[] = ((data.data ?? []) as any[]).map((item: any) => ({
      url: item.url ?? null,
      b64_json: item.b64_json ?? null,
    }));

    return {
      created: (data.created as number) ?? 0,
      data: images,
    };
  }
}
