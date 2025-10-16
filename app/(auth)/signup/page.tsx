/**
 * Signup Page
 *
 * User registration with email/password or OAuth (Google/GitHub).
 */

import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata = {
  title: 'Sign up | Radiology Reporting',
  description: 'Create your account',
};

export default function SignupPage() {
  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Create your account
      </h2>

      <SignupForm />

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
        <span className="text-gray-600">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Log in
        </Link>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-blue-600 hover:text-blue-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
