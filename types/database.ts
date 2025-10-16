/**
 * Database type definitions
 *
 * These types are derived from the database schema and provide
 * full type safety for Supabase queries.
 *
 * Note: In production, these should be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          content: string;
          modality: string | null;
          body_part: string | null;
          tags: string[];
          is_default: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          content: string;
          modality?: string | null;
          body_part?: string | null;
          tags?: string[];
          is_default?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          content?: string;
          modality?: string | null;
          body_part?: string | null;
          tags?: string[];
          is_default?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'templates_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          scan_type: string;
          clinical_history: string | null;
          findings: string;
          comparison: string | null;
          mode: 'espresso' | 'slow_brewed';
          technique: string | null;
          report_findings: string | null;
          impression: string | null;
          clinical_advice: string | null;
          clinician_questions: string[] | null;
          differential_diagnosis: Json | null;
          generation_time_ms: number | null;
          model_used: string | null;
          tokens_used: number | null;
          cost_usd: string | null;
          status: 'draft' | 'final' | 'archived';
          created_at: string;
          updated_at: string;
          finalized_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          scan_type: string;
          clinical_history?: string | null;
          findings: string;
          comparison?: string | null;
          mode: 'espresso' | 'slow_brewed';
          technique?: string | null;
          report_findings?: string | null;
          impression?: string | null;
          clinical_advice?: string | null;
          clinician_questions?: string[] | null;
          differential_diagnosis?: Json | null;
          generation_time_ms?: number | null;
          model_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: string | null;
          status?: 'draft' | 'final' | 'archived';
          created_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          scan_type?: string;
          clinical_history?: string | null;
          findings?: string;
          comparison?: string | null;
          mode?: 'espresso' | 'slow_brewed';
          technique?: string | null;
          report_findings?: string | null;
          impression?: string | null;
          clinical_advice?: string | null;
          clinician_questions?: string[] | null;
          differential_diagnosis?: Json | null;
          generation_time_ms?: number | null;
          model_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: string | null;
          status?: 'draft' | 'final' | 'archived';
          created_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          },
        ];
      };
      audio_files: {
        Row: {
          id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          duration_seconds: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          duration_seconds?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          duration_seconds?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audio_files_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      transcriptions: {
        Row: {
          id: string;
          user_id: string;
          audio_file_id: string | null;
          transcript: string;
          model_used: string;
          confidence: string | null;
          duration_ms: number | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_file_id?: string | null;
          transcript: string;
          model_used: string;
          confidence?: string | null;
          duration_ms?: number | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_file_id?: string | null;
          transcript?: string;
          model_used?: string;
          confidence?: string | null;
          duration_ms?: number | null;
          language?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transcriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transcriptions_audio_file_id_fkey';
            columns: ['audio_file_id'];
            referencedRelation: 'audio_files';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: 'free' | 'professional' | 'practice' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          amount: number;
          currency: string;
          interval: 'month' | 'year';
          trial_start: string | null;
          trial_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: 'free' | 'professional' | 'practice' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          amount: number;
          currency?: string;
          interval: 'month' | 'year';
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          plan_name?: 'free' | 'professional' | 'practice' | 'enterprise';
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          amount?: number;
          currency?: string;
          interval?: 'month' | 'year';
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_records: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          report_id: string | null;
          usage_type: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity: number;
          billing_period_start: string;
          billing_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          report_id?: string | null;
          usage_type: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity?: number;
          billing_period_start: string;
          billing_period_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          report_id?: string | null;
          usage_type?: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity?: number;
          billing_period_start?: string;
          billing_period_end?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_records_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_records_subscription_id_fkey';
            columns: ['subscription_id'];
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_records_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_limits: {
        Row: {
          id: string;
          plan_name: string;
          reports_per_month: number;
          templates_limit: number | null;
          storage_gb: number | null;
          team_members: number;
          real_time_transcription: boolean;
          priority_support: boolean;
          custom_branding: boolean;
          api_access: boolean;
          slow_brewed_mode: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_name: string;
          reports_per_month: number;
          templates_limit?: number | null;
          storage_gb?: number | null;
          team_members?: number;
          real_time_transcription?: boolean;
          priority_support?: boolean;
          custom_branding?: boolean;
          api_access?: boolean;
          slow_brewed_mode?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_name?: string;
          reports_per_month?: number;
          templates_limit?: number | null;
          storage_gb?: number | null;
          team_members?: number;
          real_time_transcription?: boolean;
          priority_support?: boolean;
          custom_branding?: boolean;
          api_access?: boolean;
          slow_brewed_mode?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
