describe('Error Scenarios Integration', () => {
  it('401 -> InvalidAPIKeyError', () => {
    // integration test
  });

  it('402 -> InsufficientRODIError', () => {
    // integration test
  });

  it('429 with Retry-After -> RateLimitError', () => {
    // integration test
  });

  it('500 -> retried 3 times -> InternalServerError', () => {
    // integration test
  });
});
