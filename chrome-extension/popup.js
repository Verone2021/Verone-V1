/**
 * Verone Sourcing Import — Popup editable
 *
 * Affiche tous les champs extraits avec cases a cocher et champs editables.
 * L'utilisateur peut modifier/decocher avant d'importer.
 */

let extractedData = null;
let imageSelections = {}; // url -> boolean
let authToken = null; // Token Supabase pour l'API
let availableBrands = []; // [{ id, name, slug }]
let selectedBrandIds = new Set();

const statusEl = document.getElementById('status');
const pageTypeEl = document.getElementById('page-type');
const fieldsContainer = document.getElementById('fields-container');
const brandsRow = document.getElementById('brands-row');
const brandChips = document.getElementById('brand-chips');
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
const supabaseUrl = document.getElementById('supabase-url');
const supabaseAnonKey = document.getElementById('supabase-anon-key');

// Login form
const loginCard = document.getElementById('login-card');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// Success modal
const successModal = document.getElementById('success-modal');
const successTitle = document.getElementById('success-title');
const successSubtitle = document.getElementById('success-subtitle');
const successSummary = document.getElementById('success-summary');
const successOpenBo = document.getElementById('success-open-bo');
const successNew = document.getElementById('success-new');

// Init
btnRefresh.addEventListener('click', extractFromPage);
btnImport.addEventListener('click', doImport);
loginBtn.addEventListener('click', doSignIn);
loginPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSignIn();
});
successNew.addEventListener('click', () => {
  successModal.style.display = 'none';
  extractFromPage();
});

// Charger le token d'auth depuis le storage, puis extraire
chrome.storage.local.get(['authToken', 'authExpires'], result => {
  const now = Math.floor(Date.now() / 1000);
  if (result.authToken && result.authExpires && result.authExpires > now) {
    authToken = result.authToken;
    // Token déjà valide — charger les marques tout de suite
    loadBrands();
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
      // Une fois le token disponible, charger les marques
      loadBrands();
    } else if (res.status === 401 && !authToken) {
      // Pas de session dans ce profil Chrome → guider vers le login
      showAuthRequired();
    }
  } catch (_e) {
    // Silencieux — le token existant sera utilise si disponible
  }
}

async function loadBrands() {
  if (!authToken) return;
  const baseUrl = backofficeUrl.value.replace(/\/$/, '');
  try {
    const res = await fetch(baseUrl + '/api/brands', {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    if (!res.ok) return;
    const data = await res.json();
    availableBrands = Array.isArray(data.brands) ? data.brands : [];
    renderBrandChips();
  } catch (_e) {
    // Silencieux
  }
}

function renderBrandChips() {
  brandChips.innerHTML = '';
  if (availableBrands.length === 0) {
    brandsRow.style.display = 'none';
    return;
  }
  availableBrands.forEach(brand => {
    const chip = document.createElement('span');
    chip.className =
      'brand-chip' + (selectedBrandIds.has(brand.id) ? ' selected' : '');
    chip.dataset.brandId = brand.id;

    const dot = document.createElement('span');
    dot.className = 'dot';
    if (brand.brand_color) dot.style.background = brand.brand_color;

    const label = document.createElement('span');
    label.textContent = brand.name;

    chip.appendChild(dot);
    chip.appendChild(label);
    chip.addEventListener('click', () => {
      if (selectedBrandIds.has(brand.id)) {
        selectedBrandIds.delete(brand.id);
        chip.classList.remove('selected');
      } else {
        selectedBrandIds.add(brand.id);
        chip.classList.add('selected');
      }
    });
    brandChips.appendChild(chip);
  });
  brandsRow.style.display = 'block';
}

// ============================================================
// Extraction
// ============================================================

function extractFromPage() {
  setStatus('detecting', 'Analyse de la page en cours...');
  statusEl.style.display = '';
  fieldsContainer.innerHTML = '';
  imagesContainer.style.display = 'none';
  supplierSection.style.display = 'none';
  actionsBar.style.display = 'none';
  successLink.style.display = 'none';
  if (successModal) successModal.style.display = 'none';
  pageTypeEl.style.display = 'none';
  // Reset selection marques entre 2 analyses, on garde la liste chargée
  selectedBrandIds = new Set();
  renderBrandChips();

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

  // Afficher la rangée marques si elles sont déjà chargées
  renderBrandChips();

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
    showAuthRequired();
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
        // credentials omis pour eviter CORS strict (on s'authentifie via Bearer)
        body: JSON.stringify(body),
      });

      let result;
      try {
        result = await res.json();
      } catch (_jsonErr) {
        const fallback = await res.text().catch(() => '');
        throw new Error(
          'Reponse invalide (HTTP ' +
            res.status +
            (fallback ? ' : ' + fallback.substring(0, 200) : ')')
        );
      }

      if (!res.ok) {
        const err = new Error(result.error || 'Erreur serveur');
        err.details =
          typeof result.details === 'string'
            ? result.details
            : result.details
              ? JSON.stringify(result.details, null, 2)
              : null;
        err.httpStatus = res.status;
        throw err;
      }

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
      brand_ids:
        selectedBrandIds.size > 0 ? Array.from(selectedBrandIds) : undefined,
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
      // credentials omis pour eviter CORS strict (on s'authentifie via Bearer)
      body: JSON.stringify(body),
    });

    let result;
    try {
      result = await res.json();
    } catch (_jsonErr) {
      const fallback = await res.text().catch(() => '');
      throw new Error(
        'Reponse invalide du serveur (HTTP ' +
          res.status +
          (fallback ? ' : ' + fallback.substring(0, 200) : ')')
      );
    }

    // Doublon détecté
    if (res.status === 409) {
      setStatus(
        'error',
        'Ce produit a deja ete importe : "' + result.existing_product_name + '"'
      );
      btnImport.textContent = 'Deja importe';
      resultLink.href = baseUrl + result.redirect_url;
      resultLink.textContent = 'Ouvrir la fiche existante';
      successLink.style.display = 'block';
      return;
    }

    if (!res.ok) {
      const err = new Error(result.error || 'Erreur serveur');
      err.details =
        typeof result.details === 'string'
          ? result.details
          : result.details
            ? JSON.stringify(result.details, null, 2)
            : null;
      err.httpStatus = res.status;
      throw err;
    }

    // Afficher le modal de confirmation
    showSuccessModal(result);
  } catch (error) {
    const httpPart = error.httpStatus ? ' (HTTP ' + error.httpStatus + ')' : '';
    setStatus('error', 'Erreur: ' + error.message + httpPart);
    if (error.details) {
      const detailsBox = document.createElement('div');
      detailsBox.className = 'error-details';
      detailsBox.textContent = error.details;
      statusEl.parentNode.insertBefore(detailsBox, statusEl.nextSibling);
    }
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

function showAuthRequired() {
  // Affiche le formulaire de connexion direct dans le popup
  loginCard.style.display = 'block';
  loginError.style.display = 'none';
  if (actionsBar) actionsBar.style.display = 'none';
  statusEl.style.display = 'none';
  pageTypeEl.style.display = 'none';
  loginEmail.focus();
}

async function doSignIn() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) {
    loginError.textContent = 'Email et mot de passe requis.';
    loginError.style.display = 'block';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Connexion...';
  loginError.style.display = 'none';

  try {
    const sbUrl = supabaseUrl.value.replace(/\/$/, '');
    const anonKey = supabaseAnonKey.value;
    const res = await fetch(sbUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const code = data.error_code || data.error || 'auth_error';
      const msg =
        data.error_description ||
        data.msg ||
        'Identifiants invalides. Réessaie.';
      loginError.textContent = msg + ' (' + code + ')';
      loginError.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
      return;
    }

    authToken = data.access_token;
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
    chrome.storage.local.set({
      authToken: data.access_token,
      authExpires: expiresAt,
      authEmail: data.user?.email || email,
    });

    // Reset UI : cacher le login, ré-analyser la page courante
    loginCard.style.display = 'none';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Se connecter';
    loginPassword.value = '';
    statusEl.style.display = '';
    if (actionsBar) actionsBar.style.display = '';
    loadBrands();
    extractFromPage();
  } catch (err) {
    loginError.textContent = 'Erreur réseau : ' + (err.message || err);
    loginError.style.display = 'block';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Se connecter';
  }
}

function showSuccessModal(result) {
  const baseUrl = backofficeUrl.value.replace(/\/$/, '');
  const p = result.product || {};
  const s = result.supplier;

  // Trouver les noms des marques sélectionnées (lookup dans availableBrands)
  const selectedBrandNames = Array.from(selectedBrandIds)
    .map(id => availableBrands.find(b => b.id === id)?.name)
    .filter(Boolean);

  successTitle.textContent = 'Produit importé';
  successSubtitle.textContent =
    'Le produit est ajouté dans le back-office Verone.';

  successSummary.innerHTML = '';

  const addSection = (title, rows) => {
    const h = document.createElement('h3');
    h.textContent = title;
    successSummary.appendChild(h);
    rows.forEach(([k, v]) => {
      if (!v) return;
      const row = document.createElement('div');
      row.className = 'row';
      const ke = document.createElement('span');
      ke.className = 'k';
      ke.textContent = k;
      const ve = document.createElement('span');
      ve.className = 'v';
      ve.textContent = v;
      row.appendChild(ke);
      row.appendChild(ve);
      successSummary.appendChild(row);
    });
  };

  addSection('Produit', [
    ['Nom', p.name],
    ['SKU', p.sku],
    ['Prix achat', p.cost_price ? p.cost_price + ' EUR' : null],
    [
      'Marques',
      selectedBrandNames.length > 0 ? selectedBrandNames.join(', ') : null,
    ],
    ['Photos', (p.images_count || 0) + ' image(s)'],
    ['Statut', 'Recherche fournisseur'],
  ]);

  if (s) {
    addSection(s.created ? 'Nouveau fournisseur' : 'Fournisseur existant', [
      ['Nom', s.name],
      ['Pays', s.country],
      ['Statut', s.created ? 'Créé maintenant' : 'Déjà en base'],
    ]);
  }

  successOpenBo.onclick = () => {
    chrome.tabs.create({ url: baseUrl + result.redirect_url });
  };

  // Masquer tout le reste, afficher le modal
  successModal.style.display = 'flex';
}

function showPageType(label, bg, color) {
  pageTypeEl.textContent = label;
  pageTypeEl.style.display = 'block';
  pageTypeEl.style.background = bg;
  pageTypeEl.style.color = color;
  pageTypeEl.style.border = '1px solid ' + color + '33';
}

function row(label, value) {
  return (
    '<span style="color:#6b7280;font-size:11px;">' +
    label +
    '</span><span style="color:#111;font-weight:500;">' +
    (value || '—') +
    '</span>'
  );
}

function addBadge(text, color) {
  const span = document.createElement('span');
  span.className = 'badge-tag ' + color;
  span.textContent = text;
  supplierBadges.appendChild(span);
}
