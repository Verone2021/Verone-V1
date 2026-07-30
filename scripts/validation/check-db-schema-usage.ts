#!/usr/bin/env tsx
/**
 * check-db-schema-usage.ts — [BO-AUDIT-004]
 *
 * Detecte les valeurs envoyees a PostgreSQL qui n'existent pas dans le schema :
 * colonnes fantomes et valeurs d'enum invalides.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * `scripts/check-db-type-alignment.ts` (npm: validate:types) annonce dans son
 * en-tete detecter les « colonnes inexistantes dans schema » et les « enums
 * hardcodes ». Verifie le 2026-07-30 : il ne le fait pas. Sur 950 diagnostics
 * emis, 273 sont « Query Supabase sans type » et zero concerne une colonne
 * fantome ou un enum invalide.
 *
 * Or c'est precisement cette classe de defaut qui produit les pannes les plus
 * couteuses, parce qu'elles echouent a l'execution et non a la compilation :
 *
 *   1. useCompleteProductWizard.ts envoie `status: 'coming_soon'` a la table
 *      `products`, qui n'a pas de colonne `status` (elle a product_status,
 *      stock_status, sourcing_status, completion_status). PostgREST repond
 *      PGRST204 et le wizard « Nouveau produit complet » ne peut rien
 *      enregistrer.
 *   2. GeneralInfoSection.tsx propose la valeur `backorder` pour
 *      availability_type, dont l'enum vaut normal|preorder|coming_soon|
 *      discontinued. Choisir cette option fait echouer tout l'enregistrement.
 *   3. supplier-segment-select.tsx propose TACTICAL et OPERATIONAL pour
 *      supplier_segment, absents de l'enum. Deux des quatre options du select
 *      cassent la sauvegarde du fournisseur.
 *
 * Aucun de ces trois defauts n'est visible pour `tsc`, ni pour ESLint, ni pour
 * `next build`. Ce sont les trois seuls garde-fous d'un merge sur ce depot.
 *
 * SOURCE DE VERITE : packages/@verone/types/src/supabase.ts (genere depuis la
 * base par `pnpm generate:types`). Si ce fichier est perime, ce script ment —
 * d'ou le controle de fraicheur en fin d'execution.
 *
 * USAGE
 *   pnpm tsx scripts/validation/check-db-schema-usage.ts
 *   pnpm tsx scripts/validation/check-db-schema-usage.ts --ci      # exit 1 si erreurs
 *   pnpm tsx scripts/validation/check-db-schema-usage.ts --json
 *
 * DEUX NIVEAUX DE CONFIANCE — voir la section « Confiance » en fin de fichier.
 * Seules les ecritures DB directes (detections A et B) pilotent le code de
 * sortie. Il n'y a volontairement PAS de baseline : la version initiale en
 * avait une, elle ensevelissait de vrais bugs de production. Detail et
 * justification dans cette meme section.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TYPES_FILE = path.join(ROOT, 'packages/@verone/types/src/supabase.ts');
const SCAN_DIRS = [
  'apps/back-office/src',
  'apps/linkme/src',
  'apps/site-internet/src',
  'packages/@verone',
];

const args = new Set(process.argv.slice(2));
const CI = args.has('--ci');
const JSON_OUT = args.has('--json');

type Finding = {
  kind: 'unknown-column' | 'invalid-enum-value';
  file: string;
  line: number;
  table?: string;
  column?: string;
  enumName?: string;
  value?: string;
  detail: string;
  suggestion?: string;
};

// ---------------------------------------------------------------------------
// 1. Extraction du schema depuis les types generes
// ---------------------------------------------------------------------------

type Schema = {
  tables: Map<string, Set<string>>; // table -> colonnes (Insert + Row)
  enums: Map<string, Set<string>>; // nom d'enum -> valeurs
  columnEnum: Map<string, string>; // "table.colonne" -> nom d'enum
};

function extractSchema(src: string): Schema {
  const tables = new Map<string, Set<string>>();
  const enums = new Map<string, Set<string>>();
  const columnEnum = new Map<string, string>();

  // --- Enums ---
  // Deux formats produits par le generateur, selon la longueur de la ligne :
  //   app_type: 'back-office' | 'site-internet' | 'linkme';
  //   availability_type_enum:
  //     | 'normal'
  //     | 'preorder';
  // On capture donc du nom jusqu'au `;`, puis on extrait les litteraux. Les
  // quotes sont SIMPLES dans ce depot (prettier), pas doubles — on accepte
  // les deux pour rester robuste a un changement de configuration.
  const enumsBlockStart = src.indexOf('Enums: {');
  if (enumsBlockStart !== -1) {
    const blockEnd = src.indexOf('\n    CompositeTypes', enumsBlockStart);
    const block = src.slice(
      enumsBlockStart,
      blockEnd === -1 ? enumsBlockStart + 200_000 : blockEnd
    );
    const re = /^\s{6}(\w+):\s*([^;]+);/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
      const values = [...m[2].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
      if (values.length) enums.set(m[1], new Set(values));
    }
  }

  // --- Tables : chaque `      table_name: {` puis son bloc Row/Insert ---
  const tablesBlockStart = src.indexOf('Tables: {');
  if (tablesBlockStart === -1) return { tables, enums, columnEnum };

  const tableRe = /^ {6}(\w+): \{$/gm;
  const region = src.slice(tablesBlockStart);
  const matches = [...region.matchAll(tableRe)];

  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1];
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : region.length;
    const body = region.slice(start, end);

    const cols = new Set<string>();
    // Colonnes des blocs Row et Insert : `          col_name: type`
    for (const blockName of ['Row: {', 'Insert: {']) {
      const bs = body.indexOf(blockName);
      if (bs === -1) continue;
      const be = body.indexOf('\n        }', bs);
      const block = body.slice(bs, be === -1 ? undefined : be);
      // Le type d'une colonne peut s'etaler sur plusieurs lignes quand prettier
      // le juge trop long :
      //   supplier_segment:
      //     | Database['public']['Enums']['supplier_segment_type']
      //     | null;
      // On capture donc du nom de colonne jusqu'au `;`, sinon on manque
      // exactement les colonnes enum nullables — celles qui comptent le plus.
      const colRe = /^\s{10}(\w+)(\??):\s*([^;]*);/gm;
      let cm: RegExpExecArray | null;
      while ((cm = colRe.exec(block))) {
        cols.add(cm[1]);
        // Colonne typee par un enum ? On memorise pour les detections B et C.
        // Quotes simples dans ce depot : Database['public']['Enums']['x'].
        const enumRef = cm[3].match(
          /Database\[['"]public['"]\]\[['"]Enums['"]\]\[['"](\w+)['"]\]/
        );
        if (enumRef) columnEnum.set(`${name}.${cm[1]}`, enumRef[1]);
      }
    }
    if (cols.size) tables.set(name, cols);
  }

  return { tables, enums, columnEnum };
}

// ---------------------------------------------------------------------------
// 2. Parcours des fichiers
// ---------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ['node_modules', '.next', 'dist', '.turbo', '__tests__'].includes(
          entry.name
        )
      )
        continue;
      walk(p, out);
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    ) {
      out.push(p);
    }
  }
  return out;
}

/** Extrait les cles de premier niveau d'un litteral objet, en ignorant l'imbrication. */
function topLevelKeys(objectBody: string): { key: string; offset: number }[] {
  const keys: { key: string; offset: number }[] = [];
  let depth = 0;
  let inString: string | null = null;
  let atKeyPosition = true;

  for (let i = 0; i < objectBody.length; i++) {
    const c = objectBody[i];
    const prev = objectBody[i - 1];

    if (inString) {
      if (c === inString && prev !== '\\') inString = null;
      continue;
    }
    // Les commentaires doivent etre sautes AVANT la detection de cle.
    // [BO-AUDIT-004] 2026-07-30 — sans ca, `// FIXED: utilisation du vrai prix`
    // etait lu comme la cle `FIXED` (faux positif sur
    // packages/@verone/stock/src/hooks/use-stock-dashboard.ts:68).
    if (c === '/' && objectBody[i + 1] === '/') {
      const nl = objectBody.indexOf('\n', i);
      i = nl === -1 ? objectBody.length : nl;
      continue;
    }
    if (c === '/' && objectBody[i + 1] === '*') {
      const end = objectBody.indexOf('*/', i + 2);
      i = end === -1 ? objectBody.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      continue;
    }
    if (c === '{' || c === '[' || c === '(') {
      depth++;
      continue;
    }
    if (c === '}' || c === ']' || c === ')') {
      depth--;
      continue;
    }
    if (depth !== 0) continue;
    if (c === ',') {
      atKeyPosition = true;
      continue;
    }
    if (c === ':') {
      atKeyPosition = false;
      continue;
    }

    if (atKeyPosition && /[A-Za-z_]/.test(c)) {
      const m = objectBody.slice(i).match(/^(\w+)\s*:/);
      if (m) {
        keys.push({ key: m[1], offset: i });
        atKeyPosition = false;
        i += m[1].length;
      }
    }
  }
  return keys;
}

/** Retourne le corps d'un litteral objet a partir de la position de son `{`. */
function objectBodyAt(src: string, braceIndex: number): string | null {
  let depth = 0;
  let inString: string | null = null;
  for (let i = braceIndex; i < src.length; i++) {
    const c = src[i];
    const prev = src[i - 1];
    if (inString) {
      if (c === inString && prev !== '\\') inString = null;
      continue;
    }
    // Meme raison que dans topLevelKeys : une accolade dans un commentaire
    // fausserait le comptage de profondeur.
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(braceIndex + 1, i);
    }
    if (i - braceIndex > 20000) return null; // garde-fou
  }
  return null;
}

const lineAt = (src: string, index: number) =>
  src.slice(0, index).split('\n').length;

function similar(target: string, candidates: Iterable<string>): string[] {
  const t = target.toLowerCase();
  return [...candidates]
    .filter(c => {
      const l = c.toLowerCase();
      return (
        l.includes(t) ||
        t.includes(l) ||
        l.replace(/_/g, '') === t.replace(/_/g, '')
      );
    })
    .slice(0, 4);
}

// ---------------------------------------------------------------------------
// 3. Detections
// ---------------------------------------------------------------------------

function analyse(file: string, src: string, schema: Schema): Finding[] {
  const findings: Finding[] = [];
  const rel = path.relative(ROOT, file);

  // --- DETECTION A : colonnes inconnues dans .insert()/.update()/.upsert() ---
  // On resout la table par le `.from('x')` qui precede dans la meme chaine.
  const mutationRe = /\.(insert|update|upsert)\s*\(\s*(\[\s*)?\{/g;
  let m: RegExpExecArray | null;
  while ((m = mutationRe.exec(src))) {
    const braceIndex = src.indexOf('{', m.index + m[0].length - 1);
    const body = objectBodyAt(src, braceIndex);
    if (!body) continue;

    // Table : dernier .from('...') dans les 1500 caracteres precedents
    const before = src.slice(Math.max(0, m.index - 1500), m.index);
    const froms = [
      ...before.matchAll(/\.from(?:<[^>]*>)?\s*\(\s*['"`](\w+)['"`]/g),
    ];
    if (!froms.length) continue;
    const table = froms[froms.length - 1][1];
    const cols = schema.tables.get(table);
    if (!cols) continue; // table inconnue du schema : hors perimetre de ce check

    for (const { key, offset } of topLevelKeys(body)) {
      if (cols.has(key)) continue;
      if (key === 'onConflict') continue;
      const near = similar(key, cols);
      findings.push({
        kind: 'unknown-column',
        file: rel,
        line: lineAt(src, braceIndex + 1 + offset),
        table,
        column: key,
        detail: `La table \`${table}\` n'a pas de colonne \`${key}\`. PostgREST repondra PGRST204 a l'execution.`,
        suggestion: near.length
          ? `Colonnes proches : ${near.join(', ')}`
          : undefined,
      });
    }
  }

  // --- DETECTION B : valeur d'enum invalide DANS une ecriture DB -------------
  // Contrainte de conception : on ne cherche PAS `colonne: 'valeur'` dans tout
  // le fichier. Le nom `status` existe dans une dizaine de tables avec des
  // enums differents, et un `status: 'active'` dans un etat React local n'est
  // pas une ecriture en base. Une premiere version le faisait et produisait
  // 6 faux positifs par occurrence.
  // Ici on reste dans les mutations reperees par la detection A : la table est
  // connue, donc l'enum applicable l'est aussi, sans ambiguite.
  mutationRe.lastIndex = 0;
  while ((m = mutationRe.exec(src))) {
    const braceIndex = src.indexOf('{', m.index + m[0].length - 1);
    const body = objectBodyAt(src, braceIndex);
    if (!body) continue;

    const before = src.slice(Math.max(0, m.index - 1500), m.index);
    const froms = [
      ...before.matchAll(/\.from(?:<[^>]*>)?\s*\(\s*['"`](\w+)['"`]/g),
    ];
    if (!froms.length) continue;
    const table = froms[froms.length - 1][1];

    for (const { key, offset } of topLevelKeys(body)) {
      const enumName = schema.columnEnum.get(`${table}.${key}`);
      if (!enumName) continue;
      const allowed = schema.enums.get(enumName);
      if (!allowed) continue;

      // Valeur litterale immediatement apres la cle ?
      const after = body.slice(offset + key.length);
      const lit = after.match(/^\s*:\s*['"]([^'"]+)['"]/);
      if (!lit) continue; // variable, ternaire, appel : hors portee
      const value = lit[1];
      if (allowed.has(value)) continue;

      const casing =
        allowed.has(value.toLowerCase()) || allowed.has(value.toUpperCase());
      findings.push({
        kind: 'invalid-enum-value',
        file: rel,
        line: lineAt(src, braceIndex + 1 + offset),
        table,
        column: key,
        enumName,
        value,
        detail: casing
          ? `Ecriture sur \`${table}.${key}\` : \`${value}\` a la mauvaise casse pour l'enum \`${enumName}\`. Postgres refusera la valeur.`
          : `Ecriture sur \`${table}.${key}\` : \`${value}\` n'existe pas dans l'enum \`${enumName}\`. L'INSERT/UPDATE echouera (22P02).`,
        suggestion: `Valeurs valides : ${[...allowed].join(' | ')}`,
      });
    }
  }

  // --- DETECTION C : select d'interface proposant une valeur refusee par la base
  // Cible le motif exact des bugs `backorder` et `TACTICAL`/`OPERATIONAL` : un
  // <SelectItem value="x"> dont la valeur n'est pas dans l'enum de la colonne.
  // Pour eviter le bruit, on n'agit que si le nom de la colonne enum apparait
  // dans le fichier ET que ce nom est associe a UN SEUL enum dans tout le
  // schema. Sinon on ne peut pas savoir quel enum s'applique.
  if (/SelectItem|<option/.test(src)) {
    // Index inverse : nom de colonne -> ensemble des enums qui l'utilisent.
    const byColumn = new Map<string, Set<string>>();
    for (const [tableCol, enumName] of schema.columnEnum) {
      const col = tableCol.split('.')[1];
      if (!byColumn.has(col)) byColumn.set(col, new Set());
      byColumn.get(col)!.add(enumName);
    }

    // Un fichier contient souvent PLUSIEURS selects (ex. GeneralInfoSection a
    // un select `condition` et un select `availability_type`). Il faut donc
    // rattacher chaque groupe d'options a SA colonne, sinon on signale les
    // options de `condition` comme invalides pour `availability_type`.
    // Ancrage retenu : le nom de champ le plus proche EN AMONT, cherche dans
    // `value={formData.X}`, `onValueChange={v => handleChange('X', …)}`,
    // `id="X"`, `name="X"` ou `htmlFor="X"`.
    const anchorRe =
      /(?:formData\.(\w+)|handleChange\(\s*['"](\w+)['"]|\b(?:id|name|htmlFor)=["'](\w+)["'])/g;
    const anchors: { pos: number; field: string }[] = [];
    let an: RegExpExecArray | null;
    while ((an = anchorRe.exec(src))) {
      anchors.push({ pos: an.index, field: an[1] ?? an[2] ?? an[3] });
    }
    const fieldBefore = (pos: number): string | null => {
      let best: string | null = null;
      for (const a of anchors) {
        if (a.pos > pos) break;
        if (pos - a.pos < 900) best = a.field;
      }
      return best;
    };

    // Deux formes d'options : le JSX <SelectItem value="x">, et le tableau de
    // configuration `{ value: 'X' as Type, label: … }` — c'est cette seconde
    // forme qu'utilise supplier-segment-select.tsx.
    const optionRes = [
      /<(?:SelectItem|option)\b[^>]*?value=(?:["']|\{["'])([A-Za-z_][\w-]*)["']/g,
      /\bvalue:\s*['"]([A-Za-z_][\w-]*)['"]/g,
    ];

    for (const [column, enumSet] of byColumn) {
      if (enumSet.size !== 1) continue; // nom ambigu : on s'abstient
      if (!new RegExp(`\\b${column}\\b`).test(src)) continue; // colonne absente du fichier
      const enumName = [...enumSet][0];
      const allowed = schema.enums.get(enumName)!;

      for (const re of optionRes) {
        re.lastIndex = 0;
        let vm: RegExpExecArray | null;
        while ((vm = re.exec(src))) {
          const value = vm[1];
          if (allowed.has(value)) continue;
          if (
            [
              'none',
              'all',
              'default',
              'placeholder',
              'other',
              'autre',
            ].includes(value.toLowerCase())
          )
            continue;

          // Ce groupe d'options appartient-il bien a cette colonne ?
          const anchored = fieldBefore(vm.index);
          if (anchored && anchored !== column) continue;
          // Pour la forme tableau, sans ancrage on exige que le fichier soit
          // manifestement dedie a cette colonne (son nom dans le nom du fichier
          // ou dans un type/constante), pour ne pas ratisser large.
          if (
            !anchored &&
            !new RegExp(column.replace(/_/g, '[-_]?'), 'i').test(rel)
          )
            continue;

          const casing = allowed.has(value.toLowerCase());
          findings.push({
            kind: 'invalid-enum-value',
            file: rel,
            line: lineAt(src, vm.index),
            column,
            enumName,
            value,
            detail: casing
              ? `Ce select propose \`${value}\`, mais l'enum \`${enumName}\` attend \`${value.toLowerCase()}\`. Choisir cette option fera echouer l'enregistrement.`
              : `Ce select propose \`${value}\`, absent de l'enum \`${enumName}\` (colonne \`${column}\`). Choisir cette option fera echouer l'enregistrement.`,
            suggestion: `Valeurs valides : ${[...allowed].join(' | ')}`,
          });
        }
      }
    }
  }

  // --- DETECTION D : payload de mutation passe indirectement ------------------
  // Beaucoup de mutations ne passent pas par `.from('x').insert({…})` mais par
  // un hook : `const productData = { … }; await createProduct(productData)`.
  // La detection A ne les voit pas, et `tsc` non plus quand le hook accepte un
  // type large. C'est le cas du bug le plus couteux de l'audit : le wizard
  // « Nouveau produit complet » envoie `status: 'coming_soon'` a `products`,
  // qui n'a pas de colonne `status` — PGRST204, wizard totalement inoperant.
  //
  // Heuristique : pour chaque litteral objet d'au moins 6 cles, on cherche la
  // table dont les colonnes couvrent le mieux ces cles. Si la couverture
  // depasse 80 %, on considere que ce bloc EST un payload pour cette table, et
  // on signale les cles restantes. Le seuil est volontairement haut : un objet
  // de props React ne ressemble pas a 80 % aux colonnes d'une table.
  // `\s*` avant le `=` : sans lui, `const productData = {` ne matche pas (le
  // nom de variable n'est pas colle au signe egal). Bug de la premiere version,
  // qui faisait manquer precisement le payload du wizard produit.
  //
  // [BO-AUDIT-004] 2026-07-30 — restriction aux variables nommees. La premiere
  // version matchait aussi `=> ({` et `return {`, ce qui signalait les objets
  // de PRESENTATION construits depuis un resultat de query (`.map(p => ({ id,
  // name, sku, stock_real, cost_price, product_image_url }))`). Ces objets
  // ressemblent forcement a 80 % aux colonnes de la table dont ils viennent :
  // faux positifs garantis (3 cas dans @verone/stock). Un vrai payload est
  // presque toujours une variable nommee `xxxData` / `xxxPayload` / `xxxUpdate`,
  // ce qui est aussi le cas du wizard produit que cette detection vise.
  const objRe = /(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*\{/g;
  const payloadName =
    /(?:data|payload|insert|update|values|record|row|fields)$/i;
  let om: RegExpExecArray | null;
  while ((om = objRe.exec(src))) {
    if (!payloadName.test(om[1])) continue;
    const braceIndex = src.indexOf('{', om.index + om[0].length - 1);
    const body = objectBodyAt(src, braceIndex);
    if (!body) continue;

    const keys = topLevelKeys(body);
    if (keys.length < 6) continue;
    const keyNames = keys.map(k => k.key);

    let bestTable: string | null = null;
    let bestHits = 0;
    for (const [table, cols] of schema.tables) {
      let hits = 0;
      for (const k of keyNames) if (cols.has(k)) hits++;
      if (hits > bestHits) {
        bestHits = hits;
        bestTable = table;
      }
    }
    if (!bestTable) continue;

    const coverage = bestHits / keyNames.length;
    if (coverage < 0.8 || bestHits < 6) continue; // pas assez ressemblant
    if (coverage === 1) continue; // rien a signaler

    const cols = schema.tables.get(bestTable)!;
    for (const { key, offset } of keys) {
      if (cols.has(key)) continue;
      const near = similar(key, cols);
      findings.push({
        kind: 'unknown-column',
        file: rel,
        line: lineAt(src, braceIndex + 1 + offset),
        table: bestTable,
        column: key,
        detail:
          `Cet objet ressemble a un payload pour \`${bestTable}\` (${bestHits}/${keyNames.length} cles ` +
          `correspondent a ses colonnes), mais \`${key}\` n'en est pas une. Si cet objet part vers la base ` +
          `— directement ou via un hook — PostgREST repondra PGRST204.`,
        suggestion: near.length
          ? `Colonnes proches : ${near.join(', ')}`
          : undefined,
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// 4. Execution
// ---------------------------------------------------------------------------

if (!fs.existsSync(TYPES_FILE)) {
  console.error(
    `Types generes introuvables : ${TYPES_FILE}\nLancer d'abord : pnpm generate:types`
  );
  process.exit(1);
}

const typesSrc = fs.readFileSync(TYPES_FILE, 'utf8');
const schema = extractSchema(typesSrc);

if (schema.tables.size === 0 || schema.enums.size === 0) {
  console.error(
    'Extraction du schema vide — le format de supabase.ts a change. Ce script doit etre adapte.'
  );
  process.exit(1);
}

const files = SCAN_DIRS.flatMap(d => walk(path.join(ROOT, d)));
const all: Finding[] = [];
for (const f of files) {
  try {
    all.push(...analyse(f, fs.readFileSync(f, 'utf8'), schema));
  } catch {
    /* fichier illisible : ignore */
  }
}

// ---------------------------------------------------------------------------
// Confiance — remplace la baseline
// ---------------------------------------------------------------------------
// [BO-AUDIT-004] 2026-07-30 — la premiere version verrouillait l'existant dans
// une baseline, comme `supabase-advisors-check.py`. Mauvaise idee ici : apres
// resserrage de la detection D, il ne reste que ~40 signalements, dont une
// trentaine sont de VRAIS bugs de production verifies un par un contre la base
// (`information_schema.columns`). Une baseline les aurait ensevelis — exactement
// le defaut reproche a la baseline advisors (719 anomalies acceptees).
//
// A la place, on separe par niveau de confiance :
//
//   HAUTE       detections A et B — colonne ou valeur d'enum ecrite dans un
//               `.insert()` / `.update()` / `.upsert()` explicitement rattache a
//               une table. Zero ambiguite : la table est nommee dans le meme
//               chainage. Precision mesuree : 100 % sur les 34 cas du
//               2026-07-30 (chacun confirme contre la base).
//
//   A VERIFIER  detections C et D — heuristiques. C rattache une option de
//               `<Select>` a une colonne par proximite dans le JSX, et se
//               trompe quand un formulaire porte a la fois `app` et `role`
//               (5 faux positifs). D devine qu'un litteral objet est un payload
//               par ressemblance a 80 % avec une table, et se trompe sur les
//               objets de formulaire qui contiennent des champs UI
//               (`imageFiles`, `items`, `family_id`).
//
// Seule la categorie HAUTE pilote le code de sortie. La categorie A VERIFIER
// reste affichee — elle a une valeur reelle (c'est elle qui a trouve le bug du
// wizard produit) — mais elle ne bloque personne.
const LOW_CONFIDENCE = /^(Ce select propose|Cet objet ressemble)/;
const isHigh = (f: Finding) => !LOW_CONFIDENCE.test(f.detail);

const high = all.filter(isHigh);
const toCheck = all.filter(f => !isHigh(f));

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        schema: { tables: schema.tables.size, enums: schema.enums.size },
        total: all.length,
        haute_confiance: high.length,
        a_verifier: toCheck.length,
        findings: all,
      },
      null,
      2
    )
  );
  process.exit(CI && high.length ? 1 : 0);
}

console.log(
  `\nSchema lu : ${schema.tables.size} tables, ${schema.enums.size} enums, ${schema.columnEnum.size} colonnes typees par un enum`
);
console.log(`Fichiers analyses : ${files.length}\n`);

function report(title: string, list: Finding[]) {
  if (!list.length) return;
  console.log(`\x1b[1m\x1b[4m${title}\x1b[0m\n`);
  const groups = new Map<string, Finding[]>();
  for (const f of list) {
    if (!groups.has(f.file)) groups.set(f.file, []);
    groups.get(f.file)!.push(f);
  }
  for (const [file, items] of [...groups].sort()) {
    console.log(`\x1b[1m${file}\x1b[0m`);
    for (const f of items.sort((a, b) => a.line - b.line)) {
      const tag =
        f.kind === 'unknown-column'
          ? 'COLONNE INEXISTANTE'
          : 'VALEUR ENUM INVALIDE';
      console.log(`  ${file}:${f.line}  [${tag}]`);
      console.log(`    ${f.detail}`);
      if (f.suggestion) console.log(`    → ${f.suggestion}`);
    }
    console.log();
  }
}

report(`BLOQUANT — ecriture DB impossible (${high.length})`, high);
report(
  `A VERIFIER — heuristique, faux positifs possibles (${toCheck.length})`,
  toCheck
);

console.log('─'.repeat(76));
console.log(
  `${high.filter(f => f.kind === 'unknown-column').length} colonne(s) inexistante(s) et ` +
    `${high.filter(f => f.kind === 'invalid-enum-value').length} valeur(s) d'enum invalide(s) en ecriture directe. ` +
    `${toCheck.length} signalement(s) heuristique(s) a verifier.`
);

// Controle de fraicheur : des types perimes rendraient ce script menteur.
const ageDays = (Date.now() - fs.statSync(TYPES_FILE).mtimeMs) / 86_400_000;
if (ageDays > 30) {
  console.log(
    `\n⚠️  ${TYPES_FILE.split('/').pop()} date de ${Math.round(ageDays)} jours. Lancer \`pnpm generate:types\` : ce script ne vaut que ce que valent les types.`
  );
}

if (CI && high.length) {
  console.log(
    "\n❌ Ecritures DB impossibles detectees. Ces erreurs echouent a l'EXECUTION, pas au build : ni tsc, ni ESLint, ni next build ne les voient."
  );
  process.exit(1);
}
console.log(all.length === 0 ? '\n✅ Aucune anomalie.' : '');
