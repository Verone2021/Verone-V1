/**
 * Verone Sourcing Import — Popup Script
 *
 * Communique avec le content script pour extraire les donnees
 * puis les envoie a l'API du back-office.
 */

let extractedData = null;

// ============================================================
// Elements DOM
// ============================================================

const statusEl = document.getElementById('status');
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
const btnRefresh = document.getElementById('btn-refresh');
const btnImport = document.getElementById('btn-import');
const successLink = document.getElementById('success-link');
const productLink = document.getElementById('product-link');

// ============================================================
// Init
// ============================================================

// Charger l'URL du back-office depuis le storage
chrome.storage.local.get(['backofficeUrl'], result => {
  backofficeUrl.value = result.backofficeUrl || 'http://localhost:3000';
});

// Sauvegarder l'URL quand elle change
backofficeUrl.addEventListener('change', () => {
  chrome.storage.local.set({ backofficeUrl: backofficeUrl.value });
});

// Extraire les donnees au chargement
extractFromPage();

// ============================================================
// Extraction
// ============================================================

function extractFromPage() {
  setStatus('detecting', 'Analyse de la page en cours...');
  productPreview.style.display = 'none';
  supplierPreview.style.display = 'none';
  successLink.style.display = 'none';
  btnImport.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      setStatus('error', 'Impossible de lire la page active');
      return;
    }

    // Verifier si on est sur un site supporte
    const url = tab.url || '';
    const isAlibaba = url.includes('alibaba.com');
    const isSupported = isAlibaba || url.includes('1688.com');

    if (!isSupported) {
      // Tenter l'extraction generique quand meme
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractProduct' },
        response => {
          if (chrome.runtime.lastError || !response || !response.success) {
            setStatus(
              'unsupported',
              'Page non reconnue. Ouvrez une page produit Alibaba ou un autre site e-commerce.'
            );
            return;
          }
          handleExtractedData(response.data);
        }
      );
      return;
    }

    // Envoyer le message au content script
    chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' }, response => {
      if (chrome.runtime.lastError) {
        // Content script pas charge — l'injecter manuellement
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ['content-script.js'],
          },
          () => {
            // Retry
            setTimeout(() => {
              chrome.tabs.sendMessage(
                tab.id,
                { action: 'extractProduct' },
                retryResponse => {
                  if (!retryResponse || !retryResponse.success) {
                    setStatus(
                      'error',
                      "Impossible d'extraire les donnees. Rechargez la page et reessayez."
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

function handleExtractedData(data) {
  extractedData = data;

  if (!data.name) {
    setStatus('error', 'Aucun produit detecte sur cette page.');
    return;
  }

  // Afficher le preview produit
  productName.textContent = data.name.substring(0, 100);
  productPrice.textContent = data.cost_price
    ? `${data.cost_price.toFixed(2)} EUR`
    : '';
  productMoq.textContent = data.moq ? `MOQ: ${data.moq}` : '';
  productLead.textContent = data.lead_days ? `Delai: ${data.lead_days}j` : '';

  // Images
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

  // Afficher le preview fournisseur
  if (data.supplier && data.supplier.name) {
    supplierName.textContent = data.supplier.name;
    supplierBadges.innerHTML = '';

    if (data.supplier.trade_assurance) {
      addBadge('Trade Assurance', 'green');
    }
    if (data.supplier.verified) {
      addBadge('Verifie', 'blue');
    }
    if (data.supplier.supplier_score) {
      addBadge(`Score: ${data.supplier.supplier_score}/5`, 'blue');
    }
    if (data.supplier.response_rate) {
      addBadge(`Reponse: ${data.supplier.response_rate}`, '');
    }
    if (
      data.supplier.certifications &&
      data.supplier.certifications.length > 0
    ) {
      addBadge(data.supplier.certifications.join(', '), '');
    }

    supplierPreview.style.display = 'block';
  }

  setStatus(
    'ready',
    `Produit detecte — pret a importer (${data.source_platform})`
  );
  btnImport.disabled = false;
}

// ============================================================
// Import vers Verone
// ============================================================

btnImport.addEventListener('click', async () => {
  if (!extractedData) return;

  btnImport.disabled = true;
  btnImport.textContent = 'Import en cours...';
  setStatus('detecting', 'Envoi vers Verone Back-Office...');

  const baseUrl = backofficeUrl.value.replace(/\/$/, '');

  try {
    const response = await fetch(`${baseUrl}/api/sourcing/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(extractedData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur serveur');
    }

    setStatus(
      'success',
      `Produit "${result.product_name}" importe avec succes !`
    );
    btnImport.textContent = 'Importe !';

    // Afficher le lien vers la fiche
    productLink.href = `${baseUrl}${result.redirect_url}`;
    successLink.style.display = 'block';
  } catch (error) {
    setStatus('error', `Erreur: ${error.message}`);
    btnImport.disabled = false;
    btnImport.textContent = 'Reessayer';
  }
});

// ============================================================
// Helpers
// ============================================================

btnRefresh.addEventListener('click', extractFromPage);

function setStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
}

function addBadge(text, color) {
  const span = document.createElement('span');
  span.className = `badge ${color}`;
  span.textContent = text;
  supplierBadges.appendChild(span);
}
