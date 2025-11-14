/**
 * Script de configuration webhook PackLink
 *
 * Usage:
 *   tsx scripts/setup-packlink-webhook.ts
 *
 * Prérequis:
 *   - PACKLINK_API_KEY dans .env
 *   - NEXT_PUBLIC_VERCEL_URL ou URL production définie
 */

const PACKLINK_API_KEY = process.env.PACKLINK_API_KEY;
const PRODUCTION_URL =
  process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;

if (!PACKLINK_API_KEY) {
  console.error('❌ PACKLINK_API_KEY manquante dans .env');
  process.exit(1);
}

if (!PRODUCTION_URL) {
  console.error('❌ URL production non définie');
  console.error('💡 Définir NEXT_PUBLIC_VERCEL_URL ou VERCEL_URL dans .env');
  process.exit(1);
}

const webhookUrl = `https://${PRODUCTION_URL}/api/webhooks/packlink`;

async function setupWebhook() {
  console.log('🚀 Configuration webhook PackLink...');
  console.log(`📍 URL webhook: ${webhookUrl}`);

  try {
    const response = await fetch(
      'https://api.packlink.com/v1/callback/register',
      {
        method: 'POST',
        headers: {
          Authorization: PACKLINK_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Webhook configuré avec succès !');
    console.log('📋 Réponse:', JSON.stringify(data, null, 2));

    console.log('\n📊 Événements PackLink qui seront reçus:');
    console.log('  - shipment.tracking     → Tracking disponible');
    console.log('  - shipment.paid         → Paiement confirmé');
    console.log('  - shipment.ready        → Label prêt');
    console.log('  - shipment.transit      → En transit');
    console.log('  - shipment.collected    → Collecté');
    console.log('  - shipment.delivery     → En livraison');
    console.log('  - shipment.delivered    → Livré');
    console.log('  - shipment.incident     → Incident signalé');

    console.log('\n✅ Configuration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur configuration webhook:', error);
    process.exit(1);
  }
}

setupWebhook();
