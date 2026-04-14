/**
 * Verone Sourcing Import — Popup Script
 *
 * Detecte le type de page (produit vs fournisseur) et propose
 * l'action appropriee.
 */

let extractedData = null;

// ============================================================
// Elements DOM
// ============================================================

const statusEl = document.getElementById('status');
const pageTypeInfo = document.getElementById('page-type-info');
const productPreview = document.getElementById('product-preview');
const productName = document.getElementById('product-name');
const productPrice = document.getElementById('product-price');
const productMoq = document.getElementById('product-moq');
const productLead = document.getElementById('product-lead');
const productImages = document.getElementById('product-images');
const supplierPreview = document.getElementById('supplier-preview');
const supplierName = document.getElementById('supplier-name');
const supplierBadges = document.getElementById('supplier-badges');
const backofficeUrl = document.getElementById('backoffice-url');
const actionsProduct = document.getElementById('actions-product');
const actionsSupplier = document.getElementById('actions-supplier');
const btnImportProduct = document.getElementById('btn-import-product');
const btnImportSupplier = document.getElementById('btn-import-supplier');
const successLink = document.getElementById('success-link');
const productLink = document.getElementById('product-link');

// ============================================================
// Init
// ============================================================

chrome.storage.local.get(['backofficeUrl'], result => {
  backofficeUrl.value = result.backofficeUrl || 'http://localhost:3000';
});

backofficeUrl.addEventListener('change', () => {
  chrome.storage.local.set({ backofficeUrl: backofficeUrl.value });
});

// Refresh buttons
document
  .getElementById('btn-refresh')
  .addEventListener('click', extractFromPage);
document
  .getElementById('btn-refresh-2')
  .addEventListener('click', extractFromPage);

// Import buttons
btnImportProduct.addEventListener('click', () => importToVerone('product'));
btnImportSupplier.addEventListener('click', () => importToVerone('supplier'));

// Start
extractFromPage();

// ============================================================
// Extraction
// ============================================================

function extractFromPage() {
  setStatus('detecting', 'Analyse de la page en cours...');
  productPreview.style.display = 'none';
  supplierPreview.style.display = 'none';
  actionsProduct.style.display = 'none';
  actionsSupplier.style.display = 'none';
  pageTypeInfo.style.display = 'none';
  successLink.style.display = 'none';
  btnImportProduct.disabled = true;
  btnImportSupplier.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      setStatus('error', 'Impossible de lire la page active');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' }, response => {
      if (chrome.runtime.lastError) {
        // Content script pas charge — l'injecter
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ['content-script.js'] },
          () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(
                tab.id,
                { action: 'extractProduct' },
                retryResponse => {
                  if (!retryResponse || !retryResponse.success) {
                    setStatus(
                      'unsupported',
                      'Page non reconnue. Ouvrez une page produit ou fournisseur.'
                    );
                    return;
                  }
                  handleExtractedData(retryResponse.data);
                }
              );
            }, 500);
          }
        );
        return;
      }

      if (!response || !response.success) {
        setStatus('error', "Erreur lors de l'extraction. Rechargez la page.");
        return;
      }

      handleExtractedData(response.data);
    });
  });
}

// ============================================================
// Affichage selon le type de page
// ============================================================

function handleExtractedData(data) {
  extractedData = data;
  const pageType = data.pageType;

  // === PAGE FOURNISSEUR (entreprise Alibaba) ===
  if (pageType === 'alibaba_supplier') {
    if (!data.supplier || !data.supplier.name) {
      setStatus('error', 'Aucun fournisseur detecte sur cette page.');
      return;
    }

    showPageType('Fiche entreprise Alibaba', '#dbeafe', '#1d4ed8');
    showSupplierPreview(data.supplier);

    actionsSupplier.style.display = 'flex';
    btnImportSupplier.disabled = false;
    setStatus(
      'ready',
      'Fournisseur detecte — pret a importer dans les organisations'
    );
    return;
  }

  // === PAGE PRODUIT (Alibaba ou generique) ===
  if (!data.name) {
    setStatus('error', 'Aucun produit detecte sur cette page.');
    return;
  }

  if (pageType === 'alibaba_product') {
    showPageType('Page produit Alibaba', '#dcfce7', '#166534');
  } else {
    showPageType('Page produit (extraction generique)', '#fef3c7', '#92400e');
  }

  // Preview produit
  productName.textContent = data.name.substring(0, 100);
  productPrice.textContent = data.cost_price
    ? data.cost_price.toFixed(2) + ' EUR'
    : '';
  productMoq.textContent = data.moq ? 'MOQ: ' + data.moq : '';
  productLead.textContent = data.lead_days
    ? 'Delai: ' + data.lead_days + 'j'
    : '';

  productImages.innerHTML = '';
  if (data.images && data.images.length > 0) {
    data.images.slice(0, 6).forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Photo produit';
      img.onerror = () => (img.style.display = 'none');
      productImages.appendChild(img);
    });
  }
  productPreview.style.display = 'block';

  // Preview fournisseur (si disponible)
  if (data.supplier && data.supplier.name) {
    showSupplierPreview(data.supplier);
  }

  actionsProduct.style.display = 'flex';
  btnImportProduct.disabled = false;

  const label =
    data.supplier && data.supplier.name
      ? 'Produit + fournisseur detectes'
      : 'Produit detecte (sans fournisseur)';
  setStatus('ready', label);
}

// ============================================================
// Import vers Verone
// ============================================================

async function importToVerone(mode) {
  if (!extractedData) return;

  const baseUrl = backofficeUrl.value.replace(/\/$/, '');
  const btn = mode === 'supplier' ? btnImportSupplier : btnImportProduct;

  btn.disabled = true;
  btn.textContent = 'Import en cours...';
  setStatus('detecting', 'Envoi vers Verone Back-Office...');

  try {
    let endpoint, body;

    if (mode === 'supplier') {
      // Import fournisseur seul
      endpoint = '/api/sourcing/import-supplier';
      body = extractedData.supplier;
    } else {
      // Import produit (+ fournisseur si disponible)
      endpoint = '/api/sourcing/import';
      body = extractedData;
    }

    const response = await fetch(baseUrl + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur serveur');
    }

    if (mode === 'supplier') {
      setStatus(
        'success',
        'Fournisseur "' + result.supplier_name + '" importe avec succes !'
      );
      btn.textContent = 'Importe !';
      productLink.href = baseUrl + result.redirect_url;
      productLink.textContent = 'Ouvrir la fiche fournisseur';
    } else {
      setStatus(
        'success',
        'Produit "' + result.product_name + '" importe avec succes !'
      );
      btn.textContent = 'Importe !';
      productLink.href = baseUrl + result.redirect_url;
      productLink.textContent = 'Ouvrir la fiche sourcing';
    }

    successLink.style.display = 'block';
  } catch (error) {
    setStatus('error', 'Erreur: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Reessayer';
  }
}

// ============================================================
// Helpers
// ============================================================

function setStatus(type, message) {
  statusEl.className = 'status ' + type;
  statusEl.textContent = message;
}

function showPageType(label, bgColor, textColor) {
  pageTypeInfo.textContent = label;
  pageTypeInfo.style.display = 'block';
  pageTypeInfo.style.background = bgColor;
  pageTypeInfo.style.color = textColor;
  pageTypeInfo.style.border = '1px solid ' + textColor + '33';
}

function showSupplierPreview(supplier) {
  supplierName.textContent = supplier.name;
  supplierBadges.innerHTML = '';

  if (supplier.trade_assurance) addBadge('Trade Assurance', 'green');
  if (supplier.verified) addBadge('Verifie', 'blue');
  if (supplier.supplier_score)
    addBadge('Score: ' + supplier.supplier_score + '/5', 'blue');
  if (supplier.response_rate)
    addBadge('Reponse: ' + supplier.response_rate, '');
  if (supplier.year_established)
    addBadge('Depuis ' + supplier.year_established, '');
  if (supplier.employees) addBadge(supplier.employees, '');
  if (supplier.certifications && supplier.certifications.length > 0)
    addBadge(supplier.certifications.join(', '), '');
  if (supplier.delivery_terms) addBadge(supplier.delivery_terms, '');

  supplierPreview.style.display = 'block';
}

function addBadge(text, color) {
  const span = document.createElement('span');
  span.className = 'badge ' + color;
  span.textContent = text;
  supplierBadges.appendChild(span);
}
