/**
 * Auth Setup - Stub for CI/CD Console Error Check
 *
 * This module provides authentication helpers for Playwright-based console checks.
 * In CI environment without proper secrets, it gracefully skips authentication.
 *
 * @module auth-setup
 */

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Authenticate with Supabase
 * In CI without secrets, returns a mock session to allow tests to run unauthenticated
 */
export async function authenticateSupabase(): Promise<SupabaseSession> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // CI mode: skip auth if credentials missing
  if (!email || !password || !supabaseUrl || !supabaseKey) {
    console.warn('⚠️ SKIP auth: Missing credentials (CI mode without secrets)');
    console.warn('   Set TEST_USER_EMAIL, TEST_USER_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY');

    // Return mock session for unauthenticated testing
    return {
      access_token: 'ci-mock-token',
      refresh_token: 'ci-mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'ci-mock-user',
        email: 'ci@test.local',
      },
    };
  }

  try {
    // Real Supabase auth
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Supabase authentication successful');
    return data;
  } catch (error) {
    console.warn('⚠️ Auth failed, falling back to unauthenticated mode:', error);

    return {
      access_token: 'fallback-token',
      refresh_token: 'fallback-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'fallback-user',
        email: 'fallback@test.local',
      },
    };
  }
}

/**
 * Extract Supabase project ref from URL
 */
export function getSupabaseProjectRef(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // Extract project ref from URL: https://[project-ref].supabase.co
  const match = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback for CI without URL
  console.warn('⚠️ Could not extract project ref from SUPABASE_URL, using fallback');
  return 'unknown-project';
}
