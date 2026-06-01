import { RodiumAI } from '../../src/index';

describe('Security', () => {
  it('http:// URL throws error', () => {
    expect(() => {
      new RodiumAI({ apiKey: 'rdk-test', baseURL: 'http://api.rodiumai.io/v1' });
    }).toThrow('HTTPS is required');
  });

  it('https:// URL accepted', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test', baseURL: 'https://api.rodiumai.io/v1' });
    expect(client).toBeDefined();
  });
});
