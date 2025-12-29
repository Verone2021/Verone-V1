/**
 * 🔐 Authentication Setup - Supabase API-based Auth
 *
 * Pattern 2025 : Authentification via REST API Supabase
 * Plus rapide et fiable que UI-based login
 *
 * Best Practices :
 * - AWS Amplify, Vercel, Netflix pattern
 * - 10x plus rapide que UI login
 * - Pas de flakiness sélecteurs UI
 *
 * @author Vérone Back Office Team
 * @date 2025-11-09
 */

import { request } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Charger variables env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: any;
}

/**
 * Authentifie via API REST Supabase et retourne session
 */
export async function authenticateSupabase(): Promise<SupabaseSession> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const testEmail = process.env.TEST_USER_EMAIL || 'veronebyromeo@gmail.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'Abc123456';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis dans .env.local'
    );
  }

  console.log(`🔐 Authenticating with Supabase (${testEmail})...`);

  const requestContext = await request.newContext();

  try {
    const response = await requestContext.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        data: {
          email: testEmail,
          password: testPassword,
        },
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Auth failed (${response.status()}): ${errorBody}`);
    }

    const session = await response.json();
    console.log('✅ Authentication successful');

    return session;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw error;
  } finally {
    await requestContext.dispose();
  }
}

/**
 * Extrait project ref depuis URL Supabase
 * Ex: https://aorroydfjsrygmosnzrl.supabase.co → aorroydfjsrygmosnzrl
 */
export function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local');

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error('Format URL Supabase invalide');

  return match[1];
}
