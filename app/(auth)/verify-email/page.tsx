/**
 * Verify Email Page
 *
 * Displayed after signup to inform user to check their email.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Verify Email | Radiology Reporting',
  description: 'Check your email to verify your account',
};

export default function VerifyEmailPage() {
  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Check your email
        </h2>

        <p className="mt-4 text-sm text-gray-600">
          We&apos;ve sent you a verification link. Click the link in the email to verify your
          account and complete your registration.
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Didn&apos;t receive the email?</strong>
            <br />
            Check your spam folder or wait a few minutes and try again.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
