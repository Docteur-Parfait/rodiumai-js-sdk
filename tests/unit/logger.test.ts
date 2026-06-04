import { RodiumAILogger } from '../../src/logger';

describe('RodiumAILogger', () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('logs JSON formatted messages', () => {
    const logger = new RodiumAILogger('INFO');
    logger.info('test', { requestId: 'req-1' });
    const output = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(output.level).toBe('INFO');
    expect(output.message).toBe('test');
    expect(output.requestId).toBe('req-1');
  });

  it('respects log level filtering', () => {
    const logger = new RodiumAILogger('ERROR');
    logger.info('should not appear');
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('logs warnings for alerts', () => {
    const logger = new RodiumAILogger('WARNING');
    logger.logAlert('test_alert', 'something happened');
    const output = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(output.level).toBe('WARNING');
    expect(output.alertType).toBe('test_alert');
  });

  it('logRequest contains required fields', () => {
    const logger = new RodiumAILogger('INFO');
    logger.logRequest({
      requestId: 'req-1',
      model: 'auto',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      latencyMs: 342,
      status: 'success',
      httpStatus: 200,
      tokens: { prompt: 120, completion: 85, total: 205 },
    });
    const output = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(output.requestId).toBe('req-1');
    expect(output.httpStatus).toBe(200);
    expect(output.model).toBe('auto');
  });

  it('falls back to warning level when env invalid', () => {
    const prev = process.env.RODIUMAI_LOG_LEVEL;
    process.env.RODIUMAI_LOG_LEVEL = 'invalid';
    const logger = new RodiumAILogger();
    logger.warning('hello');
    expect(stderrSpy).toHaveBeenCalled();
    process.env.RODIUMAI_LOG_LEVEL = prev;
  });
});
