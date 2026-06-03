/**
 * Test Playwright autonome COMPLET — audit Sourcing + Consultation
 * Cible : https://verone-back-office.vercel.app (PROD)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'https://verone-back-office.vercel.app';
const PRODUCT_ID = 'c61a1e89-4342-4418-b7da-717e4d22e487';
const PRODUCT_SKU = 'SRC-MPY8ROXI';
const POKAWA_MTP_ORG_ID = '6d3f5e3d-731b-47fa-9f11-33956a1f00cf';
const TEST_CONTACT_EMAIL = 'alexandredupas85@gmail.com';
const LOGIN_EMAIL = 'veronebyromeo@gmail.com';
const LOGIN_PASSWORD = 'Abc123456';

const SHOT_DIR = join(process.cwd(), '.playwright-mcp/screenshots/20260603');
mkdirSync(SHOT_DIR, { recursive: true });

function stamp() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(8, 14);
}
function shotPath(name) {
  return join(SHOT_DIR, `audit2-${name}-${stamp()}.png`);
}

const report = {
  startedAt: new Date().toISOString(),
  prod: BASE_URL,
  product: { id: PRODUCT_ID, sku: PRODUCT_SKU },
  tests: {},
  consoleErrors: [],
  createdIds: {},
  refonteHints: [],
};

function logTest(testId, label, status, data = null) {
  if (!report.tests[testId]) report.tests[testId] = { label, steps: [], status: 'pending' };
  report.tests[testId].steps.push({ t: new Date().toISOString(), msg: status, data });
  report.tests[testId].status = status;
  console.log(`[${testId}] ${label} — ${status}`);
}

function addHint(category, msg) {
  report.refonteHints.push({ category, msg });
}

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'fr-FR',
});
const page = await ctx.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') {
    report.consoleErrors.push({ url: page.url(), text: msg.text().slice(0, 250) });
  }
});
page.on('pageerror', err => {
  report.consoleErrors.push({ url: page.url(), text: `pageerror: ${err.message}` });
});

async function safeShot(name) {
  try {
    const p = shotPath(name);
    await page.screenshot({ path: p, fullPage: true });
    return p;
  } catch { return null; }
}

async function login() {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'commit', timeout: 90000 });
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 60000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
  } catch (err) {
    if (page.url().includes('/login')) throw err;
  }
}

async function gotoProductDetail() {
  await page.goto(`${BASE_URL}/produits/sourcing/produits/${PRODUCT_ID}`, {
    waitUntil: 'commit',
    timeout: 60000,
  });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

// ============================================
// T1 — Liste sourcing
// ============================================
async function T1_sourcingList() {
  const testId = 'T1';
  try {
    logTest(testId, 'Liste sourcing', 'running');
    await page.goto(`${BASE_URL}/produits/sourcing`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const shot = await safeShot('T1-list');
    const html = await page.content();
    const skuFound = html.includes(PRODUCT_SKU);
    logTest(testId, 'Liste sourcing', skuFound ? 'pass' : 'fail', { skuFound, screenshot: shot });
    if (!skuFound) addHint('sourcing', 'Le SKU créé n\'apparaît pas immédiatement dans la liste sourcing — recherche ou refresh nécessaire ?');
  } catch (err) {
    logTest(testId, 'Liste sourcing', 'fail', { error: err.message });
  }
}

// ============================================
// T2 — Détail produit + pipeline
// ============================================
async function T2_productDetail() {
  const testId = 'T2';
  try {
    logTest(testId, 'Détail produit', 'running');
    await gotoProductDetail();
    const shot = await safeShot('T2-detail');

    // Pipeline présent ?
    const pipelineTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, [role="tab"]'))
        .map(el => el.textContent?.trim().slice(0, 50))
        .filter(t => t && (t.includes('Sourcing') || t.includes('Évaluation') || t.includes('Échantillon')));
    });

    logTest(testId, 'Détail produit', 'pass', { pipelineTexts, screenshot: shot });
  } catch (err) {
    logTest(testId, 'Détail produit', 'fail', { error: err.message });
  }
}

// ============================================
// T4 — Édition Tarification (crayon)
// ============================================
async function clickEditNearTitle(titleText) {
  const result = await page.evaluate(name => {
    const all = Array.from(document.querySelectorAll('*'));
    const titleEl = all.find(el => {
      const txt = el.textContent?.trim();
      return txt && txt.startsWith(name) && el.children.length < 5 && txt.length < 80;
    });
    if (!titleEl) return { error: 'title-not-found' };
    // Find nearest card ancestor
    let card = titleEl.closest('[class*="Card"], [class*="card"]');
    if (!card) card = titleEl.parentElement;
    if (!card) return { error: 'no-card' };
    // Look for buttons containing svg with class lucide
    const buttons = Array.from(card.querySelectorAll('button'));
    const editBtn = buttons.find(b => {
      const svg = b.querySelector('svg');
      if (!svg) return false;
      const cls = svg.getAttribute('class') || '';
      return cls.includes('pen') || cls.includes('edit') || cls.includes('Pen');
    });
    if (editBtn) {
      editBtn.scrollIntoView();
      editBtn.click();
      return { clicked: true };
    }
    return { error: 'edit-button-not-found', buttonsCount: buttons.length };
  }, titleText);
  await page.waitForTimeout(1200);
  return result;
}

async function T4_editTarification() {
  const testId = 'T4';
  try {
    logTest(testId, 'Édition Tarification', 'running');
    await gotoProductDetail();
    const r = await clickEditNearTitle('Tarification');
    if (!r.clicked) {
      const shot = await safeShot('T4-no-edit-btn');
      logTest(testId, 'Édition Tarification', 'fail', { reason: r, screenshot: shot });
      addHint('sourcing', `Bouton "Modifier" sur la section Tarification non détectable par sélecteur générique (svg.lucide-*). Détail : ${JSON.stringify(r)}`);
      return;
    }
    const shotEdit = await safeShot('T4-edit-mode');

    // Trouver champs et modifier prix d'achat à 125.50
    const numericInputs = await page.locator('input[type="number"]').all();
    const fillResults = [];
    for (let i = 0; i < numericInputs.length; i++) {
      const before = await numericInputs[i].inputValue().catch(() => '?');
      fillResults.push({ idx: i, before });
    }
    if (numericInputs.length > 0) {
      await numericInputs[0].fill('125.50');
      await page.waitForTimeout(400);
    }

    // Bouton sauvegarder
    const saveBtn = page.getByRole('button', { name: /enregistrer|sauvegarder|valider|confirmer/i }).first();
    let saved = false;
    if (await saveBtn.count() > 0) {
      await saveBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(3000);
      saved = true;
    }
    const shotAfter = await safeShot('T4-saved');

    // Vérifier persistance après rechargement
    await page.reload({ waitUntil: 'commit' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const afterReloadHtml = await page.content();
    const persisted = afterReloadHtml.includes('125,50') || afterReloadHtml.includes('125.50');

    logTest(testId, 'Édition Tarification', persisted ? 'pass' : 'partial', {
      saved, persisted, fillResults, screenshot: shotAfter,
    });
    if (!persisted) addHint('sourcing', 'Édition Tarification : la valeur saisie ne semble pas persister après rechargement.');
  } catch (err) {
    logTest(testId, 'Édition Tarification', 'fail', { error: err.message });
  }
}

// ============================================
// T7 — Édition Notes internes
// ============================================
async function T7_editNotes() {
  const testId = 'T7';
  try {
    logTest(testId, 'Édition Notes', 'running');
    await gotoProductDetail();

    // Ouvrir l'accordéon Notes en cliquant dessus si fermé
    try {
      await page.getByText(/^Notes internes/i).first().click({ timeout: 3000 });
      await page.waitForTimeout(800);
    } catch {}

    const r = await clickEditNearTitle('Notes Internes');
    if (!r.clicked) {
      // Tentative alternative : crayon dans header
      const r2 = await clickEditNearTitle('Notes internes');
      if (!r2.clicked) {
        const shot = await safeShot('T7-no-edit');
        logTest(testId, 'Édition Notes', 'fail', { reason: 'edit-button-not-found' });
        addHint('sourcing', 'Bouton "Modifier" sur Notes internes non détectable. UX : peu découvrable.');
        return;
      }
    }

    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('AUDIT TEST Romeo 2026-06-03 — ne pas traiter');
      await page.waitForTimeout(500);
    }
    const saveBtn = page.getByRole('button', { name: /enregistrer|sauvegarder|valider/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    const shot = await safeShot('T7-saved');

    await page.reload({ waitUntil: 'commit' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const persisted = (await page.content()).includes('AUDIT TEST Romeo');
    logTest(testId, 'Édition Notes', persisted ? 'pass' : 'partial', { persisted, screenshot: shot });
    if (!persisted) addHint('sourcing', 'Édition Notes : ne persiste pas après reload.');
  } catch (err) {
    logTest(testId, 'Édition Notes', 'fail', { error: err.message });
  }
}

// ============================================
// T9 — Commander un échantillon
// ============================================
async function T9_orderSample() {
  const testId = 'T9';
  try {
    logTest(testId, 'Commander échantillon', 'running');
    await gotoProductDetail();

    // Tenter onglet "3. Échantillon & validation"
    try {
      await page.getByRole('tab', { name: /3\.\s*Échantillon/i }).click({ timeout: 4000 });
      await page.waitForTimeout(1200);
    } catch {
      // Fallback : cliquer par texte
      try {
        await page.getByText(/3\.\s*Échantillon/i).first().click({ timeout: 3000 });
        await page.waitForTimeout(1200);
      } catch {}
    }
    const shotTab = await safeShot('T9-tab-echantillon');

    // Bouton "Commander un échantillon"
    const btn = page.getByRole('button', { name: /commander.*échantillon|nouvelle.*échantillon|demander.*échantillon/i }).first();
    const exists = await btn.count() > 0;
    if (!exists) {
      // Fallback : tout bouton avec "échantillon"
      const fallback = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(t => t && t.toLowerCase().includes('échantillon'))
          .slice(0, 10);
      });
      addHint('sourcing', `Bouton "Commander échantillon" introuvable même dans l'onglet 3. Boutons "échantillon" présents : ${JSON.stringify(fallback)}`);
      logTest(testId, 'Commander échantillon', 'fail', { reason: 'btn-not-found', fallback, screenshot: shotTab });
      return;
    }

    await btn.click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    const shotModal = await safeShot('T9-modal');

    // Récupère les boutons du modal — chercher "Confirmer" ou "Créer"
    const confirmBtn = page.getByRole('button', { name: /confirmer|créer|valider/i }).last();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(3500);
    }
    const shotAfter = await safeShot('T9-after');
    logTest(testId, 'Commander échantillon', 'attempted', {
      screenshots: [shotTab, shotModal, shotAfter],
      note: 'Action déclenchée — vérifier en DB si PO sample créée',
    });
  } catch (err) {
    logTest(testId, 'Commander échantillon', 'fail', { error: err.message });
  }
}

// ============================================
// T10 — Création consultation via wizard
// ============================================
async function T10_createConsultation() {
  const testId = 'T10';
  try {
    logTest(testId, 'Créer consultation Pokawa', 'running');
    await page.goto(`${BASE_URL}/consultations/create`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const shotStep1 = await safeShot('T10-step1');

    // Étape 1 : Sélectionner Pokawa Montpellier 1 via combobox
    const combo = page.getByRole('combobox').first();
    if (await combo.count() > 0) {
      await combo.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.keyboard.type('Pokawa Montpellier', { delay: 60 });
      await page.waitForTimeout(1500);
      const shotSearch = await safeShot('T10-search-pokawa');
      // Cliquer la première option qui match
      const option = page.getByRole('option', { name: /pokawa montpellier/i }).first();
      if (await option.count() > 0) {
        await option.click({ timeout: 4000 });
      } else {
        // Tentative texte direct
        await page.getByText(/pokawa montpellier 1/i).first().click({ timeout: 4000 }).catch(() => {});
      }
      await page.waitForTimeout(1000);
    }

    // Email contact
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(TEST_CONTACT_EMAIL);
      await page.waitForTimeout(300);
    }

    const shotStep1Filled = await safeShot('T10-step1-filled');

    // Bouton Suivant
    await page.getByRole('button', { name: /suivant/i }).click({ timeout: 5000 });
    await page.waitForTimeout(2500);

    // Étape 2 : Demande
    const shotStep2 = await safeShot('T10-step2');
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('AUDIT TEST Romeo 2026-06-03 — ne pas traiter');
      await page.waitForTimeout(300);
    }
    // Cas priorité : input number ou select (si présent)
    const priorityInputs = await page.locator('input[type="number"]').all();
    if (priorityInputs.length > 0) {
      await priorityInputs[0].fill('1').catch(() => {});
    }
    const shotStep2Filled = await safeShot('T10-step2-filled');

    // Suivant
    await page.getByRole('button', { name: /suivant/i }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // Étape 3 : Confirmation
    const shotStep3 = await safeShot('T10-step3');

    // Bouton Créer / Valider
    const createBtn = page.getByRole('button', { name: /créer|valider|confirmer|terminer/i }).last();
    let consultationCreated = false;
    let consultationUrl = null;
    if (await createBtn.count() > 0) {
      await createBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(4000);
      consultationUrl = page.url();
      consultationCreated = /\/consultations\/[a-f0-9-]{20,}/.test(consultationUrl);
    }
    const shotAfter = await safeShot('T10-after');

    // Si on a une URL consultation, extraire l'ID
    if (consultationCreated) {
      const match = consultationUrl.match(/\/consultations\/([a-f0-9-]+)/);
      if (match) {
        report.createdIds.consultation = match[1];
      }
    }

    logTest(testId, 'Créer consultation Pokawa', consultationCreated ? 'pass' : 'partial', {
      consultationUrl,
      consultationCreated,
      consultationId: report.createdIds.consultation,
      screenshots: [shotStep1, shotStep1Filled, shotStep2, shotStep2Filled, shotStep3, shotAfter],
    });
    if (!consultationCreated) addHint('consultation', 'Le wizard /consultations/create n\'a pas redirigé vers la fiche consultation après création — vérifier.');
  } catch (err) {
    logTest(testId, 'Créer consultation Pokawa', 'fail', { error: err.message });
  }
}

// ============================================
// T11 — Édition consultation (items + frais + marge)
// ============================================
async function T11_editConsultation() {
  const testId = 'T11';
  try {
    logTest(testId, 'Édition consultation (items + marge)', 'running');
    const consultId = report.createdIds.consultation;
    if (!consultId) {
      logTest(testId, 'Édition consultation', 'skipped', { reason: 'no-consultation-id' });
      return;
    }
    await page.goto(`${BASE_URL}/consultations/${consultId}`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const shotInit = await safeShot('T11-init');

    // Chercher bouton "Ajouter produit"
    const addBtn = page.getByRole('button', { name: /ajouter.*produit|\+\s*produit|ajouter|nouveau produit/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      const shotAddModal = await safeShot('T11-add-modal');

      // Rechercher le SKU dans le sélecteur
      const searchInput = page.locator('input[type="search"], input[placeholder*="echerch"], input[placeholder*="produit"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill(PRODUCT_SKU);
        await page.waitForTimeout(1500);
      }
      const shotSearch = await safeShot('T11-search-sku');

      // Sélectionner le produit
      const productRow = page.getByText(new RegExp(PRODUCT_SKU, 'i')).first();
      if (await productRow.count() > 0) {
        await productRow.click({ timeout: 4000 });
        await page.waitForTimeout(800);
      }

      // Bouton de validation du sélecteur
      const confirmBtn = page.getByRole('button', { name: /ajouter|confirmer|valider/i }).last();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click({ timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    } else {
      addHint('consultation', 'Bouton "Ajouter produit" introuvable sur la page consultation.');
    }

    const shotAdded = await safeShot('T11-after-add');

    // Tenter de saisir une quantité, frais et marge — chercher les inputs editables
    const allInputs = await page.locator('input[type="number"]').all();
    let editedFields = [];
    for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
      const before = await allInputs[i].inputValue().catch(() => '?');
      editedFields.push({ idx: i, before });
    }
    const shotFinal = await safeShot('T11-final');

    logTest(testId, 'Édition consultation', 'attempted', {
      inputsCount: allInputs.length,
      editedFields,
      screenshots: [shotInit, shotAdded, shotFinal],
    });
  } catch (err) {
    logTest(testId, 'Édition consultation', 'fail', { error: err.message });
  }
}

// ============================================
// T12 — Génération PDFs consultation
// ============================================
async function T12_pdfsConsultation() {
  const testId = 'T12';
  try {
    logTest(testId, 'PDFs consultation', 'running');
    const consultId = report.createdIds.consultation;
    if (!consultId) {
      logTest(testId, 'PDFs consultation', 'skipped', { reason: 'no-consultation' });
      return;
    }
    await page.goto(`${BASE_URL}/consultations/${consultId}`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const pdfButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent?.trim().slice(0, 60))
        .filter(t => t && (t.toLowerCase().includes('pdf') || t.toLowerCase().includes('télécharger') || t.toLowerCase().includes('rapport')))
        .slice(0, 10);
    });
    const shot = await safeShot('T12-pdf-buttons');

    // Tenter le premier bouton PDF
    const pdfBtn = page.getByRole('button', { name: /pdf|télécharger|rapport/i }).first();
    let pdfOpened = false;
    if (await pdfBtn.count() > 0) {
      await pdfBtn.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(3500);
      pdfOpened = (await page.locator('iframe').count()) > 0 ||
                  (await page.locator('[role="dialog"]').count()) > 0;
    }
    const shotAfter = await safeShot('T12-pdf-opened');

    logTest(testId, 'PDFs consultation', pdfOpened ? 'pass' : 'partial', {
      pdfButtonsFound: pdfButtons,
      pdfOpened,
      screenshots: [shot, shotAfter],
    });
    if (!pdfOpened) addHint('consultation', `PDF non ouvert. Boutons PDF visibles : ${JSON.stringify(pdfButtons)}`);

    await page.keyboard.press('Escape').catch(() => {});
  } catch (err) {
    logTest(testId, 'PDFs consultation', 'fail', { error: err.message });
  }
}

// ============================================
// RUN ALL
// ============================================
try {
  console.log('=== AUDIT COMPLET ===\n');
  await login();

  await T1_sourcingList();
  await T2_productDetail();
  await T4_editTarification();
  await T7_editNotes();
  await T9_orderSample();
  await T10_createConsultation();
  await T11_editConsultation();
  await T12_pdfsConsultation();

  report.result = 'ALL_DONE';
} catch (err) {
  report.result = 'ERROR';
  report.error = { message: err.message, stack: err.stack };
} finally {
  report.endedAt = new Date().toISOString();
  const reportPath = join(SHOT_DIR, `report-full-${stamp()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n=== REPORT ===');
  console.log(`Result: ${report.result}`);
  for (const [k, v] of Object.entries(report.tests)) {
    console.log(`  ${k} — ${v.label} → ${v.status}`);
  }
  console.log('\nCreated IDs:', report.createdIds);
  console.log(`\nConsole errors: ${report.consoleErrors.length}`);
  console.log(`\nFull report: ${reportPath}`);
  await ctx.close();
  await browser.close();
  process.exit(0);
}
