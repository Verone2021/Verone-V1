#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE env vars');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const userId = 'b99f22c5-258a-47df-9f23-eb56d5711a86';
  const newPassword = 'TestLinkMe2025';

  console.log(`🔄 Resetting password for user ${userId}...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Password reset successfully!');
  console.log('📧 Email: test-org@verone.fr');
  console.log('🔑 Password: TestLinkMe2025');
}

resetPassword().catch(console.error);
