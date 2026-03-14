# Audit Performance LinkMe — 2026-03-11

**Scope** : App `linkme` (apps/linkme/) + tables DB `linkme_*`, `enseignes`, `organisations`, `affiliate_*`
**Mode** : AUDIT READ-ONLY — aucune modification effectuée
**Agent** : perf-optimizer

---

## Résumé Exécutif

| Catégorie                    | Findings                  | Critiques | Importants | Suggestions |
| ---------------------------- | ------------------------- | --------- | ---------- | ----------- |
| DB Performance (seq_scan)    | 4 tables problématiques   | 2         | 1          | 1           |
| FK sans index                | 5 FKs                     | 0         | 3          | 2           |
| RLS auth.uid() non wrappé    | 2 policies LinkMe         | 1         | 1          | —           |
| Multiple permissive policies | 12+ tables LinkMe         | 0         | 3          | —           |
| Index non utilisés           | 17 index LinkMe/affiliate | 0         | 2          | 3           |
| Overfetch select('\*')       | 15 occurrences            | 1         | 4          | 3           |
| select() sans colonnes       | 7 occurrences             | 0         | 3          | 2           |
| Patterns async               | 0 violation détectée      | —         | —          | —           |
| staleTime trop court         | 6 hooks < 30s             | 0         | 0          | 2           |

**Total** : 2 CRITIQUES, 17 IMPORTANTS, 11 SUGGESTIONS

---

## 1. Database Performance

### 1.1 Tables avec seq_scan élevé

Source : `pg_stat_user_tables` — données au 2026-03-11

| Table                          | seq_scan | idx_scan | seq_scan_pct | n_live_tup | Analyse                                                                |
| ------------------------------ | -------- | -------- | ------------ | ---------- | ---------------------------------------------------------------------- |
| `linkme_page_configurations`   | 33       | 3        | **91.7%**    | 2          | Petite table, impact faible                                            |
| `enseignes`                    | 109 446  | 15 192   | **87.8%**    | 2          | CRITIQUE — 109k seq_scans sur table RLS critique                       |
| `linkme_payment_requests`      | 4 771    | 952      | **83.4%**    | 0          | IMPORTANT — policy staff-only sans index couvrant                      |
| `linkme_tracking`              | 266      | 100      | **72.7%**    | 0          | SUGGESTION — table vide, impact actuellement nul                       |
| `linkme_payment_request_items` | 104      | 54       | **65.8%**    | 0          | SUGGESTION — table vide                                                |
| `linkme_selection_items`       | 195 617  | 663 499  | **22.8%**    | 45         | Acceptable — volume d'index_scan élevé confirme les index fonctionnent |

**Finding critique — `enseignes` (87.8% seq_scan) :**

La table `enseignes` subit 109 446 seq_scans malgré seulement 2 lignes vivantes. Cause : la policy RLS `enseignes_select_all` utilise `auth.uid()` non wrappé (confirmé ci-dessous), entraînant une ré-évaluation par ligne. De plus, la policy est évaluée pour chaque requête faisant une jointure implicite avec `user_app_roles`.

**Finding important — `linkme_payment_requests` (83.4% seq_scan) :**

4 771 seq_scans. La table est vide (`n_live_tup=0`) ce qui indique que les requêtes ne trouvent rien, mais PostgreSQL fait quand même un sequential scan. L'absence d'index filtrant par `affiliate_id + status` est la cause probable.

### 1.2 Foreign Keys sans index

Source : `information_schema` + `pg_indexes` — advisors Supabase

| Table                        | FK                                                      | Colonne                 | Référence       | Gravité    |
| ---------------------------- | ------------------------------------------------------- | ----------------------- | --------------- | ---------- |
| `affiliate_storage_requests` | `affiliate_storage_requests_owner_enseigne_id_fkey`     | `owner_enseigne_id`     | `enseignes`     | IMPORTANT  |
| `affiliate_storage_requests` | `affiliate_storage_requests_owner_organisation_id_fkey` | `owner_organisation_id` | `organisations` | IMPORTANT  |
| `affiliate_storage_requests` | `affiliate_storage_requests_reception_id_fkey`          | `reception_id`          | (interne)       | SUGGESTION |
| `affiliate_storage_requests` | `affiliate_storage_requests_reviewed_by_fkey`           | `reviewed_by`           | `auth.users`    | SUGGESTION |
| `linkme_info_requests`       | `linkme_info_requests_sent_by_fkey`                     | `sent_by`               | `auth.users`    | IMPORTANT  |

**Note** : La vérification directe par `information_schema` n'a retourné aucun résultat (0 lignes) pour les tables linkme\_\* — cela peut indiquer que les FKs des tables `affiliate_storage_requests` et `linkme_info_requests` utilisent un pattern différent. Les advisors Supabase les ont néanmoins détectés comme manquants.

### 1.3 RLS Policies — auth.uid() non wrappé

Source : `pg_policies` + `mcp__supabase__get_advisors(performance)`

Les policies suivantes utilisent `auth.uid()` directement (ré-évaluée pour chaque ligne) au lieu de `(SELECT auth.uid())` (évaluée une seule fois) :

#### CRITIQUE — `enseignes.enseignes_select_all`

```sql
-- ACTUEL (problématique)
WHERE uar.user_id = auth.uid()  -- Réévalué N fois par row

-- CORRIGÉ (attendu)
WHERE uar.user_id = (SELECT auth.uid())
```

**Impact** : Avec 109 446 seq_scans détectés, cette policy est appelée massivement. Chaque appel à `auth.uid()` sans wrapper entraîne une ré-initialisation du plan d'exécution.

**Preuve** :

```sql
-- Résultat de pg_policies
qual: "(is_backoffice_user() OR (EXISTS ( SELECT 1
   FROM user_app_roles uar
  WHERE ((uar.user_id = auth.uid())    -- <-- NON WRAPPÉ
    AND (uar.app = 'linkme'::app_type)
    AND (uar.is_active = true)
    AND (uar.enseigne_id = enseignes.id)))))"
```

**Confirmé par Supabase advisors** : `auth_rls_initplan` lint sur `enseignes`.

#### IMPORTANT — `linkme_commissions.affiliates_view_own_commissions`

```sql
-- ACTUEL (problématique)
WHERE uar.user_id = auth.uid()  -- Réévalué N fois

-- CORRIGÉ
WHERE uar.user_id = (SELECT auth.uid())
```

**Preuve** :

```sql
-- Résultat de pg_policies
qual: "(is_backoffice_user() OR (EXISTS ( SELECT 1
   FROM (user_app_roles uar
     JOIN linkme_affiliates la ON (...))
  WHERE ((uar.user_id = auth.uid())    -- <-- NON WRAPPÉ
    AND (uar.app = 'linkme'::app_type)
    AND (uar.is_active = true)
    AND (la.id = linkme_commissions.affiliate_id)))))"
```

**Confirmé par Supabase advisors** : `auth_rls_initplan` lint sur `linkme_commissions`.

**Note positive** : Les policies `linkme_affiliates_own`, `linkme_selection_items_*`, `linkme_selections_affiliate_own`, `linkme_onboarding_progress_*` utilisent déjà correctement `(SELECT auth.uid() AS uid)` — conforme au pattern des règles RLS.

**Autres tables non-linkme avec le même problème** (hors scope mais à corriger) :

- `notifications.users_own_notifications`
- `addresses.addresses_select_policy` et `addresses_delete_policy`
- `user_app_roles.Users can view their own roles`
- `user_profiles.users_own_user_profiles`
- `user_sessions.users_view_own_user_sessions`
- `stock_movements.users_own_stock_movements`
- `user_activity_logs.users_view_own_user_activity_logs`

### 1.4 Multiple Permissive Policies (performance secondaire)

Source : `mcp__supabase__get_advisors(performance)` — 12 tables LinkMe concernées

Quand plusieurs policies permissives couvrent le même rôle + action, PostgreSQL doit évaluer **toutes** les conditions (OR logique). Plus lent qu'une policy consolidée.

Tables LinkMe impactées (exemples) :

| Table                        | Rôle            | Action               | Policies en conflit                                                                                  |
| ---------------------------- | --------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `linkme_affiliates`          | `authenticated` | SELECT               | `linkme_affiliates_own`, `linkme_affiliates_public_read`, `linkme_affiliates_staff_all`              |
| `linkme_selections`          | `authenticated` | SELECT               | `linkme_selections_affiliate_own`, `linkme_selections_public_read`, `staff_manage_linkme_selections` |
| `linkme_selection_items`     | `authenticated` | SELECT               | 3 policies                                                                                           |
| `linkme_commissions`         | `authenticated` | SELECT               | `affiliates_view_own_commissions`, `staff_manage_linkme_commissions`                                 |
| `linkme_onboarding_progress` | `authenticated` | SELECT/INSERT/DELETE | 2 policies chacune                                                                                   |
| `contacts`                   | `authenticated` | SELECT/INSERT        | 2 policies chacune                                                                                   |
| `organisations`              | `authenticated` | SELECT               | 2 policies                                                                                           |
| `enseignes`                  | `authenticated` | SELECT               | 2 policies                                                                                           |

**Remédiation conseillée** : Consolider en une seule policy qui englobe les deux conditions (`is_backoffice_user() OR <condition affilié>`). C'est déjà le pattern utilisé dans les meilleures policies.

### 1.5 Index non utilisés sur tables LinkMe/affiliate

Source : `mcp__supabase__get_advisors(performance)` — `unused_index`

Index sur tables **LinkMe** n'ayant reçu aucune lecture depuis la dernière réinitialisation des stats :

| Index                                                   | Table                          | Impact                                       |
| ------------------------------------------------------- | ------------------------------ | -------------------------------------------- |
| `idx_linkme_affiliates_created_by`                      | `linkme_affiliates`            | SUGGESTION — supprimable                     |
| `idx_linkme_affiliates_verified_by`                     | `linkme_affiliates`            | SUGGESTION — supprimable                     |
| `idx_linkme_page_configurations_updated_by`             | `linkme_page_configurations`   | SUGGESTION — supprimable                     |
| `idx_linkme_channel_suppliers_visible`                  | `linkme_channel_suppliers`     | SUGGESTION                                   |
| `idx_payment_request_items_request`                     | `linkme_payment_request_items` | IMPORTANT — doublon probable avec clé unique |
| `idx_commissions_payment_request`                       | `linkme_commissions`           | IMPORTANT — doublon                          |
| `idx_linkme_selection_items_hidden`                     | `linkme_selection_items`       | SUGGESTION                                   |
| `idx_linkme_tracking_session`                           | `linkme_tracking`              | SUGGESTION                                   |
| `idx_linkme_tracking_created`                           | `linkme_tracking`              | SUGGESTION                                   |
| `idx_sales_order_linkme_details_token`                  | `sales_order_linkme_details`   | SUGGESTION                                   |
| `idx_linkme_details_missing_fields`                     | `sales_order_linkme_details`   | SUGGESTION                                   |
| `idx_linkme_info_requests_recipient_email`              | `linkme_info_requests`         | SUGGESTION                                   |
| `idx_financial_documents_linkme_selection_id`           | `financial_documents`          | SUGGESTION                                   |
| `idx_financial_documents_linkme_affiliate_id`           | `financial_documents`          | SUGGESTION                                   |
| `idx_financial_document_items_linkme_selection_item_id` | `financial_document_items`     | SUGGESTION                                   |

**Attention** : Les index `idx_payment_request_items_request` et `idx_commissions_payment_request` sont marqués non-utilisés alors que les tables ont des seq_scan élevés — cela peut indiquer que les requêtes n'utilisent pas les colonnes indexées en filtre, ou que les tables sont actuellement vides.

---

## 2. Code Performance (apps/linkme/)

### 2.1 select('\*') — Overfetch

**15 occurrences** de `select('*')` — ramènent TOUTES les colonnes alors qu'une sélection explicite serait suffisante.

#### Critiques (pages publiques / données volumineuses)

| Fichier                               | Ligne            | Table                                    | Commentaire                                                                               |
| ------------------------------------- | ---------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/lib/hooks/use-user-selection.ts` | 143              | `linkme_affiliates`                      | IMPORTANT — ramène toutes les colonnes dont des champs internes potentiellement sensibles |
| `src/lib/hooks/use-user-selection.ts` | 243              | `linkme_selections`                      | IMPORTANT — même table volumineuse que ci-dessus                                          |
| `src/lib/hooks/use-linkme-public.ts`  | 59, 85, 102, 154 | `linkme_affiliates`, `linkme_selections` | IMPORTANT — **pages publiques** : risque d'exposition et de bandwidth inutile             |

#### Importants

| Fichier                                 | Ligne | Table                        | Commentaire                                                                                   |
| --------------------------------------- | ----- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `src/lib/hooks/use-entity-addresses.ts` | 159   | `addresses`                  | Ramène toutes les colonnes adresse alors que 5-6 colonnes suffisent                           |
| `src/lib/hooks/use-payment-requests.ts` | 103   | `linkme_payment_requests`    | Toutes les 17 colonnes alors que la requête qui suit ne les utilise pas toutes                |
| `src/lib/hooks/use-storage-requests.ts` | 88    | `affiliate_storage_requests` | Requête suivie d'un enrich — seules les colonnes utilisées dans l'enrich seraient suffisantes |
| `src/lib/hooks/use-product-images.ts`   | 41    | `product_images`             | Ramène toutes les colonnes images                                                             |

#### Suggestions (moindre impact)

| Fichier                                             | Ligne | Table                        | Commentaire                                                               |
| --------------------------------------------------- | ----- | ---------------------------- | ------------------------------------------------------------------------- |
| `src/contexts/AuthContext.tsx`                      | 111   | `v_linkme_users` (vue)       | Vue probablement déjà limitée en colonnes, mais expliciter est préférable |
| `src/app/api/complete-info/[token]/route.ts`        | 37    | (à vérifier)                 | API route — overfetch en API = bandwidth serveur                          |
| `src/app/api/complete-info/[token]/submit/route.ts` | 71    | (à vérifier)                 | Idem                                                                      |
| `src/app/api/page-config/[pageId]/route.ts`         | 61    | `linkme_page_configurations` | Table petite, impact faible                                               |

### 2.2 select() sans arguments — Overfetch implicite

**7 occurrences** de `.select()` sans argument = équivalent de `select('*')` mais moins visible.

| Fichier                                   | Ligne    | Contexte                  |
| ----------------------------------------- | -------- | ------------------------- |
| `src/lib/hooks/use-affiliate-products.ts` | 293, 347 | Insert + select de retour |
| `src/lib/hooks/use-user-selection.ts`     | 472      | Après mutation            |
| `src/lib/hooks/use-payment-requests.ts`   | 254      | Après mutation            |
| `src/lib/hooks/use-product-images.ts`     | 156      | Après update              |
| `src/lib/hooks/use-storage-requests.ts`   | 207      | Après mutation            |
| `src/app/api/webhook/revolut/route.ts`    | 126      | Webhook API               |

**Note** : Pour les mutations (insert/update), `.select('id')` suffit généralement à obtenir l'identifiant du record créé/modifié sans ramener toutes les colonnes.

### 2.3 Patterns async — État des lieux

**Bonne nouvelle** : Aucune promesse flottante (`onClick` async non wrappée) détectée dans les composants TSX.

Les `invalidateQueries` dans les hooks sont correctement awaités :

```typescript
// use-affiliate-orders.ts L124-130 — CONFORME
onSuccess: async (orderId, variables) => {
  await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
  await queryClient.invalidateQueries({
    queryKey: ['linkme-orders', variables.affiliateId],
  });
  await queryClient.invalidateQueries({
    queryKey: ['affiliate-orders', variables.affiliateId],
  });
};
```

Les `useEffect` détectés sont légitimes (debounce, cleanup, sync onboarding, auth listener) — pas de pattern `useEffect + fetch` legacy.

### 2.4 staleTime — Analyse

Les `staleTime` sont globalement bien configurés. Quelques cas notables :

| Fichier                                   | staleTime | Données            | Évaluation                                                       |
| ----------------------------------------- | --------- | ------------------ | ---------------------------------------------------------------- |
| `use-affiliate-commission-stats.ts` L105  | 30s       | Stats agrégées     | SUGGESTION : pourrait être 5min, recalcul coûteux                |
| `use-affiliate-commissions.ts` L175, L212 | 30s       | Commissions        | SUGGESTION : 1-2min serait approprié, données rarement modifiées |
| `use-linkme-public.ts` L121               | 30s       | Sélection publique | OK — page publique, fraîcheur importante                         |
| `use-storage-requests.ts` L134            | 30s       | Demandes stockage  | OK                                                               |

**Positif** : `use-public-stats.ts` utilise `staleTime: 60 * 60 * 1000` (1h) pour les stats marketing — correct pour des données stables.

### 2.5 Patterns de requêtes séquentielles potentiellement N+1

Dans `use-affiliate-analytics.ts`, deux patterns séquentiels existent mais **ne sont pas des N+1** vrais :

1. **Pattern correct (L106)** : `Promise.all([commissionsQuery, selectionsQuery])` — requêtes parallèles.
2. **Pattern sous-optimal (L380-444)** : Récupération des orders → puis produits → puis images en séquentiel. Mais les deux dernières requêtes utilisent `.in()` donc c'est 1 requête par type, pas N. Le pattern est acceptable.

Dans `use-storage-requests.ts` (L86-112) : Récupération des storage_requests → puis products → puis images. Même pattern — 3 requêtes totales avec `.in()`, pas N+1.

**Recommandation** : Ces patterns pourraient être optimisés en une seule requête avec jointure Supabase (`select('*, products(*), product_images(*)') `), mais ce n'est pas une priorité urgente.

---

## 3. Bundle & Structure

### 3.1 Import lodash/moment

Aucune occurrence de `import from 'lodash'` ou `import from 'moment'` dans l'app linkme. Positif.

### 3.2 Barrel exports

Aucun `export * from` problématique détecté dans le scope linkme.

### 3.3 Composants "use client" sans nécessité

Non audité dans ce rapport (hors scope demandé). À inclure dans un audit bundle dédié si nécessaire.

---

## Recommandations Prioritaires

### CRITIQUES (à traiter en premier)

**1. [CRITIQUE] RLS `enseignes.enseignes_select_all` — auth.uid() non wrappé**

- **Où** : Migration SQL à créer, policy à modifier
- **Impact** : 109 446 seq_scans sur `enseignes`, réévaluation `auth.uid()` à chaque row
- **Fix** : Remplacer `auth.uid()` par `(SELECT auth.uid())` dans la policy
- **Déléguer à** : `database-architect` pour créer la migration

```sql
-- Fix à appliquer
DROP POLICY "enseignes_select_all" ON public.enseignes;
CREATE POLICY "enseignes_select_all" ON public.enseignes
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR (EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())  -- WRAPPÉ
        AND uar.app = 'linkme'::app_type
        AND uar.is_active = true
        AND uar.enseigne_id = enseignes.id
    ))
  );
```

### IMPORTANTS (à traiter cette semaine)

**2. [IMPORTANT] RLS `linkme_commissions.affiliates_view_own_commissions` — auth.uid() non wrappé**

- **Où** : Policy DB
- **Fix** : Même pattern que ci-dessus — remplacer `auth.uid()` par `(SELECT auth.uid())`
- **Déléguer à** : `database-architect`

**3. [IMPORTANT] select('\*') sur pages publiques — `use-linkme-public.ts`**

- **Où** : `/apps/linkme/src/lib/hooks/use-linkme-public.ts` lignes 59, 85, 102, 154
- **Tables** : `linkme_affiliates`, `linkme_selections`
- **Fix** : Lister explicitement les colonnes nécessaires (ex: `id, display_name, slug, logo_url, status, bio, created_at`)
- **Impact** : Réduit la taille des payloads sur les pages publiques consultées par les visiteurs

**4. [IMPORTANT] select('\*') sur `linkme_affiliates` — `use-user-selection.ts` L143**

- **Où** : `/apps/linkme/src/lib/hooks/use-user-selection.ts:143`
- **Fix** : Identifier les colonnes réellement utilisées après le mapping et les lister explicitement

**5. [IMPORTANT] FK sans index — `affiliate_storage_requests`**

- **Colonnes** : `owner_enseigne_id`, `owner_organisation_id`
- **Fix** : Créer deux index partiels (WHERE IS NOT NULL)
- **Déléguer à** : `database-architect`

```sql
CREATE INDEX idx_affiliate_storage_requests_owner_enseigne_id
  ON public.affiliate_storage_requests (owner_enseigne_id)
  WHERE owner_enseigne_id IS NOT NULL;

CREATE INDEX idx_affiliate_storage_requests_owner_organisation_id
  ON public.affiliate_storage_requests (owner_organisation_id)
  WHERE owner_organisation_id IS NOT NULL;
```

**6. [IMPORTANT] FK sans index — `linkme_info_requests.sent_by`**

- **Fix** : Créer un index sur `sent_by`
- **Déléguer à** : `database-architect`

**7. [IMPORTANT] `linkme_payment_requests` — 83.4% seq_scan**

- **Cause** : Les 4 policies staff-only (`staff_view_all_payment_requests`, etc.) ne bénéficient pas d'un index composite qui permettrait au planner d'utiliser un index scan
- **Analyse complémentaire nécessaire** : Vérifier quelles colonnes sont utilisées dans les WHERE des requêtes applicatives (probablement `affiliate_id + status`)
- **Fix potentiel** : Index composite `(affiliate_id, status, created_at DESC)` — déjà partiellement existant avec `idx_payment_requests_affiliate` et `idx_payment_requests_status` séparés. Un index composite pourrait être plus efficace.

### SUGGESTIONS (à planifier)

**8. [SUGGESTION] Consolider les multiple permissive policies**

Les 12 tables LinkMe avec plusieurs policies permissives pour le même rôle/action devraient être consolidées. Pattern recommandé déjà présent dans les meilleures policies du projet (`is_backoffice_user() OR <condition affilié>`).

**9. [SUGGESTION] Supprimer les index non utilisés**

Les index suivants n'ont jamais été utilisés et coûtent en espace + temps d'écriture :

- `idx_linkme_affiliates_created_by`
- `idx_linkme_affiliates_verified_by`
- `idx_linkme_page_configurations_updated_by`
- `idx_linkme_tracking_session`
- `idx_linkme_tracking_created`

**Prudence** : Vérifier que les stats pg_stat ne ont pas été réinitialisées récemment avant suppression.

**10. [SUGGESTION] Augmenter staleTime sur les stats agrégées**

- `use-affiliate-commission-stats.ts` : passer de 30s à 5min (données calculées, coûteuses)
- `use-affiliate-commissions.ts` : passer de 30s à 2min

**11. [SUGGESTION] Remplacer `.select()` sans argument par `.select('id')` dans les mutations**

Pour les 7 occurrences listées en 2.2, remplacer `.select()` par `.select('id')` ou la liste minimale des colonnes nécessaires post-mutation.

---

## Annexe — Commandes d'audit exécutées

```sql
-- Stat seq_scan tables linkme_*
SELECT schemaname, relname, seq_scan, idx_scan, seq_scan_pct FROM pg_stat_user_tables WHERE relname LIKE 'linkme%';

-- FK sans index tables linkme_*
SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints ... WHERE tc.table_name LIKE 'linkme%';

-- Index existants
SELECT indexname, tablename, indexdef FROM pg_indexes WHERE tablename LIKE 'linkme%';

-- RLS policies
SELECT schemaname, tablename, policyname, qual FROM pg_policies WHERE tablename IN ('linkme_%', 'enseignes', 'organisations');

-- Advisors Supabase
mcp__supabase__get_advisors(performance) → 488 lints, dont 104 sur tables linkme/affiliate/org
```

```bash
# Patterns code détectés
Grep: select('*') → 15 occurrences
Grep: select() sans args → 7 occurrences
Grep: invalidateQueries → tous awaités (conforme)
Grep: onClick async → 0 violation
Grep: staleTime → 44 occurrences, globalement appropriés
```

---

_Rapport généré le 2026-03-11 — Mode AUDIT READ-ONLY — Aucune modification effectuée_
_Pour activer le MODE FIX : demander explicitement à Romeo après validation de ce rapport_
