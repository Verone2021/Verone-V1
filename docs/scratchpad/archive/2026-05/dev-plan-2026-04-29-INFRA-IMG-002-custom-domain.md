# Dev Plan — INFRA-IMG-002 Custom Domain Cloudflare + Phase 6 Cleanup

**Date** : 2026-04-29
**Branche** : `feat/INFRA-IMG-002-cloudflare-cleanup` (sera renommée si besoin)
**Précédent** : INFRA-IMG-001 (PR #700 mergée — 629 images sur Cloudflare)
**Scope** : custom domain `images.veronecollections.fr` + activation loader Cloudflare global + suppression Supabase Storage

---

## Contexte

PR #700 a livré l'infrastructure Cloudflare Images :

- Account activé (5 €/mois)
- 629 images migrées
- Code helpers + composant `<CloudflareImage>` (non utilisé encore)
- Migration DB + types

Mais on n'a pas pu retirer `unoptimized: true` de Next.js car **23 fichiers utilisent encore `<Image src={public_url}>` direct** (pas via `<CloudflareImage>`). Si on retirait `unoptimized`, ces 23 fichiers passeraient par Vercel Image Optimization → bug 402 reviendrait immédiatement (on était à 4.7K/5K avant migration).

**Solution choisie** : passer le DNS de `veronecollections.fr` chez Cloudflare → activer Cloudflare Image Resizing (Transformations sur URLs externes) → configurer un custom Next.js loader qui route TOUTES les `<Image>` du site vers Cloudflare automatiquement → retirer `unoptimized` sans risque.

---

## Plan d'exécution

### Phase 1 — Audit DNS Hostinger (15 min)

1. Romeo se connecte à Hostinger via Playwright (lane-2)
2. Naviguer vers DNS Zone Editor de `veronecollections.fr`
3. Capturer **tous** les records :
   - A / AAAA / CNAME
   - MX (Google Workspace)
   - TXT (SPF, DKIM, DMARC, verification)
   - SRV éventuels
4. Sauvegarder dans `docs/scratchpad/dns-records-veronecollections-fr-2026-04-29.md`

**Records connus côté externe (via dig)** :

- Apex A : `216.198.79.1` (Vercel)
- www CNAME : `*.vercel-dns-017.com`
- MX : `1 SMTP.GOOGLE.COM`
- TXT : Google verification + SPF (`v=spf1 include:_spf.google.com include:amazonses.com ~all`)
- DKIM Resend sur `app.veronecollections.fr` (subdomain)

### Phase 2 — Setup Cloudflare DNS (15 min)

1. Cloudflare Dashboard → Domains → "Add a domain"
2. Saisir `veronecollections.fr`
3. Cloudflare scan automatique des records existants
4. Vérifier que **chaque** record est bien copié (comparer avec audit Phase 1)
5. Ajouter records manquants si oubliés
6. **Mode proxy** :
   - `images.veronecollections.fr` : proxied (orange cloud)
   - Apex + `www` : DNS-only (gris) → Vercel reste maître du CDN
   - MX : DNS-only obligatoire
   - DKIM/SPF/DMARC : DNS-only

### Phase 3 — Switch nameservers (5 min + propagation)

1. Cloudflare donne 2 nameservers (ex: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`)
2. Hostinger → Domains → DNS/Nameservers → custom nameservers
3. Remplacer `ns1/ns2.dns-parking.com` par les NS Cloudflare
4. Sauvegarder
5. **Propagation : 5 min - 48h** (généralement < 1h)

### Phase 4 — Vérification post-propagation (10-30 min)

```bash
# Boucle dig jusqu'à voir les NS Cloudflare
until dig +short veronecollections.fr NS | grep -q "cloudflare.com"; do sleep 30; done
```

Tests obligatoires :

- ✅ `https://veronecollections.fr` charge (Vercel)
- ✅ `https://www.veronecollections.fr` charge
- ✅ Email reçu sur `contact@app.veronecollections.fr` (test envoyer un mail dummy)
- ✅ Mails sortants Resend fonctionnent (Workspace de Romeo)

### Phase 5 — Custom domain Cloudflare Images (10 min)

1. Cloudflare Dashboard → Images → Custom domains
2. Ajouter `images.veronecollections.fr`
3. Cloudflare crée automatiquement le CNAME nécessaire
4. Vérifier qu'une URL test charge :
   ```
   https://images.veronecollections.fr/<hash>/<image_id>/public
   ```

### Phase 6 — Custom Next.js loader Cloudflare (30 min)

1. Créer `apps/back-office/lib/cloudflare-loader.ts` (idem site-internet, linkme) :
   ```ts
   export default function cloudflareLoader({ src, width, quality }) {
     // Si src est déjà une URL Cloudflare → utiliser tel quel
     // Si src est une URL Supabase → wrapper avec Cloudflare Image Resizing
     const params = `width=${width},quality=${quality || 75},format=auto`;
     return `https://images.veronecollections.fr/cdn-cgi/image/${params}/${src}`;
   }
   ```
2. Modifier `next.config.js` (3 apps) :
   ```js
   images: {
     loader: 'custom',
     loaderFile: './lib/cloudflare-loader.ts',
     // SUPPRIMER unoptimized: true
   }
   ```
3. Tester en preview deploy Vercel
4. Vérifier qu'une image transforme bien (resize, format webp)

### Phase 7 — Mise à jour env vars (5 min)

Vercel Shared Env Variables (lane-2) :

- Pas de changement nécessaire (`NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH` reste le même)

`.env.local` (3 apps) :

- Pas de changement

### Phase 8 — Phase 6 cleanup originale (30 min)

1. ✅ `unoptimized: true` retiré dans Phase 6
2. **Supprimer la colonne `public_url` ?** À voir — gardons-la pour fallback runtime au moins 1 semaine après merge
3. **Supprimer les buckets Supabase Storage** :
   ```sql
   -- À exécuter via mcp__supabase__execute_sql
   DELETE FROM storage.objects WHERE bucket_id IN ('product-images', 'family-images', 'organisation-logos', 'category-images', 'collection-images');
   DELETE FROM storage.buckets WHERE id IN ('product-images', 'family-images', 'organisation-logos', 'category-images', 'collection-images');
   ```
   ⚠️ **Risque** : si une row a `cloudflare_image_id IS NULL` mais un `public_url` valide → image cassée
   → Vérifier d'abord : `SELECT COUNT(*) FROM product_images WHERE cloudflare_image_id IS NULL AND public_url IS NOT NULL`
4. Documentation `docs/current/integrations.md`

### Phase 9 — Tests E2E (30 min)

Via Playwright lane-1 :

- Charger `/produits/catalogue` → vérifier que toutes les images chargent depuis `images.veronecollections.fr/cdn-cgi/image/...`
- Charger une page produit → vérifier images (gallery, primary)
- Charger `/factures` → vérifier logos organisations
- Charger `linkme` catalogue → vérifier images
- Vérifier `network` que **0 requête** vers Vercel Image Optimization (`/_next/image`)

### Phase 10 — Commit + PR + Merge (15 min)

1. Commit final groupé
2. Push
3. Promote PR ready
4. Merge squash

---

## Checklist tests post-merge

- [ ] Site `veronecollections.fr` accessible
- [ ] Sous-domaines accessibles
- [ ] Emails Google Workspace fonctionnent
- [ ] Mails sortants Resend fonctionnent
- [ ] Images chargent via `images.veronecollections.fr` (et plus via `imagedelivery.net` ni Supabase)
- [ ] Vercel Image Optimization à 0 requêtes
- [ ] Supabase Storage à 12 MB (justificatifs + delivery-forms uniquement)

---

## Risques + mitigations

| Risque                            | Probabilité                    | Mitigation                                                                                |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| Email cassé pendant propagation   | Faible (records bien recopiés) | Garder MX en DNS-only chez Cloudflare                                                     |
| Site down pendant propagation     | Faible                         | Recopier rigoureusement chaque record                                                     |
| Loader Cloudflare casse une image | Moyen                          | Test E2E sur chaque type de page avant merge                                              |
| Récupération si désastre          | Possible                       | Possibilité de remettre les NS Hostinger en cas de problème (24-48h propagation)          |
| Cloudflare Image Resizing payant  | À vérifier                     | Le pricing Images Pro inclut Resizing — peut nécessiter Cloudflare Pro Plan ($20/mo zone) |

⚠️ **Point d'attention pricing Cloudflare Image Resizing** :

- Cloudflare Image Resizing standalone (sans Cloudflare Images) = **payant** depuis 2024 ($5/mo + usage)
- AVEC Cloudflare Images souscrit (notre cas) = transformations **incluses** dans le forfait
- À CONFIRMER lors de la Phase 5 que les transformations sur URLs externes (Supabase) sont bien gratuites

---

## Documentation à produire

- `docs/scratchpad/dns-records-veronecollections-fr-2026-04-29.md` (audit)
- `docs/scratchpad/dev-report-2026-04-29-INFRA-IMG-002-custom-domain.md` (rapport)
- `docs/current/integrations.md` (section Cloudflare Images)
