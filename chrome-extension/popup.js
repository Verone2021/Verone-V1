/**
 * Verone Sourcing Import — Popup editable
 *
 * Affiche tous les champs extraits avec cases a cocher et champs editables.
 * L'utilisateur peut modifier/decocher avant d'importer.
 */

let extractedData = null;
let imageSelections = {}; // url -> boolean
let authToken = null; // Token Supabase pour l'API

const statusEl = document.getElementById('status');
const pageTypeEl = document.getElementById('page-type');
const fieldsContainer = document.getElementById('fields-container');
const imagesContainer = document.getElementById('images-container');
const imagesGrid = document.getElementById('images-grid');
const supplierSection = document.getElementById('supplier-section');
const supplierFields = document.getElementById('supplier-fields');
const supplierBadges = document.getElementById('supplier-badges');
const actionsBar = document.getElementById('actions-bar');
const btnImport = document.getElementById('btn-import');
const btnRefresh = document.getElementById('btn-refresh');
const successLink = document.getElementById('success-link');
const resultLink = document.getElementById('result-link');
const backofficeUrl = document.getElementById('backoffice-url');

// Init
btnRefresh.addEventListener('click', extractFromPage);
btnImport.addEventListener('click', doImport);

// Charger le token d'auth depuis le storage, puis extraire
chrome.storage.local.get(['authToken', 'authExpires'], result => {
  const now = Math.floor(Date.now() / 1000);
  if (result.authToken && result.authExpires && result.authExpires > now) {
    authToken = result.authToken;
  }
  extractFromPage();
  // Rafraichir le token en arriere-plan
  refreshAuthToken();
});

async function refreshAuthToken() {
  const baseUrl = backofficeUrl.value.replace(/\/$/, '');
  try {
    const res = await fetch(baseUrl + '/api/sourcing/auth', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.access_token;
      chrome.storage.local.set({
        authToken: data.access_token,
        authExpires: data.expires_at,
        authEmail: data.user_email,
      });
    }
  } catch (_e) {
    // Silencieux — le token existant sera utilise si disponible
  }
}

// ============================================================
// Extraction
// ============================================================

function extractFromPage() {
  setStatus('detecting', 'Analyse de la page en cours...');
  fieldsContainer.innerHTML = '';
  imagesContainer.style.display = 'none';
  supplierSection.style.display = 'none';
  actionsBar.style.display = 'none';
  successLink.style.display = 'none';
  pageTypeEl.style.display = 'none';

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      setStatus('error', 'Impossible de lire la page active');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' }, response => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ['content-script.js'] },
          () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(
                tab.id,
                { action: 'extractProduct' },
                retry => {
                  if (!retry || !retry.success) {
                    setStatus(
                      'unsupported',
                      'Page non reconnue. Ouvrez une page produit.'
                    );
                    return;
                  }
                  handleData(retry.data);
                }
              );
            }, 800);
          }
        );
        return;
      }
      if (!response || !response.success) {
        setStatus('error', "Erreur d'extraction. Rechargez la page.");
        return;
      }
      handleData(response.data);
    });
  });
}

// ============================================================
// Affichage des champs editables
// ============================================================

function handleData(data) {
  extractedData = data;
  const pt = data.pageType;

  // Page type indicator
  if (pt === 'alibaba_product') {
    showPageType('Page produit Alibaba', '#dcfce7', '#166534');
  } else if (pt === 'alibaba_supplier') {
    showPageType('Fiche entreprise Alibaba', '#dbeafe', '#1d4ed8');
  } else {
    showPageType('Page produit (extraction generique)', '#fef3c7', '#92400e');
  }

  // === FOURNISSEUR SEUL ===
  if (pt === 'alibaba_supplier') {
    if (!data.supplier || !data.supplier.name) {
      setStatus('error', 'Aucun fournisseur detecte.');
      return;
    }
    showSupplierFields(data.supplier);
    actionsBar.style.display = 'flex';
    btnImport.disabled = false;
    btnImport.textContent = 'Importer le fournisseur';
    setStatus('ready', 'Fournisseur detecte — verifiez et importez');
    return;
  }

  // === PRODUIT ===
  if (!data.name) {
    setStatus('error', 'Aucun produit detecte sur cette page.');
    return;
  }

  // Champs produit editables
  fieldsContainer.innerHTML = '';
  addField('name', 'Nom du produit', data.name, 'text', true);
  addField(
    'supplier_reference',
    'Reference fournisseur',
    data.reference || '',
    'text',
    !!data.reference
  );
  addField('brand', 'Marque', data.brand || '', 'text', !!data.brand);
  addField(
    'cost_price',
    "Prix d'achat HT (EUR)",
    data.cost_price ? String(data.cost_price) : '',
    'number',
    true
  );
  addField(
    'eco_tax',
    'Eco-taxe (EUR)',
    data.eco_tax ? String(data.eco_tax) : '',
    'number',
    !!data.eco_tax
  );
  addField(
    'description',
    'Description',
    data.description || '',
    'textarea',
    true
  );
  addField(
    'technical_description',
    'Description technique',
    data.technical_description || '',
    'textarea',
    false
  );

  // Dimensions (si extraites du titre, specs ou donnees)
  const dimMatch = (data.name || '').match(/D(\d+).*H(\d+)/i);
  const dimL = data.length || '';
  const dimW = data.width || (dimMatch ? dimMatch[1] : '');
  const dimH = data.height || (dimMatch ? dimMatch[2] : '');
  addField(
    'dim_length',
    'Longueur (cm)',
    dimL ? String(dimL) : '',
    'number',
    !!dimL
  );
  addField(
    'dim_width',
    'Largeur / Diametre (cm)',
    dimW ? String(dimW) : '',
    'number',
    !!dimW
  );
  addField(
    'dim_height',
    'Hauteur (cm)',
    dimH ? String(dimH) : '',
    'number',
    !!dimH
  );
  addField(
    'weight',
    'Poids (kg)',
    data.weight ? String(data.weight) : '',
    'number',
    !!data.weight
  );

  // Materiau / Style / Couleur
  addField(
    'material',
    'Materiau',
    data.material || '',
    'text',
    !!data.material
  );
  addField('color', 'Couleur', data.color || '', 'text', !!data.color);
  addField('style', 'Style', data.style || '', 'text', !!data.style);
  addField('condition', 'Etat', data.condition || 'Neuf', 'text', true);

  addField(
    'moq',
    'MOQ (quantite min.)',
    data.moq ? String(data.moq) : '',
    'number',
    !!data.moq
  );
  addField(
    'lead_days',
    'Delai (jours)',
    data.lead_days ? String(data.lead_days) : '',
    'number',
    !!data.lead_days
  );

  // Images
  if (data.images && data.images.length > 0) {
    showImages(data.images);
  }

  // Fournisseur (si disponible)
  if (data.supplier && data.supplier.name) {
    showSupplierFields(data.supplier);
  }

  actionsBar.style.display = 'flex';
  btnImport.disabled = false;
  btnImport.textContent = data.supplier
    ? 'Importer produit + fournisseur'
    : 'Importer le produit';
  setStatus(
    'ready',
    'Verifiez les champs, decochez ce que vous ne voulez pas, puis importez.'
  );
}

function addField(id, label, value, type, checked) {
  const row = document.createElement('div');
  row.className = 'field-row' + (checked ? '' : ' disabled');
  row.id = 'row-' + id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = checked;
  cb.id = 'cb-' + id;
  cb.addEventListener('change', () => {
    const input = document.getElementById('val-' + id);
    input.disabled = !cb.checked;
    row.className = 'field-row' + (cb.checked ? '' : ' disabled');
  });

  const info = document.createElement('div');
  info.className = 'field-info';

  const lbl = document.createElement('div');
  lbl.className = 'field-label';
  lbl.textContent = label;

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 2;
  } else {
    input = document.createElement('input');
    input.type = type === 'number' ? 'number' : 'text';
    if (type === 'number') input.step = '0.01';
  }
  input.className = 'field-value';
  input.id = 'val-' + id;
  input.value = value;
  input.disabled = !checked;

  info.appendChild(lbl);
  info.appendChild(input);
  row.appendChild(cb);
  row.appendChild(info);
  fieldsContainer.appendChild(row);
}

function showImages(urls) {
  imagesGrid.innerHTML = '';
  imageSelections = {};

  // Filter real product images
  const filtered = urls
    .filter(
      u =>
        u &&
        !u.includes('icon') &&
        !u.includes('logo') &&
        !u.includes('lazy_load') &&
        !u.includes('website/1/')
    )
    .slice(0, 12);

  if (filtered.length === 0) return;

  filtered.forEach((url, i) => {
    imageSelections[url] = true;

    const thumb = document.createElement('div');
    thumb.className = 'img-thumb';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
      imageSelections[url] = cb.checked;
      thumb.className = 'img-thumb' + (cb.checked ? '' : ' unchecked');
    });

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Photo ' + (i + 1);
    img.onerror = () => {
      thumb.style.display = 'none';
    };

    thumb.appendChild(cb);
    thumb.appendChild(img);
    imagesGrid.appendChild(thumb);
  });

  imagesContainer.style.display = 'block';
}

function showSupplierFields(supplier) {
  supplierFields.innerHTML = '';
  supplierBadges.innerHTML = '';

  addSupplierField('supplier_name', 'Nom', supplier.name, true);
  addSupplierField(
    'supplier_country',
    'Pays',
    supplier.country || '',
    !!supplier.country
  );
  addSupplierField(
    'supplier_url',
    'URL boutique',
    supplier.alibaba_store_url || '',
    !!supplier.alibaba_store_url
  );

  // Badges
  if (supplier.trade_assurance) addBadge('Trade Assurance', 'green');
  if (supplier.verified) addBadge('Verifie', 'blue');
  if (supplier.supplier_score)
    addBadge('Score: ' + supplier.supplier_score + '/5', 'blue');
  if (supplier.response_rate)
    addBadge('Reponse: ' + supplier.response_rate, '');
  if (supplier.year_established)
    addBadge('Depuis ' + supplier.year_established, '');
  if (supplier.employees) addBadge(supplier.employees, '');
  if (supplier.certifications && supplier.certifications.length)
    addBadge(supplier.certifications.join(', '), '');

  supplierSection.style.display = 'block';
}

function addSupplierField(id, label, value, checked) {
  const row = document.createElement('div');
  row.className = 'field-row' + (checked ? '' : ' disabled');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = checked;
  cb.id = 'cb-' + id;
  cb.addEventListener('change', () => {
    const input = document.getElementById('val-' + id);
    input.disabled = !cb.checked;
    row.className = 'field-row' + (cb.checked ? '' : ' disabled');
  });

  const info = document.createElement('div');
  info.className = 'field-info';

  const lbl = document.createElement('div');
  lbl.className = 'field-label';
  lbl.textContent = label;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'field-value';
  input.id = 'val-' + id;
  input.value = value;
  input.disabled = !checked;

  info.appendChild(lbl);
  info.appendChild(input);
  row.appendChild(cb);
  row.appendChild(info);
  supplierFields.appendChild(row);
}

// ============================================================
// Import
// ============================================================

async function doImport() {
  if (!extractedData) return;

  if (!authToken) {
    setStatus(
      'error',
      'Non connecte. Ouvrez votre back-office Verone dans un onglet, connectez-vous, puis revenez ici et cliquez "Reanalyser".'
    );
    return;
  }

  btnImport.disabled = true;
  btnImport.textContent = 'Import en cours...';
  setStatus('detecting', 'Envoi vers Verone...');

  const baseUrl = backofficeUrl.value.replace(/\/$/, '');
  const pt = extractedData.pageType;

  try {
    // === FOURNISSEUR SEUL ===
    if (pt === 'alibaba_supplier') {
      const body = {
        name: getVal('supplier_name'),
        country: getVal('supplier_country'),
        alibaba_store_url: getVal('supplier_url'),
        supplier_score: extractedData.supplier?.supplier_score,
        trade_assurance: extractedData.supplier?.trade_assurance,
        verified: extractedData.supplier?.verified,
        certifications: extractedData.supplier?.certifications,
        year_established: extractedData.supplier?.year_established,
        employees: extractedData.supplier?.employees,
        delivery_terms: extractedData.supplier?.delivery_terms,
      };

      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
      const res = await fetch(baseUrl + '/api/sourcing/import-supplier', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur serveur');

      setStatus(
        'success',
        'Fournisseur "' + result.supplier_name + '" importe !'
      );
      btnImport.textContent = 'Importe !';
      resultLink.href = baseUrl + result.redirect_url;
      resultLink.textContent = 'Ouvrir la fiche fournisseur';
      successLink.style.display = 'block';
      return;
    }

    // === PRODUIT ===
    const selectedImages = Object.entries(imageSelections)
      .filter(([, selected]) => selected)
      .map(([url]) => url);

    const body = {
      name: getCheckedVal('name', ''),
      description: getCheckedVal('description', undefined),
      technical_description: getCheckedVal('technical_description', undefined),
      supplier_reference: getCheckedVal('supplier_reference', undefined),
      brand: getCheckedVal('brand', undefined),
      source_url: extractedData.source_url,
      source_platform: extractedData.source_platform || 'other',
      images: selectedImages.length > 0 ? selectedImages : undefined,
      cost_price: getCheckedVal('cost_price', undefined, parseFloat),
      eco_tax: getCheckedVal('eco_tax', undefined, parseFloat),
      weight: getCheckedVal('weight', undefined, parseFloat),
      dim_length: getCheckedVal('dim_length', undefined, parseFloat),
      dim_width: getCheckedVal('dim_width', undefined, parseFloat),
      dim_height: getCheckedVal('dim_height', undefined, parseFloat),
      material: getCheckedVal('material', undefined),
      color: getCheckedVal('color', undefined),
      style: getCheckedVal('style', undefined),
      condition: getCheckedVal('condition', undefined),
      moq: getCheckedVal('moq', undefined, parseInt),
      lead_days: getCheckedVal('lead_days', undefined, parseInt),
    };

    // Supplier data (si coche)
    const supplierName = getVal('supplier_name');
    if (supplierName && isChecked('supplier_name')) {
      body.supplier = {
        name: supplierName,
        country: getCheckedVal('supplier_country', undefined),
        alibaba_store_url: getCheckedVal('supplier_url', undefined),
        supplier_score: extractedData.supplier?.supplier_score,
        trade_assurance: extractedData.supplier?.trade_assurance,
        verified: extractedData.supplier?.verified,
        certifications: extractedData.supplier?.certifications,
      };
    }

    const importHeaders = { 'Content-Type': 'application/json' };
    if (authToken) importHeaders['Authorization'] = 'Bearer ' + authToken;
    const res = await fetch(baseUrl + '/api/sourcing/import', {
      method: 'POST',
      headers: importHeaders,
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erreur serveur');

    setStatus('success', 'Produit "' + result.product_name + '" importe !');
    btnImport.textContent = 'Importe !';
    resultLink.href = baseUrl + result.redirect_url;
    resultLink.textContent = 'Ouvrir la fiche sourcing';
    successLink.style.display = 'block';
  } catch (error) {
    setStatus('error', 'Erreur: ' + error.message);
    btnImport.disabled = false;
    btnImport.textContent = 'Reessayer';
  }
}

// ============================================================
// Helpers
// ============================================================

function getVal(id) {
  const el = document.getElementById('val-' + id);
  return el ? el.value.trim() : '';
}

function isChecked(id) {
  const el = document.getElementById('cb-' + id);
  return el ? el.checked : false;
}

function getCheckedVal(id, fallback, parser) {
  if (!isChecked(id)) return fallback;
  const val = getVal(id);
  if (!val) return fallback;
  if (parser) {
    const parsed = parser(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return val;
}

function setStatus(type, message) {
  statusEl.className = 'status ' + type;
  statusEl.textContent = message;
}

function showPageType(label, bg, color) {
  pageTypeEl.textContent = label;
  pageTypeEl.style.display = 'block';
  pageTypeEl.style.background = bg;
  pageTypeEl.style.color = color;
  pageTypeEl.style.border = '1px solid ' + color + '33';
}

function addBadge(text, color) {
  const span = document.createElement('span');
  span.className = 'badge-tag ' + color;
  span.textContent = text;
  supplierBadges.appendChild(span);
}
