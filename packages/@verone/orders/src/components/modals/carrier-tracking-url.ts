/**
 * Construit l'URL publique de suivi d'un colis à partir du transporteur
 * et du numéro de tracking, quand `tracking_url` n'est pas disponible
 * en DB (ex : webhook Packlink pas encore arrivé).
 *
 * On préfère toujours `tracking_url` venant de Packlink (qui peut être
 * une page de tracking unifiée Packlink). Cette fonction sert de filet
 * de sécurité pour les cas où l'URL n'a pas pu être récupérée.
 */
export function buildCarrierTrackingUrl(
  carrierName: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  if (!carrierName || !trackingNumber) return null;
  const carrier = carrierName.toLowerCase();
  const tn = encodeURIComponent(trackingNumber);

  if (carrier.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${tn}`;
  }
  if (carrier.includes('dpd')) {
    return `https://www.dpd.fr/trace/${tn}`;
  }
  if (carrier.includes('chrono')) {
    return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${tn}`;
  }
  if (carrier.includes('colissimo') || carrier.includes('la poste')) {
    return `https://www.laposte.fr/outils/suivre-vos-envois?code=${tn}`;
  }
  if (carrier.includes('mondial') || carrier.includes('relais')) {
    return `https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=${tn}`;
  }
  if (carrier.includes('dhl')) {
    return `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${tn}`;
  }
  if (carrier.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${tn}`;
  }
  if (carrier.includes('gls')) {
    return `https://gls-group.eu/FR/fr/suivi-colis?match=${tn}`;
  }
  if (carrier.includes('tnt')) {
    return `https://www.tnt.com/express/fr_fr/site/shipping-tools/tracking.html?searchType=con&cons=${tn}`;
  }
  return null;
}

/**
 * Retourne l'URL de tracking effective : `tracking_url` si présent,
 * sinon URL construite depuis le carrier+numéro, sinon null.
 */
export function resolveTrackingUrl(
  trackingUrl: string | null | undefined,
  carrierName: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  if (trackingUrl) return trackingUrl;
  return buildCarrierTrackingUrl(carrierName, trackingNumber);
}
