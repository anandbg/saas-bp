/**
 * Login Page
 *
 * User login with email/password or OAuth (Google/GitHub).
 */

import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata = {
  title: 'Log in | Radiology Reporting',
  description: 'Log in to your account',
};

export default function LoginPage() {
  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Log in to your account
      </h2>

      <LoginForm />

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <OAuthButtons />
        </div>
      </div>

      <div className="mt-6 text-center text-sm">
        <Link
          href="/reset-password"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Forgot your password?
        </Link>
      </div>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Don&apos;t have an account? </span>
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
