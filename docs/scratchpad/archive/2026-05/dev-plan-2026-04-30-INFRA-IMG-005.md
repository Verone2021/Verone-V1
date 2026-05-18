# Dev-plan — [INFRA-IMG-005] Cleanup Supabase Storage legacy (Phase code)

**Date** : 2026-04-30  
**Branche** : `feat/INFRA-IMG-005-cleanup-supabase-storage-legacy`  
**Suite de** : PR #837 [INFRA-IMG-004] (en draft)  
**Pré-requis** : aucun (TÂCHE 2 indépendante de TÂCHE 1)

## Contexte

Migration code uniquement — pas de migration SQL dans cette PR. La TÂCHE 3 (DROP column `public_url` + DELETE buckets) sera traitée dans une PR séparée après merge de celle-ci, car FEU ROUGE (migrations DB) et nécessite un audit row-by-row complet.

### Audit DB réalisé (2026-04-30 00h45)

| Table                  | Total | with cloudflare_image_id | Cible scope                                                  |
| ---------------------- | ----: | -----------------------: | :----------------------------------------------------------- |
| product_images         |   460 |               460 (100%) | ✅ Migrer code                                               |
| organisations.logo_url |   213 |                169 (79%) | ✅ Migrer code avec fallback                                 |
| consultation_images    |     3 |                        0 | ⏸️ Hors scope (1 row legacy à migrer manuellement plus tard) |
| collection_images      |     1 |                        0 | ⏸️ Hors scope                                                |
| linkme_selections      |     2 |                        – | ⏸️ Hors scope (colonne `cloudflare_image_id` manque)         |
| linkme_affiliates      |     3 |                        – | ⏸️ Hors scope (colonne `cloudflare_image_id` manque)         |

## Périmètre de la PR

4 fichiers code à modifier :

1. `packages/@verone/products/src/hooks/sourcing/use-sourcing-create-update.ts`
2. `apps/linkme/src/lib/hooks/use-product-images.ts`
3. `packages/@verone/common/src/hooks/use-simple-image-upload.ts`
4. `packages/@verone/organisations/src/components/OrganisationLogo.tsx` + `display/OrganisationLogo.tsx`

### Hors scope

- `image-upload-zone.tsx` (multi-bucket polyvalent, accepte PDFs)
- `use-selection-image.ts` (linkme) — besoin ALTER TABLE
- `use-linkme-public.ts` (bucket `logos` séparé)
- `DeliveryStep.tsx` + `submit-build-details.ts` (PDFs livraison, bucket à GARDER)
- `supabase-utils.ts` (helper bas niveau, conservé)

---

## Spécifications par fichier

### 1. `packages/@verone/products/src/hooks/sourcing/use-sourcing-create-update.ts`

**Lignes 82-115** — bloc d'upload + insert dans `product_images`.

**Avant** :

```ts
const { error: uploadError } = await supabase.storage
  .from('product-images')
  .upload(filePath, file);
if (uploadError) { console.error(...); continue; }
const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
await supabase.from('product_images').insert([{
  product_id: newProduct.id,
  public_url: publicUrl,
  storage_path: filePath,
  is_primary: i === 0,
  image_type: i === 0 ? 'primary' : 'gallery',
}]);
```

**Après** :

```ts
import { smartUploadImage } from '@verone/utils/upload';

try {
  const uploadResult = await smartUploadImage(file, {
    bucket: 'product-images',
    path: filePath,
    ownerId: newProduct.id,
    ownerType: 'product',
  });
  await supabase.from('product_images').insert([
    {
      product_id: newProduct.id,
      cloudflare_image_id: uploadResult.cloudflareImageId ?? null,
      public_url: uploadResult.supabasePublicUrl ?? null,
      storage_path: filePath,
      is_primary: i === 0,
      image_type: i === 0 ? 'primary' : 'gallery',
    },
  ]);
} catch (uploadErr) {
  console.error(`Erreur upload image ${i}:`, uploadErr);
  continue;
}
```

### 2. `apps/linkme/src/lib/hooks/use-product-images.ts`

**Lignes 105-117** — upload :

**Avant** :

```ts
const { data: _uploadData, error: uploadError } = await supabase.storage
  .from(BUCKET).upload(fileName, file, { ... });
if (uploadError) { throw new Error(...); }
```

**Après** :

```ts
import { smartUploadImage } from '@verone/utils/upload';
const uploadResult = await smartUploadImage(file, {
  bucket: BUCKET,
  path: fileName,
  ownerId: productId,
  ownerType: 'product',
});
```

**Lignes 121-124** — get public URL : SUPPRIMER, on n'a plus besoin (insert utilisera `cloudflare_image_id` + `public_url` directement depuis result).

**Lignes 149-162** — insert :

**Avant** :

```ts
const { data: imageRecord, error: insertError } = await supabase
  .from('product_images')
  .insert({
    product_id: productId,
    storage_path: fileName,
    public_url: publicUrl,
    is_primary: isPrimary,
    display_order: maxOrder + 1,
    created_by: user.id,
  });
```

**Après** :

```ts
const { data: imageRecord, error: insertError } = await supabase
  .from('product_images')
  .insert({
    product_id: productId,
    storage_path: fileName,
    cloudflare_image_id: uploadResult.cloudflareImageId ?? null,
    public_url: uploadResult.supabasePublicUrl ?? null,
    is_primary: isPrimary,
    display_order: maxOrder + 1,
    created_by: user.id,
  });
```

**Lignes 165-167 (cleanup en cas d'erreur insert)** : on tente seulement le cleanup Supabase (le cleanup Cloudflare nécessite server-side, à traiter dans TÂCHE future) :

```ts
if (insertError) {
  // Cleanup best-effort — Supabase seulement
  try {
    await supabase.storage.from(BUCKET).remove([fileName]);
  } catch (e) {
    console.warn('Cleanup Supabase échoué (non bloquant):', e);
  }
  // Note: si uploadResult.cloudflareImageId, l'image Cloudflare reste orpheline
  // (cleanup côté server requis, traité dans une TÂCHE séparée)
  console.error('Insert error:', insertError);
  throw new Error(`Erreur enregistrement: ${insertError.message}`);
}
```

**`useDeleteProductImage` (lignes 191-226)** : ne pas modifier — le delete Supabase reste valide. Cleanup Cloudflare orpheline est un sujet séparé.

### 3. `packages/@verone/common/src/hooks/use-simple-image-upload.ts`

**Aucune modif sur le upload** — il utilise déjà `smartUploadImage` (ligne 76).

**Modif sur le `deleteImage` (lignes 124-148)** : ajouter un commentaire WARN et garder l'implémentation actuelle. Le hook ne sait pas si l'image vit côté Cloudflare ou Supabase (juste un `filePath`). La complétion du cleanup Cloudflare nécessite une route API server-side, traitée plus tard.

```ts
const deleteImage = async (filePath: string): Promise<boolean> => {
  // Note: cette fonction supprime UNIQUEMENT le fichier Supabase.
  // Si l'image a été uploadée vers Cloudflare via smartUploadImage(),
  // elle restera orpheline côté Cloudflare. Cleanup full nécessite
  // route API server-side (TODO TÂCHE INFRA-IMG-006).
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    // ... reste inchangé
```

### 4. `packages/@verone/organisations/src/components/OrganisationLogo.tsx` (les 2 versions)

**Modif** : ajouter prop `cloudflareImageId?: string | null` et utiliser `buildCloudflareImageUrl` en priorité.

**Avant** :

```tsx
interface OrganisationLogoProps {
  logoUrl?: string | null;
  organisationName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: 'initials' | 'icon';
  className?: string;
}

// dans le body :
const publicUrl = logoUrl
  ? logoUrl.startsWith('http')
    ? logoUrl
    : supabase.storage.from('organisation-logos').getPublicUrl(logoUrl, {
        transform: { width, height, quality: 80 },
      }).data.publicUrl
  : null;
```

**Après** :

```tsx
import { buildCloudflareImageUrl, isCloudflareConfigured } from '@verone/utils';

interface OrganisationLogoProps {
  cloudflareImageId?: string | null;
  logoUrl?: string | null;
  organisationName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: 'initials' | 'icon';
  className?: string;
}

// dans le body :
let publicUrl: string | null = null;
if (cloudflareImageId && isCloudflareConfigured()) {
  try {
    publicUrl = buildCloudflareImageUrl(cloudflareImageId, 'public');
  } catch {
    publicUrl = null;
  }
}
if (!publicUrl && logoUrl) {
  publicUrl = logoUrl.startsWith('http')
    ? logoUrl
    : supabase.storage.from('organisation-logos').getPublicUrl(logoUrl, {
        transform: { width, height, quality: 80 },
      }).data.publicUrl;
}
```

**Important** : Le `transform` de Supabase ne s'applique pas aux URLs Cloudflare. C'est OK car Cloudflare gère son propre resize via les variants. Pour l'instant on utilise le variant `public` (taille originale). Optimisation future : créer des variants Cloudflare nommés `xs`/`sm`/`md`/`lg`/`xl`.

**Variante du composant côté `display/OrganisationLogo.tsx`** : appliquer la même logique. Les 2 fichiers ont une légère divergence (`xs` size, signature `organisationName`) — préserver les différences existantes.

**Adoption** : pour cette PR on AJOUTE la prop `cloudflareImageId`, on ne casse pas la signature existante (logoUrl reste optionnel). Les consommateurs qui passent `cloudflareImageId={org.cloudflare_image_id}` bénéficient automatiquement. Identifier les consommateurs (`grep -rn "OrganisationLogo"`) et mettre à jour les principaux pour passer `cloudflareImageId` quand la donnée est disponible.

---

## Tests obligatoires (Playwright MCP)

Avant commit, lancer un test E2E sur les flux critiques :

1. **Upload sourcing** — page `/produits/sourcing` → créer un produit avec image → vérifier dans DB que `cloudflare_image_id` est rempli + image affichée
2. **Upload image produit affilié (linkme)** — page produit linkme → ajouter image → vérifier DB + display
3. **Logo organisation** — page d'une org avec `cloudflare_image_id` → logo s'affiche via Cloudflare. Page d'une org sans CF (44 cas) → logo s'affiche via Supabase fallback
4. **Delete image produit** — supprimer une image → row removed + fichier Supabase supprimé (Cloudflare orphelin acceptable, traité plus tard)

Console : 0 erreur. Réseau : URLs `imagedelivery.net` pour les images migrées.

---

## Validation finale

- [ ] Type-check vert sur 3 apps + 4 packages (back-office, linkme, site-internet, ui, common, products, organisations)
- [ ] Build local back-office vert
- [ ] Tests E2E Playwright sur les 4 flux ci-dessus
- [ ] Aucun `select('*')` Supabase ajouté
- [ ] Aucune migration SQL dans cette PR
- [ ] Aucun fichier hors scope modifié
- [ ] Branche poussée + PR draft créée

---

## TÂCHES suivantes (après merge)

| TÂCHE         | Action                                                                      | Risque |
| ------------- | --------------------------------------------------------------------------- | ------ |
| INFRA-IMG-006 | DROP `public_url` sur `product_images` (460/460 OK)                         | FAIBLE |
| INFRA-IMG-007 | ALTER TABLE linkme_selections + linkme_affiliates ADD `cloudflare_image_id` | FAIBLE |
| INFRA-IMG-008 | Migration code use-selection-image + use-linkme-public                      | MOYEN  |
| INFRA-IMG-009 | Refactor image-upload-zone (multi-bucket smart)                             | MOYEN  |
| INFRA-IMG-010 | Migration data des 1+1+1 rows legacy non-CF + des 44 organisations sans CF  | MOYEN  |
| INFRA-IMG-011 | DELETE buckets product-images + organisation-logos quand 100% migré         | FAIBLE |
| INFRA-IMG-012 | Route API server-side pour cleanup Cloudflare orphelins                     | MOYEN  |
