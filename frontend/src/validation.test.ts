import { describe, it, expect } from 'vitest';
import { loginSchema } from './utils/loginSchema';
import { signupSchema } from './utils/signupSchema';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid credentials', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'Password123!', rememberMe: false });
      expect(result.success).toBe(true);
    });
  });
});
