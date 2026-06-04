import { RodiumAI, InvalidAPIKeyError } from '../../src/index';

describe('RodiumAI', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('creates client with api key from env var', () => {
    process.env.RODIUMAI_API_KEY = 'rdk-test-key';
    const client = new RodiumAI();
    expect(client).toBeDefined();
  });

  it('creates client with api key passed directly', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test-key' });
    expect(client).toBeDefined();
  });

  it('throws InvalidAPIKeyError when key is missing', () => {
    delete process.env.RODIUMAI_API_KEY;
    expect(() => new RodiumAI()).toThrow(InvalidAPIKeyError);
  });

  it('throws on http:// URL', () => {
    expect(() => {
      new RodiumAI({ apiKey: 'rdk-test', baseURL: 'http://api.rodiumai.io/v1' });
    }).toThrow('HTTPS is required');
  });

  it('accepts custom timeout', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test', timeout: 60_000 });
    expect(client).toBeDefined();
  });

  it('accepts custom base URL', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test', baseURL: 'https://custom.rodiumai.io/v1' });
    expect(client).toBeDefined();
  });

  it('initializes all resources', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test' });
    expect(client.chat).toBeDefined();
    expect(client.embeddings).toBeDefined();
    expect(client.images).toBeDefined();
    expect(client.audio).toBeDefined();
    expect(client.video).toBeDefined();
  });

  it('has usage stats property', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test' });
    expect(client.usage.totalRequests).toBe(0);
  });

  it('has logger property', () => {
    const client = new RodiumAI({ apiKey: 'rdk-test' });
    expect(client.logger).toBeDefined();
  });
});
