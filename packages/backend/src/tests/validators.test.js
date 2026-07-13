import { describe, it } from 'node:test';
import assert from 'node:assert';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidator.js';

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({ fullname: 'John Doe', email: 'john@example.com', password: 'secret123' });
    assert.strictEqual(result.success, true);
  });

  it('rejects short name', () => {
    const result = registerSchema.safeParse({ fullname: 'J', email: 'john@example.com', password: 'secret123' });
    assert.strictEqual(result.success, false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ fullname: 'John Doe', email: 'not-an-email', password: 'secret123' });
    assert.strictEqual(result.success, false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({ fullname: 'John Doe', email: 'john@example.com', password: '12345' });
    assert.strictEqual(result.success, false);
  });

  it('rejects missing fields', () => {
    const result = registerSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });
});

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ email: 'john@example.com', password: 'pass' });
    assert.strictEqual(result.success, true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'john@example.com', password: '' });
    assert.strictEqual(result.success, false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'pass' });
    assert.strictEqual(result.success, false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'john@example.com' });
    assert.strictEqual(result.success, true);
  });

  it('rejects missing email', () => {
    const result = forgotPasswordSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid input', () => {
    const result = resetPasswordSchema.safeParse({ token: 'abc123', password: 'newpass123' });
    assert.strictEqual(result.success, true);
  });

  it('rejects empty token', () => {
    const result = resetPasswordSchema.safeParse({ token: '', password: 'newpass123' });
    assert.strictEqual(result.success, false);
  });

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'abc123', password: '12345' });
    assert.strictEqual(result.success, false);
  });
});
