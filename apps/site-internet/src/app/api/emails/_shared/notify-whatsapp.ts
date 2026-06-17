/**
 * Notification WhatsApp (Vérone) via WhatsApp Business Cloud API.
 *
 * En veille tant que les variables WHATSAPP_* ne sont pas configurées : si l'une
 * manque, la fonction ne fait rien. Elle ne lève JAMAIS — un échec est loggé,
 * l'email reste la notification principale. Le même numéro/compte Meta que LinkMe
 * est utilisé (la config Meta est partagée).
 *
 * Calqué sur `notifyWhatsApp()` de LinkMe
 * (apps/linkme/src/app/api/contact/unified/route.ts).
 *
 * @module api/emails/_shared/notify-whatsapp
 */

export interface WhatsAppContactNotification {
  subjectLabel: string;
  name: string;
  email: string;
}

/**
 * Envoie une notification WhatsApp à Roméo pour un nouveau message de contact.
 * No-op silencieux si les variables d'env WhatsApp ne sont pas configurées.
 */
export async function notifyContactWhatsApp(
  data: WhatsAppContactNotification
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const toNumber = process.env.WHATSAPP_TO_NUMBER;

  if (!phoneNumberId || !accessToken || !toNumber) {
    // WhatsApp non configuré → on ne fait rien (l'email assure la notif).
    return;
  }

  const body = `🔔 Nouveau message Vérone — ${data.subjectLabel} — ${data.name} — ${data.email}`;

  // Délai d'expiration : ne jamais bloquer la réponse du formulaire si Meta est
  // lent ou indisponible (l'email reste la notif principale).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toNumber,
          type: 'text',
          text: { body },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('[contact] WhatsApp non envoyé:', detail);
    }
  } catch (error) {
    console.error('[contact] WhatsApp échec réseau:', error);
  } finally {
    clearTimeout(timeout);
  }
}
