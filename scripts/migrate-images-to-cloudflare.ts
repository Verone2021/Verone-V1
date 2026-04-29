#!/usr/bin/env node
/**
 * Script: migrate-images-to-cloudflare.ts
 *
 * Migre les images depuis Supabase Storage vers Cloudflare Images.
 * Les colonnes cloudflare_image_id doivent exister (migration 20260421_add_cloudflare_image_id.sql).
 *
 * USAGE:
 *   npx tsx scripts/migrate-images-to-cloudflare.ts [options]
 *
 * OPTIONS:
 *   --dry-run          Simule sans écrire (défaut: true)
 *   --no-dry-run       Exécute réellement la migration
 *   --table <name>     Filtre sur une table (product_images, categories, collections, organisations, families)
 *   --limit <n>        Limite le nombre de lignes à traiter (défaut: 50)
 *
 * EXEMPLES:
 *   npx tsx scripts/migrate-images-to-cloudflare.ts                             # dry-run, toutes tables, 50 lignes
 *   npx tsx scripts/migrate-images-to-cloudflare.ts --no-dry-run --limit 10    # 10 lignes réelles
 *   npx tsx scripts/migrate-images-to-cloudflare.ts --table product_images      # dry-run, produits uniquement
 *
 * REPRISE:
 *   Le script skip les lignes où cloudflare_image_id IS NOT NULL (déjà migrées).
 *
 * SORTIE CSV:
 *   stdout affiche chaque ligne au format: table,row_id,supabase_path,cloudflare_id,status,error
 *
 * PREREQUIS ENV VARS:
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_API_TOKEN, CLOUDFLARE_IMAGES_HASH
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (pour accès admin sans RLS)
 *
 * @since 2026-04-21
 */

import { createClient } from '@supabase/supabase-js';
import { uploadImageToCloudflare } from '../packages/@verone/utils/src/cloudflare/images.js';

// ============================================================================
// TYPES
// ============================================================================

interface MigrationRow {
  id: string;
  supabasePath: string | null;
  publicUrl: string | null;
  table: TableName;
}

type TableName =
  | 'product_images'
  | 'categories'
  | 'collections'
  | 'organisations'
  | 'families';

interface CsvResult {
  table: string;
  rowId: string;
  supabasePath: string;
  cloudflareId: string;
  status: 'ok' | 'error' | 'skipped' | 'dry-run';
  error: string;
}

// ============================================================================
// CONFIG TABLES
// ============================================================================

interface TableConfig {
  name: TableName;
  pathColumn: string;
  urlColumn: string;
}

const TABLE_CONFIGS: TableConfig[] = [
  {
    name: 'product_images',
    pathColumn: 'storage_path',
    urlColumn: 'public_url',
  },
  { name: 'categories', pathColumn: 'image_url', urlColumn: 'image_url' },
  { name: 'collections', pathColumn: 'image_url', urlColumn: 'image_url' },
  { name: 'organisations', pathColumn: 'logo_url', urlColumn: 'logo_url' },
  { name: 'families', pathColumn: 'image_url', urlColumn: 'image_url' },
];

// ============================================================================
// PARSE ARGS
// ============================================================================

function parseArgs(): {
  dryRun: boolean;
  table: TableName | null;
  limit: number;
} {
  const args = process.argv.slice(2);
  let dryRun = true;
  let table: TableName | null = null;
  let limit = 50;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--no-dry-run') dryRun = false;
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--table' && args[i + 1]) {
      table = args[i + 1] as TableName;
      i++;
    }
    if (arg === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1] ?? '50', 10);
      i++;
    }
  }

  return { dryRun, table, limit };
}

// ============================================================================
// FETCH ROWS CANDIDATES
// ============================================================================

async function fetchCandidateRows(
  supabase: ReturnType<typeof createClient>,
  config: TableConfig,
  limit: number
): Promise<MigrationRow[]> {
  const { data, error } = await supabase
    .from(config.name)
    .select(`id, ${config.urlColumn}`)
    .is('cloudflare_image_id', null)
    .not(config.urlColumn, 'is', null)
    .limit(limit);

  if (error) {
    console.error(`[${config.name}] Erreur fetch: ${error.message}`);
    return [];
  }

  return (data ?? []).map(
    (row: Record<string, unknown>) =>
      ({
        id: String(row['id'] ?? ''),
        supabasePath: row[config.urlColumn] as string | null,
        publicUrl: row[config.urlColumn] as string | null,
        table: config.name,
      }) satisfies MigrationRow
  );
}

// ============================================================================
// MIGRATE ONE ROW
// ============================================================================

async function migrateRow(
  supabase: ReturnType<typeof createClient>,
  row: MigrationRow,
  dryRun: boolean
): Promise<CsvResult> {
  const publicUrl = row.publicUrl;
  if (!publicUrl) {
    return {
      table: row.table,
      rowId: row.id,
      supabasePath: row.supabasePath ?? '',
      cloudflareId: '',
      status: 'skipped',
      error: 'public_url null',
    };
  }

  if (dryRun) {
    return {
      table: row.table,
      rowId: row.id,
      supabasePath: publicUrl,
      cloudflareId: '',
      status: 'dry-run',
      error: '',
    };
  }

  try {
    // 1. Télécharge depuis Supabase
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} lors du fetch de ${publicUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload vers Cloudflare
    const result = await uploadImageToCloudflare(buffer, {
      ownerId: row.id,
      ownerType: tableToOwnerType(row.table),
    });

    // 3. Update DB (ne supprime PAS le fichier Supabase — Phase 6)
    const { error: updateError } = await supabase
      .from(row.table)
      .update({ cloudflare_image_id: result.id })
      .eq('id', row.id);

    if (updateError) {
      throw new Error(`DB update échoué: ${updateError.message}`);
    }

    return {
      table: row.table,
      rowId: row.id,
      supabasePath: publicUrl,
      cloudflareId: result.id,
      status: 'ok',
      error: '',
    };
  } catch (err) {
    return {
      table: row.table,
      rowId: row.id,
      supabasePath: publicUrl,
      cloudflareId: '',
      status: 'error',
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}

function tableToOwnerType(
  table: TableName
): 'product' | 'category' | 'collection' | 'family' | 'organisation' {
  const map: Record<
    TableName,
    'product' | 'category' | 'collection' | 'family' | 'organisation'
  > = {
    product_images: 'product',
    categories: 'category',
    collections: 'collection',
    families: 'family',
    organisations: 'organisation',
  };
  return map[table];
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const { dryRun, table, limit } = parseArgs();

  // Validation env vars
  const supabaseUrl = process.env['SUPABASE_URL'];
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'ERREUR: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.'
    );
    process.exit(1);
  }

  const missingCfVars = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_IMAGES_API_TOKEN',
    'CLOUDFLARE_IMAGES_HASH',
  ].filter(k => !process.env[k]);

  if (!dryRun && missingCfVars.length > 0) {
    console.error(
      `ERREUR: Variables Cloudflare manquantes pour exécution réelle: ${missingCfVars.join(', ')}`
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const tablesToProcess = table
    ? TABLE_CONFIGS.filter(c => c.name === table)
    : TABLE_CONFIGS;

  if (tablesToProcess.length === 0) {
    console.error(`ERREUR: Table inconnue "${table ?? ''}".`);
    process.exit(1);
  }

  // En-tête CSV
  console.log('table,row_id,supabase_path,cloudflare_id,status,error');

  let totalOk = 0;
  let totalError = 0;
  let totalSkipped = 0;
  let totalDryRun = 0;

  for (const config of tablesToProcess) {
    const rows = await fetchCandidateRows(supabase, config, limit);

    for (const row of rows) {
      const result = await migrateRow(supabase, row, dryRun);

      // CSV output
      const line = [
        result.table,
        result.rowId,
        `"${result.supabasePath.replace(/"/g, '""')}"`,
        result.cloudflareId,
        result.status,
        `"${result.error.replace(/"/g, '""')}"`,
      ].join(',');
      console.log(line);

      if (result.status === 'ok') totalOk++;
      else if (result.status === 'error') totalError++;
      else if (result.status === 'skipped') totalSkipped++;
      else if (result.status === 'dry-run') totalDryRun++;
    }
  }

  // Résumé sur stderr pour ne pas polluer le CSV
  console.error(
    `\nRésumé — dryRun: ${String(dryRun)}, ok: ${totalOk}, erreurs: ${totalError}, ignorées: ${totalSkipped}, dry-run: ${totalDryRun}`
  );

  if (totalError > 0) {
    process.exit(1);
  }
}

void main().catch(err => {
  console.error('Erreur fatale:', err instanceof Error ? err.message : err);
  process.exit(1);
});
