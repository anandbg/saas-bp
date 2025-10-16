/**
 * AuthProvider Component
 *
 * Provides authentication context to the entire application.
 * Wraps the app and makes authentication state available to all components.
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextValue {
  // Session data
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;

  // State
  loading: boolean;
  isAuthenticated: boolean;

  // Methods
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 *
 * Provides authentication context to all child components.
 * Should be placed near the root of the application.
 *
 * @example
 * ```typescript
 * // app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const sessionData = useSession();
  const userData = useUser();

  const value: AuthContextValue = {
    session: sessionData.session,
    user: sessionData.user,
    profile: userData.profile,
    loading: sessionData.loading || userData.loading,
    isAuthenticated: sessionData.isAuthenticated,
    refreshSession: sessionData.refresh,
    refreshProfile: userData.refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuthContext hook
 *
 * Access authentication context from any component.
 * Must be used within an AuthProvider.
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```typescript
 * function UserMenu() {
 *   const { user, profile, isAuthenticated } = useAuthContext();
 *
 *   if (!isAuthenticated) {
 *     return <LoginButton />;
 *   }
 *
 *   return (
 *     <div>
 *       <img src={profile?.avatar_url} />
 *       <span>{profile?.name || user?.email}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
