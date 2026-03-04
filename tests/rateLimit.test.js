const { checkRateLimit, clearRateLimit, cleanupStaleLimits } = require('../src/server/middleware/rateLimit');

describe('checkRateLimit', () => {
  afterEach(() => {
    clearRateLimit('test-socket');
    clearRateLimit('socket-a');
    clearRateLimit('socket-b');
  });

  test('allows requests within limit', () => {
    expect(checkRateLimit('test-socket', 'general')).toBe(true);
  });

  test('blocks after exceeding general limit', () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit('test-socket', 'general');
    }
    expect(checkRateLimit('test-socket', 'general')).toBe(false);
  });

  test('blocks after exceeding chat limit', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-socket', 'chat');
    }
    expect(checkRateLimit('test-socket', 'chat')).toBe(false);
  });

  test('chat and general limits are independent', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-socket', 'chat');
    }
    // Chat is exhausted but general should still work
    expect(checkRateLimit('test-socket', 'general')).toBe(true);
  });

  test('different sockets have independent limits', () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit('socket-a', 'general');
    }
    expect(checkRateLimit('socket-a', 'general')).toBe(false);
    expect(checkRateLimit('socket-b', 'general')).toBe(true);
  });
});

describe('clearRateLimit', () => {
  test('resets limits for a socket', () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit('test-socket', 'general');
    }
    expect(checkRateLimit('test-socket', 'general')).toBe(false);

    clearRateLimit('test-socket');
    expect(checkRateLimit('test-socket', 'general')).toBe(true);
  });
});

describe('cleanupStaleLimits', () => {
  test('does not throw on empty state', () => {
    expect(() => cleanupStaleLimits()).not.toThrow();
  });
});
