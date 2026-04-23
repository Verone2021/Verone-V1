#!/usr/bin/env node
/**
 * Test live : reproduit exactement le payload createShipment de notre code,
 * avec et sans insurance, et vérifie les lignes price.items côté Packlink.
 *
 * Supprime automatiquement les shipments créés en fin de script.
 * À lancer depuis la racine du monorepo : node docs/scratchpad/test-packlink-insurance-fix.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_PATH = resolve(
  'apps/back-office/.env.local'
);
const envText = readFileSync(ENV_PATH, 'utf-8');
const API_KEY = envText
  .split('\n')
  .find(l => l.startsWith('PACKLINK_API_KEY='))
  ?.slice('PACKLINK_API_KEY='.length)
  ?.trim();
if (!API_KEY) {
  console.error('PACKLINK_API_KEY missing from', ENV_PATH);
  process.exit(1);
}

const BASE = 'https://api.packlink.com/v1';

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { ok: r.ok, status: r.status, body: json };
}

async function apiPro(path) {
  const r = await fetch(`https://api.packlink.com${path}`, {
    headers: {
      Authorization: API_KEY,
      'x-packlink-tenant-id': 'PACKLINKPROFR',
    },
  });
  return r.json();
}

// Reproduit client.createShipment avec contentValue param
async function createShipmentLikeOurCode(contentValue) {
  const warehouses = await api('GET', '/warehouses');
  const wh =
    warehouses.body.find(w => w.default_selection) ?? warehouses.body[0];

  const destZipList = await api(
    'GET',
    `/locations/postalcodes?language=fr_FR&postalzone=${wh.postal_zone.id}&q=13002&platform=PRO&platform_country=FR`
  );
  const destInfo = destZipList.body[0];

  // Services identiques à ce que le wizard sélectionne
  const svc = await api(
    'GET',
    `/services?from[country]=FR&from[zip]=91300&to[country]=FR&to[zip]=13002&packages[0][weight]=7.8&packages[0][width]=23&packages[0][height]=25&packages[0][length]=35`
  );
  // UPS Standard 21293 = service utilisé dans le shipment qui a produit l'incident
  // (home-to-home FR → FR, a montré INSURANCE 9.80€ sur contentvalue 326.55€)
  const ups = svc.body.find(s => s.id === 21293)
    ?? svc.body.find(s => s.carrier_name === 'UPS' && s.name?.trim() === 'Standard');
  if (!ups) {
    console.error('UPS Standard (21293) not available');
    console.error('Available UPS services:', svc.body.filter(s => s.carrier_name==='UPS').map(s => ({id: s.id, name: s.name})));
    process.exit(1);
  }
  console.log(`  using service: ${ups.id} ${ups.carrier_name} ${ups.name}`);

  const richPayload = {
    carrier: ups.carrier_name,
    service: ups.name,
    service_id: ups.id,
    adult_signature: false,
    additional_handling: false,
    insurance: { amount: 0, insurance_selected: false },
    print_in_store_selected: false,
    proof_of_delivery: false,
    priority: false,
    additional_data: {
      selectedWarehouseId: wh.id,
      postal_zone_id_from: wh.postal_zone.id,
      postal_zone_name_from: 'France',
      zip_code_id_from: wh.postal_code_id,
      postal_zone_id_to: String(destInfo.postal_zone_id),
      postal_zone_name_to: 'France',
      zip_code_id_to: destInfo.id,
      parcelIds: ['custom-parcel-id'],
    },
    content: 'Test insurance fix',
    contentvalue: contentValue,
    currency: 'EUR',
    from: {
      country: 'FR',
      zip_code: '91300',
      city: 'Massy',
      street1: '4 rue du Perou',
      phone: '+33600000000',
      email: 'contact@veronecollections.fr',
      name: 'Verone',
      surname: 'Collections',
      company: 'Verone',
      state: 'France',
    },
    packages: [
      {
        weight: 7.8,
        width: 23,
        height: 25,
        length: 35,
        id: 'custom-parcel-id',
        name: 'CUSTOM_PARCEL',
      },
    ],
    to: {
      country: 'FR',
      zip_code: '13002',
      city: 'Marseille',
      street1: '9 Quai du Lazaret',
      phone: '+33600000000',
      email: 'client@verone.fr',
      name: 'Test',
      surname: 'Fix',
      state: 'France',
    },
    has_customs: false,
    shipment_custom_reference: `TEST-FIX-${contentValue}`,
    collection_date: '2026/04/27',
    collection_time: '09:00-18:00',
  };

  const created = await api('POST', '/shipments', richPayload);
  return created.body?.reference;
}

async function inspectShipment(ref) {
  // Le breakdown price.items n'est exposé qu'au niveau /pro/shipments
  const pro = await apiPro(
    `/pro/shipments?inbox=READY_TO_PURCHASE`
  );
  const match = (pro.content || []).find(
    s => s?.data?.packlink_reference === ref
  );
  if (!match) {
    console.log(`  [${ref}] introuvable dans /pro/shipments, essai direct v1…`);
    const v1 = await api('GET', `/shipments/${ref}`);
    return { source: 'v1', data: v1.body };
  }
  return { source: 'pro', data: match.data };
}

async function main() {
  // Note: Packlink forces 3% × contentvalue as INSURANCE even when
  // insurance_selected=false. No payload flag overrides it. contentvalue=0
  // breaks the shipment (AWAITING_COMPLETION, invisible in PRO web). The fix
  // sends contentvalue=1 when the user opts out → INSURANCE drops to the
  // 0.99€ floor instead of 3% × declared value.
  console.log('=== TEST A : wantsInsurance=false → contentValue=1 (fix appliqué) ===');
  const refA = await createShipmentLikeOurCode(1);
  console.log(`  created: ${refA}`);
  // laisser Packlink calculer le prix (indexation /pro/shipments peut prendre plusieurs sec)
  await new Promise(r => setTimeout(r, 10000));
  const infoA = await inspectShipment(refA);
  const itemsA = infoA.data?.price?.items || [];
  console.log(`  price.total:`, infoA.data?.price?.total_price ?? infoA.data?.price?.total);
  console.log(`  price.items concepts:`, itemsA.map(i => `${i.concept}=${i.total_price}`).join(', ') || '(none)');
  const hasInsuranceA = itemsA.some(i => String(i.concept).toUpperCase() === 'INSURANCE');
  console.log(`  INSURANCE line present?`, hasInsuranceA ? '❌ OUI (fix KO)' : '✅ NON (fix OK)');

  console.log('');
  console.log('=== TEST B : wantsInsurance=true → contentValue=326.55 (comportement ancien) ===');
  const refB = await createShipmentLikeOurCode(326.55);
  console.log(`  created: ${refB}`);
  await new Promise(r => setTimeout(r, 10000));
  const infoB = await inspectShipment(refB);
  const itemsB = infoB.data?.price?.items || [];
  console.log(`  price.total:`, infoB.data?.price?.total_price ?? infoB.data?.price?.total);
  console.log(`  price.items concepts:`, itemsB.map(i => `${i.concept}=${i.total_price}`).join(', ') || '(none)');
  const hasInsuranceB = itemsB.some(i => String(i.concept).toUpperCase() === 'INSURANCE');
  console.log(`  INSURANCE line present?`, hasInsuranceB ? '✅ OUI (comportement opt-in attendu)' : '⚠ NON (pas de 3% forcé)');

  console.log('');
  console.log('=== CLEANUP ===');
  for (const ref of [refA, refB]) {
    const del = await api('DELETE', `/shipments/${ref}`);
    console.log(`  DELETE ${ref} → HTTP ${del.status}`);
  }

  console.log('');
  console.log('=== STATS ===');
  const stats = await apiPro('/pro/shipments/stats');
  console.log(`  ${JSON.stringify(stats)}`);

  const pass = !hasInsuranceA;
  console.log('');
  console.log(pass ? '✅ FIX VERIFIED' : '❌ FIX DID NOT WORK');
  process.exit(pass ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
