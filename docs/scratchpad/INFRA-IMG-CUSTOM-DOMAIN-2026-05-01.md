# INFRA-IMG-CUSTOM-DOMAIN — Rapport d'audit

**Date** : 2026-05-01
**Statut** : 🔴 **CLOS — BLOQUÉ par contrainte DNS structurelle, reporté indéfiniment** (décision Roméo 2026-05-01)
**Méthode** : audit API Cloudflare + dashboard via MCP Playwright (lane-1)

---

## ✅ Décision finale (2026-05-01, Roméo)

**Option A retenue — status quo.** Le code Verone continue d'utiliser `imagedelivery.net` directement (déjà en place via `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH`). Aucune action côté Verone, aucune PR.

Le custom domain `images.veronecollections.fr` est purement cosmétique (branding URL). Migrer toute la zone DNS Hostinger → Cloudflare juste pour ça est jugé trop risqué (email Resend + Google + SPF/DMARC tous dépendants).

**Option B (migration NS) part en backlog** sous `[INFRA-DNS-MIGRATE-CLOUDFLARE]` dans `.claude/work/ACTIVE.md` (section "Backlog priorité MOYENNE / BASSE"). À reprioriser uniquement si Roméo exprime un besoin business explicite.

---

## TL;DR

Le custom domain `images.veronecollections.fr` ne peut PAS être activé dans l'état DNS actuel. La zone Cloudflare existe mais est **PENDING** : Cloudflare attend que les nameservers de `veronecollections.fr` pointent vers `kellen.ns.cloudflare.com` + `nataly.ns.cloudflare.com`. Or HOTFIX-001 (2026-05-01, aujourd'hui même) vient de fixer les NS sur Hostinger (`ns1/ns2.dns-parking.com`) pour résoudre la panne du domaine principal.

**Impossible** d'avoir simultanément :

- NS Hostinger → site principal OK, MAIS pas de SSL pour `images.veronecollections.fr`
- NS Cloudflare → SSL OK pour images, MAIS toute la résolution DNS bascule (risque de casser MX, autres CNAME)

**Recommandation** : conserver l'URL native `imagedelivery.net/{HASH}/{IMAGE_ID}/{VARIANT}` qui fonctionne déjà. Si le custom domain est un must, ouvrir un sprint dédié `INFRA-DNS-MIGRATE-CLOUDFLARE` avec audit DNS complet (MX Resend, MX Google, TXT DMARC/SPF, etc.) avant tout switch de NS.

---

## 1. État initial (vérifié)

### DNS public

```
$ dig +short CNAME images.veronecollections.fr
imagedelivery.net.

$ dig +short images.veronecollections.fr
imagedelivery.net.
104.18.3.36
104.18.2.36

$ dig +short NS veronecollections.fr (autoritatif)
ns1.dns-parking.com.
ns2.dns-parking.com.
```

### Test HTTPS

```
$ curl -I https://images.veronecollections.fr
exit code 35 (SSL handshake failure)
LibreSSL/3.3.6: error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
```

### API Cloudflare Images (token Images-only `CLOUDFLARE_IMAGES_API_TOKEN`)

- ✅ `/accounts/{id}/images/v1/stats` → 629/100000 images stockées
- ✅ `/accounts/{id}/images/v1/keys` → key `default` présente
- ❌ `/user/tokens/verify` → 1000 Invalid (token scopé Images uniquement)
- ❌ `/accounts/{id}/cloudflare/images/v1/config` (endpoint mentionné dans le brief) → **n'existe pas** (route 7000 No route)

**Aucun endpoint API public Cloudflare Images n'expose la configuration du custom domain.** D'après la doc actuelle (https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/), le custom domain se configure via une zone Cloudflare proxifiée + Transform Rules, pas via API Images dédiée.

---

## 2. Audit dashboard Cloudflare (MCP Playwright lane-1)

Session `Romeo@veronecollections.fr's Account` active.

### Zone `veronecollections.fr`

- **Statut** : `pending` (bandeau orange : _"veronecollections.fr is pending until you complete the instructions on the Overview page"_)
- **Plan** : Free
- **Zone ID** : `2de63c637a6ca5943186d4a3fcd3a69b`
- **NS attendus par Cloudflare** : `kellen.ns.cloudflare.com`, `nataly.ns.cloudflare.com`
- **NS actuels (autoritatifs .fr)** : `ns1.dns-parking.com`, `ns2.dns-parking.com` (Hostinger)
- Page Overview : _"Waiting for your registrar to propagate your new nameservers"_

### Enregistrements DNS dans la zone Cloudflare (importés mais inactifs tant que zone PENDING)

| Type      | Name                                                     | Content                               | Proxy                             |
| --------- | -------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| A         | veronecollections.fr                                     | 216.198.79.1                          | DNS only                          |
| CNAME     | gbnouc5jzx74.veronecollections.fr                        | gv-6sopydpinkavcx.dv.googlehosted.com | DNS only                          |
| **CNAME** | **images**                                               | **imagedelivery.net**                 | **🟧 Proxied** ← record du sprint |
| CNAME     | www.veronecollections.fr                                 | 243ab161976a4289.vercel-dns...        | DNS only                          |
| MX        | send.app.veronecollections.fr                            | feedback-smtp.eu... (Resend)          | —                                 |
| MX        | veronecollections.fr                                     | SMTP.GOOGLE.COM                       | —                                 |
| TXT       | \_dmarc, resend, send.app, ... (DMARC/SPF/Resend/Google) | ...                                   | —                                 |
| **NS**    | **veronecollections.fr**                                 | **ns2.dns-parking.com**               | DNS only                          |
| **NS**    | **veronecollections.fr**                                 | **ns1.dns-parking.com**               | DNS only                          |

Le CNAME `images → imagedelivery.net` est bien proxifié (orange cloud) dans la zone Cloudflare. Mais comme la zone est `pending` (NS pas pointés Cloudflare), aucun cert SSL n'est émis et le proxy n'est pas actif.

Screenshots de preuve :

- `.playwright-mcp/screenshots/20260501/cloudflare-zone-veronecollections-overview.png`
- `.playwright-mcp/screenshots/20260501/cloudflare-zone-dns-records.png`
- `.playwright-mcp/screenshots/20260501/cloudflare-images-dashboard-initial.png`
- `.playwright-mcp/screenshots/20260501/cloudflare-images-delivery-tab.png`

---

## 3. Pourquoi l'approche brief ne peut pas aboutir

Le brief part de l'hypothèse : _"Le CNAME existe + zone Cloudflare doit auto-émettre le cert SSL"_. C'était vrai en 2022-2023 quand Cloudflare Images supportait des custom domains via simple CNAME proxifié. Depuis, l'approche a changé :

> Cloudflare Images Docs (2025) : _"image delivery is supported from all customer domains under the same Cloudflare account"_ — implique zone active dans le compte, pas juste un CNAME.

Sans zone active (NS Cloudflare), Universal SSL ne génère pas de cert pour le hostname → SSL handshake fail systématique.

L'endpoint `/accounts/{id}/cloudflare/images/v1/config` mentionné dans le brief n'existe pas dans l'API Cloudflare actuelle.

---

## 4. Conflit avec HOTFIX-001 du 2026-05-01

D'après `.claude/local/CREDENTIALS-VAULT.md` mis à jour aujourd'hui :

> **Hostinger / Nameservers (post HOTFIX-001 2026-05-01)** : `ns1.dns-parking.com` + `ns2.dns-parking.com` — DNS Hostinger interne (pas une "page parking")
>
> **Avant HOTFIX-001** : 4 NS mélangés : 2× Cloudflare (zone vide) + 2× Hostinger — Source de la panne du 2026-05-01

Conséquence directe :

- HOTFIX-001 a délibérément retiré les NS Cloudflare pour stabiliser le domaine principal
- INFRA-IMG-CUSTOM-DOMAIN nécessite l'inverse : remettre les NS Cloudflare
- Les deux objectifs sont **mutuellement exclusifs** dans la config DNS actuelle

---

## 5. Options pour Roméo

### Option A — Status quo (recommandée court terme)

Conserver NS Hostinger. Servir les images via URL native :

```
https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/{IMAGE_ID}/{VARIANT}
```

- ✅ Marche déjà, zéro intervention
- ✅ Cert SSL Cloudflare géré automatiquement
- ❌ URL publique ne porte pas le branding `veronecollections.fr`

**Aucun changement requis dans `.env.local` ni Vercel.** Le code Verone construit déjà ces URLs (variable `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH`).

### Option B — Migration NS vers Cloudflare (sprint dédié, FEU ROUGE)

Activer le custom domain en migrant la résolution DNS complète vers Cloudflare.

- Préalable obligatoire : audit complet des records existants dans la zone Cloudflare PENDING vs ce qui est servi actuellement par Hostinger. Vérifier 100% des MX (Resend `send.app.veronecollections.fr`, Google MX, TXT DMARC/SPF, A racine 216.198.79.1, CNAME `www` Vercel, CNAME Google verification `gbnouc5jzx74...`).
- Dans le dashboard, les records semblent déjà importés (cf. tableau §2). MAIS la zone est PENDING depuis longtemps — vérifier qu'aucun record n'a été ajouté côté Hostinger après l'import Cloudflare initial.
- Étapes : Roméo se connecte sur hpanel.hostinger.com → change NS vers `kellen.ns.cloudflare.com` + `nataly.ns.cloudflare.com` → propagation 1-24h → Cloudflare passe la zone en `Active` → cert Universal SSL généré sous 30 min → `https://images.veronecollections.fr` répond 200.
- Risques : si un record manque côté Cloudflare quand les NS basculent → emails Resend/Google KO, site Vercel KO, etc. Critique.
- Tâche associée : à créer en sprint séparé `INFRA-DNS-MIGRATE-CLOUDFLARE` avec checklist DNS complète. **Pas dans le scope de ce sprint**.

### Option C — Cloudflare for SaaS / Custom Hostnames

- Nécessite plan Business+ (200 $/mo) sur la zone Cloudflare
- Pas justifié pour un simple branding d'URL d'images
- ❌ Rejeté

---

## 6. Procédure d'activation côté code (à exécuter SI Option B retenue)

À documenter pour mémoire (ne PAS exécuter maintenant) :

1. Variables `.env.local` des 3 apps (`apps/back-office`, `apps/site-internet`, `apps/linkme`) :

   ```
   NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true
   ```

   (À condition que le code lise cette variable. Vérifier la présence de `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` dans le code Verone via `grep -r "USE_CUSTOM_DOMAIN" apps packages` avant le sprint d'activation. Si absent, coder le switch — sprint séparé.)

2. Variables Vercel (Environment Variables) sur les 3 projets :

   ```
   NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true
   ```

   (Production + Preview)

3. Redéploiement Vercel automatique sur push.

**Roméo valide manuellement** chaque URL générée dans le back-office, le site et LinkMe avant de fermer le sprint d'activation.

---

## 7. Tests effectués

| Test                                                   | Résultat                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `dig +short CNAME images.veronecollections.fr`         | `imagedelivery.net.` ✅                                              |
| `dig +short images.veronecollections.fr`               | IPs Cloudflare ✅                                                    |
| `curl -I https://images.veronecollections.fr`          | exit 35 (SSL handshake fail) ❌                                      |
| `curl -I https://imagedelivery.net/{HASH}/{ID}/public` | HTTP 404 (image ID test invalide) ✅ baseline cert OK                |
| Token Images `/stats`                                  | 629/100k ✅                                                          |
| Token Images `/keys`                                   | OK ✅                                                                |
| Token Images `/user/tokens/verify`                     | 1000 Invalid (scope Images-only) — comportement attendu              |
| Endpoint `/cloudflare/images/v1/config`                | route 7000 No route ❌ (endpoint inexistant)                         |
| Dashboard Cloudflare Images > Delivery                 | Redirige vers Transformations (zone-level config, pas account-level) |
| Dashboard Cloudflare > zone veronecollections.fr       | **PENDING — NS pas pointés Cloudflare**                              |

Pas de test fonctionnel d'image (Étape 4 du brief) car cert SSL absent → impossible.

---

## 8. Points critiques pour Roméo

1. **Le sprint INFRA-IMG-CUSTOM-DOMAIN ne peut pas être complété tant que la zone DNS reste sur Hostinger.** C'est structurel, pas un bug.

2. **HOTFIX-001 (aujourd'hui) a explicitement choisi NS Hostinger** pour stabiliser le domaine principal — ce qui est incompatible avec le custom domain Images.

3. **Pas d'urgence côté Verone** : l'app actuelle utilise déjà `imagedelivery.net` directement (variable `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH`), tout fonctionne. Le custom domain est un nice-to-have de branding, pas un besoin métier bloquant.

4. **Décision attendue** :
   - 🅰 Garder Option A (status quo, URLs `imagedelivery.net`) → fermer ce sprint comme "bloqué par contrainte DNS"
   - 🅱 Planifier Option B (sprint `INFRA-DNS-MIGRATE-CLOUDFLARE` séparé) → audit DNS complet AVANT, pas dans la même PR

5. **Aucun code Verone modifié** dans ce sprint (config externe pure). Pas de PR à créer.

---

## 9. Annexe : commandes utiles pour reprendre

```bash
# Réveiller le check
ACCOUNT_ID="f0087e285a908a15ea5bdb51985c43ee"
TOKEN="cfat_..."  # cf. apps/back-office/.env.local CLOUDFLARE_IMAGES_API_TOKEN

# 1. Test SSL
curl -I -m 10 https://images.veronecollections.fr

# 2. État NS
dig +short NS veronecollections.fr

# 3. Stats Images
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/stats" \
  -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool
```

Quand `dig +short NS veronecollections.fr` renvoie `kellen.ns.cloudflare.com` + `nataly.ns.cloudflare.com`, attendre 30 min puis re-tester `curl -I https://images.veronecollections.fr`. Si 200/302/415 → cert OK, custom domain actif.
