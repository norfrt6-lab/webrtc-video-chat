const { escapeHtml, validatePayload, validateString } = require('../src/server/utils/sanitize');

describe('escapeHtml', () => {
  test('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  test('escapes backticks', () => {
    expect(escapeHtml('`template`')).toBe('&#96;template&#96;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  test('handles non-string input', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });

  test('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('validatePayload', () => {
  test('returns true when all required fields present', () => {
    expect(validatePayload({ a: 1, b: 'x' }, ['a', 'b'])).toBe(true);
  });

  test('returns false when a field is missing', () => {
    expect(validatePayload({ a: 1 }, ['a', 'b'])).toBe(false);
  });

  test('returns false when a field is null', () => {
    expect(validatePayload({ a: null }, ['a'])).toBe(false);
  });

  test('returns false when a field is undefined', () => {
    expect(validatePayload({ a: undefined }, ['a'])).toBe(false);
  });

  test('returns false for null data', () => {
    expect(validatePayload(null, ['a'])).toBe(false);
  });

  test('returns false for non-object data', () => {
    expect(validatePayload('string', ['a'])).toBe(false);
  });

  test('accepts zero and false as valid values', () => {
    expect(validatePayload({ a: 0, b: false }, ['a', 'b'])).toBe(true);
  });
});

describe('validateString', () => {
  test('returns true for valid string', () => {
    expect(validateString('hello')).toBe(true);
  });

  test('returns false for empty string', () => {
    expect(validateString('')).toBe(false);
  });

  test('returns false for non-string', () => {
    expect(validateString(42)).toBe(false);
    expect(validateString(null)).toBe(false);
  });

  test('returns false when exceeding max length', () => {
    expect(validateString('a'.repeat(256))).toBe(false);
  });

  test('respects custom max length', () => {
    expect(validateString('hello', 3)).toBe(false);
    expect(validateString('hi', 3)).toBe(true);
  });
});
