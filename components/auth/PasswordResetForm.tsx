/**
 * PasswordResetForm Component
 *
 * Form for requesting a password reset email.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { resetPasswordSchema } from '@/lib/auth/validation';

interface PasswordResetFormProps {
  onSuccess?: () => void;
}

export function PasswordResetForm({ onSuccess }: PasswordResetFormProps) {
  const { resetPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});
    setSuccess(false);

    // Validate input
    const result = resetPasswordSchema.safeParse({ email });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    // Request password reset
    await resetPassword(email);

    // Show success message
    setSuccess(true);

    if (onSuccess) {
      onSuccess();
    }
  };

  if (success) {
    return (
      <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
        <p className="font-medium">Check your email</p>
        <p className="mt-1">
          If an account exists with {email}, we&apos;ve sent a password reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(e); }} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="you@example.com"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
}
