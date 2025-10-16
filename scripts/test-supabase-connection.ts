/**
 * Supabase Connection Test Script
 *
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    const supabase = createSupabaseAdminClient();

    // Test 1: Database connection
    console.log('Test 1: Database Connection');
    const { error: healthError } = await supabase
      .from('subscription_limits')
      .select('count')
      .limit(1);

    if (healthError) {
      throw healthError;
    }
    console.log('✅ Connection successful\n');

    // Test 2: Table verification
    console.log('Test 2: Table Verification');
    const tables = [
      'users',
      'templates',
      'reports',
      'audio_files',
      'transcriptions',
      'subscriptions',
      'usage_records',
      'subscription_limits',
    ] as const;

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
      console.log(`✅ ${table}`);
    }
    console.log('');

    // Test 3: Subscription limits seeded
    console.log('Test 3: Subscription Limits');
    const { data: limits, error: limitsError } = await supabase
      .from('subscription_limits')
      .select('*')
      .order('reports_per_month');

    if (limitsError) {
      throw limitsError;
    }
    if (!limits || limits.length !== 4) {
      throw new Error(`Expected 4 plans, found ${limits?.length || 0}`);
    }

    limits.forEach((plan) => {
      console.log(`✅ ${plan.plan_name}: ${plan.reports_per_month} reports/month`);
    });
    console.log('');

    // Test 4: RLS policies
    console.log('Test 4: RLS Policy Check');
    // Note: Admin client bypasses RLS, so we can't test enforcement here
    // RLS testing requires actual user sessions (tested in integration tests)
    console.log('⚠️  RLS enforcement requires user sessions (see integration tests)');
    console.log('');

    console.log('🎉 All connection tests passed!\n');
    console.log('Next steps:');
    console.log('1. Run integration tests with actual user sessions');
    console.log('2. Test RLS enforcement with non-admin clients');
    console.log('3. Verify data isolation between users\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

void testConnection();
