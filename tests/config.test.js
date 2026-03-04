const config = require('../src/server/config');

describe('config', () => {
  test('has valid PORT', () => {
    expect(typeof config.PORT).toBe('number');
    expect(config.PORT).toBeGreaterThan(0);
  });

  test('has valid MAX_PARTICIPANTS', () => {
    expect(config.MAX_PARTICIPANTS).toBeGreaterThanOrEqual(2);
  });

  test('has valid ROOM_EXPIRY_MS', () => {
    expect(config.ROOM_EXPIRY_MS).toBeGreaterThan(0);
  });

  test('has valid RATE_LIMIT_WINDOW', () => {
    expect(config.RATE_LIMIT_WINDOW).toBeGreaterThan(0);
  });

  test('has valid RATE_LIMIT_MAX', () => {
    expect(config.RATE_LIMIT_MAX).toBeGreaterThan(0);
  });

  test('has valid CHAT_RATE_LIMIT_MAX', () => {
    expect(config.CHAT_RATE_LIMIT_MAX).toBeGreaterThan(0);
  });

  test('has DB_PATH defined', () => {
    expect(typeof config.DB_PATH).toBe('string');
    expect(config.DB_PATH.length).toBeGreaterThan(0);
  });

  test('has CORS_ORIGIN defined', () => {
    expect(typeof config.CORS_ORIGIN).toBe('string');
  });
});
