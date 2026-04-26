# Audit + Benchmark + Architecture cible — Système ambassadeurs Verone

**Date** : 2026-04-26
**Auteur** : Claude (mode audit, zéro modification de code)
**Demande Romeo** : refonte du modèle ambassadeur (un client peut être ambassadeur, tracking par lien + code promo, niveaux ou pas, etc.). Audit complet AVANT toute modification, benchmark industrie, recommandation senior.

---

## 0. Résumé exécutif (3 lignes)

Le squelette ambassadeur Verone est **architecturalement bon et aligné avec les standards industrie 2026** (tracking dual code+lien prévu en DB, calcul commission sur HT après remise, validation 30j post-vente). Il manque **2 pièces côté checkout** (lecture du cookie `verone_ref` quand pas de code, attribution `referral_link`). Le modèle "client = ambassadeur" demandé par Romeo nécessite une **migration FK ciblée sur 3 tables** (0 records actuellement → risque très bas). **Pas besoin de déconstruire.**

---

## 1. Vision produit Romeo (synthèse de tes messages)

| #   | Règle                                                                                                                                                        | Statut côté code                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| R1  | Pas de "profil ambassadeur" séparé. Tout client peut devenir ambassadeur en cochant une case dans son `/compte`.                                             | ❌ À faire — actuellement table `site_ambassadors` séparée                                         |
| R2  | Côté BO : admin peut activer le statut sur un client existant **OU** créer un compte client+ambassadeur direct (email + password temporaire envoyé par mail) | ⚠️ Existe partiellement (route `create-auth` crée auth user mais pas lié au client)                |
| R3  | Tracking par **lien d'affiliation** avec ID de l'ambassadeur dans l'URL : si client oublie le code, l'ambassadeur reste tracé (vente attribuée)              | ✅ Cookie `verone_ref` 30j en place ❌ Mais checkout ne le lit pas                                 |
| R4  | Si client n'utilise pas le code promo : pas de réduction client. Mais ambassadeur reste rémunéré (lien)                                                      | ❌ Logique pas implémentée côté checkout                                                           |
| R5  | L'ambassadeur choisit son taux (10% ou 15%) — selon son niveau ou config                                                                                     | ⚠️ Champ `commission_rate` existe par ambassadeur, mais pas de système de niveaux                  |
| R6  | Dans la rubrique ambassadeur : génération + partage du lien, suivi des gains, notifications email à chaque gain                                              | ⚠️ Page `/ambassadeur` existe (KPIs + codes + history) ❌ Notif email manquante                    |
| R7  | BO doit gérer les paiements primes (workflow validation → payé)                                                                                              | ❌ UI BO de paiement manquante                                                                     |
| R8  | Calcul commission : article 100€ avec 10% promo = 90€, ambassadeur 10% = 9€                                                                                  | ✅ Conforme (calcul actuel : `orderHt = finalTtc / 1.2`, puis `prime = orderHt * commission_rate`) |
| R9  | Différence avec LinkMe : LinkMe = catalogue custom + commission par produit. Site = pourcentage flat sur tout le catalogue                                   | ✅ Modèle Verone actuel respecte cette distinction                                                 |

---

## 2. État existant — Architecture actuelle

### 2.1 Tables DB (5 tables liées, 0 records)

```
site_ambassadors (0 rows)
├── id, first_name, last_name, email UNIQUE, phone
├── auth_user_id UNIQUE FK → auth.users (ON DELETE SET NULL)
├── commission_rate NUMERIC(5,2) DEFAULT 10.00      ← prime ambassadeur (%)
├── discount_rate NUMERIC(5,2) DEFAULT 10.00         ← réduction client (%)
├── is_active, cgu_accepted_at, cgu_version
├── total_sales_generated, total_primes_earned, total_primes_paid
├── current_balance, annual_earnings_ytd, siret_required
├── iban, bic, bank_name, account_holder_name, siret  ← coordonnées paiement
└── notes, created_by, timestamps

ambassador_codes (0 rows)
├── id
├── ambassador_id FK → site_ambassadors (CASCADE)
├── discount_id FK → order_discounts (CASCADE)         ← lien vers le code promo réel
├── code TEXT UNIQUE                                    ← ex: "ROMEO10"
├── qr_code_url                                          ← générée à l'écriture
├── is_active, usage_count
└── created_at

ambassador_attributions (0 rows)
├── id
├── order_id FK → sales_orders (UNIQUE per order)
├── ambassador_id FK → site_ambassadors
├── code_id FK → ambassador_codes
├── order_total_ht, commission_rate, prime_amount
├── status ('pending' | 'validated' | 'cancelled' | 'paid')
├── validation_date (now + 30j), validated_at, paid_at
├── cancellation_reason
├── attribution_method ('coupon_code' | 'referral_link')   ← prévu pour les 2 modes
└── created_at

order_discounts (15+ rows, codes promo génériques)
├── id, code, name, description
├── discount_type ('percentage' | 'fixed' | 'free_shipping')
├── discount_value, max_discount_amount, min_order_amount
├── valid_from, valid_until, max_uses_total, max_uses_per_customer
├── current_uses, is_active, requires_code, is_combinable
├── applicable_channels[], applicable_customer_types[]
├── target_type, is_automatic, exclude_sale_items
└── created_by, timestamps

promotion_usages (audit trail)
├── id, discount_id FK, order_id FK UNIQUE, customer_id FK
├── discount_amount, used_at
```

**Triggers DB** :

- `trg_update_ambassador_counters` — INSERT/UPDATE sur `ambassador_attributions` met à jour `site_ambassadors.total_*`, `current_balance`
- `trg_increment_ambassador_code_usage` — incrémente `ambassador_codes.usage_count`
- `trg_set_updated_at_site_ambassadors` — touch updated_at

**RLS** :

- `is_backoffice_user()` → full access (pattern staff Verone standard)
- `auth.uid() = ambassador.auth_user_id` → ambassador read/update own data

### 2.2 Code site-internet

| Fichier                                                                         | Statut     | Logique                                                                                                       |
| ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/site-internet/src/middleware.ts`                                          | ✅ COMPLET | Détecte `?ref=CODE` → cookie `verone_ref` 30j, `httpOnly:false`, `sameSite:'lax'`                             |
| `apps/site-internet/src/app/ambassadeur/page.tsx` (447L)                        | ✅ COMPLET | Dashboard : KPIs, codes promo + QR, historique attributions, modal CGU                                        |
| `apps/site-internet/src/app/api/checkout/route.ts`                              | ✅ COMPLET | Server-side promo revalidation + create draft order + ambassador attribution                                  |
| `apps/site-internet/src/app/api/checkout/helpers/create-order.ts:174-236`       | ⚠️ PARTIEL | `createAmbassadorAttribution()` ne fonctionne **QU'AVEC code promo**. Pas de fallback sur cookie `verone_ref` |
| `apps/site-internet/src/app/api/checkout/helpers/validate-promo.ts`             | ✅ COMPLET | Validation server-side du code promo, recalcul discount                                                       |
| `apps/site-internet/src/app/api/webhooks/stripe/route.ts`                       | ✅ COMPLET | Track promo usage, update order status, audit trail                                                           |
| `apps/site-internet/src/app/api/cron/validate-ambassador-primes/route.ts` (91L) | ✅ COMPLET | Cron daily : pending → validated après 30j                                                                    |

### 2.3 Code back-office

| Fichier                                        | Statut     | Logique                                                                                                                     |
| ---------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `AmbassadorsSection.tsx` (359L)                | ✅ COMPLET | Liste, recherche, toggle actif/inactif, créer compte auth                                                                   |
| `CreateAmbassadorModal.tsx` (309L)             | ✅ COMPLET | Form création ambassadeur (identité + taux + code + IBAN + notes)                                                           |
| `QrCodeDisplay.tsx` (99L)                      | ✅ COMPLET | Génère QR code via lib `qrcode`                                                                                             |
| `use-ambassadors.ts` (322L)                    | ✅ COMPLET | Hooks queries + mutations (create, toggle, create-auth)                                                                     |
| `/api/ambassadors/create-auth/route.ts` (158L) | ⚠️ PARTIEL | Crée auth user pour un ambassadeur existant. ❌ Aucun check `is_backoffice_user()` ; ❌ Ne lie pas à `individual_customers` |

### 2.4 Ce qui MANQUE par rapport à la vision Romeo

| #   | Manquant                                                                                                                                    | Sévérité  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| M1  | **Lecture du cookie `verone_ref` au checkout** : si `discountCode` absent mais cookie présent → créer `attribution_method: 'referral_link'` | P0        |
| M2  | **Notification email** à l'ambassadeur à chaque nouveau gain (after Stripe webhook)                                                         | P1        |
| M3  | **Workflow paiement primes BO** (validate → pay → mark paid + virement)                                                                     | P1        |
| M4  | **Modèle "client = ambassadeur" unifié** (refacto `site_ambassadors` → flag sur `individual_customers`)                                     | P1        |
| M5  | **Système de niveaux** (optionnel selon décision benchmark — voir §3)                                                                       | P2        |
| M6  | **Page paramètres ambassadeur dans `/compte`** (toggle "devenir ambassadeur" + voir infos)                                                  | P1        |
| M7  | **BO : créer compte client+ambassadeur en 1 action** (avec envoi email accès + password temp)                                               | P1        |
| M8  | **Tests E2E ambassadeur** (zéro test actuellement)                                                                                          | P1        |
| M9  | **Page `/canaux-vente/site-internet` 404 prod** (déjà documenté Bug 0 audit visuel)                                                         | P0 séparé |

---

## 3. Benchmark industrie 2026 — Réponse aux questions Romeo

### 3.1 Tier system vs Flat commission ?

**Source** : [Refgrow](https://refgrow.com/blog/affiliate-commission-structures-guide), [Matt McWilliams](https://www.mattmcwilliams.com/tiered-affiliate-commissions/), [Influence Flow](https://influenceflow.io/resources/mastering-multi-tier-affiliate-commission-structures-in-2026/)

| Modèle                                    | Quand l'utiliser                                                              | Pour Verone                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Flat rate uniforme** (1 taux pour tous) | Démarrage, < 30 affiliés actifs, simplicité prio                              | ✅ Recommandé pour le **lancement**                                             |
| **Flat avec overrides custom**            | Top performers / partenariats spéciaux à mettre en avant                      | ✅ **Modèle actuel Verone** (chaque ambassadeur a son `commission_rate` propre) |
| **Tier (3 niveaux)**                      | Programme mature avec >30 affiliés actifs, données de performance disponibles | ⏸ À introduire **plus tard**                                                   |
| **Tier multi-level (MLM)**                | Commission sur recrutement d'autres affiliés                                  | ❌ Complexe, peu pertinent B2C                                                  |

**Recommandation senior pour Verone (0 ambassadeurs aujourd'hui)** :

1. **Phase 1 (MVP, maintenant)** : Flat avec custom override
   - Taux par défaut : `commission_rate = 10%` (déjà en place)
   - Admin BO peut surcharger ce taux par ambassadeur (déjà supporté)
   - **Pas de niveaux** au lancement → trop complexe pour 0 ambassadeurs
   - Simplicité = adoption plus rapide

2. **Phase 2 (>30 ambassadeurs actifs, dans 6 mois)** : ajouter un système de tiers OPTIONNEL
   - 3 tiers (industrie standard) : ex Bronze 8% / Silver 12% / Gold 15%
   - Promotion auto basée sur `total_sales_generated` ou `current_uses`
   - Le `commission_rate` custom par ambassadeur reste prioritaire (override)

> **Verdict** : ne pas construire le système de tiers maintenant. Garder flat + custom override. Documenter cette décision en ADR.

### 3.2 Calcul commission : avant ou après remise ?

**Source** : [SHOPLINE](https://support.shoplineapp.com/hc/en-us/articles/360030399151), [BixGrow](https://docs.bixgrow.com/affiliate-program/commission-calculation), [Drupal Commerce](https://www.drupal.org/project/uc_affiliate2/issues/1789504)

**Standard 2026** : commission calculée sur le **net après remise**, avant frais de port et taxes.

```
Subtotal HT       100,00 €
- Discount (10%) -10,00 €
= Net HT          90,00 €      ← base de calcul commission
× commission_rate × 10%
= Prime            9,00 €
```

**Verone fait actuellement** (cf `create-order.ts:208-210`) :

```ts
const orderHt = finalTtc / 1.2; // finalTtc est déjà après remise
const primeAmount = orderHt * (commission_rate / 100);
```

✅ **Conforme au standard 2026.** Le `finalTtc` envoyé par le checkout = total après application du code promo, donc `orderHt = (TTC après remise) / 1.20` = HT après remise = base correcte.

**Exemple Romeo** : 100€ TTC, 10% promo → 90€ TTC. Ambassadeur 10% → 9€ ?

- En réalité Verone calculerait : `90 / 1.20 = 75 €` HT, puis `75 * 10% = 7,50 €` HT
- Si Romeo veut 9€ TTC → soit calculer sur TTC, soit ajuster la base

> **Décision à prendre** : commission sur HT (standard comptable) ou sur TTC (plus simple à comprendre pour l'ambassadeur) ? La majorité des plateformes le fait sur HT/net. Recommandation : garder HT (déjà en place) + bien documenter dans CGU.

### 3.3 Tracking par lien sans code promo ?

**Source** : [Affiliate Manager](https://affiliatemanager.us/blog/how-affiliate-tracking-works), [iRev](https://irev.com/blog/cookieless-affiliate-tracking-what-actually-works-in-2026/), [Cometly](https://www.cometly.com/post/utm-tracking-best-practices)

**Standard 2026** :

- **Last-click attribution** dominante en e-commerce (cookie 30-90 jours)
- **Cookies tiers** = peu fiables (Safari/Firefox bloquent, Chrome partial)
- **First-party cookies** + **UTM params** + **server-side postback** = combo recommandé

**Verone a déjà** :

- ✅ First-party cookie `verone_ref` (sameSite:'lax', 30j) sur paramètre `?ref=CODE`
- ✅ Middleware Next.js qui capture (`apps/site-internet/src/middleware.ts:22-30`)
- ✅ Champ DB `attribution_method = 'referral_link'` prévu

**Verone ne fait PAS encore** :

- ❌ Lecture du cookie `verone_ref` au checkout pour créer attribution sans code
- ❌ Application auto du discount client si `verone_ref` présent (Romeo : si client oublie code → pas de réduction, mais ambassadeur tracé)
- ❌ UTM params standardisés (`utm_source=ambassadeur&utm_medium=referral&utm_content=ROMEO10`) → ajout simple pour analytics

> **Verdict** : compléter l'existant, ne PAS reconstruire.

### 3.4 Refersion / Shopify Collabs / Industry standard ?

**Source** : [Refersion](https://www.refersion.com/partners/shopify/), [Shopify Collabs](https://apps.shopify.com/collabs)

- **Refersion** : supporte **3 modes simultanément** (1) flat, (2) custom per-affiliate (override), (3) tiers récents. Pricing 99-249$/mois.
- **Shopify Collabs** : portail créateur intégré, application en self-service, codes promo + liens, paiements automatiques.
- **Tendance commune** : self-onboarding du créateur (postule depuis le site marchand) > admin crée tout.

**Implications pour Verone** :

- ✅ Self-onboarding via toggle dans `/compte` = **aligné avec la tendance**
- ✅ Custom rate par ambassadeur (override) = pattern Refersion
- ❌ Tiers automatiques = à différer

---

## 4. Recommandation architecturale

### 4.1 Faut-il déconstruire ?

**NON.** Le squelette est bon et aligné avec 2026 :

- ✅ DB schema robuste (FK propres, RLS pattern Verone, triggers atomiques)
- ✅ Middleware tracking déjà en place
- ✅ Calcul commission conforme standard
- ✅ Validation 30j post-vente (protection retours)
- ✅ Champ `attribution_method` prévoit déjà les 2 modes

**Ce qui change** : la **représentation logique** de l'ambassadeur. Au lieu de table séparée `site_ambassadors`, on traite l'ambassadeur comme une **propriété d'un client** (`individual_customers.is_ambassador = true`).

### 4.2 Architecture cible

```
auth.users (Supabase)
    ↓ 1:1
individual_customers
    ├── is_ambassador BOOLEAN DEFAULT false       ← NOUVEAU
    ├── ambassador_commission_rate NUMERIC(5,2)   ← migré depuis site_ambassadors
    ├── ambassador_discount_rate NUMERIC(5,2)
    ├── ambassador_iban, bic, bank_name, account_holder_name, siret
    ├── ambassador_total_sales_generated, total_primes_earned, etc. (compteurs)
    ├── ambassador_balance, ambassador_annual_ytd
    ├── ambassador_cgu_accepted_at, cgu_version
    ├── ambassador_siret_required
    ├── ambassador_notify_on_gain BOOLEAN DEFAULT true   ← NOUVEAU R6
    └── ambassador_activated_at TIMESTAMPTZ              ← NOUVEAU
    ↓ 1:N
ambassador_codes
    ├── customer_id FK → individual_customers     ← renommé depuis ambassador_id
    ├── discount_id FK → order_discounts
    ├── code, qr_code_url, is_active, usage_count
    ↓ 1:N
ambassador_attributions
    ├── customer_id FK → individual_customers     ← renommé depuis ambassador_id
    ├── order_id FK → sales_orders UNIQUE
    ├── code_id FK → ambassador_codes (nullable si referral_link)
    ├── order_total_ht, commission_rate, prime_amount
    ├── status, validation_date, validated_at, paid_at
    ├── attribution_method ('coupon_code' | 'referral_link')
    └── created_at
```

**Changements DB** :

1. Ajouter ~10 colonnes `ambassador_*` sur `individual_customers`
2. Rename FK `ambassador_id` → `customer_id` sur `ambassador_codes` et `ambassador_attributions` (data 0 → safe)
3. **Drop** `site_ambassadors` (data 0 → safe)
4. Adapter les triggers (cibler `individual_customers` au lieu de `site_ambassadors`)
5. Adapter les RLS (mêmes patterns mais sur `individual_customers`)

**Avantages** :

- ✅ Un client unique = un compte unique (clarté CRM)
- ✅ Pas de duplication email/nom/coordonnées
- ✅ Aligné avec self-onboarding (cocher case dans `/compte`)
- ✅ Permet "client devient ambassadeur" sans recréer un compte
- ✅ BO peut créer un client+ambassadeur en 1 form (M7)

### 4.3 Plan migration en 4 PRs cohérentes

> Toutes les PRs partent de `staging` et ciblent `staging`.

#### **PR A — `[SI-AMB-REFACTO-001]` Migration DB ambassadeur → client unifié**

**Branche** : `feat/ambassador-customer-unification`

- Migration SQL : ALTER `individual_customers` (+ 12 colonnes), rename FK sur ambassador_codes + attributions, drop `site_ambassadors`, refacto triggers + RLS
- Adaptation types Supabase (régen post-merge)
- **Aucun changement UI** dans cette PR
- Tests : SQL idempotency, FK constraints, RLS policies via `mcp__supabase__get_advisors`
- **FEU ROUGE** — validation explicite Romeo avant `apply_migration`

#### **PR B — `[SI-AMB-CHECKOUT-001]` Tracking lien sans code + email gain**

**Branche** : `feat/ambassador-link-tracking-completion`

- `create-order.ts` : si pas de discountCode mais cookie `verone_ref` → fetch ambassador_codes + créer attribution `attribution_method='referral_link'`
- Si client utilise lien sans saisir code : pas de réduction client, mais ambassadeur tracé
- Email à l'ambassadeur à chaque nouvelle attribution (template Resend)
- UTM params standardisés sur les liens générés (`?ref=CODE&utm_source=ambassadeur&utm_medium=referral&utm_content=CODE`)
- Tests E2E : avec code, avec lien, avec les deux

#### **PR C — `[SI-AMB-UI-001]` UI client (toggle ambassadeur dans /compte) + UI BO refonte**

**Branche** : `feat/ambassador-ui-unification`

- Site : nouvelle section dans `/compte` "Devenir ambassadeur" + toggle + paramètres (taux, IBAN, notif email)
- Site : page `/ambassadeur` adaptée à la nouvelle FK (read from individual_customers)
- BO : `AmbassadorsSection` listant `individual_customers WHERE is_ambassador=true`
- BO : `CreateAmbassadorModal` adapté (créer client + activer ambassadeur en 1 step + envoi email accès)
- Adapter `useAmbassadors` hooks (FK customer_id)
- Tests Playwright 5 tailles
- Confirmer Bug 0 (404 BO) résolu en parallèle

#### **PR D — `[SI-AMB-PAYOUT-001]` Workflow paiement primes BO**

**Branche** : `feat/ambassador-payout-workflow`

- BO : nouvelle page `/canaux-vente/site-internet/ambassadeurs/paiements` (liste attributions validated, action "Marquer payé" avec date virement + référence)
- Route API `POST /api/ambassadors/[id]/mark-paid` (UPDATE `status='paid'`, `paid_at`, déduit du `current_balance` via trigger)
- Email à l'ambassadeur "Prime payée" + lien justificatif
- Export CSV mensuel pour comptable

### 4.4 Tests à créer AVANT toute refacto (filet de sécurité)

Création de **tests E2E Playwright** ciblant le système actuel pour valider qu'on ne casse rien :

1. Admin crée ambassadeur → créer auth → ambassadeur login → dashboard charge
2. Client utilise code promo → checkout → attribution créée
3. Cron validate primes → status pending → validated après 30j
4. RLS : ambassadeur ne voit que ses propres données

→ À faire dans une **PR 0** avant les PRs A/B/C/D.

---

## 5. Risques et points d'attention

| Risque                                   | Niveau                               | Mitigation                                                             |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Migration DB (ALTER + drop)              | **Bas** (0 records site_ambassadors) | Tester migration en local d'abord, dry-run via mcp                     |
| RLS recursion sur `individual_customers` | Moyen                                | Suivre pattern Verone : `is_backoffice_user()` + `(SELECT auth.uid())` |
| Trigger break (compteurs)                | Moyen                                | Tests E2E avant/après pour valider les flows                           |
| Bug 404 BO `/canaux-vente/site-internet` | **Élevé** (bloque admin)             | Cf audit visuel — investigation Vercel/Next à faire en parallèle       |
| Email transactionnel deliverability      | Bas                                  | Resend est déjà configuré pour les autres emails                       |
| Calcul commission HT vs TTC              | Bas                                  | Validé au §3.2 — garder HT, documenter en CGU                          |

---

## 6. Points en attente de validation Romeo

| #   | Question                                                                                     | Recommandation                                                                                   |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Q1  | Refacto `site_ambassadors` → `individual_customers` ?                                        | OUI (vision Romeo + 0 records → safe)                                                            |
| Q2  | Système de niveaux (tiers) maintenant ?                                                      | NON, attendre >30 ambassadeurs actifs                                                            |
| Q3  | Calcul commission sur HT ou TTC ?                                                            | HT (déjà en place, standard 2026)                                                                |
| Q4  | Si client utilise lien sans code : réduction appliquée auto ou pas ?                         | **Pas de réduction auto** (ta règle R4) — confirmer dans CGU                                     |
| Q5  | Cookie ref durée ?                                                                           | 30j (déjà en place, standard industrie 30-90j)                                                   |
| Q6  | Email à chaque gain ou digest hebdo ?                                                        | Email à chaque gain (vision Romeo R6) + opt-out via toggle                                       |
| Q7  | Self-onboarding client (toggle case dans `/compte`) + admin BO peut aussi activer ?          | OUI les deux (double entrée OK)                                                                  |
| Q8  | Page `/ambassadeur` actuelle : garder URL + structure ou déplacer en `/compte/ambassadeur` ? | Garder `/ambassadeur` comme dashboard public partagé + ajouter section paramètres dans `/compte` |
| Q9  | Workflow paiement : SEPA manuel par admin ou intégration Qonto ?                             | Manuel pour MVP, intégration Qonto plus tard                                                     |
| Q10 | Bug 404 BO prod : fixer en parallèle ou bloquer ce sprint dessus ?                           | **Fixer d'abord** — sinon impossible d'admin via UI normale                                      |

---

## 7. Verdict final

**Pas de déconstruction.** Le squelette est bon. Les 4 PRs proposées (A/B/C/D + tests préliminaires) refacto progressivement vers la vision Romeo sans casse.

**Effort estimé** :

- Tests préliminaires : 1 session
- PR A (migration DB) : 1 session
- PR B (checkout tracking + email) : 1 session
- PR C (UI client + BO) : 2-3 sessions
- PR D (payout workflow) : 1 session
- **Total** : 6-8 sessions de travail réparties sur 1-2 semaines

**Avant de coder** : valide les 10 questions du §6 ci-dessus. Une fois validées, je convertis chaque réponse en ADR dans `.claude/DECISIONS.md` puis je démarre la PR 0 (tests préliminaires).

---

## Sources

- [Affiliate Commission Structures: Flat vs Recurring vs Tiered (Refgrow)](https://refgrow.com/blog/affiliate-commission-structures-guide)
- [How to Use Tiered Affiliate Commissions (Matt McWilliams)](https://www.mattmcwilliams.com/tiered-affiliate-commissions/)
- [Mastering Multi-Tier Affiliate Commission Structures 2026 (Influence Flow)](https://influenceflow.io/resources/mastering-multi-tier-affiliate-commission-structures-in-2026/)
- [How Affiliate Tracking Works (Affiliate Manager)](https://affiliatemanager.us/blog/how-affiliate-tracking-works)
- [Server-Side Affiliate Tracking 2026 (iRev)](https://irev.com/blog/cookieless-affiliate-tracking-what-actually-works-in-2026/)
- [UTM Tracking Best Practices (Cometly)](https://www.cometly.com/post/utm-tracking-best-practices)
- [Affiliate Commission Calculation (BixGrow)](https://docs.bixgrow.com/affiliate-program/commission-calculation)
- [Refersion Shopify Affiliate](https://www.refersion.com/partners/shopify/)
- [Shopify Affiliate Apps Comparison (Hulkapps)](https://www.hulkapps.com/blogs/compare/shopify-affiliate-program-apps-refersion-affiliate-marketing-vs-shopify-collabs)
- [Affiliate Commission Rates by Industry 2026 (ReferralCandy)](https://www.referralcandy.com/blog/affiliate-commission-rates)
