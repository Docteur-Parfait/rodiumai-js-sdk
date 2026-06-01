import { Generations } from '../../../src/resources/video';

describe('Video', () => {
  it('stub throws NotImplementedError', async () => {
    const gen = new Generations();
    await expect(gen.create({ prompt: 'test' })).rejects.toThrow('not yet available');
  });
});
