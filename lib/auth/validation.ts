/**
 * Authentication Validation Schemas
 *
 * This module provides Zod schemas for validating authentication-related inputs.
 * All schemas enforce security requirements from the specification.
 */

import { z } from 'zod';

/**
 * Password validation schema
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address').toLowerCase();

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters')
  .optional();

/**
 * Signup form validation schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Password reset request validation schema
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Password reset confirm validation schema
 */
export const resetPasswordConfirmSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;

/**
 * Update password validation schema
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * OAuth provider validation schema
 */
export const oauthProviderSchema = z.enum(['google', 'github']);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Helper function to format validation errors
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}
