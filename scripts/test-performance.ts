/**
 * Database Performance Test
 *
 * Run with: npx tsx scripts/test-performance.ts
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testPerformance() {
  console.log('⚡ Testing Database Performance...\n');

  const supabase = createSupabaseAdminClient();

  // Test 1: Connection latency
  console.log('Test 1: Connection Latency');
  const iterations = 10;
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await supabase.from('subscription_limits').select('count').limit(1);
    const latency = Date.now() - start;
    latencies.push(latency);
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  console.log(`Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`Min: ${minLatency}ms`);
  console.log(`Max: ${maxLatency}ms`);

  if (avgLatency < 100) {
    console.log('✅ Latency within acceptable range (<100ms)\n');
  } else {
    console.log('⚠️  High latency detected (>100ms)\n');
  }

  // Test 2: Query performance with indexes
  console.log('Test 2: Indexed Query Performance');
  const start = Date.now();
  await supabase.from('subscription_limits').select('*').eq('plan_name', 'professional');
  const queryTime = Date.now() - start;

  console.log(`Query time: ${queryTime}ms`);
  if (queryTime < 50) {
    console.log('✅ Indexed query is fast (<50ms)\n');
  } else {
    console.log('⚠️  Slow query detected (>50ms)\n');
  }

  console.log('🎉 Performance tests complete!\n');
}

void testPerformance();
