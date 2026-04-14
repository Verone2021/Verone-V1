/**
 * Verone Sourcing Import — Content Script
 *
 * Tourne sur les pages produit Alibaba et extrait les donnees structurees.
 * Communique avec le popup via chrome.runtime.onMessage.
 */

// ============================================================
// Extracteurs par plateforme
// ============================================================

function extractAlibabaProduct() {
  const data = {
    source_platform: 'alibaba',
    source_url: window.location.href,
    name: '',
    description: '',
    images: [],
    cost_price: null,
    moq: null,
    lead_days: null,
    price_tiers: [],
    supplier: null,
  };

  const text = document.body.innerText;

  // Nom du produit
  const h1 = document.querySelector('h1');
  data.name = h1
    ? h1.textContent.trim()
    : document.title.split(' - ')[0].trim();

  // Images produit (haute resolution)
  const imgs = document.querySelectorAll('img[src*="alicdn"]');
  const uniqueUrls = new Set();
  imgs.forEach(img => {
    const src = img.src || img.getAttribute('data-src');
    if (
      src &&
      src.includes('alicdn') &&
      !src.includes('icon') &&
      !src.includes('logo') &&
      !src.includes('svg')
    ) {
      // Convertir en haute resolution
      const hiRes = src.replace(/_\d+x\d+/, '').replace(/\.\d+x\d+\./, '.');
      uniqueUrls.add(hiRes);
    }
  });
  data.images = Array.from(uniqueUrls).slice(0, 10);

  // Prix — parser les paliers
  const priceElements = document.querySelectorAll('[class*="price"]');
  const priceTexts = Array.from(priceElements)
    .map(el => el.textContent.trim())
    .filter(Boolean);

  // Extraire les prix numeriques
  const pricePattern = /(\d+[.,]\d+)\s*[€$]/g;
  const prices = [];
  priceTexts.forEach(pt => {
    let match;
    while ((match = pricePattern.exec(pt)) !== null) {
      prices.push(parseFloat(match[1].replace(',', '.')));
    }
  });

  if (prices.length > 0) {
    data.cost_price = Math.min(...prices);
  }

  // MOQ
  const moqMatch = text.match(
    /(?:MOQ|Min(?:imum)?\s*Order|Commande minimum)[:\s]*(\d+)/i
  );
  if (moqMatch) {
    data.moq = parseInt(moqMatch[1]);
  }

  // Delai de production
  const leadMatch = text.match(
    /(?:Lead Time|Delai|Production)[:\s]*(\d+)\s*(?:jours|days)/i
  );
  if (leadMatch) {
    data.lead_days = parseInt(leadMatch[1]);
  }

  // Fournisseur
  const supplierData = extractAlibabaSupplier();
  if (supplierData) {
    data.supplier = supplierData;
  }

  return data;
}

function extractAlibabaSupplier() {
  const text = document.body.innerText;
  const supplier = {
    name: '',
    country: '',
    alibaba_store_url: '',
    response_rate: '',
    response_time: '',
    supplier_score: null,
    trade_assurance: false,
    verified: false,
    certifications: [],
  };

  // Nom du fournisseur
  const companyLinks = document.querySelectorAll('a[href*=".en.alibaba.com"]');
  for (const link of companyLinks) {
    const linkText = link.textContent.trim();
    if (
      linkText.length > 3 &&
      linkText.length < 100 &&
      !linkText.includes('http')
    ) {
      supplier.name = linkText;
      supplier.alibaba_store_url = link.href.split('?')[0];
      break;
    }
  }

  // Si pas trouve, chercher dans les elements company
  if (!supplier.name) {
    const companyEls = document.querySelectorAll('[class*="company"]');
    for (const el of companyEls) {
      const t = el.textContent.trim();
      if (t.length > 5 && t.length < 80 && t.includes('Co.')) {
        supplier.name = t;
        break;
      }
    }
  }

  // Pays
  const countryMatch = text.match(
    /(?:Pays|Country|region)\s*[:/]\s*([^\n,]+)/i
  );
  if (countryMatch) {
    supplier.country = countryMatch[1].trim();
  }

  // Taux de reponse
  const rateMatch = text.match(
    /(?:Taux de réponse|Response Rate)\s*[:\s]*(\d+\.?\d*%?)/i
  );
  if (rateMatch) {
    supplier.response_rate = rateMatch[1];
  }

  // Temps de reponse
  const timeMatch = text.match(
    /(?:Temps de réponse|Response Time)\s*[:\s]*([^\n]+)/i
  );
  if (timeMatch) {
    supplier.response_time = timeMatch[1].trim().substring(0, 20);
  }

  // Score
  const scoreMatch = text.match(
    /(\d\.\d)\s*(?:\/\s*5|Très satisfait|Very satisfied)/i
  );
  if (scoreMatch) {
    supplier.supplier_score = parseFloat(scoreMatch[1]);
  }

  // Trade Assurance
  supplier.trade_assurance = text.toLowerCase().includes('trade assurance');

  // Verified
  supplier.verified = text.includes('Verified') || text.includes('Vérifié');

  // Certifications
  const certPatterns = [
    'CE',
    'RoHS',
    'LVD',
    'UL',
    'FCC',
    'ISO',
    'SGS',
    'BSCI',
    'SA8000',
  ];
  certPatterns.forEach(cert => {
    if (text.includes(cert)) {
      supplier.certifications.push(cert);
    }
  });

  return supplier.name ? supplier : null;
}

// ============================================================
// Extracteur generique (Open Graph + JSON-LD)
// ============================================================

function extractGenericProduct() {
  const data = {
    source_platform: 'other',
    source_url: window.location.href,
    name: '',
    description: '',
    reference: '',
    images: [],
    cost_price: null,
    moq: null,
    lead_days: null,
    price_tiers: [],
    supplier: null,
  };

  const text = document.body.innerText;

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogDescription = document.querySelector(
    'meta[property="og:description"]'
  );
  const ogPrice = document.querySelector(
    'meta[property="product:price:amount"], meta[property="og:price:amount"]'
  );
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');

  data.name = ogTitle
    ? ogTitle.content.split('|')[0].trim()
    : document.title.split('|')[0].split('-')[0].trim();
  data.description = ogDescription ? ogDescription.content.trim() : '';
  if (ogImage) data.images.push(ogImage.content);
  if (ogPrice) data.cost_price = parseFloat(ogPrice.content);

  // JSON-LD (schema.org Product) — handle @graph arrays
  const ldScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  ldScripts.forEach(script => {
    try {
      const json = JSON.parse(script.textContent);
      const items = json['@graph'] ? json['@graph'] : [json];
      items.forEach(item => {
        if (item['@type'] === 'Product') {
          if (item.name) data.name = item.name;
          if (item.description)
            data.description = item.description.substring(0, 500);
          if (item.sku) data.reference = item.sku;
          if (item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            data.images = [
              ...data.images,
              ...imgs.map(i => (typeof i === 'string' ? i : i.url || '')),
            ]
              .filter(Boolean)
              .slice(0, 10);
          }
          if (item.offers) {
            const offer = Array.isArray(item.offers)
              ? item.offers[0]
              : item.offers;
            if (offer && offer.price) {
              data.cost_price = parseFloat(offer.price);
            }
          }
          if (item.brand && item.brand.name) {
            data.brand = item.brand.name;
          }
        }
      });
    } catch (_e) {
      // Ignore invalid JSON-LD
    }
  });

  // Reference / SKU depuis le texte (si pas trouve en JSON-LD)
  if (!data.reference) {
    const refMatch = text.match(
      /(?:R[eé]f|Ref|SKU|Code article|Reference)[.\s:]*([A-Z0-9\-]{4,20})/i
    );
    if (refMatch) data.reference = refMatch[1];
  }

  // Prix depuis le texte (si pas trouve en OG/JSON-LD)
  if (!data.cost_price) {
    const priceEls = document.querySelectorAll(
      '[class*="price"], .oe_currency_value, [itemprop="price"]'
    );
    for (const el of priceEls) {
      const match = el.textContent.match(/(\d+[.,]\d{2})/);
      if (match) {
        data.cost_price = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }
  }

  // Description depuis le DOM (si OG description est vide ou trop courte)
  if (!data.description || data.description.length < 20) {
    const descEl = document.querySelector(
      '[itemprop="description"], .product_description, [class*="description"]'
    );
    if (descEl) {
      const descText = descEl.textContent.trim();
      if (descText.length > 20) data.description = descText.substring(0, 500);
    }
  }

  // Images produit — recherche specifique pour Odoo et autres CMS
  const productImgs = document.querySelectorAll(
    '.carousel img, [class*="product"] img, [itemprop="image"]'
  );
  productImgs.forEach(img => {
    let src = img.src || img.getAttribute('data-src') || '';
    if (
      src &&
      !src.includes('lazy_load') &&
      !src.includes('icon') &&
      !src.includes('logo') &&
      !src.includes('placeholder')
    ) {
      // Convertir en haute resolution pour Odoo
      src = src
        .replace('image_128', 'image_1024')
        .replace('image_256', 'image_1024')
        .replace('image_512', 'image_1024');
      if (!data.images.includes(src)) data.images.push(src);
    }
  });

  // Fallback: grandes images dans la page
  if (data.images.length === 0) {
    document.querySelectorAll('img[src]').forEach(img => {
      if (
        img.naturalWidth > 200 &&
        img.naturalHeight > 200 &&
        data.images.length < 5
      ) {
        data.images.push(img.src);
      }
    });
  }

  data.images = data.images.slice(0, 12);

  // Fournisseur depuis le nom du site
  if (ogSiteName && ogSiteName.content) {
    data.supplier = { name: ogSiteName.content.trim() };
  }

  return data;
}

// ============================================================
// Extraction fournisseur seul (page entreprise Alibaba)
// ============================================================

function extractAlibabaSupplierOnly() {
  const text = document.body.innerText;
  const supplier = {
    name: '',
    country: '',
    city: '',
    address: '',
    alibaba_store_url: window.location.href.split('?')[0],
    year_established: null,
    employees: '',
    response_rate: '',
    response_time: '',
    supplier_score: null,
    trade_assurance: false,
    verified: false,
    certifications: [],
    specialties: [],
    delivery_terms: '',
  };

  // Nom du fournisseur — h1 ou premier element company
  const h1 = document.querySelector('h1');
  if (h1) {
    supplier.name = h1.textContent.trim();
  }
  if (!supplier.name) {
    const companyEls = document.querySelectorAll('[class*="company"]');
    for (const el of companyEls) {
      const t = el.textContent.trim();
      if (t.length > 5 && t.length < 80 && t.includes('Co.')) {
        supplier.name = t;
        break;
      }
    }
  }

  // Pays / Region
  const countryMatch = text.match(
    /(?:Pays\s*\/\s*r[eé]gion|Country\s*\/\s*Region)\s*\n?\s*([^\n]+)/i
  );
  if (countryMatch) supplier.country = countryMatch[1].trim();

  // Adresse usine
  const factoryMatch = text.match(
    /(?:Lieu de l'usine|Factory Location)\s*\n?\s*([^\n]+)/i
  );
  if (factoryMatch) supplier.address = factoryMatch[1].trim();

  // Annee de creation
  const yearMatch = text.match(
    /(?:Ann[eé]e de cr[eé]ation|Year Established)\s*\n?\s*(\d{4})/i
  );
  if (yearMatch) supplier.year_established = parseInt(yearMatch[1]);

  // Nombre d'employes
  const empMatch = text.match(
    /(?:Nombre d'employ[eé]s total|Total Employees)\s*\n?\s*([^\n]+)/i
  );
  if (empMatch) supplier.employees = empMatch[1].trim();

  // Taux de reponse
  const rateMatch = text.match(
    /(?:Taux de r[eé]ponse|Response Rate)\s*\n?\s*(\d+\.?\d*%?)/i
  );
  if (rateMatch) supplier.response_rate = rateMatch[1];

  // Temps de reponse
  const timeMatch = text.match(
    /(?:Temps de r[eé]ponse|Response Time)\s*\n?\s*([^\n]+)/i
  );
  if (timeMatch) supplier.response_time = timeMatch[1].trim().substring(0, 20);

  // Score
  const scoreMatch = text.match(
    /(\d\.\d)\s*(?:\/\s*5|Tr[eè]s satisfait|Very satisfied)/i
  );
  if (scoreMatch) supplier.supplier_score = parseFloat(scoreMatch[1]);

  // Trade Assurance
  supplier.trade_assurance = text.toLowerCase().includes('trade assurance');

  // Verified
  supplier.verified = text.includes('Verified') || text.includes('Vérifié');

  // Certifications
  ['CE', 'RoHS', 'LVD', 'UL', 'FCC', 'ISO', 'SGS', 'BSCI', 'SA8000'].forEach(
    cert => {
      if (text.includes(cert)) supplier.certifications.push(cert);
    }
  );

  // Incoterms / Conditions de livraison
  const deliveryMatch = text.match(
    /(?:Conditions de livraison accept[eé]es|Delivery Terms)\s*\n?\s*([^\n]+)/i
  );
  if (deliveryMatch) supplier.delivery_terms = deliveryMatch[1].trim();

  return supplier;
}

// ============================================================
// Detecter le type de page
// ============================================================

function detectPageType() {
  const url = window.location.href;

  if (url.includes('alibaba.com/product-detail')) {
    return 'alibaba_product';
  }
  if (
    url.includes('alibaba.com/company_profile') ||
    (url.includes('.en.alibaba.com') && !url.includes('/product-detail'))
  ) {
    return 'alibaba_supplier';
  }
  if (url.includes('1688.com/offer/')) {
    return 'alibaba_product';
  }

  // Site generique
  return 'generic_product';
}

function detectAndExtract() {
  const pageType = detectPageType();

  if (pageType === 'alibaba_product') {
    return { pageType, ...extractAlibabaProduct() };
  }
  if (pageType === 'alibaba_supplier') {
    return { pageType, supplier: extractAlibabaSupplierOnly() };
  }

  // Generique
  return { pageType, ...extractGenericProduct() };
}

// ============================================================
// Listener pour le popup
// ============================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractProduct') {
    const data = detectAndExtract();
    sendResponse({ success: true, data });
  }
  return true; // Keep the message channel open for async response
});
