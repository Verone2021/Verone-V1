# HOTFIX-001 — Restauration veronecollections.fr (DNS down)

**Date** : 2026-05-01
**Branche worktree** : `hotfix/HOTFIX-001-restore-veronecollections` (dossier `/Users/romeodossantos/verone-hotfix-001/`)
**Type d'incident** : DNS — domaine non résolu
**Pas de code modifié** — config externe pure (registrar Hostinger)

---

## Symptôme

```
$ curl -v https://www.veronecollections.fr
curl: (6) Could not resolve host: www.veronecollections.fr
```

Site totalement inaccessible. DNS retourne NXDOMAIN intermittent selon le résolveur contacté.

## Cause racine

Au niveau du TLD `.fr`, le domaine `veronecollections.fr` avait **4 nameservers** configurés (anormal — normalement 2) :

```
kellen.ns.cloudflare.com   ← Cloudflare (zone vide → ne renvoie aucun A/CNAME)
nataly.ns.cloudflare.com   ← Cloudflare (zone vide)
ns1.dns-parking.com        ← Hostinger DNS interne (zone réelle, records corrects)
ns2.dns-parking.com        ← Hostinger DNS interne (zone réelle)
```

Conséquence : la résolution DNS dépendait du NS contacté par chaque résolveur — la moitié renvoyait NXDOMAIN (Cloudflare), l'autre moitié les bons records (Hostinger). Comportement aléatoire perçu comme "site down".

**Pourquoi 4 NS ?** Origine probable : config historique sur Cloudflare ajoutée au registrar, mais zone Cloudflare jamais peuplée. Hostinger a maintenu ses propres NS en parallèle. Le mélange a produit une résolution incohérente.

**Snapshot de référence** : `.playwright-mcp/veronecollections-fr.txt` (zone export du 2026-04-29) confirme que la zone DNS active est bien chez Hostinger DNS-parking, avec les bons records (A apex, CNAME `www → ...vercel-dns-017.com`, MX Google, TXT SPF/DMARC, etc.).

## Diagnostic — preuves

```
$ dig +trace veronecollections.fr
...
veronecollections.fr.   3600 IN NS kellen.ns.cloudflare.com.
veronecollections.fr.   3600 IN NS nataly.ns.cloudflare.com.
veronecollections.fr.   3600 IN NS ns1.dns-parking.com.
veronecollections.fr.   3600 IN NS ns2.dns-parking.com.
veronecollections.fr.   14400 IN A 216.198.79.1
;; Received 65 bytes from 2400:cb00:2049:1::a29f:18c9#53(ns1.dns-parking.com) in 33 ms

$ dig @nataly.ns.cloudflare.com veronecollections.fr A
;; ANSWER: 0   ← zone Cloudflare vide

$ whois veronecollections.fr | grep nserver
nserver: kellen.ns.cloudflare.com
nserver: nataly.ns.cloudflare.com
nserver: ns1.dns-parking.com
nserver: ns2.dns-parking.com
```

## Action exécutée

Connexion au panneau Hostinger via MCP Playwright (lane-2) — session déjà active dans le profil persistant, login `veronebyromeo@gmail.com` reconnu auto.

Navigation : hpanel.hostinger.com → Noms de domaine → veronecollections.fr → DNS / Serveurs de noms → "Modifier les serveurs de noms".

**Avant** :

- Field 1 : `kellen.ns.cloudflare.com`
- Field 2 : `nataly.ns.cloudflare.com`
- Field 3 : `ns1.dns-parking.com`
- Field 4 : `ns2.dns-parking.com`

**Après** :

- Field 1 : `ns1.dns-parking.com`
- Field 2 : `ns2.dns-parking.com`
- Field 3 : (vide)
- Field 4 : (vide)

Click "Enregistrer" → modale Hostinger : _« Les noms de serveurs ont été changé ! »_ avec mention « Cela peut prendre jusqu'à 24 heures pour que le domaine se propage ».

## Screenshots

- `.playwright-mcp/screenshots/20260501/hostinger-domain-overview-141700.png` (état initial — 4 NS visibles à droite)
- `.playwright-mcp/screenshots/20260501/hostinger-dns-records-141800.png` (page DNS, panneau "Serveurs de noms" 4 lignes)
- `.playwright-mcp/screenshots/20260501/hostinger-edit-ns-form-141930.png` (formulaire édition ouvert, 4 champs remplis avec ancienne config)
- `.playwright-mcp/screenshots/20260501/hostinger-form-filled-142000.png` (formulaire après remplacement : 2 NS dns-parking + 2 vides)
- `.playwright-mcp/screenshots/20260501/hostinger-after-save-142100.png` (modale Hostinger « Les noms de serveurs ont été changé ! »)

## Vérification propagation

Polling automatique 16:25 → 16:35 (20 cycles de 30s, log `/tmp/dns_propagation.log`).

**Résultat polling local** : HTTP_WWW = `000` (timeout) sur tous les cycles.
Le résolveur DNS local de la machine est encore en cache sur les anciens NS
Cloudflare. Test direct via `curl` impossible tant que le cache local n'expire
pas.

**Vérifications hors cache local — site OPÉRATIONNEL** :

```bash
# Cloudflare DNS 1.1.1.1 — DÉJÀ à jour avec les nouveaux NS
$ dig @1.1.1.1 veronecollections.fr NS +short
ns2.dns-parking.com.
ns1.dns-parking.com.

$ dig @1.1.1.1 veronecollections.fr A +short
216.198.79.1

$ dig @1.1.1.1 www.veronecollections.fr +short
243ab161976a4289.vercel-dns-017.com.
64.29.17.1
216.198.79.1

# HTTPS test direct (bypass DNS local) → site UP côté Vercel ✅
$ curl --resolve www.veronecollections.fr:443:64.29.17.65 -sI https://www.veronecollections.fr
HTTP/2 200
content-type: text/html
server: Vercel
strict-transport-security: max-age=63072000
```

**État caches résolveurs publics au moment du rapport (16:36)** :

- ✅ Cloudflare 1.1.1.1 : nouveaux NS (`ns1/ns2.dns-parking.com`) — propagation effective
- ⏳ Google 8.8.8.8 : encore les anciens NS Cloudflare en cache (TTL TLD = 602s restant ≈ 10 min)
- ⏳ Résolveur local machine Romeo : encore en cache, TTL inconnu

**Verdict** : la modification au registrar est appliquée et propagée au TLD `.fr`.
Le site répond HTTP 200 côté Vercel. Reste uniquement la maturation des caches
DNS publics et locaux (TTL 3600s max, déjà 50 min écoulés depuis le fix).

**ETA accès depuis la machine de Romeo** : 10-30 min selon son fournisseur DNS.
Accélération possible : changer DNS Mac → `1.1.1.1` (Préférences Système → Réseau →
Wi-Fi → Avancé → DNS), ou utiliser `dscacheutil -flushcache` + relance navigateur.

## Mises à jour parallèles

- `.claude/local/CREDENTIALS-VAULT.md` section Hostinger complétée :
  - Email login : `veronebyromeo@gmail.com`
  - Session active dans profil Playwright `lane-2`
  - Nameservers post-fix documentés
  - Notes sur la cause de la panne
- 2 PNG parasites à la racine (`github-secret-page.png`, `github-secrets-after.png`) déjà absents au moment du `rm` (probablement supprimés par autre agent).

## Suivi

- **Pas de PR à pousser** — config externe pure. Le worktree `verone-hotfix-001` peut être supprimé après ce rapport.
- **Si propagation > 30 min** : flush cache des résolveurs publics, ou attendre TTL TLD `.fr` (3600s sur les NS records).
- **Long-terme** : si Romeo veut migrer DNS sur Cloudflare un jour, il faudra recréer la zone Cloudflare (vide actuellement) avec **tous** les records (A, MX, TXT, CNAME `www`, DKIM Resend, DMARC, etc.) **avant** de re-pointer les NS au registrar. Sinon même panne.

## Cleanup post-mission

```bash
git -C /Users/romeodossantos/verone-back-office-V1 worktree remove /Users/romeodossantos/verone-hotfix-001
git -C /Users/romeodossantos/verone-back-office-V1 branch -D hotfix/HOTFIX-001-restore-veronecollections
```

À exécuter après confirmation propagation OK.
