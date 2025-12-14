import { z } from 'zod';

/**
 * Schema for sign in form
 */
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Schema for sign up form
 */
export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Schema for password reset form
 */
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
