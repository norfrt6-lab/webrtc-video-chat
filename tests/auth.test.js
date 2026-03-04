const { verifyRoomPassword, hashPassword } = require('../src/server/middleware/auth');

describe('hashPassword', () => {
  test('returns a bcrypt hash', () => {
    const hash = hashPassword('test123');
    expect(hash).toBeTruthy();
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  test('produces different hashes for same password', () => {
    const hash1 = hashPassword('test123');
    const hash2 = hashPassword('test123');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyRoomPassword', () => {
  test('returns true when room has no password', () => {
    const room = { passwordHash: null };
    expect(verifyRoomPassword(room, null)).toBe(true);
  });

  test('returns true for correct password', () => {
    const hash = hashPassword('secret');
    const room = { passwordHash: hash };
    expect(verifyRoomPassword(room, 'secret')).toBe(true);
  });

  test('returns false for wrong password', () => {
    const hash = hashPassword('secret');
    const room = { passwordHash: hash };
    expect(verifyRoomPassword(room, 'wrong')).toBe(false);
  });

  test('returns false when password is empty', () => {
    const hash = hashPassword('secret');
    const room = { passwordHash: hash };
    expect(verifyRoomPassword(room, '')).toBe(false);
  });

  test('returns false when password is null', () => {
    const hash = hashPassword('secret');
    const room = { passwordHash: hash };
    expect(verifyRoomPassword(room, null)).toBe(false);
  });
});
