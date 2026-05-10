/**
 * Client-side helper pour mirrorer un event Pixel browser vers le CAPI
 * server-side (route /api/marketing/capi/event).
 *
 * Utilisation : appele depuis les helpers track*() de MetaPixel.tsx, en
 * fire-and-forget (pas d'attente, pas de blocage UI).
 */

export type CapiEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'CompleteRegistration'
  | 'Lead';

export interface CapiCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  content_category?: string;
  num_items?: number;
  order_id?: string;
}

export interface CapiUserData {
  email?: string;
  phone?: string;
  external_id?: string;
}

interface CapiClientPayload {
  eventName: CapiEventName;
  eventId: string;
  customData?: CapiCustomData;
  userData?: CapiUserData;
}

export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // fallback simple
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sendCapiEvent(payload: CapiClientPayload): void {
  if (typeof window === 'undefined') return;

  // Fire-and-forget : on ne bloque jamais l'UI sur le retour CAPI.
  void fetch('/api/marketing/capi/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      eventSourceUrl: window.location.href,
    }),
    keepalive: true, // permet l'envoi même si la page se ferme (Purchase)
  }).catch(err => {
    console.warn('[meta-capi-client] forward failed:', err);
  });
}
