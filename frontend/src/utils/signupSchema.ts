import { z } from 'zod';

export const USER_ROLES = ['Regular User', 'Administrator'] as const;

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(10, 'Password must be at least 10 characters')
      .regex(/^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{10,}$/, 'Password must contain at least one number and one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
