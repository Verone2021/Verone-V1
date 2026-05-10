/**
 * Meta Conversions API (CAPI) — server-side event sender.
 *
 * Doc officielle : https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Pourquoi ?
 *   Depuis iOS 14.5 et la limitation des cookies tiers, le Meta Pixel
 *   navigateur perd ~30-50% des events. CAPI envoie les events server-side
 *   et les déduplique côté Meta via `event_id` (commun entre browser + server).
 *   Brands mesurent +24% de conversions attribuees avec Pixel + CAPI combines
 *   (Meta data 2025).
 *
 * Variables d'environnement requises :
 *   - NEXT_PUBLIC_META_PIXEL_ID : ID du pixel/dataset (publique)
 *   - META_CAPI_ACCESS_TOKEN ou META_ACCESS_TOKEN : token d'acces serveur
 *     (secret). Le code utilise en priorite META_CAPI_ACCESS_TOKEN si defini,
 *     sinon fallback sur META_ACCESS_TOKEN (System User VeroneCatalog deja
 *     configure en Vercel). Doc Meta : "System User access token is the
 *     recommended method for Conversions API".
 *
 * Match keys hashees SHA-256 (sauf fbp / fbc qui sont en clair).
 */

import { createHash } from 'node:crypto';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
// Reuse System User token (META_ACCESS_TOKEN) si pas de token CAPI dedie.
// Le System User VeroneCatalog a "Controle total" sur l app/dataset, ce qui
// suffit pour soumettre des events CAPI.
const ACCESS_TOKEN =
  process.env.META_CAPI_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN;
const GRAPH_API_VERSION = 'v22.0';

export type MetaCapiEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'CompleteRegistration'
  | 'Lead';

export interface MetaCapiUserData {
  /** Cookie _fbp (en clair, pas hashe) */
  fbp?: string;
  /** Cookie _fbc ou fbclid query param (en clair) */
  fbc?: string;
  /** IP du client (en clair) */
  client_ip_address?: string;
  /** User-Agent (en clair) */
  client_user_agent?: string;
  /** Email (sera hashe SHA-256 si fourni) */
  email?: string;
  /** Telephone (sera hashe SHA-256 si fourni) */
  phone?: string;
  /** ID utilisateur Verone (sera hashe SHA-256 si fourni) */
  external_id?: string;
}

export interface MetaCapiCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  content_category?: string;
  num_items?: number;
  order_id?: string;
}

export interface SendMetaCapiEventInput {
  eventName: MetaCapiEventName;
  /** ID unique pour deduplication avec le Pixel browser. UUID v4 recommande. */
  eventId: string;
  /** URL de la page d'ou provient l'event (https://verone.fr/produits/x). */
  eventSourceUrl?: string;
  userData: MetaCapiUserData;
  customData?: MetaCapiCustomData;
  /** Code action source (recommande : 'website') */
  actionSource?: 'website' | 'app' | 'email' | 'physical_store';
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function buildUserData(
  input: MetaCapiUserData
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (input.email) out.em = [sha256(input.email)];
  if (input.phone) out.ph = [sha256(input.phone.replace(/\D/g, ''))];
  if (input.external_id) out.external_id = [sha256(input.external_id)];
  if (input.fbp) out.fbp = input.fbp;
  if (input.fbc) out.fbc = input.fbc;
  if (input.client_ip_address) out.client_ip_address = input.client_ip_address;
  if (input.client_user_agent) out.client_user_agent = input.client_user_agent;
  return out;
}

export interface SendMetaCapiEventResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

/**
 * Envoie un event CAPI server-side. Fire-and-forget : ne fait pas crasher
 * la requete utilisateur si Meta repond une erreur (just logs).
 */
export async function sendMetaCapiEvent(
  input: SendMetaCapiEventInput
): Promise<SendMetaCapiEventResult> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return {
      ok: false,
      status: 0,
      body: null,
      error:
        'NEXT_PUBLIC_META_PIXEL_ID ou META_CAPI_ACCESS_TOKEN/META_ACCESS_TOKEN manquant',
    };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`;
  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: input.actionSource ?? 'website',
        user_data: buildUserData(input.userData),
        custom_data: input.customData ?? {},
      },
    ],
    access_token: ACCESS_TOKEN,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as unknown;
    return {
      ok: res.ok,
      status: res.status,
      body: json,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
