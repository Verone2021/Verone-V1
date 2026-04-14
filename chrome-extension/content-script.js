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
    images: [],
    cost_price: null,
    moq: null,
    lead_days: null,
    price_tiers: [],
    supplier: null,
  };

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogDescription = document.querySelector(
    'meta[property="og:description"]'
  );
  const ogPrice = document.querySelector(
    'meta[property="product:price:amount"], meta[property="og:price:amount"]'
  );

  data.name = ogTitle ? ogTitle.content : document.title.split(' - ')[0].trim();
  data.description = ogDescription ? ogDescription.content : '';
  if (ogImage) data.images.push(ogImage.content);
  if (ogPrice) data.cost_price = parseFloat(ogPrice.content);

  // JSON-LD (schema.org Product)
  const ldScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  ldScripts.forEach(script => {
    try {
      const json = JSON.parse(script.textContent);
      const product = json['@type'] === 'Product' ? json : null;
      if (product) {
        if (product.name) data.name = product.name;
        if (product.description)
          data.description = product.description.substring(0, 500);
        if (product.image) {
          const imgs = Array.isArray(product.image)
            ? product.image
            : [product.image];
          data.images = [...data.images, ...imgs].slice(0, 10);
        }
        if (product.offers) {
          const offer = Array.isArray(product.offers)
            ? product.offers[0]
            : product.offers;
          if (offer && offer.price) {
            data.cost_price = parseFloat(offer.price);
          }
        }
      }
    } catch (_e) {
      // Ignore invalid JSON-LD
    }
  });

  // Fallback: chercher des images produit dans la page
  if (data.images.length === 0) {
    const mainImages = document.querySelectorAll('img[src]');
    mainImages.forEach(img => {
      if (
        img.naturalWidth > 200 &&
        img.naturalHeight > 200 &&
        data.images.length < 5
      ) {
        data.images.push(img.src);
      }
    });
  }

  return data;
}

// ============================================================
// Detecter la plateforme et extraire
// ============================================================

function detectAndExtract() {
  const url = window.location.href;

  if (
    url.includes('alibaba.com/product-detail') ||
    url.includes('alibaba.com/company_profile')
  ) {
    return extractAlibabaProduct();
  }

  // Fallback generique (fonctionne sur la plupart des sites e-commerce)
  return extractGenericProduct();
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
