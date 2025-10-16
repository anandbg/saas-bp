import type { Database } from './database';

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type User = Tables<'users'>;
export type Template = Tables<'templates'>;
export type Report = Tables<'reports'>;
export type AudioFile = Tables<'audio_files'>;
export type Transcription = Tables<'transcriptions'>;
export type Subscription = Tables<'subscriptions'>;
export type UsageRecord = Tables<'usage_records'>;
export type SubscriptionLimits = Tables<'subscription_limits'>;

// Insert types
export type UserInsert = Inserts<'users'>;
export type TemplateInsert = Inserts<'templates'>;
export type ReportInsert = Inserts<'reports'>;

// Update types
export type UserUpdate = Updates<'users'>;
export type TemplateUpdate = Updates<'templates'>;
export type ReportUpdate = Updates<'reports'>;

// Enums
export type ReportMode = 'espresso' | 'slow_brewed';
export type ReportStatus = 'draft' | 'final' | 'archived';
export type PlanName = 'free' | 'professional' | 'practice' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'unpaid';
export type UsageType = 'report_generated' | 'transcription' | 'export' | 'api_call';

// Complex types
export interface DifferentialDiagnosis {
  diagnoses: Array<{
    name: string;
    probability: number;
    evidence: string[];
  }>;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    browser?: boolean;
  };
  defaultMode?: ReportMode;
  autoSave?: boolean;
}
