import { AsyncHTTPClient } from '../_http.js';

export interface Transcription {
  text: string;
}

export interface SpeechResponse {
  content: ArrayBuffer;
  contentType: string;
}

export class Transcriptions {
  private http: AsyncHTTPClient;

  constructor(http: AsyncHTTPClient) {
    this.http = http;
  }

  async create({
    model = 'auto',
    file,
    language,
    timeout,
  }: {
    model?: string;
    file: Buffer | Blob;
    language?: string;
    timeout?: number;
  }): Promise<Transcription> {
    const body: Record<string, unknown> = { model };
    if (language !== undefined) body.language = language;

    const { data } = await this.http.request({
      method: 'POST',
      path: '/audio/transcriptions',
      body,
      files: { file: file as any },
      timeout,
    });

    return { text: (data.text as string) ?? '' };
  }
}

export class Speech {
  private http: AsyncHTTPClient;

  constructor(http: AsyncHTTPClient) {
    this.http = http;
  }

  async create({
    model = 'auto',
    input,
    voice = 'alloy',
    response_format,
    speed,
    timeout,
  }: {
    model?: string;
    input: string;
    voice?: string;
    response_format?: string;
    speed?: number;
    timeout?: number;
  }): Promise<SpeechResponse> {
    const body: Record<string, unknown> = { model, input, voice };
    if (response_format !== undefined) body.response_format = response_format;
    if (speed !== undefined) body.speed = speed;

    const { data } = await this.http.request({
      method: 'POST',
      path: '/audio/speech',
      body,
      timeout,
    });

    const content = data.content
      ? new TextEncoder().encode(data.content as string).buffer
      : new ArrayBuffer(0);

    return {
      content,
      contentType: (data.content_type as string) ?? 'audio/mpeg',
    };
  }
}

export class Audio {
  public transcriptions: Transcriptions;
  public speech: Speech;

  constructor(http: AsyncHTTPClient) {
    this.transcriptions = new Transcriptions(http);
    this.speech = new Speech(http);
  }
}
