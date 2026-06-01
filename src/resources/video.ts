export class Generations {
  async create(_opts: {
    model?: string;
    prompt: string;
    duration?: number;
    resolution?: string;
    timeout?: number;
  }): Promise<never> {
    throw new Error(
      'Video generation is not yet available. ' +
      'We are working on it and it will be released soon. ' +
      'Follow https://docs.rodiumai.io/changelog for updates.'
    );
  }
}

export class Video {
  public generations: Generations;

  constructor() {
    this.generations = new Generations();
  }
}
