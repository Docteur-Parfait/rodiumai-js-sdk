import {
  RodiumAIError,
  InvalidAPIKeyError,
  InsufficientRODIError,
  PermissionDeniedError,
  ModelNotFoundError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  TimeoutError,
  NetworkError,
  mapHttpStatus,
} from '../../src/errors';

describe('Error Hierarchy', () => {
  it('InvalidAPIKeyError has code 401', () => {
    const err = new InvalidAPIKeyError('req-1');
    expect(err.code).toBe(401);
    expect(err.fixSuggestion).toContain('rodiumai.io');
  });

  it('InsufficientRODIError has code 402', () => {
    const err = new InsufficientRODIError('req-2');
    expect(err.code).toBe(402);
  });

  it('PermissionDeniedError has code 403', () => {
    const err = new PermissionDeniedError('req-3');
    expect(err.code).toBe(403);
  });

  it('ModelNotFoundError has code 404', () => {
    const err = new ModelNotFoundError('req-4');
    expect(err.code).toBe(404);
  });

  it('RateLimitError has code 429 and retryAfter', () => {
    const err = new RateLimitError('req-5', 2.5);
    expect(err.code).toBe(429);
    expect(err.retryAfter).toBe(2.5);
  });

  it('InternalServerError has code 500', () => {
    const err = new InternalServerError('req-6');
    expect(err.code).toBe(500);
  });

  it('ServiceUnavailableError has code 503', () => {
    const err = new ServiceUnavailableError('req-7');
    expect(err.code).toBe(503);
  });

  it('TimeoutError has code 408 and elapsed', () => {
    const err = new TimeoutError(30.5, 'req-8');
    expect(err.code).toBe(408);
    expect(err.elapsed).toBe(30.5);
  });

  it('NetworkError has code 0', () => {
    const err = new NetworkError();
    expect(err.code).toBe(0);
  });

  it('all errors extend RodiumAIError', () => {
    const errors = [
      new InvalidAPIKeyError(),
      new InsufficientRODIError(),
      new PermissionDeniedError(),
      new ModelNotFoundError(),
      new RateLimitError(),
      new InternalServerError(),
      new ServiceUnavailableError(),
      new TimeoutError(1),
      new NetworkError(),
    ];
    errors.forEach((e) => expect(e).toBeInstanceOf(RodiumAIError));
  });

  it('mapHttpStatus returns correct error types', () => {
    expect(mapHttpStatus(401)).toBeInstanceOf(InvalidAPIKeyError);
    expect(mapHttpStatus(402)).toBeInstanceOf(InsufficientRODIError);
    expect(mapHttpStatus(403)).toBeInstanceOf(PermissionDeniedError);
    expect(mapHttpStatus(404)).toBeInstanceOf(ModelNotFoundError);
    expect(mapHttpStatus(429)).toBeInstanceOf(RateLimitError);
    expect(mapHttpStatus(500)).toBeInstanceOf(InternalServerError);
    expect(mapHttpStatus(503)).toBeInstanceOf(ServiceUnavailableError);
  });

  it('mapHttpStatus returns base error for unknown codes', () => {
    expect(mapHttpStatus(418)).toBeInstanceOf(RodiumAIError);
  });
});
