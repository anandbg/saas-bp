/**
 * Reset Password Page
 *
 * Allows users to request a password reset email.
 */

import Link from 'next/link';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

export const metadata = {
  title: 'Reset Password | Radiology Reporting',
  description: 'Reset your password',
};

export default function ResetPasswordPage() {
  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Reset your password
      </h2>

      <PasswordResetForm />

      <div className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Back to log in
        </Link>
      </div>
    </div>
  );
}
