/**
 * Unit tests for authentication validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  emailSchema,
  signupSchema,
  loginSchema,
  resetPasswordSchema,
} from '@/lib/auth/validation';

describe('passwordSchema', () => {
  it('should accept valid password', () => {
    const result = passwordSchema.safeParse('SecurePass123!');
    expect(result.success).toBe(true);
  });

  it('should reject password without uppercase', () => {
    const result = passwordSchema.safeParse('securepass123!');
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = passwordSchema.safeParse('SECUREPASS123!');
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = passwordSchema.safeParse('SecurePass!');
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = passwordSchema.safeParse('SecurePass123');
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Pass1!');
    expect(result.success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('should accept valid email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
  });

  it('should convert email to lowercase', () => {
    const result = emailSchema.safeParse('User@Example.Com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('should reject invalid email format', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('should reject email without domain', () => {
    const result = emailSchema.safeParse('user@');
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('should accept valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('should accept signup without name', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject signup with invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'invalid-email',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject signup with weak password', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any-password',
    });
    expect(result.success).toBe(true);
  });

  it('should reject login without email', () => {
    const result = loginSchema.safeParse({
      password: 'any-password',
    });
    expect(result.success).toBe(false);
  });

  it('should reject login without password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
