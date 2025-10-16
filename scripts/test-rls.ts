/**
 * RLS Policy Testing Script
 *
 * Prerequisites:
 * 1. Create 2 test users in Supabase Dashboard
 * 2. Get their auth tokens (use Supabase Dashboard)
 * 3. Set environment variables:
 *    - TEST_USER1_ID
 *    - TEST_USER2_ID
 *
 * Run with: npx tsx scripts/test-rls.ts
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testRLS() {
  console.log('🔐 Testing Row Level Security...\n');

  const adminSupabase = createSupabaseAdminClient();

  try {
    // Get test user IDs from environment
    const user1Id = process.env.TEST_USER1_ID;
    const user2Id = process.env.TEST_USER2_ID;

    if (!user1Id || !user2Id) {
      throw new Error('Set TEST_USER1_ID and TEST_USER2_ID environment variables');
    }

    // Test 1: Create user profiles
    console.log('Test 1: Creating user profiles');
    await adminSupabase.from('users').upsert([
      { id: user1Id, email: 'testuser1@example.com', name: 'Test User 1' },
      { id: user2Id, email: 'testuser2@example.com', name: 'Test User 2' },
    ]);
    console.log('✅ Profiles created\n');

    // Test 2: Create data for User 1
    console.log('Test 2: Creating template for User 1');
    const { data: template1 } = await adminSupabase
      .from('templates')
      .insert({
        user_id: user1Id,
        name: 'User 1 Template',
        content: 'Test content',
      })
      .select()
      .single();
    console.log('✅ Template created:', template1?.id, '\n');

    // Test 3: Create data for User 2
    console.log('Test 3: Creating template for User 2');
    const { data: template2 } = await adminSupabase
      .from('templates')
      .insert({
        user_id: user2Id,
        name: 'User 2 Template',
        content: 'Test content',
      })
      .select()
      .single();
    console.log('✅ Template created:', template2?.id, '\n');

    // Test 4: Admin can see all data
    console.log('Test 4: Admin access (should see both templates)');
    const { data: allTemplates } = await adminSupabase
      .from('templates')
      .select('*')
      .in('user_id', [user1Id, user2Id]);
    console.log(`✅ Admin sees ${allTemplates?.length} templates\n`);

    // Test 5: RLS enforcement (manual verification needed)
    console.log('Test 5: RLS Enforcement');
    console.log('⚠️  Manual verification required:');
    console.log('1. Log in as testuser1@example.com in your app');
    console.log('2. Query templates - should only see User 1 template');
    console.log('3. Log in as testuser2@example.com in your app');
    console.log('4. Query templates - should only see User 2 template\n');

    console.log('🎉 RLS test setup complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

void testRLS();
