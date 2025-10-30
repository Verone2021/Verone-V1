/**
 * Script de test automatisé : Scan toutes les pages de l'application
 * Génère un rapport JSON avec les erreurs console détectées
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

// Liste complète des 70 pages à tester
const PAGES = [
  // Auth & Profile (2)
  { path: '/login', name: 'Login', module: 'Auth' },
  { path: '/profile', name: 'Profile', module: 'Auth' },

  // Dashboard (1)
  { path: '/dashboard', name: 'Dashboard', module: 'Dashboard' },

  // Organisations & Contacts (11)
  { path: '/organisation', name: 'Organisations Hub', module: 'Organisations' },
  { path: '/organisation/all', name: 'Toutes Organisations', module: 'Organisations' },
  { path: '/organisation/contacts', name: 'Contacts Orga', module: 'Organisations' },
  { path: '/contacts-organisations', name: 'Contacts Hub', module: 'Organisations' },
  { path: '/contacts-organisations/contacts', name: 'Liste Contacts', module: 'Organisations' },
  { path: '/contacts-organisations/customers', name: 'Liste Clients', module: 'Organisations' },
  { path: '/contacts-organisations/suppliers', name: 'Liste Fournisseurs', module: 'Organisations' },
  { path: '/contacts-organisations/partners', name: 'Liste Partenaires', module: 'Organisations' },

  // Admin (3)
  { path: '/admin/users', name: 'Gestion Utilisateurs', module: 'Admin' },
  { path: '/admin/activite-utilisateurs', name: 'Activité Utilisateurs', module: 'Admin' },

  // Paramètres (1)
  { path: '/parametres', name: 'Paramètres', module: 'Paramètres' },

  // Produits - Catalogue (15)
  { path: '/produits', name: 'Produits Hub', module: 'Produits' },
  { path: '/produits/catalogue', name: 'Catalogue', module: 'Produits' },
  { path: '/produits/catalogue/dashboard', name: 'Dashboard Catalogue', module: 'Produits' },
  { path: '/produits/catalogue/stocks', name: 'Stocks Catalogue', module: 'Produits' },
  { path: '/produits/catalogue/categories', name: 'Catégories', module: 'Produits' },
  { path: '/produits/catalogue/archived', name: 'Produits Archivés', module: 'Produits' },
  { path: '/produits/catalogue/collections', name: 'Collections', module: 'Produits' },
  { path: '/produits/catalogue/variantes', name: 'Variantes', module: 'Produits' },

  // Produits - Sourcing (5)
  { path: '/produits/sourcing', name: 'Sourcing Hub', module: 'Produits' },
  { path: '/produits/sourcing/produits', name: 'Produits Sourcing', module: 'Produits' },
  { path: '/produits/sourcing/echantillons', name: 'Échantillons', module: 'Produits' },
  { path: '/produits/sourcing/validation', name: 'Validation Sourcing', module: 'Produits' },

  // Stocks (10)
  { path: '/stocks', name: 'Stocks Hub', module: 'Stocks' },
  { path: '/stocks/alertes', name: 'Alertes Stock', module: 'Stocks' },
  { path: '/stocks/ajustements/create', name: 'Créer Ajustement', module: 'Stocks' },
  { path: '/stocks/entrees', name: 'Entrées Stock', module: 'Stocks' },
  { path: '/stocks/expeditions', name: 'Expéditions Stock', module: 'Stocks' },
  { path: '/stocks/inventaire', name: 'Inventaire', module: 'Stocks' },
  { path: '/stocks/mouvements', name: 'Mouvements Stock', module: 'Stocks' },
  { path: '/stocks/produits', name: 'Produits Stock', module: 'Stocks' },
  { path: '/stocks/receptions', name: 'Réceptions', module: 'Stocks' },
  { path: '/stocks/sorties', name: 'Sorties Stock', module: 'Stocks' },

  // Commandes (4)
  { path: '/commandes', name: 'Commandes Hub', module: 'Commandes' },
  { path: '/commandes/clients', name: 'Commandes Clients', module: 'Commandes' },
  { path: '/commandes/fournisseurs', name: 'Commandes Fournisseurs', module: 'Commandes' },
  { path: '/commandes/expeditions', name: 'Expéditions Commandes', module: 'Commandes' },

  // Consultations (3)
  { path: '/consultations', name: 'Consultations Liste', module: 'Consultations' },
  { path: '/consultations/create', name: 'Créer Consultation', module: 'Consultations' },

  // Canaux Vente (3)
  { path: '/canaux-vente', name: 'Canaux Vente Hub', module: 'Canaux Vente' },
  { path: '/canaux-vente/google-merchant', name: 'Google Merchant', module: 'Canaux Vente' },
  { path: '/canaux-vente/prix-clients', name: 'Prix Clients (NOUVEAU)', module: 'Canaux Vente' },

  // Finance (2)
  { path: '/finance/rapprochement', name: 'Rapprochement Bancaire', module: 'Finance' },

  // Factures (2)
  { path: '/factures', name: 'Factures Liste', module: 'Factures' },

  // Autres (3)
  { path: '/tresorerie', name: 'Trésorerie', module: 'Trésorerie' },
  { path: '/ventes', name: 'Ventes', module: 'Ventes' },
  { path: '/notifications', name: 'Notifications', module: 'Notifications' }
];

async function testAllPages() {
  console.log('🚀 Démarrage test automatisé - 70 pages\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let warningCount = 0;

  // Collecter les erreurs console
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  for (const pageInfo of PAGES) {
    pageErrors.length = 0; // Reset
    const url = `${BASE_URL}${pageInfo.path}`;

    console.log(`Testing: ${pageInfo.name} (${pageInfo.path})`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      await page.waitForTimeout(2000); // Attendre chargement

      const status = response?.status() || 0;
      const title = await page.title();
      const currentUrl = page.url();

      const result = {
        path: pageInfo.path,
        name: pageInfo.name,
        module: pageInfo.module,
        status: status,
        title: title,
        finalUrl: currentUrl,
        errors: [...pageErrors],
        success: status === 200 && pageErrors.length === 0
      };

      results.push(result);

      if (result.success) {
        successCount++;
        console.log(`  ✅ OK (${status})`);
      } else if (pageErrors.length > 0) {
        errorCount++;
        console.log(`  ❌ ERRORS: ${pageErrors.length} console errors`);
      } else {
        warningCount++;
        console.log(`  ⚠️ WARNING: Status ${status}`);
      }

    } catch (error) {
      errorCount++;
      results.push({
        path: pageInfo.path,
        name: pageInfo.name,
        module: pageInfo.module,
        status: 0,
        error: error.message,
        success: false
      });
      console.log(`  ❌ CRASH: ${error.message}`);
    }
  }

  await browser.close();

  // Générer rapport
  const report = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES.length,
    summary: {
      success: successCount,
      errors: errorCount,
      warnings: warningCount
    },
    results: results
  };

  const reportPath = './test-results-pages.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`  ✅ Succès: ${successCount}/${PAGES.length}`);
  console.log(`  ❌ Erreurs: ${errorCount}`);
  console.log(`  ⚠️ Warnings: ${warningCount}`);
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);

  return report;
}

// Exécution
testAllPages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
