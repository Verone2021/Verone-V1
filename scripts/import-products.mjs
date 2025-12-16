#!/usr/bin/env node
/**
 * Script d'import des produits depuis le CSV Airtable
 * Usage: node scripts/import-products.mjs
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import pg from 'pg';

// Connection string Supabase Cloud
const DATABASE_URL = 'postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';

// Mapping fournisseurs (nom CSV -> ID DB)
const SUPPLIERS = {
  'Zentrada': '16ccbe2e-85e4-41ad-8d46-70520afc0fa1',
  '164 -   Zentrada': '16ccbe2e-85e4-41ad-8d46-70520afc0fa1',
  'Opjet': '9078f112-6944-4732-b926-f64dcef66034',
  '6 -   Opjet': '9078f112-6944-4732-b926-f64dcef66034',
  'Maisons Nomades': '435e0d9f-ee82-4127-b3ed-295888afb03c',
  '2 -   Maisons Nomades': '435e0d9f-ee82-4127-b3ed-295888afb03c',
  'Linhai Newlanston Arts And Crafts': '988ba9d8-1007-45b3-a311-0c88e75c5915',
  '1 -   Linhai Newlanston Arts And Crafts': '988ba9d8-1007-45b3-a311-0c88e75c5915',
  'Madeiragueda': 'e3fbda9e-175c-4710-bf50-55a31aa84616',
  '3 -   Madeiragueda': 'e3fbda9e-175c-4710-bf50-55a31aa84616',
  'DSA Menuiserie': 'd69b2362-d6ae-4705-9dd8-713df006bc38',
  '4 -   DSA Menuiserie': 'd69b2362-d6ae-4705-9dd8-713df006bc38',
  'Yunnan Yeqiu Technology Co': 'a85ca0c5-9c9a-4f36-b14b-05792140a2d9',
  '5 -   Yunnan Yeqiu Technology Co': 'a85ca0c5-9c9a-4f36-b14b-05792140a2d9',
  'Lecomptoir': 'f576275a-26bd-4be2-a8d3-ae4b77b59f60',
  '7 -   Lecomptoir': 'f576275a-26bd-4be2-a8d3-ae4b77b59f60',
};

// Mapping sous-catégories (nom CSV simplifié -> ID DB)
const SUBCATEGORIES = {
  // Éclairage
  'Suspension': '444487a0-a7fd-4854-95ac-bd98fca57455',
  'Suspension (luminaire suspendu)': '444487a0-a7fd-4854-95ac-bd98fca57455',
  '1 - Suspension (luminaire suspendu)': '444487a0-a7fd-4854-95ac-bd98fca57455',
  'Lampe de table': '066a2556-3e52-417e-8530-712f037dddf6',
  '2 - Lampe de table': '066a2556-3e52-417e-8530-712f037dddf6',
  'Lampadaire': 'bde1a455-b756-4e7f-8c00-38c8e6752ebc',
  '3 - Lampadaire': 'bde1a455-b756-4e7f-8c00-38c8e6752ebc',
  'Applique murale': '30a8b695-006f-4a95-9c70-69a07054b777',
  '4 - Applique murale': '30a8b695-006f-4a95-9c70-69a07054b777',
  'Ampoule': '8460c080-b9cf-4645-a187-c80e5f602acc',
  '5 - Ampoule': '8460c080-b9cf-4645-a187-c80e5f602acc',

  // Mobilier
  'Fauteuil': 'ac917138-2e47-41c6-8766-bcfa038ed944',
  '1 - Fauteuil': 'ac917138-2e47-41c6-8766-bcfa038ed944',
  'Chaise': 'a3925c42-2c23-443f-a75e-8b66f6411024',
  '2 - Chaise': 'a3925c42-2c23-443f-a75e-8b66f6411024',
  'Canapé': '35042527-89e1-4c27-b040-b267aa373d02',
  '3 - Canapé': '35042527-89e1-4c27-b040-b267aa373d02',
  'Table': 'b8cc3d8a-8fba-4b96-838a-a46a9f3a0228',
  '4 - Table': 'b8cc3d8a-8fba-4b96-838a-a46a9f3a0228',
  'Table basse': 'd84ae926-9826-4cde-83c5-f9f69a8b7286',
  '5 - Table basse': 'd84ae926-9826-4cde-83c5-f9f69a8b7286',
  "Table d'appoint": '7d4d3aa7-802e-427a-a200-171efd560000',
  "6 - Table d'appoint": '7d4d3aa7-802e-427a-a200-171efd560000',
  'Table de chevet': '465cdce0-5d90-4b4e-9f01-1d6342520c77',
  '7 - Table de chevet': '465cdce0-5d90-4b4e-9f01-1d6342520c77',
  'Banc & tabouret': 'a392f0d2-b643-4868-9ccc-2904ffe7bd1e',
  '8 - Banc & tabouret': 'a392f0d2-b643-4868-9ccc-2904ffe7bd1e',
  'Meuble console': '6fc33476-a09e-46fc-b149-8e96ecb85579',
  '9 - Meuble console': '6fc33476-a09e-46fc-b149-8e96ecb85579',

  // Objets décoratifs
  'Vase': '4a915a10-0099-439f-a512-09adf0088736',
  '1 - Vase': '4a915a10-0099-439f-a512-09adf0088736',
  'Miroir': 'd8bc0be9-acac-4360-a8b9-e3e222dd8d26',
  '2 - Miroir': 'd8bc0be9-acac-4360-a8b9-e3e222dd8d26',
  'Décoration murale': '5169cdbc-ba3c-4ee1-a28a-e61f87040e01',
  '2 - Décoration murale': '5169cdbc-ba3c-4ee1-a28a-e61f87040e01',
  'Tapis': '199c2371-9661-4e13-8eee-d83d4f776cd5',
  '4 - Tapis': '199c2371-9661-4e13-8eee-d83d4f776cd5',
  'Panier': '0ff5fd30-eed7-4999-8b94-412c15077a03',
  '5 - Panier': '0ff5fd30-eed7-4999-8b94-412c15077a03',

  // Linge de maison
  'Coussin': '67b3f161-b569-46ef-985c-7aebc153c980',
  '1 - Coussin': '67b3f161-b569-46ef-985c-7aebc153c980',

  // Plantes
  'Plantes artificielles': 'c117c493-1794-4d49-bd0d-6175af9d322e',
  '1 - Plantes artificielles': 'c117c493-1794-4d49-bd0d-6175af9d322e',
  'Fleurs séchées': 'feed8c6b-2736-4b56-ad92-fc30c88a678a',
  '2 - Fleurs séchées': 'feed8c6b-2736-4b56-ad92-fc30c88a678a',

  // Art de table
  'Verre': 'eca9a6d2-5f5e-4aef-8b8c-76b683a753b2',
  '1 - Verre': 'eca9a6d2-5f5e-4aef-8b8c-76b683a753b2',
  'Plateaux & Supports': '9dec49fa-1c35-453c-8354-d9c991cdf6a3',
  '2 - Plateaux & Supports': '9dec49fa-1c35-453c-8354-d9c991cdf6a3',
  'Coupelles / Ramequins': '78070433-234d-467d-bec2-a834c7116ed1',
  '3 - Coupelles / Ramequins': '78070433-234d-467d-bec2-a834c7116ed1',
  'Couverts de service': 'f98a9315-07d7-4059-a438-20501bf8a0fa',
  '4 - Couverts de service': 'f98a9315-07d7-4059-a438-20501bf8a0fa',
  'Accessoires de table': '5701e9ea-09f8-4405-a7d1-00b73edbcdb2',
  '5 - Accessoires de table': '5701e9ea-09f8-4405-a7d1-00b73edbcdb2',
  'Tasse à café': '06b400b8-1e46-4f78-bf26-f2881813e99b',
  '6 - Tasse à café': '06b400b8-1e46-4f78-bf26-f2881813e99b',
  'Pots à ustensiles': '800033ec-d1d5-439e-9f16-fcea70c2dd26',
  '7 - Pots à ustensiles': '800033ec-d1d5-439e-9f16-fcea70c2dd26',
  'Repose-cuillères': '09098812-2e0c-407f-887f-c9afa4faf674',
  '8 - Repose-cuillères': '09098812-2e0c-407f-887f-c9afa4faf674',

  // Accessoires
  'Pot': '4cdd8a3b-44e4-432a-9640-2bfc32cc74a7',
  'Set de table': 'aa310bf4-c950-4b09-8035-322f0a666f46',
};

// Mapping codes SKU par sous-catégorie
const SKU_CODES = {
  '444487a0-a7fd-4854-95ac-bd98fca57455': 'SUS', // Suspension
  '066a2556-3e52-417e-8530-712f037dddf6': 'LAM', // Lampe de table
  'bde1a455-b756-4e7f-8c00-38c8e6752ebc': 'LPD', // Lampadaire
  '30a8b695-006f-4a95-9c70-69a07054b777': 'APL', // Applique murale
  '8460c080-b9cf-4645-a187-c80e5f602acc': 'AMP', // Ampoule
  'ac917138-2e47-41c6-8766-bcfa038ed944': 'FAU', // Fauteuil
  'a3925c42-2c23-443f-a75e-8b66f6411024': 'CHA', // Chaise
  '35042527-89e1-4c27-b040-b267aa373d02': 'CAN', // Canapé
  'b8cc3d8a-8fba-4b96-838a-a46a9f3a0228': 'TAB', // Table
  'd84ae926-9826-4cde-83c5-f9f69a8b7286': 'TBA', // Table basse
  '7d4d3aa7-802e-427a-a200-171efd560000': 'TAP', // Table d'appoint
  '465cdce0-5d90-4b4e-9f01-1d6342520c77': 'TCH', // Table de chevet
  'a392f0d2-b643-4868-9ccc-2904ffe7bd1e': 'BAN', // Banc & tabouret
  '6fc33476-a09e-46fc-b149-8e96ecb85579': 'CON', // Meuble console
  '4a915a10-0099-439f-a512-09adf0088736': 'VAS', // Vase
  'd8bc0be9-acac-4360-a8b9-e3e222dd8d26': 'MIR', // Miroir
  '5169cdbc-ba3c-4ee1-a28a-e61f87040e01': 'DMU', // Décoration murale
  '199c2371-9661-4e13-8eee-d83d4f776cd5': 'TAP', // Tapis
  '0ff5fd30-eed7-4999-8b94-412c15077a03': 'PAN', // Panier
  '67b3f161-b569-46ef-985c-7aebc153c980': 'COU', // Coussin
  'c117c493-1794-4d49-bd0d-6175af9d322e': 'PLA', // Plantes artificielles
  'feed8c6b-2736-4b56-ad92-fc30c88a678a': 'FLS', // Fleurs séchées
  'eca9a6d2-5f5e-4aef-8b8c-76b683a753b2': 'VER', // Verre
  '9dec49fa-1c35-453c-8354-d9c991cdf6a3': 'PLS', // Plateaux & Supports
  '78070433-234d-467d-bec2-a834c7116ed1': 'CRA', // Coupelles / Ramequins
  'f98a9315-07d7-4059-a438-20501bf8a0fa': 'CVS', // Couverts de service
  '5701e9ea-09f8-4405-a7d1-00b73edbcdb2': 'ACT', // Accessoires de table
  '06b400b8-1e46-4f78-bf26-f2881813e99b': 'TCA', // Tasse à café
  '800033ec-d1d5-439e-9f16-fcea70c2dd26': 'PUT', // Pots à ustensiles
  '09098812-2e0c-407f-887f-c9afa4faf674': 'RCU', // Repose-cuillères
  '4cdd8a3b-44e4-432a-9640-2bfc32cc74a7': 'POT', // Pot
  'aa310bf4-c950-4b09-8035-322f0a666f46': 'SDT', // Set de table
};

// Compteurs SKU par code
const skuCounters = {};

function generateSku(subcategoryId) {
  const code = SKU_CODES[subcategoryId] || 'PRD';
  if (!skuCounters[code]) {
    skuCounters[code] = 0;
  }
  skuCounters[code]++;
  return `${code}-${String(skuCounters[code]).padStart(4, '0')}`;
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  // Remove currency symbols, spaces, and convert comma to dot
  const cleaned = priceStr.replace(/[€\s]/g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

function findSupplierId(supplierName) {
  if (!supplierName) return null;
  const name = supplierName.trim();
  return SUPPLIERS[name] || null;
}

function findSubcategoryId(subcategoryName) {
  if (!subcategoryName) return null;
  const name = subcategoryName.trim();
  return SUBCATEGORIES[name] || null;
}

function mapArticleType(typeArticle) {
  if (!typeArticle) return 'vente_de_marchandises';
  const type = typeArticle.toLowerCase().trim();
  if (type.includes('prestation') || type.includes('service')) {
    return 'prestations_de_services';
  }
  return 'vente_de_marchandises';
}

function mapProductStatus(statut, typeAchat) {
  if (statut?.toLowerCase() === 'sourcing') return 'draft';
  if (typeAchat?.toLowerCase() === 'sur commande') return 'preorder';
  return 'active';
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function importProducts() {
  const csvPath = path.join(process.cwd(), 'docs/assets/Catalogue Verone.csv');

  console.log('📂 Lecture du fichier CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relaxColumnCount: true,
    trim: true,
  });

  console.log(`📊 ${records.length} lignes trouvées dans le CSV`);

  // Connect to database
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✅ Connecté à la base de données');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const row of records) {
    try {
      const name = row['Name'] || row['Nom'];
      if (!name || name.trim() === '') {
        skipped++;
        continue;
      }

      const subcategoryName = row['Sous-catégorie'];
      const subcategoryId = findSubcategoryId(subcategoryName);

      const supplierName = row['Fournisseur'];
      const supplierId = findSupplierId(supplierName);

      const costPrice = parsePrice(row['Prix achat HT (indicatif)']);
      const articleType = mapArticleType(row["Type d'article"]);
      const productStatus = mapProductStatus(row['Statut'], row['Type achat']);

      const sku = generateSku(subcategoryId);
      const slug = generateSlug(name);

      // Build variant_attributes from CSV columns
      const variantAttributes = {};
      if (row['Couleur']) variantAttributes.couleur = row['Couleur'];
      if (row['Matières']) variantAttributes.matieres = row['Matières'];
      if (row['Pièces habitation ']) variantAttributes.pieces_habitation = row['Pièces habitation '];

      // Insert product
      const result = await client.query(`
        INSERT INTO products (
          name,
          slug,
          sku,
          subcategory_id,
          supplier_id,
          supplier_page_url,
          supplier_reference,
          cost_price,
          article_type,
          product_status,
          stock_status,
          completion_status,
          variant_attributes,
          weight,
          condition
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (sku) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          subcategory_id = EXCLUDED.subcategory_id,
          supplier_id = EXCLUDED.supplier_id,
          supplier_page_url = EXCLUDED.supplier_page_url,
          supplier_reference = EXCLUDED.supplier_reference,
          cost_price = EXCLUDED.cost_price,
          article_type = EXCLUDED.article_type,
          product_status = EXCLUDED.product_status,
          variant_attributes = EXCLUDED.variant_attributes,
          weight = EXCLUDED.weight,
          updated_at = NOW()
        RETURNING id
      `, [
        name.trim(),
        slug,
        sku,
        subcategoryId,
        supplierId,
        row['URL'] || null,
        row['Ref fournisseur'] || null,
        costPrice,
        articleType,
        productStatus,
        'out_of_stock',
        productStatus === 'draft' ? 'draft' : 'complete',
        Object.keys(variantAttributes).length > 0 ? JSON.stringify(variantAttributes) : null,
        parseFloat(row['Kg']) || null,
        'new'
      ]);

      inserted++;
      if (inserted % 50 === 0) {
        console.log(`  ⏳ ${inserted} produits importés...`);
      }
    } catch (err) {
      errors++;
      errorDetails.push({ row: row['Name'], error: err.message });
    }
  }

  await client.end();

  console.log('\n📊 RAPPORT D\'IMPORT');
  console.log('='.repeat(50));
  console.log(`✅ Produits importés : ${inserted}`);
  console.log(`⏭️  Lignes ignorées   : ${skipped}`);
  console.log(`❌ Erreurs           : ${errors}`);

  if (errorDetails.length > 0) {
    console.log('\n❌ Détails erreurs (5 premières):');
    errorDetails.slice(0, 5).forEach(e => {
      console.log(`   - ${e.row}: ${e.error}`);
    });
  }
}

// Run
importProducts().catch(console.error);
