# Audit Issues Critiques — Site Internet

_Date : 12 avril 2026 | Branche : feat/BO-SI-001-site-internet-sprint1-3_

Audit realise par 4 agents specialises (database-architect, site-internet-expert, back-office-expert, code-reviewer).

---

## CRITICAL (a corriger AVANT merge)

### C1. ClientsSection — filtre incorrect

**Fichier** : `apps/back-office/.../components/ClientsSection.tsx`
**Bug** : Filtre `auth_user_id IS NOT NULL` au lieu de `source_type = 'site-internet'`
**Impact** : Affiche 0 vrais clients site et potentiellement des clients internes/LinkMe
**Fix** : Remplacer `.not('auth_user_id', 'is', null)` par `.eq('source_type', 'site-internet')`
**Priorite** : P0

---

### C2. Checkout — discount non revalide serveur

**Fichier** : `apps/site-internet/src/app/api/checkout/route.ts`
**Bug** : Le `discount_amount` vient du frontend sans revalidation serveur. Un utilisateur peut envoyer `discount_amount: 9999`.
**Impact** : Faille de securite e-commerce — reduction arbitraire
**Fix** : Revalider le code promo cote serveur dans la route checkout (appeler la meme logique que `/api/promo/validate`)
**Priorite** : P0

---

### C3. Checkout — race condition order_number

**Fichier** : `apps/site-internet/src/app/api/checkout/route.ts`
**Bug** : Generation numero commande en 2 requetes non-atomiques (SELECT max → INSERT +1)
**Impact** : Deux checkouts simultanes = meme numero de commande
**Fix** : Utiliser une sequence PostgreSQL (`CREATE SEQUENCE site_order_number_seq`) ou `INSERT ... RETURNING`
**Priorite** : P0

---

### C4. Webhook Stripe — race condition current_uses

**Fichier** : `apps/site-internet/src/app/api/webhooks/stripe/route.ts`
**Bug** : Incrementation `current_uses` en 2 etapes (SELECT → UPDATE count+1)
**Impact** : Depassement quota promo avec webhooks simultanes
**Fix** : `UPDATE order_discounts SET current_uses = current_uses + 1 WHERE id = $1`
**Priorite** : P0

---

### C5. Webhook Stripe — casts `as unknown as`

**Fichier** : `apps/site-internet/src/app/api/webhooks/stripe/route.ts`
**Bug** : Casts `as unknown as { ... }` pour contourner typage Supabase sur `promotion_usages` et `order_discounts`
**Impact** : TypeScript unsafe, equivalent a `any` (interdit par regles projet)
**Fix** : Regenerer types Supabase (`supabase gen types typescript`) puis utiliser les types corrects
**Priorite** : P1

---

### C6. RLS promotion_usages — SELECT trop permissive

**Fichier** : `supabase/migrations/20260412100000_promotion_system_upgrade.sql`
**Bug** : `USING (true)` sur SELECT = tout authenticated lit tous les usages de promo
**Impact** : Fuite donnees (commandes des autres clients)
**Fix** : Restreindre a staff only ou `customer_id` lie a `auth.uid()`
**Priorite** : P1

---

### C7. RLS promotion_usages — INSERT sans restriction

**Fichier** : Meme migration
**Bug** : `WITH CHECK (true)` sur INSERT = tout authenticated peut inserer des usages arbitraires
**Impact** : Fraude possible (DOS sur promos)
**Fix** : Supprimer cette policy. Les inserts doivent passer par le webhook (service role).
**Priorite** : P1

---

### C8. RLS individual_customers — SELECT manquante

**Fichier** : `supabase/migrations/20260412120000_add_auth_user_id_to_individual_customers.sql`
**Bug** : Policy SELECT manquante pour les clients site-internet (`auth_user_id = auth.uid()`)
**Impact** : Page /compte cassee — le client ne peut pas lire son propre profil via RLS
**Fix** : Ajouter `CREATE POLICY "customer_read_own_profile" ON individual_customers FOR SELECT USING (auth_user_id = (SELECT auth.uid()))`
**Priorite** : P0

---

### C9. cms_pages — schema incomplet

**Fichier** : `supabase/migrations/20260412140000_create_cms_pages.sql`
**Bug** : Pas de `created_at`, pas de trigger `updated_at`, `updated_by` sans FK
**Impact** : Incoherence avec toutes les autres tables du projet
**Fix** : Migration corrective pour ajouter `created_at`, trigger `updated_at`, FK `updated_by`
**Priorite** : P2

---

### C10. document_emails — RLS non activee

**Fichier** : `supabase/migrations/20260410030617_create_document_emails.sql`
**Bug** : Table creee SANS `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
**Impact** : Donnees sensibles accessibles a tous les authenticated
**Fix** : `ALTER TABLE document_emails ENABLE ROW LEVEL SECURITY` + policy staff
**Priorite** : P1

---

### C11. Fichier parasite commite

**Fichier** : `export-claude-config-complet.md` (8605 lignes)
**Bug** : Fichier de config/export Claude commite dans le repo
**Impact** : Pollution repo
**Fix** : Supprimer du repo + ajouter au `.gitignore`
**Priorite** : P2

---

### C12. ConfigurationSection — 738 lignes

**Fichier** : `apps/back-office/.../components/ConfigurationSection.tsx`
**Bug** : 738 lignes (limite projet = 400)
**Impact** : Violation regle clean-code
**Fix** : Extraire en sous-composants (IdentiteSection, SEOSection, ContactSection, AnalyticsSection)
**Priorite** : P2

---

### C13. Prix fournisseur expose

**Fonction** : `get_site_internet_collection_detail()`
**Bug** : Utilise `p.cost_price` au lieu de `channel_pricing.custom_price_ht`
**Impact** : Prix fournisseur visible par le client sur les pages collections
**Fix** : Modifier la RPC pour utiliser le prix de vente canal
**Priorite** : P0

---

### C14. Table site_orders inexistante

**Fichiers** : `api/account/export`, `api/cron/review-request-check`, `api/cron/win-back-check`
**Bug** : 3 routes requetent `site_orders` qui a ete droppee (migree vers `sales_orders`)
**Impact** : Export RGPD vide, 2 cron jobs non fonctionnels
**Fix** : Remplacer par `sales_orders` filtre sur `channel_id`
**Priorite** : P1

---

## WARNING (a corriger avant mise en prod)

### W1. Race condition OAuth

**Fichier** : `apps/site-internet/src/app/auth/callback/route.ts`
**Bug** : Le trigger `handle_site_internet_signup` s'execute AVANT que `source: 'site-internet'` soit pose dans user_metadata par le callback
**Impact** : Le trigger peut creer le customer sans `source_type = 'site-internet'`
**Fix** : Poser `source` dans les `options.data` du `signInWithOAuth` au lieu du callback

---

### W2. Auth actions sans validation Zod

**Fichier** : `apps/site-internet/src/app/auth/actions.ts`
**Bug** : `login`, `signup`, `updateProfile` extraient FormData sans validation Zod
**Impact** : Strings arbitrairement longues ou malformees dans user_metadata

---

### W3. deleteAccount incomplet

**Fichier** : `apps/site-internet/src/app/auth/actions.ts`
**Bug** : Anonymise auth.users mais ne touche pas individual_customers (PII restent)
**Impact** : Non-conformite RGPD

---

### W4. deleteAccount sans confirmation

**Fichier** : `apps/site-internet/src/app/compte/page.tsx`
**Bug** : 1 clic = suppression immediate (pas de modal/confirm)

---

### W5. XSS potentiel CMS

**Fichier** : `apps/site-internet/src/components/cms/CmsPageContent.tsx`
**Bug** : `dangerouslySetInnerHTML` sans sanitisation DOMPurify
**Impact** : XSS si contenu CMS compromis (risque attenue car seul le staff ecrit)

---

### W6. Pages legales sans fallback

**Fichiers** : Pages CMS (cgv, mentions, etc.)
**Bug** : Si la page est depubliee dans le back-office, elle retourne 404
**Impact** : Pages legales obligatoires inaccessibles

---

### W7. getCmsPage sans cache

**Fichier** : `apps/site-internet/src/components/cms/CmsPageContent.tsx`
**Bug** : Pas de `unstable_cache` Next.js — chaque rendu = requete Supabase

---

### W8. Migrations 110000/120000 doublons

**Fichiers** : Deux migrations redefinissent `handle_site_internet_signup()`
**Bug** : La 110000 est morte a la naissance (ecrasee par 120000)
**Impact** : Confusion historique

---

### W9. wishlist_items — FK manquante

**Table** : `wishlist_items.user_id`
**Bug** : Pas de FK formelle vers `auth.users` — pas de cascade a la suppression user

---

### W10. Promo validate — customer_email contournable

**Fichier** : `apps/site-internet/src/app/api/promo/validate/route.ts`
**Bug** : `max_uses_per_customer` verifie avec `customer_email` fourni par le client

---

### W11. channel_id hardcode en 3 endroits

**Fichiers** : checkout, compte, OrdersSection
**Bug** : `0c2639e9-df80-41fa-84d0-9da96a128f7f` en dur
**Fix** : Constante partagee ou variable d'environnement

---

### W12. Commandes draft visibles

**Fichier** : `apps/site-internet/src/app/compte/page.tsx`
**Bug** : Commandes `draft` (checkout abandonne) affichees comme "En cours"

---

### W13. CmsPagesSection — updated_by jamais ecrit

**Fichier** : Back-office `CmsPagesSection.tsx`
**Bug** : Le staff ID n'est pas ecrit dans `updated_by` lors de l'edition

---

### W14. Webhook refund — mauvais statut

**Fichier** : `apps/site-internet/src/app/api/webhooks/stripe/route.ts`
**Bug** : `charge.refunded` pose `payment_status_v2: 'pending'` au lieu de `'refunded'`

---

### W15. Export RGPD sans verification auth

**Fichier** : `apps/site-internet/src/app/api/account/export/route.ts`
**Bug** : Le param `userId` n'est pas verifie — acces potentiel aux donnees d'un autre user

---

### W16. order_discounts — RLS expose codes inactifs

**Table** : `order_discounts`
**Bug** : SELECT `USING (true)` expose codes expires/inactifs a tout authenticated

---

## Plan de Correction (par priorite)

### Phase 1 — Securite (BLOQUANT)

| #     | Issue                                  | Effort | Risque |
| ----- | -------------------------------------- | ------ | ------ |
| C2    | Revalider discount serveur checkout    | 2h     | HAUT   |
| C13   | Fix RPC collection_detail (cost_price) | 30min  | HAUT   |
| C8    | Policy SELECT individual_customers     | 15min  | HAUT   |
| C6+C7 | Corriger RLS promotion_usages          | 15min  | MOYEN  |
| C10   | Activer RLS document_emails            | 10min  | MOYEN  |
| W15   | Verification auth export RGPD          | 30min  | MOYEN  |

### Phase 2 — Integrite Donnees

| #     | Issue                                            | Effort | Risque |
| ----- | ------------------------------------------------ | ------ | ------ |
| C1    | Corriger filtre ClientsSection                   | 10min  | BAS    |
| C3+C4 | Sequences atomiques (order_number, current_uses) | 1h     | MOYEN  |
| C14   | Remplacer site_orders par sales_orders           | 30min  | BAS    |
| W1    | Fix race condition OAuth                         | 1h     | MOYEN  |
| W14   | Fix statut refund                                | 10min  | BAS    |

### Phase 3 — Qualite Code

| #   | Issue                                     | Effort | Risque |
| --- | ----------------------------------------- | ------ | ------ |
| C5  | Regenerer types Supabase                  | 30min  | BAS    |
| C9  | Migration corrective cms_pages            | 20min  | BAS    |
| C11 | Supprimer export-claude-config-complet.md | 5min   | BAS    |
| C12 | Refactorer ConfigurationSection           | 2h     | BAS    |

### Phase 4 — Warnings

| #     | Issue                                | Effort |
| ----- | ------------------------------------ | ------ |
| W2    | Validation Zod auth actions          | 1h     |
| W3+W4 | deleteAccount complet + confirmation | 1h     |
| W5    | Sanitisation CMS (DOMPurify)         | 30min  |
| W6    | Fallback pages legales               | 30min  |
| W9    | FK wishlist_items                    | 10min  |
| W11   | Constante channel_id                 | 20min  |
| W12   | Filtrer commandes draft              | 10min  |
| W16   | RLS order_discounts (filtrer actifs) | 15min  |
