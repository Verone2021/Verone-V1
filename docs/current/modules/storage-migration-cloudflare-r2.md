# Migration Supabase Storage → Cloudflare R2

**Status** : PLAN — à exécuter quand Romeo aura du temps (~1-2 jours de travail)  
**Priorité** : Haute (blocage récurrent quota Supabase egress)  
**Sprint ticket** : `[BO-STORAGE-001]` (à créer dans ACTIVE.md)

---

## 1. Pourquoi migrer

### Problème actuel

- Supabase Storage applique un **quota d'egress** (bande passante sortante) par plan :
  - Free : 5 GB/mois
  - Pro ($25/mois) : 250 GB/mois puis $0.09/GB
- Au-delà du quota, Supabase renvoie **HTTP 402 Payment Required** → les images ne s'affichent plus
- Incident constaté le 2026-04-20 : images consultations/produits cassées en prod sans prévenir
- Si Verone publie massivement sur Meta / Google Catalog / Pinterest → explosion imprévisible de la facture

### Pourquoi Cloudflare R2

- **Zéro frais d'egress** (0€ quel que soit le volume téléchargé)
- Prix storage très bas : $0.015 / GB / mois
- CDN mondial inclus
- Compatible API S3 (migration scriptable)
- Cloudflare Images en complément : $5/mois pour 100K images + transformations auto (WebP/AVIF, crop smart, tailles multiples)

### Estimation coût Verone (après migration)

Hypothèse : 500 produits × 5 photos (1 MB moyen) = 2.5 GB + 200 consultations × 3 photos = 0.6 GB = **~3 GB total**.

| Poste                                    | Coût mensuel   |
| ---------------------------------------- | -------------- |
| Cloudflare R2 storage (3 GB)             | $0.05          |
| Cloudflare Images (100K transformations) | $5.00          |
| **Total**                                | **~$5 / mois** |

vs Supabase Pro $25/mois (et toujours un cap egress).

---

## 2. Architecture cible

```
┌──────────────────────┐   Upload    ┌──────────────────────┐
│  Back-office (Next)  │────────────▶│   Cloudflare R2      │
└──────────────────────┘             │   (stockage origine) │
          │                          └──────────────────────┘
          │ URL publique                       │
          ▼                                    │
┌──────────────────────┐                      │
│   Cloudflare Images  │◀─────────────────────┘
│   (CDN + transforms) │   variantes WebP/AVIF auto
└──────────────────────┘
          │
          │ URL  https://images.verone.fr/...
          ▼
┌──────────────────────┐
│  Site-internet       │  <Image src={url} />
│  Back-office         │
│  Facebook / Google   │
└──────────────────────┘
```

### URLs

- Ancien : `https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/xxx.jpg`
- Nouveau : `https://images.verone.fr/xxx.jpg` (R2 + Cloudflare DNS)
- Avec transforms : `https://images.verone.fr/cdn-cgi/image/width=800,format=webp/xxx.jpg`

---

## 3. Plan de migration (7 étapes)

### Étape 1 — Préparation Cloudflare (30 min)

1. Créer compte Cloudflare si pas déjà fait
2. Ajouter le domaine `verone.fr` à Cloudflare (changement des NS)
3. Créer un bucket R2 `verone-images`
4. Générer une clé API R2 (read + write)
5. Activer Cloudflare Images (addon $5/mois)
6. Créer le sous-domaine custom `images.verone.fr` → R2 bucket

### Étape 2 — Inventaire des buckets Supabase (1h)

Lister tous les buckets + tables qui référencent des URLs images :

```sql
-- Tables à auditer (à enrichir via une passe grep du codebase)
SELECT 'product_images' AS source, public_url FROM product_images
UNION ALL
SELECT 'consultation_images' AS source, public_url FROM consultation_images
UNION ALL
SELECT 'organisation_logos' AS source, logo_url FROM organisations WHERE logo_url LIKE '%supabase.co%'
-- ajouter les autres tables
;
```

Buckets Supabase recensés (à confirmer) :

- `product-images`
- `consultation-images`
- `organisation-logos`
- `product-documents` (PDFs fiches techniques)
- `user-avatars` (si existant)

### Étape 3 — Script de migration (1 journée)

Créer `scripts/migrate-storage-to-r2.ts` :

1. Pour chaque bucket Supabase :
   - Lister tous les objets via `supabase.storage.from(bucket).list()`
   - Télécharger chaque fichier
   - Uploader vers R2 avec la même structure de path
   - Mettre à jour la table correspondante (UPDATE colonne URL)
2. Batch par 100 fichiers avec logs + retry automatique
3. Mode `dry-run` pour tester avant d'exécuter

### Étape 4 — Dual-write temporaire (0.5 jour)

Pour éviter toute rupture de service pendant la migration :

1. Modifier tous les hooks d'upload dans le code :
   - Continuer à uploader vers Supabase (inchangé)
   - - uploader en parallèle vers R2
2. Les URLs servies restent Supabase pendant la phase de migration
3. Permet un rollback instantané si problème R2

Fichiers concernés (à confirmer via grep) :

- `packages/@verone/products/src/components/images/hooks/use-product-image-upload.ts`
- `packages/@verone/consultations/src/components/images/hooks/use-consultation-image-upload.ts`
- `packages/@verone/organisations/src/components/forms/use-org-logo-upload.ts`

### Étape 5 — Exécution migration en prod (0.5 jour)

1. Snapshot DB Supabase avant migration (point de rollback)
2. Exécuter `scripts/migrate-storage-to-r2.ts --env=production`
3. Durée estimée : ~30 min pour 3 GB (dépend du débit)
4. Vérifier côté R2 que tous les objets sont présents + hash MD5 identique

### Étape 6 — Bascule lecture (0.5 jour)

1. Modifier les helpers qui construisent les URLs (1 ou 2 fonctions centrales) :
   ```ts
   // Avant
   const getPublicUrl = path =>
     `https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/${path}`;
   // Après
   const getPublicUrl = path => `https://images.verone.fr/${path}`;
   ```
2. Déployer en staging → tester que tout s'affiche
3. Déployer en prod (staging → main)

### Étape 7 — Nettoyage (après 1 semaine de prod stable)

1. Retirer le dual-write (uploads uniquement R2)
2. Supprimer les fichiers Supabase Storage (après backup externe par sécurité)
3. Passer Supabase en plan Free (gain $25/mois)

---

## 4. Rollback

Si problème détecté après la bascule lecture :

1. Revert le commit qui change les URLs (1 ligne)
2. Redéployer staging → main
3. Les fichiers Supabase sont encore là → service reprend immédiatement

Temps rollback : ~5 minutes.

---

## 5. Dépendances et risques

### Dépendances externes

- Compte Cloudflare (à créer ou existant)
- DNS `verone.fr` accessible pour ajouter le sous-domaine
- Décision paiement Cloudflare Images $5/mois

### Risques identifiés

| Risque                                                      | Probabilité | Impact                          | Mitigation                                                 |
| ----------------------------------------------------------- | ----------- | ------------------------------- | ---------------------------------------------------------- |
| Certaines URLs en dur dans le code oubliées                 | Moyen       | Images cassées                  | Grep exhaustif `supabase.co/storage` avant bascule         |
| Facebook/Google catalogues pointent vers les anciennes URLs | Haut        | Catalogues Meta/Merchant cassés | Garder un redirect 301 Supabase → R2 pendant 1 mois        |
| Synchronisation site-internet ↔ back-office                | Moyen       | Désynchro URLs                  | Les 2 apps utilisent les mêmes helpers → basculer ensemble |
| Quota Cloudflare Images dépassé (100K transforms)           | Faible      | Images moins optimisées         | Monitoring Cloudflare + upgrade si besoin                  |

---

## 6. Fichiers à modifier (à confirmer via grep avant exécution)

- `packages/@verone/utils/src/storage/` — helpers getPublicUrl (centraliser si pas déjà fait)
- `apps/back-office/next.config.js` — ajouter `images.verone.fr` dans `remotePatterns`
- `apps/site-internet/next.config.js` — idem
- `apps/linkme/next.config.js` — idem si LinkMe affiche des images produits
- Tous les composants qui font `<Image src={...supabase.co...} />` → devraient déjà utiliser un helper central

---

## 7. Checklist avant exécution (rappels)

- [ ] Backup DB Supabase
- [ ] Backup fichiers Supabase Storage (rclone vers local/S3 en backup)
- [ ] Test script migration en dry-run
- [ ] Test upload depuis back-office vers R2 (smoke test)
- [ ] Test lecture URL R2 depuis site-internet
- [ ] Test URL R2 dans aperçu Facebook Debugger
- [ ] Créer sprint `[BO-STORAGE-001]` dans ACTIVE.md avec ce lien

---

## 8. Références

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)
- [Migration S3-compatible](https://developers.cloudflare.com/r2/data-migration/)
- Plan Supabase actuel — 2026-04-20 quota dépassé (bug HTTP 402 sur images produit)
