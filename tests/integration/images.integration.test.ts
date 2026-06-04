import nock from 'nock';
import { RodiumAI } from '../../src/index';

const API_BASE = 'https://api.rodiumai.io';

describe('Images Integration', () => {
  let client: RodiumAI;

  beforeEach(() => {
    client = new RodiumAI({ apiKey: 'rdk-test-key', baseURL: `${API_BASE}/v1` });
  });

  it('POST /v1/images/generations returns image', async () => {
    nock(API_BASE)
      .post('/v1/images/generations')
      .reply(200, {
        created: 1715000000,
        data: [{ url: 'https://api.rodiumai.io/images/generated.png' }],
      });

    const response: any = await client.images.generate({
      model: 'auto',
      prompt: 'A sunset',
      n: 1,
      size: '1024x1024',
    });

    expect(response.created).toBeGreaterThan(0);
    expect(response.data[0].url).toContain('generated');
  });
});
