import { Completions } from '../../../src/resources/chat';

describe('Chat', () => {
  it('throws on empty messages', async () => {
    const completions = new Completions(null as any);
    await expect(
      (completions.create as any)({ messages: [] })
    ).rejects.toThrow('messages must not be empty');
  });

  it('throws on temperature out of range', async () => {
    const completions = new Completions(null as any);
    await expect(
      (completions.create as any)({ messages: [{ role: 'user', content: 'hi' }], temperature: 3 })
    ).rejects.toThrow('temperature must be between 0 and 2');
  });

  it('throws on negative temperature', async () => {
    const completions = new Completions(null as any);
    await expect(
      (completions.create as any)({ messages: [{ role: 'user', content: 'hi' }], temperature: -1 })
    ).rejects.toThrow('temperature must be between 0 and 2');
  });
});
