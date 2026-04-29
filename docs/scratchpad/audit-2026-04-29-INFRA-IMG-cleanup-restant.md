# Audit — Travail Cloudflare Images RESTANT (post-INFRA-IMG-003)

**Date** : 2026-04-29
**Contexte** : 4 PRs Cloudflare Images mergées/en cours. Cette session a livré jusqu'à PR #836 (draft).
**Pour la prochaine session** : finaliser la migration et nettoyer l'héritage Supabase Storage.

---

## ✅ État actuel (fait dans les sessions précédentes)

| PR                       | Bloc                                                                                                                                                                                            | Statut                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **#700** [INFRA-IMG-001] | Helpers + DB migration + 629 images migrées                                                                                                                                                     | ✅ Mergée                  |
| **#835** [INFRA-IMG-002] | DNS Cloudflare + custom domain `images.veronecollections.fr` + 3 `next.config.js`                                                                                                               | ✅ Mergée                  |
| **#836** [INFRA-IMG-003] | 22 composants `<Image>` → `<CloudflareImage>` + DB extension (`consultation_images`, `collection_images`, `sourcing_photos`) + `buildCloudflareImageUrl` utilise `imagedelivery.net` par défaut | 🔄 **DRAFT — à compléter** |

**Coût mensuel infra Verone aujourd'hui** : 5 €/mois (Cloudflare Images) + 0 € Vercel + 0 € Supabase = **5 €/mois total**

**Bug 402 Vercel** : Résolu. `unoptimized: true` reste en place dans 2 next.config.js (back-office + site-internet).

**629 images** : servables dès maintenant via `https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/<image_id>/public`.

---

## ⏳ Bloqueur externe en attente

**Zone Cloudflare `veronecollections.fr`** : en cours de validation par Cloudflare (1-24h après ajout). Pas accélérable.

Une fois active :

- Cert SSL Universal émis automatiquement (15 min de plus)
- `https://images.veronecollections.fr/...` répondra HTTP 200
- **Action humaine requise** : changer 1 env var Vercel `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true` → Vercel redéploie auto → custom domain actif

**Surveillance** : `curl -I https://images.veronecollections.fr/a-LEt3vfWH1BG-ME-lftDA/c0e43d91-1dd3-4259-07ef-591761c99400/public` doit retourner HTTP 200.

---

## 🚧 Ce qu'il reste à faire (3 tâches)

### TÂCHE 1 — Retirer `unoptimized: true` proprement (30 min, FAIBLE risque)

**Pourquoi le faire** :

- Code propre qui ne dépend plus du flag global
- Vercel optimise les images Supabase qui restent en fallback (rares)

**Pourquoi NE PAS le faire** (et risque si fait mal) :

- Si on retire `unoptimized: true` global ET les `<Image>` qui pointent vers Cloudflare repassent par Vercel → consomme quota → bug 402 retour

**Solution propre** :

1. Modifier `packages/@verone/ui/src/components/ui/cloudflare-image.tsx` :
   ```tsx
   <Image
     src={src}
     alt={alt}
     // Si l'URL est Cloudflare, dire à Next.js de ne PAS re-optimiser
     unoptimized={src.includes('imagedelivery.net') || src.includes('images.veronecollections.fr')}
     ...
   />
   ```
2. Retirer `unoptimized: true` des 2 `next.config.js` (back-office + site-internet)
3. Tester sur preview Vercel : Network tab doit montrer 0 requête `/_next/image` pour les images Cloudflare

**Fichiers à modifier** :

- `packages/@verone/ui/src/components/ui/cloudflare-image.tsx`
- `apps/back-office/next.config.js`
- `apps/site-internet/next.config.js`

**Test critique** : avant merge, vérifier compteur Vercel Image Optimization Transformations dans le dashboard. Doit rester à 0 après 24h en preview.

**Branche suggérée** : `feat/INFRA-IMG-004-remove-unoptimized`

---

### TÂCHE 2 — Audit + adapter les 10 fichiers qui utilisent `supabase.storage.from()` direct (1-2h, MOYEN risque)

**Inventaire des fichiers** (audit grep fait dans cette session) :

```
packages/@verone/ui/src/components/ui/image-upload-zone.tsx
packages/@verone/products/src/hooks/sourcing/use-sourcing-create-update.ts
packages/@verone/utils/src/upload/supabase-utils.ts
packages/@verone/common/src/hooks/use-simple-image-upload.ts
packages/@verone/organisations/src/components/OrganisationLogo.tsx
packages/@verone/organisations/src/components/display/OrganisationLogo.tsx
apps/linkme/src/components/order-form/DeliveryStep.tsx
apps/linkme/src/lib/hooks/use-selection-image.ts
apps/linkme/src/lib/hooks/submit-build-details.ts
apps/linkme/src/lib/hooks/use-product-images.ts
```

**Pour chaque fichier**, vérifier l'usage :

| Type d'opération                               | Action requise                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `.upload()` (upload nouveau fichier)           | Remplacer par `smartUploadImage()` qui route Cloudflare                         |
| `.remove()` ou `.delete()` (supprimer fichier) | Si `cloudflare_image_id` set : appeler `deleteImageFromCloudflare()` à la place |
| `.getPublicUrl()` (générer URL)                | Remplacer par `buildCloudflareImageUrl()` si `cloudflare_image_id` présent      |
| `.list()` (lister fichiers d'un bucket)        | Utiliser API Cloudflare Images list à la place                                  |

**Buckets concernés** (à terme à supprimer) :

- `product-images` (539 fichiers, 331 MB)
- `family-images` (31 fichiers, 11 MB)
- `organisation-logos` (148 fichiers, 9.5 MB)
- `category-images` (6 fichiers, 3.5 MB)
- `collection-images` (2 fichiers, 700 KB)

**Buckets à GARDER** (non-images sensibles) :

- `justificatifs` (157 fichiers, 11 MB) — PDFs Qonto
- `linkme-delivery-forms` (4 fichiers, 504 KB) — PDFs livraison

**Branche suggérée** : `feat/INFRA-IMG-005-cleanup-supabase-storage-legacy`

**Risques** :

- Si un usage manqué → upload casse en prod
- Si `delete` mal géré → images orphelines (fichier Cloudflare mais row DB sans `cloudflare_image_id`)

**Mitigation** :

- Faire un test E2E complet upload + delete + display sur chaque module avant merge
- Garder les buckets pendant 1 semaine après merge en monitoring (rollback possible)

---

### TÂCHE 3 — Supprimer la colonne `public_url` + buckets Supabase (30 min, FAIBLE risque APRÈS Tâche 2)

**Pré-requis** : Tâche 2 doit être faite et mergée d'abord.

**Migration SQL** :

```sql
-- 1. Vérifier que toutes les rows ont cloudflare_image_id
SELECT COUNT(*) FROM product_images WHERE cloudflare_image_id IS NULL AND public_url IS NOT NULL;
-- Doit retourner 0 avant de DROP

-- 2. Supprimer la colonne (5 tables)
ALTER TABLE product_images DROP COLUMN public_url;
ALTER TABLE categories DROP COLUMN image_url;
ALTER TABLE collections DROP COLUMN image_url;
ALTER TABLE organisations DROP COLUMN logo_url;
ALTER TABLE families DROP COLUMN image_url;
ALTER TABLE consultation_images DROP COLUMN public_url;
ALTER TABLE collection_images DROP COLUMN public_url;
ALTER TABLE sourcing_photos DROP COLUMN public_url;

-- 3. Supprimer les fichiers Storage
DELETE FROM storage.objects WHERE bucket_id IN ('product-images', 'family-images', 'organisation-logos', 'category-images', 'collection-images');

-- 4. Supprimer les buckets
DELETE FROM storage.buckets WHERE id IN ('product-images', 'family-images', 'organisation-logos', 'category-images', 'collection-images');
```

**Action code** :

- Modifier `<CloudflareImage>` : supprimer le prop `fallbackSrc` (n'a plus de sens)
- Modifier les 22 composants migrés pour retirer `fallbackSrc={image.public_url}`
- Régénérer les types Supabase (`mcp__supabase__generate_typescript_types` + remplacer fichier)
- Bundler avec PR Tâche 2 OU PR séparée

**Branche suggérée** : Inclure dans `feat/INFRA-IMG-005` (Tâche 2 + 3 atomiques).

---

## 📋 Plan d'exécution suggéré pour la prochaine session

### Session 1 (1h)

1. **Activer le custom domain Cloudflare** (toggle env var Vercel) — quand zone active
2. **Tâche 1** — retirer `unoptimized: true` proprement
3. PR `[INFRA-IMG-004]` → merge

### Session 2 (3-4h, audit minutieux)

1. **Tâche 2** — audit + adapter les 10 fichiers `supabase.storage.from()`
2. **Tâche 3** — supprimer `public_url` + buckets
3. PR `[INFRA-IMG-005]` → merge

---

## ✅ Checklist finale post-cleanup complet

- [ ] `unoptimized: true` retiré des `next.config.js`
- [ ] Vercel Image Optim Transformations à 0 / 5K (compteur stable)
- [ ] Supabase Storage à 12 MB (justificatifs + linkme-delivery-forms uniquement)
- [ ] Aucun fichier ne fait `supabase.storage.from('product-images')` etc.
- [ ] Colonne `public_url` supprimée des 5 tables initiales + 3 ajoutées
- [ ] Composant `<CloudflareImage>` simplifié (plus de `fallbackSrc`)
- [ ] Types Supabase régénérés
- [ ] CI verte sur 2 PRs successives

---

## 🎯 Pourquoi ça vaut la peine (motivation)

**Aujourd'hui (post INFRA-IMG-003 mergée)** :

- ✅ 5 €/mois total
- ✅ Bug 402 résolu
- ✅ Images Cloudflare CDN mondial
- ⚠️ Code "split" : moitié Cloudflare, moitié Supabase Storage legacy

**Après INFRA-IMG-004 + 005** :

- ✅ Code 100 % Cloudflare pour les images
- ✅ Plus aucune dépendance Supabase Storage pour les images
- ✅ Économie marginale : ~355 MB sur Supabase Free Plan
- ✅ Code maintenable, sans dette technique

**Coût/Bénéfice** : ~5h de travail pour zéro régression et code propre. Vaut la peine si tu vises une code base saine pour les 12 prochains mois.

---

## 🚨 Quand un dev senior NE FERAIT PAS Tâches 2/3

- Si Verone scale rapidement (1000+ commandes/mois) → priorité = nouvelles features, pas dette tech
- Si Supabase Storage Free Plan ne risque pas d'être saturé (< 80%) → pas urgent
- Si le risque d'introduire un bug en cassant un upload est plus coûteux que le gain

**Pour Verone** (jeune app, dev solo) : **Faisable sans urgence**. Pourrait être reporté de 1-3 mois sans aucun impact business.

---

## Récap pour mémoire — Credentials Cloudflare

**Tous les credentials sont déjà configurés** :

- ✅ Dans les 3 `apps/*/.env.local` (gitignored, pour dev local)
- ✅ Dans Vercel Shared Environment Variables (liés aux 3 projets, Production + Preview)

**Variables disponibles** (valeurs non listées ici pour ne pas exposer les secrets) :

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN` (sensible — voir Vercel ou `.env.local`)
- `CLOUDFLARE_IMAGES_HASH`
- `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH`
- `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` — à set à `true` dans Vercel **quand zone Cloudflare est active**

**Pour récupérer les valeurs** :

1. Local : `cat apps/back-office/.env.local | grep CLOUDFLARE`
2. Prod : Vercel Dashboard → veronecollections-fr (ou autre projet) → Settings → Environment Variables → onglet Shared
