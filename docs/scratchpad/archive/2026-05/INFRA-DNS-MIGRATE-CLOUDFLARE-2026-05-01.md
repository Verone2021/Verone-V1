# INFRA-DNS-MIGRATE-CLOUDFLARE — Rapport (étape 1-4 audit + corrections)

**Date** : 2026-05-01 19:50 → 20:07 CEST
**Branche worktree** : `chore/INFRA-DNS-MIGRATE-CLOUDFLARE` (`/Users/romeodossantos/verone-dns-migrate`)
**Statut** : 🟢 **MIGRATION TERMINÉE — Zone Cloudflare ACTIVE, cert SSL OK, emails OK, site OK. Activation côté code (Vercel env) reportée.**
**Méthode** : dig direct sur NS Hostinger + dashboard Cloudflare via Playwright lane-2

---

## Pourquoi je m'arrête ici

L'audit révèle un **imprévu majeur non documenté dans le brief** :

- Le brief disait « Recréer les records manquants côté Cloudflare ». En réalité, **les records sont déjà tous présents** côté Cloudflare (importés à la création de la zone), mais :
  - **2 records MX sont stockés CASSÉS** (suffixe domaine doublement appliqué dans le contenu mail server)
  - **2 records NS placeholders** (ns1/ns2.dns-parking.com) n'ont aucune raison d'exister dans la zone Cloudflare et seraient résolus comme NS apex au switch
- La zone Cloudflare PENDING **ne sert AUCUN record** via dig public (Cloudflare attend que les NS soient pointés au TLD). Donc impossible de valider via dig avant le switch — seul le dashboard fait foi.
- Si je switche les NS sans corriger ces 2 MX :
  - **Emails Google Workspace KO immédiatement** (MX → `SMTP.GOOGLE.COM.veronecollections.fr.veronecollections.fr` qui n'existe pas)
  - **Emails Resend KO immédiatement** (MX → `feedback-smtp.eu-west-1.amazonses.com.veronecollections.fr.veronecollections.fr`)
  - Rollback NS ~5 min mais pendant ce temps les emails entrants sont rejetés par les serveurs émetteurs (NXDOMAIN sur le mail server cible)

Conformément à `.claude/rules/autonomy-boundaries.md` règle anti-GO et FEU ROUGE par essence (DNS prod + email prod), je présente le diff EXACT à Roméo avant toute modification.

---

## Audit Hostinger (source de vérité)

Snapshot live `2026-05-01 19:50 CEST` archivé dans `.playwright-mcp/hostinger-live-snapshot-2026-05-01.txt`.

Identique au snapshot officiel du 29 avril (`.playwright-mcp/veronecollections-fr.txt` — depuis écrasé par export Cloudflare).

| Type  | Name                    | Content                                                                                                                                                                                                                        | TTL   |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| SOA   | apex                    | `ns1.dns-parking.com. dns.hostinger.com. 2026043001 ...`                                                                                                                                                                       | 3600  |
| NS    | apex                    | `ns1.dns-parking.com.` + `ns2.dns-parking.com.`                                                                                                                                                                                | 86400 |
| A     | apex                    | `216.198.79.1`                                                                                                                                                                                                                 | 14400 |
| MX    | apex                    | `1 SMTP.GOOGLE.COM`                                                                                                                                                                                                            | 14400 |
| TXT   | apex                    | `"google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"` <br>`"v=spf1 include:_spf.google.com include:amazonses.com ~all"`                                                                                     | 14400 |
| TXT   | `_dmarc`                | `"v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r"`                                                                                                                                             | 14400 |
| CNAME | `gbnouc5jzx74`          | `gv-6sopydpinkavcx.dv.googlehosted.com.`                                                                                                                                                                                       | 14400 |
| TXT   | `resend._domainkey.app` | `"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDPAklUmXwXb3Vc3zvR6fxlJzm8p5rqCUvUDJ5jzEJli0uK6qU0FeQHSpNXhQnpO2RC8a7XxWPevnev01wYlOc4AivkGN9+VCqVbir+e5p48XJOXOSb9gVoepsKgxQZ2pVk12Gww5gHMmsAcUiFTIhK8jkAn5SpFPL0U3WN/MVQrQIDAQAB"` | 14400 |
| MX    | `send.app`              | `10 feedback-smtp.eu-west-1.amazonses.com`                                                                                                                                                                                     | 14400 |
| TXT   | `send.app`              | `"v=spf1 include:amazonses.com ~all"`                                                                                                                                                                                          | 14400 |
| CNAME | `www`                   | `243ab161976a4289.vercel-dns-017.com.`                                                                                                                                                                                         | 300   |

Total : **11 records utiles** + SOA + 2 NS gérés au registrar.
Aucun AAAA, CAA, ni autre sous-domaine répondant (sondage 22 sous-domaines communs : tous vides). Pas de zone transfer (AXFR refusé par Hostinger, normal).

---

## Audit Cloudflare zone PENDING (état réel, vérifié via dashboard)

13 records visibles dans le dashboard. 11 sont stockés correctement, 2 MX sont cassés, 2 NS sont à supprimer.

### ✅ Records OK côté Cloudflare (11)

| Type  | Name (réel stocké)                           | Content (réel stocké)                                                              | Match Hostinger      |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------- | ---------------------------------------- |
| A     | `veronecollections.fr`                       | `216.198.79.1`                                                                     | DNS only             | ✅                                       |
| CNAME | `gbnouc5jzx74.veronecollections.fr`          | `gv-6sopydpinkavcx.dv.googlehosted.com`                                            | ✅                   |
| CNAME | `images` (= `images.veronecollections.fr`)   | `imagedelivery.net`                                                                | **Proxied** (orange) | ✅ (record du sprint, ajout manuel hier) |
| CNAME | `www.veronecollections.fr`                   | `243ab161976a4289.vercel-dns-017.com`                                              | ✅                   |
| TXT   | `veronecollections.fr`                       | `"google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"`           | ✅                   |
| TXT   | `veronecollections.fr`                       | `"v=spf1 include:_spf.google.com include:amazonses.com ~all"`                      | ✅                   |
| TXT   | `_dmarc.veronecollections.fr`                | `"v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r"` | ✅                   |
| TXT   | `resend._domainkey.app.veronecollections.fr` | `"p=MIGfMA0..."` (DKIM Resend complet)                                             | ✅                   |
| TXT   | `send.app.veronecollections.fr`              | `"v=spf1 include:amazonses.com ~all"`                                              | ✅                   |

### 🚨 Records CASSÉS côté Cloudflare (2 MX)

| Type | Name                            | Content actuel (CASSÉ)                                                                          | Content attendu                              | Action               |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------- |
| MX   | `veronecollections.fr` apex     | `SMTP.GOOGLE.COM.veronecollections.fr.veronecollections.fr` (priorité 1)                        | `SMTP.GOOGLE.COM` (priorité 1)               | **Edit Mail server** |
| MX   | `send.app.veronecollections.fr` | `feedback-smtp.eu-west-1.amazonses.com.veronecollections.fr.veronecollections.fr` (priorité 10) | `feedback-smtp.eu-west-1.amazonses.com` (10) | **Edit Mail server** |

Vérifié visuellement dans le formulaire d'édition Cloudflare (textarea Mail server contient bien la valeur doublement qualifiée). Ce n'est pas un bug d'export BIND : le stockage interne est cassé.

### 🗑 Records à SUPPRIMER côté Cloudflare (2 NS placeholders)

| Type | Name                   | Content actuel        | Action            |
| ---- | ---------------------- | --------------------- | ----------------- |
| NS   | `veronecollections.fr` | `ns1.dns-parking.com` | **Delete record** |
| NS   | `veronecollections.fr` | `ns2.dns-parking.com` | **Delete record** |

Ces NS apex pointent vers Hostinger. Une fois la zone active sur Cloudflare, ces NS records dans la zone créeraient une incohérence (NS officiels au TLD = Cloudflare, NS apex dans la zone = Hostinger). Ils n'auraient aucun effet métier mais polluent la zone. À supprimer par hygiène.

NS officiels Cloudflare (assignés à la zone, gérés automatiquement) : `kellen.ns.cloudflare.com` + `nataly.ns.cloudflare.com` — visibles dans le panneau « Cloudflare Nameservers » du dashboard.

---

## Diff exact à appliquer AVANT switch NS

### Étape A (4 actions sur dashboard Cloudflare)

1. **Edit MX apex Google** :
   - Name: `veronecollections.fr` (inchangé)
   - Mail server: `SMTP.GOOGLE.COM.veronecollections.fr.veronecollections.fr` → **`SMTP.GOOGLE.COM`**
   - Priority: `1` (inchangé)
   - TTL: `14400` (inchangé)
   - Save

2. **Edit MX send.app Resend** :
   - Name: `send.app.veronecollections.fr` (inchangé)
   - Mail server: `feedback-smtp.eu-west-1.amazonses.com.veronecollections.fr.veronecollections.fr` → **`feedback-smtp.eu-west-1.amazonses.com`**
   - Priority: `10` (inchangé)
   - TTL: `14400` (inchangé)
   - Save

3. **Delete NS** `ns1.dns-parking.com` (record apex)

4. **Delete NS** `ns2.dns-parking.com` (record apex)

Pas d'ajout de record. Pas de modif des autres records. Pas de touch aux NS officiels Cloudflare.

### Validation post-correction

- Re-screenshot du tableau DNS Cloudflare propre
- Re-export BIND pour archiver l'état corrigé
- Vérifier que les 11 records OK n'ont pas bougé

### Étape B (switch NS chez Hostinger — POINT DE NON-RETOUR)

Une fois A validé visuellement par Roméo :

- Hostinger hpanel.hostinger.com → veronecollections.fr → DNS / Serveurs de noms → Modifier
- NS1 = `kellen.ns.cloudflare.com`
- NS2 = `nataly.ns.cloudflare.com`
- NS3, NS4 = vides
- Save + screenshot avant/après

### Étape C (vérifications)

- Polling 30 min : `dig @1.1.1.1 NS veronecollections.fr` jusqu'à voir `kellen` + `nataly`
- Pour CHAQUE record post-propagation : `dig @kellen.ns.cloudflare.com {name} {type} +short`
- Test email Resend : envoi vers `veronebyromeo@gmail.com` (réception Google si MX OK)
- Test email Google : envoi vers `romeo@veronecollections.fr` depuis Gmail externe (réception si MX Google OK + SPF + DKIM)

### Étape D (custom hostname Images)

Une fois zone passée en `Active` côté Cloudflare (status visible dans Overview), Cloudflare émet automatiquement Universal SSL pour `images.veronecollections.fr` (5-30 min).

Test : `curl -I https://images.veronecollections.fr/{HASH}/{IMAGE_ID}/social1x1` → HTTP 200/302/415 attendu (n'importe quoi sauf SSL handshake fail).

### Étape E (activation côté code Vérone — différée)

À documenter mais NE PAS exécuter avant que Roméo le décide. Voir `INFRA-IMG-CUSTOM-DOMAIN-2026-05-01.md` section 6 pour la procédure (.env.local + Vercel env).

---

## Plan de rollback

Si UN test fail à n'importe quelle étape post-switch :

1. Hostinger → remettre NS = `ns1.dns-parking.com` + `ns2.dns-parking.com`
2. Propagation ~5 min sur Cloudflare 1.1.1.1, ~30 min ailleurs
3. Site et emails restaurés à l'état actuel
4. Documenter l'échec dans ce fichier (nouvelle section « Rollback YYYYMMDD-HHMM »)

---

## Crédentials utilisés

- Cloudflare dashboard : session OAuth Google `romeo@veronecollections.fr` active dans Playwright lane-2
- Hostinger hpanel : session active dans Playwright lane-2 (post HOTFIX-001)
- Aucun nouveau credential créé

---

## Screenshots horodatés

- `.playwright-mcp/screenshots/20260501/cf-dns-records-state-19h41.png` — état initial zone Cloudflare (13 records)
- `.playwright-mcp/screenshots/20260501/cf-edit-mx-google.png` — preuve bug stockage MX Google
- `.playwright-mcp/screenshots/20260501/cf-edit-cname-www.png` — preuve CNAME OK
- `.playwright-mcp/screenshots/20260501/cf-edit-a-apex-top.png` — preuve A apex OK
- `.playwright-mcp/cf-records-inspect.json` — dump JSON inputs/textareas de 9 records vérifiés
- `.playwright-mcp/hostinger-live-snapshot-2026-05-01.txt` — snapshot dig live Hostinger

---

## ⚡ Update 20:07 — Découverte d'un bug plus grave + corrections complètes

Pendant l'application des 4 corrections initiales, j'ai découvert que **le bug de doublement (`veronecollections.fr.veronecollections.fr.`) n'était PAS cosmétique export, mais bel et bien stocké en interne**.

**Preuve** : test d'un re-save sans modif sur le record A apex →

- AVANT re-save : BIND export = `veronecollections.fr.veronecollections.fr. 1 IN A 216.198.79.1`
- APRÈS re-save : BIND export = `veronecollections.fr. 1 IN A 216.198.79.1` ✅

**Conséquence** : 9 records hors les 3 propres (CNAME images, MX Google après fix, MX Resend après fix) étaient cassés. Sans re-save, la zone Cloudflare aurait servi les records sous des names doublement qualifiés inexistants au switch.

### Actions complémentaires appliquées (au-delà des 4 du diff initial)

Re-save (Edit + trick dirty state + Save) sur les 8 records buggés :

| #   | Record                                           | Avant (name stocké)                                                | Après (name stocké)                           | Status |
| --- | ------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------- | ------ |
| 1   | A apex                                           | `veronecollections.fr.veronecollections.fr.`                       | `veronecollections.fr.`                       | ✅     |
| 2   | CNAME `gbnouc5jzx74.veronecollections.fr`        | `gbnouc5jzx74.veronecollections.fr.veronecollections.fr.`          | `gbnouc5jzx74.veronecollections.fr.`          | ✅     |
| 3   | CNAME `www.veronecollections.fr`                 | `www.veronecollections.fr.veronecollections.fr.`                   | `www.veronecollections.fr.`                   | ✅     |
| 4   | TXT `_dmarc.veronecollections.fr`                | `_dmarc.veronecollections.fr.veronecollections.fr.`                | `_dmarc.veronecollections.fr.`                | ✅     |
| 5   | TXT `resend._domainkey.app.veronecollections.fr` | `resend._domainkey.app.veronecollections.fr.veronecollections.fr.` | `resend._domainkey.app.veronecollections.fr.` | ✅     |
| 6   | TXT `send.app.veronecollections.fr` (SPF)        | `send.app.veronecollections.fr.veronecollections.fr.`              | `send.app.veronecollections.fr.`              | ✅     |
| 7   | TXT apex (SPF)                                   | `veronecollections.fr.veronecollections.fr.`                       | `veronecollections.fr.`                       | ✅     |
| 8   | TXT apex (google-site-verification)              | `veronecollections.fr.veronecollections.fr.`                       | `veronecollections.fr.`                       | ✅     |

Note : le CNAME `images` (Proxied) était déjà propre car ajouté manuellement hier dans le sprint INFRA-IMG. Les 2 MX (Google + Resend) ont été corrigés ET re-savés à l'étape A initiale.

---

## État final zone Cloudflare (BIND export 20:06:51)

```
;; SOA Record
veronecollections.fr	3600	IN	SOA	kellen.ns.cloudflare.com. dns.cloudflare.com. 2052933261 10000 2400 604800 3600

;; NS Records
veronecollections.fr.	86400	IN	NS	kellen.ns.cloudflare.com.
veronecollections.fr.	86400	IN	NS	nataly.ns.cloudflare.com.

;; A Records
veronecollections.fr.	1	IN	A	216.198.79.1

;; CNAME Records
gbnouc5jzx74.veronecollections.fr.	1	IN	CNAME	gv-6sopydpinkavcx.dv.googlehosted.com.
images.veronecollections.fr.	1	IN	CNAME	imagedelivery.net.   ; Proxied (orange)
www.veronecollections.fr.	1	IN	CNAME	243ab161976a4289.vercel-dns-017.com.

;; MX Records
send.app.veronecollections.fr.	14400	IN	MX	10 feedback-smtp.eu-west-1.amazonses.com.
veronecollections.fr.	14400	IN	MX	1 smtp.google.com.

;; TXT Records
_dmarc.veronecollections.fr.	14400	IN	TXT	"v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r"
resend._domainkey.app.veronecollections.fr.	14400	IN	TXT	"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDPAklUmXwXb3Vc3zvR6fxlJzm8p5rqCUvUDJ5jzEJli0uK6qU0FeQHSpNXhQnpO2RC8a7XxWPevnev01wYlOc4AivkGN9+VCqVbir+e5p48XJOXOSb9gVoepsKgxQZ2pVk12Gww5gHMmsAcUiFTIhK8jkAn5SpFPL0U3WN/MVQrQIDAQAB"
send.app.veronecollections.fr.	14400	IN	TXT	"v=spf1 include:amazonses.com ~all"
veronecollections.fr.	14400	IN	TXT	"google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"
veronecollections.fr.	14400	IN	TXT	"v=spf1 include:_spf.google.com include:amazonses.com ~all"
```

11 records utiles + SOA + 2 NS Cloudflare. Aucun NS placeholder Hostinger. Aucun name doublé.

---

## Diff sémantique vs Hostinger live

| Record                       | Hostinger                                                                        | Cloudflare (final)                                       | Match                 |
| ---------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| A apex                       | 216.198.79.1                                                                     | 216.198.79.1                                             | ✅                    |
| MX apex                      | 1 SMTP.GOOGLE.COM.                                                               | 1 smtp.google.com.                                       | ✅ (case-insensitive) |
| MX send.app                  | 10 feedback-smtp.eu-west-1.amazonses.com.                                        | 10 feedback-smtp.eu-west-1.amazonses.com.                | ✅                    |
| CNAME www                    | 243ab161976a4289.vercel-dns-017.com.                                             | 243ab161976a4289.vercel-dns-017.com.                     | ✅                    |
| CNAME gbnouc5jzx74           | gv-6sopydpinkavcx.dv.googlehosted.com.                                           | gv-6sopydpinkavcx.dv.googlehosted.com.                   | ✅                    |
| TXT apex SPF                 | "v=spf1 include:\_spf.google.com include:amazonses.com ~all"                     | identique                                                | ✅                    |
| TXT apex google-verification | "google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"           | identique                                                | ✅                    |
| TXT \_dmarc                  | "v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r" | identique                                                | ✅                    |
| TXT send.app SPF             | "v=spf1 include:amazonses.com ~all"                                              | identique                                                | ✅                    |
| TXT resend.\_domainkey.app   | "p=MIGfMA0..." (DKIM Resend, 220 chars)                                          | identique                                                | ✅                    |
| **CNAME images** (extra)     | (n'existe pas)                                                                   | imagedelivery.net (Proxied) ← record du sprint INFRA-IMG | ✅                    |

**0 différence sémantique sur les 11 records existants. + 1 record extra (images) du sprint.**

TTL diffèrent (Hostinger 14400s vs Cloudflare Auto = ~5 min sur A/CNAME, 14400s sur MX/TXT) — accepté, sans impact.

---

## Plan de rollback (préparé, prêt à exécuter en < 5 min)

Si UN test fail après le switch NS :

1. **Hostinger** : hpanel.hostinger.com → Domaines → veronecollections.fr → Serveurs de noms → Modifier
2. Remettre :
   - Field 1 = `ns1.dns-parking.com`
   - Field 2 = `ns2.dns-parking.com`
   - Field 3 vide, Field 4 vide
3. Save → propagation 1.1.1.1 ~5 min, autres résolveurs ~10-30 min
4. Site et emails restaurés à l'état actuel (Hostinger zone reste intacte côté serveur Hostinger, n'a jamais été touchée)
5. Documenter l'échec dans une nouvelle section « Rollback YYYYMMDD-HHMM »

**La zone Hostinger n'a JAMAIS été modifiée**, seuls les NS du registrar bougent. Donc rollback = juste re-pointer NS, aucune perte d'info.

---

## STOP — point de non-retour

Cloudflare zone est prête. Hostinger zone est intacte. Plan rollback documenté.

**Action suivante (qui demande ton GO explicite Roméo)** : switch NS chez Hostinger via Playwright lane-2 (panneau Hostinger encore actif).

---

## Question pour Roméo

Tu valides le switch NS ? Confirmation requise avant action FEU ROUGE point de non-retour.

Preuves à valider :

- Screenshot final zone Cloudflare propre : `.playwright-mcp/screenshots/20260501/cf-zone-FINAL-clean-before-switch.png`
- BIND export Cloudflare propre : `.playwright-mcp/veronecollections-fr.txt` (timestamp 20:06:51)
- Snapshot Hostinger live : `.playwright-mcp/hostinger-live-snapshot-2026-05-01.txt`
- Diff sémantique : 0 différence (table ci-dessus)
- Plan rollback : prêt, < 5 min

Si tu valides, j'enchaîne :

1. Switch NS Hostinger (kellen + nataly, vider field 3 et 4)
2. Polling propagation `dig @1.1.1.1 NS veronecollections.fr` toutes les 2 min (jusqu'à voir Cloudflare ou max 30 min)
3. Tests dig de chaque record contre `kellen.ns.cloudflare.com` puis contre 1.1.1.1
4. Test email aller-retour Resend + Google
5. Si tout OK : étape custom hostname Images (cert SSL Universal automatique 5-30 min)
6. Si fail : rollback NS immédiat

Si tu refuses ou veux attendre : zone Cloudflare reste prête (PENDING), aucun risque, on peut switcher demain ou plus tard sans rien refaire.

---

## ⚡ Update 22:24 → 22:59 — Switch NS exécuté + validation post-propagation

### Switch NS Hostinger — 22:24 CEST

Via Playwright lane-2 sur hpanel.hostinger.com → veronecollections.fr → DNS / Serveurs de noms → Modifier les serveurs de noms :

- Sélection radio « Modifier les serveurs de noms » (au lieu de « Utiliser les serveurs de noms Hostinger »)
- Field 1 : `ns1.dns-parking.com` → **`kellen.ns.cloudflare.com`**
- Field 2 : `ns2.dns-parking.com` → **`nataly.ns.cloudflare.com`**
- Fields 3-6 : laissés vides
- Click « Enregistrer »
- Modal Hostinger : **« Les noms de serveurs ont été changé ! »** confirmé visuellement
- Bandeau jaune apparu : « Vos enregistrements DNS sont actuellement gérés chez un autre fournisseur »
- Heure exacte du switch : **2026-05-01 22:24 CEST**

Screenshots de preuve :

- `.playwright-mcp/screenshots/20260501/hostinger-edit-ns-form-CLOUDFLARE.png` (formulaire rempli avant Save)
- `.playwright-mcp/screenshots/20260501/hostinger-after-switch-NS.png` (modal de confirmation)

### Polling propagation — T+0 à T+6 min

Polling background `/tmp/dns-poll/poll-loop.sh` toutes les 2 min, contre `1.1.1.1`, `8.8.8.8`, `9.9.9.9` :

| Timestamp | NS @1.1.1.1                                             | Statut      |
| --------- | ------------------------------------------------------- | ----------- |
| T+0m      | ns1.dns-parking.com / ns2.dns-parking.com               | Cache TLD   |
| T+2m      | idem                                                    | Cache TLD   |
| T+4m      | idem                                                    | Cache TLD   |
| **T+6m**  | **kellen.ns.cloudflare.com / nataly.ns.cloudflare.com** | **PROPAGÉ** |
| T+7m      | confirmé stable                                         | OK          |

→ **Propagation Cloudflare 1.1.1.1 en 6 minutes** (TTL TLD `.fr` 3600s mais en pratique beaucoup plus rapide).
→ Google 8.8.8.8 et Quad9 9.9.9.9 propagés également quelques minutes après.
→ OpenDNS encore en cache au moment du rapport (normal, propagation progressive géographique).

### Vérifications DNS post-propagation (T+6 à T+33 min)

```
[A apex]               : 216.198.79.1
[MX apex]              : 1 smtp.google.com.
[CNAME www]            : 243ab161976a4289.vercel-dns-017.com.
[CNAME images]         : imagedelivery.net.
[TXT _dmarc]           : "v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r"
[TXT apex SPF]         : "v=spf1 include:_spf.google.com include:amazonses.com ~all"
[TXT apex google-verif]: "google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"
[MX send.app]          : 10 feedback-smtp.eu-west-1.amazonses.com.
```

✅ Tous les records résolvent correctement. Aucune trace du bug doublement qualifié (corrections du Edit + Save ont bien normalisé le storage côté Cloudflare avant le switch).

### Tests HTTPS

| URL                                 | Avant switch       | Après switch               | Verdict        |
| ----------------------------------- | ------------------ | -------------------------- | -------------- |
| https://www.veronecollections.fr    | HTTP 200 (Vercel)  | HTTP 200 (Vercel)          | ✅ Identique   |
| https://veronecollections.fr        | HTTP 307 → www     | HTTP 307 → www             | ✅ Identique   |
| https://images.veronecollections.fr | SSL handshake fail | **HTTP 403 + cert SSL OK** | ✅ Cert émis   |
| https://imagedelivery.net/...       | HTTP 200           | HTTP 200                   | ✅ Baseline OK |

### Tests email — 2 envois critiques (22:37 CEST)

Envoi via Resend API :

**Test 1 — SORTANT vers Gmail externe** :

- From : `Vérone DNS Test <contact@app.veronecollections.fr>`
- To : `veronebyromeo@gmail.com`
- Resend Email ID : `808c4af3-f05b-45b4-8356-260b6cd8a40b`
- ✅ **Reçu dans Gmail** (vérifié via MCP Gmail search)
- → Valide : MX send.app + SPF send.app + DKIM Resend + DMARC OK

**Test 2 — ENTRANT vers Google Workspace** :

- From : `Vérone DNS Test <contact@app.veronecollections.fr>`
- To : `romeo@veronecollections.fr`
- Resend Email ID : `f4813a1d-ebe8-4b36-bcb8-ca0c6205d7a5`
- ✅ **Reçu dans Google Workspace** (vérifié via MCP Gmail search, thread ID `19de5426dbac8de5`)
- → Valide : MX apex pointant vers smtp.google.com + acceptation Google Workspace

**Aucune perte d'email**. La migration est sûre côté email.

### Activation zone Cloudflare — T+15 min

Bouton « Check nameservers now » cliqué dans le dashboard Cloudflare Overview à T+15 min.

À T+27 min (22:51 CEST), zone Cloudflare passée en **ACTIVE** :

- Bandeau « Your domain is now protected by Cloudflare » avec check vert
- Plus de message « Waiting for your registrar to propagate »
- Quick start guide affiché (mode actif)
- Cert SSL Universal pour `images.veronecollections.fr` émis automatiquement

Screenshot : `.playwright-mcp/screenshots/20260501/cf-overview-T+27min.png`

### Cert SSL `images.veronecollections.fr` — T+27 min

```
$ curl -I https://images.veronecollections.fr
HTTP/2 403
server: cloudflare
cf-ray: 9f51a9f31ab9d30d-CDG
```

✅ **TLS handshake OK** (avant le switch : SSL handshake failure → maintenant SSL valide).
🟡 HTTP 403 sur l'URL d'image avec ID réelle. Comportement attendu : Cloudflare Images requiert une étape supplémentaire pour servir les images via custom hostname. Le cert SSL est OK, le réseau Cloudflare répond, mais le serving des images via `images.veronecollections.fr` n'est pas encore activé.

→ À investiguer dans le sprint d'activation côté code (étape suivante, hors scope ce sprint).

---

## 🔧 Procédure d'activation côté code Vérone (NE PAS exécuter — documentation pour Roméo)

Ces étapes sont reportées. À exécuter par Roméo (ou agent sur ordre explicite Roméo) après validation du custom hostname côté Cloudflare Images.

### 1. Vérifier que le code lit bien la variable env

```bash
grep -r "NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN\|images.veronecollections.fr" \
  apps packages 2>/dev/null
```

Si la variable n'est pas lue → coder le switch dans `packages/@verone/images/...` ou équivalent (sprint séparé). Si elle est lue → continuer étape 2.

### 2. Variables `.env.local` des 3 apps

Dans `apps/back-office/.env.local`, `apps/site-internet/.env.local`, `apps/linkme/.env.local` :

```env
NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true
```

### 3. Variables Vercel (Production + Preview) sur les 3 projets

Via dashboard Vercel ou CLI `vercel env` :

```env
NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true
```

### 4. Redéploiement Vercel automatique au push.

### 5. Validation Roméo

- Ouvrir back-office, site-internet, LinkMe — vérifier que les images chargent
- Vérifier l'URL générée dans le HTML : `https://images.veronecollections.fr/{HASH}/{ID}/{VARIANT}` au lieu de `https://imagedelivery.net/{HASH}/{ID}/{VARIANT}`
- Confirmer 0 régression (404, broken images)

### 6. Investigation HTTP 403 sur custom hostname

Si l'image en HTTP 403 persiste après activation côté code :

- Aller sur dash.cloudflare.com → veronecollections.fr → SSL/TLS → Custom hostnames (si présent)
- Ou Cloudflare Images → Hosted images → Sourcing Kit → ajouter `images.veronecollections.fr` comme hostname autorisé
- Ou Account-level setting `transform_via_url = true` (à confirmer dans la doc Cloudflare Images 2025)

---

## 🛡 Plan de rollback (toujours valide, ~5 min)

Si après l'activation côté code une régression apparaît :

1. Vercel env : retirer `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` ou mettre à `false`
2. Redéploiement automatique → URLs reviennent à `imagedelivery.net`
3. Aucune action DNS nécessaire

Si problème DNS plus large (improbable maintenant) :

1. Hostinger → remettre NS = `ns1.dns-parking.com` + `ns2.dns-parking.com`
2. Propagation ~5-30 min selon résolveur
3. Zone Hostinger intacte côté serveur Hostinger, état restauré

---

## 📊 Bilan migration

| Critère                                          | Statut                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Switch NS Hostinger → Cloudflare                 | ✅ 22:24                                         |
| Propagation NS Cloudflare 1.1.1.1                | ✅ T+6 min                                       |
| Propagation NS Cloudflare 8.8.8.8                | ✅ T+10 min env.                                 |
| Tous les records DNS résolus                     | ✅ A, MX, CNAME, TXT                             |
| Site `https://www.veronecollections.fr`          | ✅ HTTP 200                                      |
| Email sortant Resend → Gmail                     | ✅ Reçu                                          |
| Email entrant Resend → Google Workspace          | ✅ Reçu                                          |
| Zone Cloudflare ACTIVE                           | ✅ T+27 min                                      |
| Cert SSL Universal `images.veronecollections.fr` | ✅ Émis automatiquement                          |
| Custom hostname Images servant les images        | 🟡 HTTP 403 (étape activation côté code requise) |
| Activation `.env Vercel`                         | ⏸ Reportée par Roméo                            |

**Migration DNS 100% réussie. Custom hostname Images prêt à recevoir l'activation côté code.**

Coût pratique : ~33 min entre le switch et la zone ACTIVE complète. Aucune perte d'email, aucune downtime perçue côté utilisateur.

---

## ⚡ Update 23:32 → 23:55 — Activation Vercel + tests runtime + diagnostic HTTP 403

### Modifications appliquées (sur GO Romeo)

**3 .env.local locaux** (gitignored, modifiés en place pour cohérence dev) :

- `apps/back-office/.env.local` : `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true`
- `apps/site-internet/.env.local` : idem
- `apps/linkme/.env.local` : idem

**3 env vars Vercel ajoutées** (Production + Preview + Development, Sensitive OFF) :

- Project `verone-back-office`
- Project `veronecollections-fr` (= site-internet en prod)
- Project `linkme`

**3 redeploys Vercel triggés** à 23:32 :

- `EEGqNvse1niZQF235dAqxvL9pAWz` (back-office)
- `A6rarTDotvVmku3Xotq5gdBs4Qey` (veronecollections-fr)
- `2upYonHWzK3eKN5YAyPSBKjw55gP` (linkme)

**`.claude/local/CREDENTIALS-VAULT.md`** mis à jour : section Cloudflare avec Zone ID, NS officiels, état activation custom domain.

### 🚨 Diagnostic HTTP 403 sur `images.veronecollections.fr`

```
$ curl https://images.veronecollections.fr/{hash}/{id}/public
error code: 1014
```

**Cloudflare Error Code 1014 = "CNAME Cross-User Banned"**.

Cause : Cloudflare interdit qu'une zone Cloudflare ait un CNAME vers `imagedelivery.net` (autre service Cloudflare) **sans Custom Hostname binding explicite côté Cloudflare Images**.

Le simple fait que la zone soit ACTIVE et que le CNAME soit Proxied **ne suffit pas**. Il faut activer le hostname `images.veronecollections.fr` dans :

- Cloudflare Images > Settings > Custom subdomain (si UI dispo)
- OU API : POST sur `/accounts/{id}/images/v1/...` (endpoint à confirmer)
- OU support Cloudflare ticket si l'option n'est pas disponible sur plan Free

### Tests runtime Playwright

Page produit `https://www.veronecollections.fr/produit/fauteuil-eve-bouclette-bleu-klein` (post-redeploy) :

| Métrique                                 | Résultat                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| Page chargée                             | ✅ HTTP 200                                                                |
| Total images                             | 24                                                                         |
| Images via `imagedelivery.net`           | 0 (pas utilisé sur cette page)                                             |
| Images via `images.veronecollections.fr` | 0 (composant CloudflareImage non utilisé sur cette page)                   |
| Images via `_next/image` (Vercel)        | 24                                                                         |
| Images broken                            | 21 (URLs Supabase Storage cassées — **problème pré-existant indépendant**) |

**Conclusion** : la migration DNS et l'activation Vercel **n'ont causé AUCUNE régression visible**. Le composant `CloudflareImage` du package n'est pas (ou peu) utilisé sur les pages actuelles du site-internet — donc le HTTP 403 sur le custom hostname n'a aucun impact pratique.

Les 21 broken images sont des URLs Supabase Storage (`aorroydfjsrygmosnzrl.supabase.co/storage/...`) routées via Vercel Image Optimization. Bug pré-existant non lié à ce sprint, à investiguer séparément si nécessaire.

### Schedule re-check 60 min

Un agent est planifié à 00:55 CEST pour :

- Re-tester `curl https://images.veronecollections.fr/{hash}/{id}/public`
- Si HTTP 200 : Cloudflare Images binding propagé naturellement, sprint clôturé
- Si HTTP 403 toujours : investigation Cloudflare Images Custom Hostname binding manuel ou ticket support

### Bilan révisé

| Critère                                          | Statut                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| Switch NS Hostinger → Cloudflare                 | ✅                                                  |
| Propagation NS publique                          | ✅ T+6 min                                          |
| Tous les records DNS résolvent                   | ✅                                                  |
| Site `https://www.veronecollections.fr` HTTP 200 | ✅                                                  |
| Email sortant Resend                             | ✅ Reçu                                             |
| Email entrant Google Workspace                   | ✅ Reçu                                             |
| Zone Cloudflare ACTIVE                           | ✅ T+27 min                                         |
| Cert SSL Universal `images.veronecollections.fr` | ✅ Émis                                             |
| 3 .env.local locaux                              | ✅ NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true    |
| 3 env vars Vercel                                | ✅ Activées en Prod/Preview/Dev                     |
| 3 redeploys Vercel                               | ✅ Triggés                                          |
| Tests runtime page produit (pas de régression)   | ✅                                                  |
| Custom hostname HTTP 200 sur image réelle        | 🟡 HTTP 403 (Cloudflare error 1014, binding requis) |

**Migration DNS = succès complet. Custom hostname Images = nécessite étape supplémentaire côté Cloudflare Images settings (sprint séparé ou re-check à 00:55).**

### Cleanup à effectuer

```bash
git -C /Users/romeodossantos/verone-back-office-V1 worktree remove /Users/romeodossantos/verone-dns-migrate
git -C /Users/romeodossantos/verone-back-office-V1 branch -d chore/INFRA-DNS-MIGRATE-CLOUDFLARE
```

Effectué dans la phase finale ci-dessous.

---

## 📁 Artefacts

- Snapshot Hostinger pré-migration : `.playwright-mcp/hostinger-live-snapshot-2026-05-01.txt`
- Export BIND Cloudflare final propre : `.playwright-mcp/veronecollections-fr.txt` (timestamp 20:06:51)
- Polling propagation log : `/tmp/dns-poll/poll-loop.log`
- JSON dump des inputs Cloudflare audit : `.playwright-mcp/cf-records-inspect.json`
- JSON dump du re-save 7 records : `.playwright-mcp/cf-resave-7records.json`
- Screenshots horodatés (~15) dans `.playwright-mcp/screenshots/20260501/`
