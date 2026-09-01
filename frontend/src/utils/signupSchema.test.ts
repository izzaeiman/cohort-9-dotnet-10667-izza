import { describe, it, expect } from 'vitest';
import { signupSchema } from './signupSchema';

describe('signupSchema', () => {
  it('validates correct signup data', () => {
    const validData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeToTerms: true,
    };
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects password mismatch', () => {
    const invalidData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!',
      agreeToTerms: true,
    };
    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
