/**
 * Channel IDs — UUIDs stables des canaux de vente Verone.
 *
 * Source de vérité : table `sales_channels` (column `code` immuable).
 * Hardcoded ici parce que ces UUIDs sont référencés en clair dans le code
 * (constantes business, pas dynamique). Si un nouveau canal est ajouté,
 * mettre à jour cette constante manuellement après insertion en DB.
 *
 * Voir : docs/current/INDEX-CANAUX-VENTE.md
 *        docs/current/canaux-vente-publication-rules.md
 */

export const CHANNEL_IDS = {
  site_internet: '0c2639e9-df80-41fa-84d0-9da96a128f7f',
  google_merchant: 'd3d2b018-dfee-41c1-a955-f0690320afec',
  linkme: '93c68db1-5a30-4168-89ec-6383152be405',
  manuel: '1c5a0b39-b8b7-4c8b-bffd-fc0482d329c6',
  meta_commerce: '09d93a0c-a71b-42e2-81df-303752bde932',
} as const;

export type ChannelCode = keyof typeof CHANNEL_IDS;
export type ChannelId = (typeof CHANNEL_IDS)[ChannelCode];

/**
 * Channels qui dépendent du Site Internet pour pouvoir être publiés.
 * Voir règle cascade dans `docs/current/canaux-vente-publication-rules.md`.
 */
export const CHANNELS_DEPENDENT_ON_SITE: readonly ChannelCode[] = [
  'google_merchant',
  'meta_commerce',
] as const;
