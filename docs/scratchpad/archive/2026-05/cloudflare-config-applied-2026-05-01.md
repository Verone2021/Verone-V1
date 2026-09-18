# Cloudflare Images — Configuration appliquée

**Date** : 2026-05-01
**Auteur** : Claude (HOTFIX-002)
**Objet** : Compte rendu de l'activation des variants Cloudflare Images pour Vérone, et clarification du statut Polish.

---

## TL;DR

- ✅ **4 variants créés** sur l'account Cloudflare Images : `social1x1`, `story9x16`, `banner16x9`, `pin2x3`
- ✅ **WebP/AVIF auto déjà actif** sur les URLs `imagedelivery.net` (testé : `content-type: image/avif` retourné spontanément)
- ❌ **Polish NON activé** — pas nécessaire, et requiert plan Cloudflare Pro (~25 $/mois) que Romeo n'a pas (zone en plan Free)
- ⚠️ **Domaine custom `images.veronecollections.fr` ne résout pas** (HTTP 000) — à fixer plus tard avec le DNS global
- ⚠️ **Convention de nommage modifiée** par contrainte API : tirets refusés → on utilise `social1x1` au lieu de `social-1x1`

---

## 1. Variants créés (via API Cloudflare, sans dashboard)

L'API token `CLOUDFLARE_IMAGES_API_TOKEN` (déjà dans `apps/back-office/.env.local`) permet la création directe via :

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/images/v1/variants
```

| Variant      | Width | Height | Fit        | Metadata | Usage                              |
| ------------ | ----- | ------ | ---------- | -------- | ---------------------------------- |
| `social1x1`  | 1080  | 1080   | crop       | keep     | Posts feed Instagram + Meta        |
| `story9x16`  | 1080  | 1920   | crop       | keep     | Stories IG + Reels covers          |
| `banner16x9` | 1920  | 1080   | scale-down | keep     | Bannières site + Pinterest paysage |
| `pin2x3`     | 1000  | 1500   | crop       | keep     | Pinterest portrait (2:3)           |

**État final de l'account** (vérifié via `GET /variants`) : 5 variants au total = `public` (pré-existant) + les 4 nouveaux.

### Contrainte API découverte

L'API Cloudflare Images **refuse les tirets dans le nom de variant** (erreur `5400: Variant name not allowed`). Le mémo du 30 avril 2026 proposait `social-1x1` mais c'est invalide. Convention adoptée : **camelCase / accolement chiffres** (ex: `social1x1`, `banner16x9`).

**Impact côté code Vérone** : quand on étendra le composant `<CloudflareImage>` (`packages/@verone/ui/src/components/ui/cloudflare-image.tsx`) en Phase 1 DAM, il faudra utiliser ces noms exacts dans le type `variant`.

---

## 2. WebP/AVIF auto — déjà actif, sans Polish

Test HTTP avec différents `Accept:` headers sur le variant `social1x1` :

```bash
# Browser moderne (Chrome récent — accepte AVIF + WebP)
curl -I "https://imagedelivery.net/{hash}/{img}/social1x1" \
  -H "Accept: image/avif,image/webp,image/png,*/*"
# → content-type: image/avif, 7 970 bytes

# Browser non-AVIF
curl -I "https://imagedelivery.net/{hash}/{img}/social1x1" \
  -H "Accept: image/webp,image/png,*/*"
# → content-type: image/webp (négocié)

# Sans Accept (curl par défaut)
curl -I "https://imagedelivery.net/{hash}/{img}/social1x1"
# → content-type: image/png, 25 169 bytes (PNG d'origine)
```

**Conclusion** : Cloudflare Images négocie automatiquement le format optimal selon l'`Accept:` envoyé par le navigateur. **AVIF est servi spontanément** sans aucune config supplémentaire. Sur l'image testée, le PNG de 25 KB devient 7,9 KB en AVIF (= **-68 % de poids**).

---

## 3. Polish — pourquoi on n'y touche PAS

### Constat

Le mémo `docs/scratchpad/memo-cloudflare-images-activation-2026-04-30.md` recommandait d'activer Polish (Lossy + WebP + AVIF) via le dashboard. Tentative effectuée le 2026-05-01 sur l'URL :

```
https://dash.cloudflare.com/{account}/veronecollections.fr/speed/optimization/image
```

Le dashboard affiche : **"Polish — Requires Pro or higher"** avec un bouton "Upgrade to Pro" (~25 $/mois).

### Pourquoi le mémo s'est trompé

Cloudflare a **deux produits différents et nommés de façon confuse** :

| Produit                                  | Prix                          | Périmètre                                                                                                                                    |
| ---------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Images** (acheté par Romeo) | 5 $/mo (100k images stockées) | Sert via `imagedelivery.net`, **WebP/AVIF auto inclus**, variants gérés via API                                                              |
| **Cloudflare Pro** (pas acheté)          | ~25 $/mo par zone             | Débloque Polish, Mirage, etc. — **utile uniquement** pour images servies depuis l'origine via le CDN d'une zone, pas via `imagedelivery.net` |

Le mémo a confondu les deux. **Polish n'apporte AUCUN gain pour Vérone** dans la mesure où **toutes les images du DAM passent déjà par Cloudflare Images** (`product_images.cloudflare_image_id` → `imagedelivery.net/{hash}/{id}/{variant}`). La conversion WebP/AVIF est déjà appliquée sur ces URLs.

### Décision

**Skip Polish.** Pas d'upgrade Pro nécessaire. Les 5 $/mois de l'abonnement Images Basic Base sont parfaitement utiles et suffisent au cas d'usage Vérone.

Si un jour Vérone sert des images **hors Cloudflare Images** (ex: assets statiques `apps/site-internet/public/`) via le CDN Cloudflare, Polish pourrait redevenir pertinent — mais ce n'est pas l'architecture actuelle.

---

## 4. Custom domain — `images.veronecollections.fr` ne résout pas

Test :

```bash
curl -I "https://images.veronecollections.fr/{hash}/{img}/public"
# → HTTP 000 (DNS resolve fail / pas de cert)
```

Le mémo du 30 avril proposait ce domaine custom comme alternative à `imagedelivery.net`. **Il n'est pas configuré** côté DNS / Custom Hostname Cloudflare.

**Action recommandée** (à différer) : créer un Custom Hostname Cloudflare Images pointant vers `images.veronecollections.fr`. Procédure officielle :

1. Dashboard → Images → Custom Hostnames → Add
2. Saisir `images.veronecollections.fr`
3. Suivre l'instruction DNS CNAME (à ajouter chez le registrar du domaine)
4. Attendre la validation cert

À traiter plus tard quand on fera la passe DNS globale du site (ticket à créer).

**En attendant** : utiliser `imagedelivery.net/{hash}/{id}/{variant}` directement dans `<CloudflareImage>` (déjà le défaut du composant existant — pas de changement nécessaire).

---

## 5. Subscription Cloudflare actuelle (vérifiée le 2026-05-01)

```
Subscriptions :
- Images Basic Base : 5,00 $/mo, RENEWS ON May 29, 2026 (Paid)
- veronecollections.fr : Free plan (PROCESSING — Paid)

Invoice : IN-63695734, Apr 29, 2026, 5,00 $, Paid
```

**Total mensuel Cloudflare** : 5 $/mois.

---

## 6. Code Vérone — état (rien à modifier)

Aucun commit code n'a été fait pendant cette tâche (pure config externe Cloudflare).

Pour utiliser les nouveaux variants en Phase 1 DAM :

- Étendre le type du composant `<CloudflareImage>` dans `packages/@verone/ui/src/components/ui/cloudflare-image.tsx` pour accepter `social1x1 | story9x16 | banner16x9 | pin2x3` en plus du `public` existant.
- Aucune migration DB nécessaire (la colonne `product_images.cloudflare_image_id` reste inchangée).

---

## 7. Erreurs du mémo du 30 avril à corriger

À garder en tête lors de la prochaine relecture du mémo :

1. ❌ "4 variants existants" — faux. Il n'y avait QUE `public` au démarrage de la session.
2. ❌ Naming `social-1x1` — tirets refusés par l'API. Utiliser `social1x1`.
3. ❌ "Activer Polish (Lossy + WebP + AVIF)" — Polish requiert Pro ($25/mo) et **n'apporte rien** vu que les images passent par Cloudflare Images qui fait déjà WebP/AVIF auto.
4. ⚠️ URL `images.veronecollections.fr` — pas configurée. Utiliser `imagedelivery.net/{hash}/...` en attendant.

Recommandation : marquer le mémo `memo-cloudflare-images-activation-2026-04-30.md` comme **OBSOLÈTE** et pointer vers ce rapport.

---

## 8. Validation finale

| Critère                            | Résultat                                            |
| ---------------------------------- | --------------------------------------------------- |
| 4 variants créés et listés via API | ✅                                                  |
| Variants servent HTTP 200          | ✅                                                  |
| WebP/AVIF auto fonctionne          | ✅ (testé)                                          |
| Polish activé                      | ❌ Skip volontaire (non requis)                     |
| Subscription Cloudflare validée    | ✅ 5 $/mo Images Basic Base                         |
| Code Vérone touché                 | ❌ (pas de commit, pas de PR — pure config externe) |
