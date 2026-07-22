/**
 * API Route: POST /api/contact/unified
 * Formulaire de contact unifié du site public LinkMe.
 *
 * Toutes les demandes entrantes (créateur, pro, enseigne, fournisseur) passent
 * par ici. La notification se fait par email via Resend (actif si
 * RESEND_API_KEY présent).
 *
 * La réponse renvoie l'URL Calendly adaptée au type de profil (résolue côté
 * serveur depuis les variables d'environnement) pour la page de confirmation.
 *
 * NB : route NOUVELLE — la route email existante /api/contact/send n'est pas
 * modifiée (routes email = immuables, cf. CLAUDE.md).
 *
 * @module api/contact/unified
 * @since 2026-06-05 - LINKME-CONTACT-001
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';
import { z } from 'zod';

import {
  antiSpamSchemaShape,
  getClientIp,
  isLikelyBot,
  isRateLimited,
} from '@/lib/anti-spam';

const PROFILE_TYPES = ['createur', 'pro', 'enseigne', 'fournisseur'] as const;
const LOGISTICS_MODES = ['self', 'warehouse'] as const;

const unifiedContactSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').max(80),
    lastName: z.string().min(1, 'Nom requis').max(80),
    email: z.string().email('Email invalide'),
    phone: z.string().max(40).optional().or(z.literal('')),
    profileType: z.enum(PROFILE_TYPES),
    logisticsMode: z.enum(LOGISTICS_MODES).optional(),
    message: z.string().max(4000).optional().or(z.literal('')),
    ...antiSpamSchemaShape,
  })
  .refine(
    data => data.profileType !== 'fournisseur' || data.logisticsMode != null,
    {
      message: 'Mode logistique requis pour un fournisseur',
      path: ['logisticsMode'],
    }
  );

type UnifiedContactData = z.infer<typeof unifiedContactSchema>;

const PROFILE_LABELS: Record<(typeof PROFILE_TYPES)[number], string> = {
  createur: 'Ambassadeur créateur',
  pro: 'Professionnel prescripteur',
  enseigne: 'Enseigne / Réseau',
  fournisseur: 'Fournisseur',
};

const LOGISTICS_LABELS: Record<(typeof LOGISTICS_MODES)[number], string> = {
  self: 'Gère le stock et expédie directement à chaque commande',
  warehouse: 'Souhaite un stockage en entrepôt LinkMe',
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const CONTACT_EMAIL = process.env.LINKME_CONTACT_EMAIL ?? 'contact@verone.io';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@verone.io';

/**
 * Résout le lien Calendly adapté au profil (depuis les variables d'env).
 * Retourne null si non configuré → la page de confirmation affiche un fallback.
 */
function resolveCalendlyUrl(
  profileType: UnifiedContactData['profileType']
): string | null {
  switch (profileType) {
    case 'enseigne':
      return process.env.CALENDLY_URL_ENSEIGNE ?? null;
    case 'fournisseur':
      return process.env.CALENDLY_URL_FOURNISSEUR ?? null;
    case 'createur':
    case 'pro':
    default:
      return process.env.CALENDLY_URL_AMBASSADEUR ?? null;
  }
}

function generateEmailHtml(data: UnifiedContactData): string {
  const fullName = `${data.firstName} ${data.lastName}`;
  const logisticsRow =
    data.profileType === 'fournisseur' && data.logisticsMode
      ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Mode logistique</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${LOGISTICS_LABELS[data.logisticsMode]}</td>
      </tr>`
      : '';
  const phoneRow = data.phone
    ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Téléphone</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.phone}</td>
      </tr>`
    : '';
  const messageBlock = data.message
    ? `
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h3 style="color: #183559; margin-top: 0;">Message</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${data.message}</div>
  </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande LinkMe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #5DBEBB 0%, #7E84C0 100%); padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Nouvelle demande LinkMe — ${PROFILE_LABELS[data.profileType]}</h1>
  </div>
  <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #e5e7eb; border-top: none;${data.message ? '' : ' border-radius: 0 0 8px 8px;'}">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 35%;">Type de profil</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${PROFILE_LABELS[data.profileType]}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nom</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${fullName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="mailto:${data.email}" style="color: #5DBEBB;">${data.email}</a>
        </td>
      </tr>${phoneRow}${logisticsRow}
    </table>
  </div>${messageBlock}
  <div style="margin-top: 20px; padding: 15px; text-align: center; font-size: 12px; color: #999;">
    <p>Demande envoyée depuis le formulaire de contact LinkMe</p>
  </div>
</body>
</html>
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = unifiedContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const calendlyUrl = resolveCalendlyUrl(data.profileType);

    // Robot détecté : on renvoie un succès neutre sans envoyer d'email, pour ne
    // pas indiquer au spammeur quel garde-fou l'a arrêté.
    if (isLikelyBot(data)) {
      console.warn('[contact/unified] Soumission écartée (anti-spam)');
      return NextResponse.json({ success: true, calendlyUrl });
    }

    if (isRateLimited(getClientIp(request.headers))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Email (notif principale) — bloquant pour le statut de la requête.
    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [CONTACT_EMAIL],
        replyTo: data.email,
        subject: `[LinkMe] ${PROFILE_LABELS[data.profileType]} — ${data.firstName} ${data.lastName}`,
        html: generateEmailHtml(data),
      });

      if (error) {
        console.error('[contact/unified] Erreur Resend:', error);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }
    } else {
      console.warn('[contact/unified] Resend non configuré - email non envoyé');
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ success: true, calendlyUrl });
  } catch (error) {
    console.error('[contact/unified] Erreur API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
