/**
 * Database Module - Central export for all database functionality
 */

// Clients
export { createSupabaseServerClient, createSupabaseAdminClient } from './supabase-server';
export { createSupabaseBrowserClient } from './supabase-browser';
export { createSupabaseMiddlewareClient } from './supabase-middleware';

// Helpers
export {
  // User operations
  getUserProfile,
  getUserByEmail,
  updateUserProfile,

  // Subscription operations
  getActiveSubscription,
  getUserSubscription,
  getSubscriptionLimits,
  getAllPlans,

  // Usage tracking
  getCurrentUsage,
  recordUsage,
  checkUsageLimit,

  // Template operations
  getDefaultTemplate,
  getUserTemplates,
} from './helpers';

// Types
export type { Database } from '@/types/database';
export type {
  User,
  Template,
  Report,
  AudioFile,
  Transcription,
  Subscription,
  UsageRecord,
  SubscriptionLimits,
  UserInsert,
  TemplateInsert,
  ReportInsert,
  UserUpdate,
  TemplateUpdate,
  ReportUpdate,
  ReportMode,
  ReportStatus,
  PlanName,
  SubscriptionStatus,
  UsageType,
  DifferentialDiagnosis,
  UserPreferences,
} from '@/types/supabase';
