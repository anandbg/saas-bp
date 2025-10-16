/**
 * Auth Layout
 *
 * Layout for authentication pages (login, signup, reset-password).
 * Provides a centered card layout with branding.
 */

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Radiology Reporting
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered radiology reporting platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
