/**
 * Packlink Webhook Registration Script
 *
 * Enregistre l'URL webhook auprès de Packlink pour recevoir les événements en temps réel.
 *
 * Usage:
 *   tsx scripts/setup-packlink-webhook.ts [environment]
 *
 * Exemples:
 *   tsx scripts/setup-packlink-webhook.ts sandbox
 *   tsx scripts/setup-packlink-webhook.ts production
 *
 * Variables d'environnement requises:
 *   PACKLINK_API_KEY - Clé API Packlink
 *   PACKLINK_ENVIRONMENT - sandbox ou production
 *   NEXT_PUBLIC_APP_URL - URL de base application (ex: https://verone-v1.vercel.app)
 *   PACKLINK_WEBHOOK_SECRET - Secret optionnel pour sécuriser webhook
 */

import { PacklinkClient } from '../apps/back-office/src/lib/packlink/client';
import type { PacklinkClientConfig } from '../apps/back-office/src/lib/packlink/types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

/**
 * Configuration webhook par environnement
 */
const WEBHOOK_CONFIG = {
  sandbox: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL_SANDBOX || 'http://localhost:3000',
    description: 'Sandbox (test)',
  },
  production: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'https://verone-v1.vercel.app',
    description: 'Production (live)',
  },
} as const;

type Environment = keyof typeof WEBHOOK_CONFIG;

/**
 * Valider variables environnement
 */
function validateEnv(): { apiKey: string; secret?: string; appUrl: string } {
  const apiKey = process.env.PACKLINK_API_KEY;
  if (!apiKey) {
    throw new Error('❌ PACKLINK_API_KEY manquant dans .env.local');
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://verone-v1.vercel.app';

  const secret = process.env.PACKLINK_WEBHOOK_SECRET;

  console.log('✅ Variables environnement validées');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`   App URL: ${appUrl}`);
  console.log(
    `   Secret: ${secret ? '✅ Configuré' : '⚠️ Non configuré (optionnel)'}`
  );

  return { apiKey, secret, appUrl };
}

/**
 * Register webhook avec Packlink
 */
async function registerWebhook(environment: Environment): Promise<void> {
  console.log(
    `\n🚀 Registration webhook Packlink - ${WEBHOOK_CONFIG[environment].description}`
  );
  console.log('='.repeat(80));

  // Valider environnement
  const env = validateEnv();

  // Construire URL webhook
  const webhookURL = `${env.appUrl}/api/webhooks/packlink`;
  console.log(`\n📡 Webhook URL: ${webhookURL}`);

  // Créer client Packlink
  const clientConfig: PacklinkClientConfig = {
    apiKey: env.apiKey,
    environment,
    timeout: 30000,
    maxRetries: 3,
  };

  const client = new PacklinkClient(clientConfig);
  console.log(`✅ Client Packlink créé (${environment})`);

  // Register webhook
  console.log('\n📤 Envoi requête registration...');

  try {
    const success = await client.registerWebhook(webhookURL, env.secret);

    if (success) {
      console.log('\n✅ SUCCÈS - Webhook enregistré avec succès !');
      console.log(`   URL: ${webhookURL}`);
      console.log(`   Environment: ${environment}`);

      if (env.secret) {
        console.log(`   Secret: Configuré (${env.secret.substring(0, 10)}...)`);
      }

      console.log('\n🔔 Événements Packlink qui seront reçus:');
      console.log('   - shipment.label.ready : Étiquette générée');
      console.log('   - shipment.tracking.update : Mise à jour tracking');
      console.log('   - shipment.delivered : Livraison effectuée');
      console.log('   - shipment.carrier.success : Transporteur enregistré');
      console.log('   - shipment.carrier.fail : Échec transporteur');
      console.log('   - shipment.label.fail : Échec génération étiquette');

      console.log('\n📝 Prochaines étapes:');
      console.log('   1. Créer un shipment test avec Packlink');
      console.log(
        '   2. Vérifier logs webhook dans /api/webhooks/packlink/route.ts'
      );
      console.log(
        '   3. Consulter table shipment_tracking_events dans Supabase'
      );
    } else {
      console.error('\n❌ ÉCHEC - Webhook non enregistré');
      console.error('   Vérifier:');
      console.error('   - Clé API Packlink valide');
      console.error('   - URL webhook accessible publiquement');
      console.error('   - Logs API Packlink pour détails erreur');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERREUR lors de la registration:');
    console.error(error);
    console.error('\n💡 Solutions possibles:');
    console.error('   - Vérifier PACKLINK_API_KEY dans .env.local');
    console.error('   - Vérifier NEXT_PUBLIC_APP_URL est accessible');
    console.error(
      '   - Consulter documentation Packlink: https://github.com/wout/packlink.cr'
    );
    process.exit(1);
  }
}

/**
 * Test webhook endpoint (vérifier qu'il répond)
 */
async function testWebhookEndpoint(webhookURL: string): Promise<boolean> {
  console.log(`\n🧪 Test endpoint webhook: ${webhookURL}`);

  try {
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'test.connection',
        created_at: new Date().toISOString(),
        data: {
          shipment_reference: 'TEST123',
          status: 'TESTING',
        },
      }),
    });

    if (response.ok) {
      console.log('✅ Endpoint webhook répond correctement');
      return true;
    } else {
      console.warn(`⚠️ Endpoint répond avec status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Endpoint webhook non accessible:');
    console.error(error);
    console.error('\n💡 Solutions:');
    console.error('   - Vérifier application déployée et accessible');
    console.error('   - Vérifier route /api/webhooks/packlink existe');
    console.error('   - Vérifier firewall/proxy ne bloque pas requêtes POST');
    return false;
  }
}

/**
 * Script principal
 */
async function main() {
  console.log(
    '╔════════════════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                   PACKLINK WEBHOOK REGISTRATION                            ║'
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════════════════╝'
  );

  // Récupérer environnement (argument CLI ou .env)
  const envArg = process.argv[2] as Environment | undefined;
  const envFromFile =
    (process.env.PACKLINK_ENVIRONMENT as Environment) || 'sandbox';
  const environment = envArg || envFromFile;

  if (!['sandbox', 'production'].includes(environment)) {
    console.error(
      '❌ Environnement invalide. Utiliser "sandbox" ou "production"'
    );
    console.error(
      '   Usage: tsx scripts/setup-packlink-webhook.ts [sandbox|production]'
    );
    process.exit(1);
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Base URL: ${WEBHOOK_CONFIG[environment].baseURL}`);

  // Test endpoint AVANT registration (optionnel en production)
  if (environment === 'sandbox') {
    const webhookURL = `${WEBHOOK_CONFIG[environment].baseURL}/api/webhooks/packlink`;
    const endpointOk = await testWebhookEndpoint(webhookURL);

    if (!endpointOk) {
      console.warn(
        '\n⚠️ Endpoint webhook non accessible. Continuer quand même ? (y/N)'
      );
      // En production on continue sans prompt
    }
  }

  // Register webhook
  await registerWebhook(environment);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Script terminé avec succès\n');
}

// Exécuter
main().catch(error => {
  console.error('\n❌ ERREUR FATALE:');
  console.error(error);
  process.exit(1);
});
