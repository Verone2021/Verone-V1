# Custom Hostname Cloudflare Images — État & blocage

**Date** : 2026-05-01
**Cible** : faire en sorte que `https://images.veronecollections.fr/{hash}/{img}/{variant}` réponde HTTP 200 (au lieu de SSL handshake fail).
**Statut** : ⛔ Bloqué — nécessite intervention Romeo.

---

## Ce qui est déjà OK

| Élément                                                                                         | État                                            |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| NS du domaine pointent vers Cloudflare (`kellen.ns.cloudflare.com`, `nataly.ns.cloudflare.com`) | ✅                                              |
| CNAME `images.veronecollections.fr` → `imagedelivery.net` configuré                             | ✅                                              |
| Cloudflare Images Account actif (629 images / 100k stockées, plan Basic 5 $/mo)                 | ✅                                              |
| `flexible_variants: true` activé                                                                | ✅                                              |
| API Token Images valide                                                                         | ✅ (testé `GET /accounts/{id}/images/v1/stats`) |

## Ce qui manque

**SSL handshake fail** quand on appelle `https://images.veronecollections.fr/...` :

```
LibreSSL/3.3.6: error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
```

→ Cloudflare reçoit la connexion (le DNS pointe bien vers ses IPs) mais ne sait pas quel certificat servir pour ce hostname. Le hostname n'est **pas déclaré comme Custom Hostname** côté Cloudflare Images.

## Pourquoi je ne peux pas finir

Pour activer le Custom Hostname Cloudflare Images, il faut :

1. **Soit** se connecter au dashboard Cloudflare → Images → activer le custom hostname `images.veronecollections.fr`. Mais les credentials login dashboard ne sont **pas dans `.claude/local/CREDENTIALS-VAULT.md`** (ligne `Email login dashboard: À compléter`).
2. **Soit** un API token avec scope `Zone DNS:Edit + SSL and Certificates:Edit + Images:Edit + Custom Hostnames:Edit` sur la zone `veronecollections.fr`. Mon API token actuel (`CLOUDFLARE_IMAGES_API_TOKEN`) est scopé Images uniquement (testé : `GET /zones?name=veronecollections.fr` retourne `[]` car pas de scope Zone).

## Ce que Romeo doit faire

### Option A — via le dashboard (~5 min de clic, recommandée)

1. Aller sur `https://dash.cloudflare.com` → Login
2. Sélectionner le compte Verone
3. Menu de gauche → **Images** → **Settings** (ou **Custom hostnames** selon la version UI)
4. Section **Custom hostname** → Saisir `images.veronecollections.fr` → **Save**
5. Cloudflare émet automatiquement un certificat SSL Universal (1-15 min en général)
6. Tester : `curl -I https://images.veronecollections.fr/a-LEt3vfWH1BG-ME-lftDA/test/public` → doit retourner `HTTP/2 404` ou `200` (pas SSL fail)

### Option B — créer un API token "scoped Zone+Images"

Si Romeo préfère que l'agent puisse le faire à l'avenir via API :

1. Dashboard Cloudflare → **My Profile** → **API Tokens** → **Create token**
2. Custom token avec permissions :
   - Account → Cloudflare Images → Edit
   - Zone → DNS → Edit (limité à `veronecollections.fr`)
   - Zone → Custom Hostnames → Edit (limité à `veronecollections.fr`)
   - Zone → SSL and Certificates → Edit
3. Stocker dans `apps/back-office/.env.local` sous `CLOUDFLARE_IMAGES_DNS_TOKEN`
4. Déclencher l'agent à nouveau pour qu'il appelle l'API

L'option A est plus rapide pour ce sprint.

## Une fois le SSL OK

Action **Vercel** (3 apps × 3 envs = 9 var sets) :

```
NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true
```

Sur les projets Vercel `back-office`, `linkme`, `site-internet` (Production + Preview + Development).

→ `<CloudflareImage>` basculera automatiquement de `imagedelivery.net` à `images.veronecollections.fr`.

## Vérification finale

```bash
# Doit retourner HTTP 200 après config
curl -I "https://images.veronecollections.fr/a-LEt3vfWH1BG-ME-lftDA/$(curl -s -H "Authorization: Bearer $CLOUDFLARE_IMAGES_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/images/v1?per_page=1" | python3 -c 'import sys, json; print(json.load(sys.stdin)["result"]["images"][0]["id"])')/public"
```

(Construit l'URL avec une image existante de l'account.)
