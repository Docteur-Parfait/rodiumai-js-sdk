import nock from 'nock';
import { RodiumAI } from '../../src/index';

const API_BASE = 'https://api.rodiumai.io';

describe('Embeddings Integration', () => {
  let client: RodiumAI;

  beforeEach(() => {
    client = new RodiumAI({ apiKey: 'rdk-test-key', baseURL: `${API_BASE}/v1` });
  });

  it('POST /v1/embeddings returns embeddings', async () => {
    nock(API_BASE)
      .post('/v1/embeddings')
      .reply(200, {
        object: 'list',
        data: [{ object: 'embedding', index: 0, embedding: [0.1, 0.2, 0.3] }],
        model: 'auto',
        usage: { prompt_tokens: 5, total_tokens: 5 },
      });

    const response: any = await client.embeddings.create({
      model: 'auto',
      input: 'Hello',
    });

    expect(response.data.length).toBe(1);
    expect(response.data[0].embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('handles batch input', async () => {
    nock(API_BASE)
      .post('/v1/embeddings')
      .reply(200, {
        object: 'list',
        data: [
          { object: 'embedding', index: 0, embedding: [0.1] },
          { object: 'embedding', index: 1, embedding: [0.2] },
        ],
        model: 'auto',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });

    const response: any = await client.embeddings.create({
      model: 'auto',
      input: ['Hello', 'World'],
    });

    expect(response.data.length).toBe(2);
    expect(response.data[0].index).toBe(0);
    expect(response.data[1].index).toBe(1);
  });
});
