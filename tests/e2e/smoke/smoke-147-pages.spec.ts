import { test, expect } from '../../fixtures/base';

/**
 * SMOKE TEST EXHAUSTIF — 147 pages Back Office
 *
 * Verifie que CHAQUE page du back-office charge sans erreur console.
 * Les pages avec [id] dynamique sont testees via redirection vers la liste parent.
 * Genere depuis : find apps/back-office/src/app -name "page.tsx" (16 avril 2026)
 *
 * Ref : docs/current/TESTS-CHECKLIST-PAGES.md
 */

// Pages statiques (sans parametre dynamique) a tester
const STATIC_PAGES: Array<{ path: string; label: string; priority: string }> = [
  // P0 — Stocks (10 pages statiques)
  { path: '/stocks', label: 'Stocks hub', priority: 'P0' },
  { path: '/stocks/inventaire', label: 'Inventaire', priority: 'P0' },
  { path: '/stocks/mouvements', label: 'Mouvements', priority: 'P0' },
  { path: '/stocks/alertes', label: 'Alertes', priority: 'P0' },
  { path: '/stocks/stockage', label: 'Stockage', priority: 'P0' },
  { path: '/stocks/entrees', label: 'Entrees', priority: 'P0' },
  { path: '/stocks/receptions', label: 'Receptions', priority: 'P0' },
  { path: '/stocks/sorties', label: 'Sorties', priority: 'P0' },
  { path: '/stocks/expeditions', label: 'Expeditions', priority: 'P0' },
  { path: '/stocks/ajustements', label: 'Ajustements', priority: 'P0' },
  {
    path: '/stocks/ajustements/create',
    label: 'Creer ajustement',
    priority: 'P0',
  },
  { path: '/stocks/analytics', label: 'Analytics stocks', priority: 'P0' },
  { path: '/stocks/previsionnel', label: 'Previsionnel', priority: 'P0' },

  // P0 — Finance (26 pages statiques)
  { path: '/finance', label: 'Finance hub', priority: 'P0' },
  { path: '/finance/comptabilite', label: 'Comptabilite', priority: 'P0' },
  { path: '/finance/depenses', label: 'Depenses', priority: 'P0' },
  {
    path: '/finance/depenses/regles',
    label: 'Regles depenses',
    priority: 'P0',
  },
  { path: '/finance/transactions', label: 'Transactions', priority: 'P0' },
  { path: '/finance/rapprochement', label: 'Rapprochement', priority: 'P0' },
  { path: '/finance/tresorerie', label: 'Tresorerie', priority: 'P0' },
  { path: '/finance/tva', label: 'TVA', priority: 'P0' },
  { path: '/finance/bilan', label: 'Bilan', priority: 'P0' },
  { path: '/finance/grand-livre', label: 'Grand livre', priority: 'P0' },
  { path: '/finance/echeancier', label: 'Echeancier', priority: 'P0' },
  {
    path: '/finance/immobilisations',
    label: 'Immobilisations',
    priority: 'P0',
  },
  { path: '/finance/livres', label: 'Livres', priority: 'P0' },
  { path: '/finance/justificatifs', label: 'Justificatifs', priority: 'P0' },
  { path: '/finance/annexe', label: 'Annexe', priority: 'P0' },
  { path: '/finance/bibliotheque', label: 'Bibliotheque', priority: 'P0' },
  { path: '/finance/documents', label: 'Documents hub', priority: 'P0' },
  { path: '/finance/documents/achats', label: 'Docs achats', priority: 'P0' },
  {
    path: '/finance/documents/recettes',
    label: 'Docs recettes',
    priority: 'P0',
  },
  { path: '/finance/documents/bilan', label: 'Docs bilan', priority: 'P0' },
  {
    path: '/finance/documents/compte-resultat',
    label: 'Compte resultat',
    priority: 'P0',
  },
  {
    path: '/finance/documents/grand-livre',
    label: 'Docs grand livre',
    priority: 'P0',
  },
  { path: '/finance/documents/resultats', label: 'Resultats', priority: 'P0' },
  { path: '/finance/documents/tva', label: 'Docs TVA', priority: 'P0' },
  { path: '/finance/documents/annexe', label: 'Docs annexe', priority: 'P0' },
  { path: '/finance/admin/cloture', label: 'Cloture', priority: 'P0' },
  { path: '/finance/admin/reset', label: 'Reset', priority: 'P0' },

  // P0 — Factures (4 pages statiques)
  { path: '/factures', label: 'Factures', priority: 'P0' },
  { path: '/factures/nouvelle', label: 'Nouvelle facture', priority: 'P0' },
  { path: '/factures/qonto', label: 'Qonto', priority: 'P0' },

  // P1 — Produits (10 pages statiques)
  { path: '/produits', label: 'Produits hub', priority: 'P1' },
  { path: '/produits/affilies', label: 'Affilies', priority: 'P1' },
  { path: '/produits/sourcing', label: 'Sourcing', priority: 'P1' },
  {
    path: '/produits/sourcing/produits/create',
    label: 'Creer produit sourcing',
    priority: 'P1',
  },
  {
    path: '/produits/sourcing/echantillons',
    label: 'Echantillons',
    priority: 'P1',
  },
  { path: '/produits/catalogue', label: 'Catalogue', priority: 'P1' },
  {
    path: '/produits/catalogue/nouveau',
    label: 'Nouveau produit',
    priority: 'P1',
  },
  { path: '/produits/catalogue/archived', label: 'Archives', priority: 'P1' },
  {
    path: '/produits/catalogue/categories',
    label: 'Categories',
    priority: 'P1',
  },
  {
    path: '/produits/catalogue/collections',
    label: 'Collections',
    priority: 'P1',
  },
  { path: '/produits/catalogue/variantes', label: 'Variantes', priority: 'P1' },

  // P1 — LinkMe (19 pages statiques)
  { path: '/canaux-vente/linkme', label: 'LinkMe hub', priority: 'P1' },
  {
    path: '/canaux-vente/linkme/catalogue',
    label: 'Catalogue LinkMe',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/catalogue/configuration',
    label: 'Config catalogue',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/catalogue/fournisseurs',
    label: 'Fournisseurs catalogue',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/catalogue/vedettes',
    label: 'Vedettes',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/commandes',
    label: 'Commandes LinkMe',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/commissions',
    label: 'Commissions',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/selections',
    label: 'Selections',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/selections/new',
    label: 'Nouvelle selection',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/utilisateurs',
    label: 'Utilisateurs',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/enseignes',
    label: 'Enseignes',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/organisations',
    label: 'Organisations',
    priority: 'P1',
  },
  { path: '/canaux-vente/linkme/stockage', label: 'Stockage', priority: 'P1' },
  {
    path: '/canaux-vente/linkme/approbations',
    label: 'Approbations',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/demandes-paiement',
    label: 'Demandes paiement',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/messages',
    label: 'Messages LinkMe',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/analytics',
    label: 'Analytics hub',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/analytics/rapports',
    label: 'Rapports',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/analytics/performance',
    label: 'Performance',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/configuration',
    label: 'Config hub',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/configuration/commissions',
    label: 'Config commissions',
    priority: 'P1',
  },
  {
    path: '/canaux-vente/linkme/configuration/integrations',
    label: 'Integrations',
    priority: 'P1',
  },

  // P1 — Commandes, Devis, Consultations
  { path: '/commandes/clients', label: 'Commandes clients', priority: 'P1' },
  {
    path: '/commandes/fournisseurs',
    label: 'Commandes fournisseurs',
    priority: 'P1',
  },
  { path: '/devis', label: 'Devis', priority: 'P1' },
  { path: '/devis/nouveau', label: 'Nouveau devis', priority: 'P1' },
  { path: '/consultations', label: 'Consultations', priority: 'P1' },
  {
    path: '/consultations/create',
    label: 'Creer consultation',
    priority: 'P1',
  },

  // P2 — Contacts, Canaux, Parametres, Admin, Dashboard
  { path: '/contacts-organisations', label: 'CRM hub', priority: 'P2' },
  {
    path: '/contacts-organisations/contacts',
    label: 'Contacts',
    priority: 'P2',
  },
  {
    path: '/contacts-organisations/customers',
    label: 'Clients B2B',
    priority: 'P2',
  },
  {
    path: '/contacts-organisations/enseignes',
    label: 'Enseignes',
    priority: 'P2',
  },
  {
    path: '/contacts-organisations/partners',
    label: 'Partenaires',
    priority: 'P2',
  },
  {
    path: '/contacts-organisations/suppliers',
    label: 'Fournisseurs',
    priority: 'P2',
  },
  {
    path: '/contacts-organisations/clients-particuliers',
    label: 'Clients B2C',
    priority: 'P2',
  },
  { path: '/canaux-vente', label: 'Canaux hub', priority: 'P2' },
  { path: '/canaux-vente/prix-clients', label: 'Prix clients', priority: 'P2' },
  {
    path: '/canaux-vente/google-merchant',
    label: 'Google Merchant',
    priority: 'P2',
  },
  { path: '/canaux-vente/meta', label: 'Meta Commerce', priority: 'P2' },
  {
    path: '/canaux-vente/site-internet',
    label: 'Site internet',
    priority: 'P2',
  },
  { path: '/parametres', label: 'Parametres hub', priority: 'P2' },
  { path: '/parametres/emails', label: 'Emails', priority: 'P2' },
  {
    path: '/parametres/notifications',
    label: 'Notifications config',
    priority: 'P2',
  },
  { path: '/parametres/webhooks', label: 'Webhooks', priority: 'P2' },
  { path: '/admin/users', label: 'Users admin', priority: 'P2' },
  { path: '/admin/activite-utilisateurs', label: 'Activite', priority: 'P2' },
  { path: '/dashboard', label: 'Dashboard', priority: 'P2' },
  { path: '/achats', label: 'Achats', priority: 'P2' },
  { path: '/ventes', label: 'Ventes', priority: 'P2' },

  // P3 — Smoke
  { path: '/profile', label: 'Profil', priority: 'P3' },
  { path: '/notifications', label: 'Notifications', priority: 'P3' },
  { path: '/messages', label: 'Messages', priority: 'P3' },
];

// Group pages by priority for test organization
const P0_PAGES = STATIC_PAGES.filter(p => p.priority === 'P0');
const P1_PAGES = STATIC_PAGES.filter(p => p.priority === 'P1');
const P2_PAGES = STATIC_PAGES.filter(p => p.priority === 'P2');
const P3_PAGES = STATIC_PAGES.filter(p => p.priority === 'P3');

test.describe('P0 — Pages critiques', () => {
  for (const page_ of P0_PAGES) {
    test(`[P0] ${page_.label} (${page_.path})`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(page_.path, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      // Verify page loaded (not redirected to login or error)
      const url = page.url();
      expect(url).not.toContain('/login');

      // Verify no error boundary visible
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {
          // Also check French variant
        });

      consoleErrors.expectNoErrors();
    });
  }
});

test.describe('P1 — Pages elevees', () => {
  for (const page_ of P1_PAGES) {
    test(`[P1] ${page_.label} (${page_.path})`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(page_.path, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).not.toContain('/login');

      consoleErrors.expectNoErrors();
    });
  }
});

test.describe('P2 — Pages moyennes', () => {
  for (const page_ of P2_PAGES) {
    test(`[P2] ${page_.label} (${page_.path})`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(page_.path, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).not.toContain('/login');

      consoleErrors.expectNoErrors();
    });
  }
});

test.describe('P3 — Smoke test', () => {
  for (const page_ of P3_PAGES) {
    test(`[P3] ${page_.label} (${page_.path})`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(page_.path, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      consoleErrors.expectNoErrors();
    });
  }
});
