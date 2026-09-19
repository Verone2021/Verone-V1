import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { clientIpFromHeaders, createRateLimiter } from '@/lib/rate-limit';

/**
 * Formulaire public, sans connexion : 3 messages par quart d'heure et par
 * adresse suffisent largement à un visiteur de bonne foi, et coupent le
 * remplissage en boucle de la table `site_contact_messages`.
 */
const contactRateLimiter = createRateLimiter({
  limit: 3,
  windowMs: 15 * 60 * 1000,
});

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = clientIpFromHeaders(request.headers);
    const quota = contactRateLimiter.check(clientIp);

    if (!quota.allowed) {
      console.warn(`[Contact API] Trop de messages depuis ${clientIp}`);
      return NextResponse.json(
        {
          success: false,
          error:
            'Trop de messages envoyés en peu de temps. Merci de réessayer dans quelques minutes.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(quota.retryAfterSeconds) },
        }
      );
    }

    const body: unknown = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Insert into database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Contact API] Supabase not configured');
      return NextResponse.json(
        { success: false, error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase
      .from('site_contact_messages')
      .insert({ name, email, subject, message });

    if (insertError) {
      console.error('[Contact API] Insert failed:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Send confirmation email to the visitor (non-blocking)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
    void fetch(`${siteUrl}/api/emails/contact-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: name.split(' ')[0],
        subject,
      }),
    }).catch(emailError => {
      console.error('[Contact API] Confirmation email failed:', emailError);
    });

    // Notify the Vérone team by email (non-blocking)
    void fetch(`${siteUrl}/api/emails/contact-admin-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    }).catch(notifyError => {
      console.error('[Contact API] Admin notification failed:', notifyError);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact API] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
