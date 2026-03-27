# Audit Performance Back-Office — 2026-03-24

**App cible** : `apps/back-office` + `packages/@verone/*` utilisés
**Mode** : AUDIT read-only
**Domaines** : dead-code | db-perf | code-perf | bundle | legacy-hooks
**Agent** : perf-optimizer
**Branche** : staging
**Précédent audit** : `audit-back-office-2026-03-11.md`

---

## Résumé Exécutif

Le codebase a subi des refactorings majeurs depuis mars 2026 (split pages, suppression 1432 lignes). Certains problèmes du précédent audit ont été corrigés (invalidateQueries dans InvoicesSection). D'autres persistent ou sont nouveaux.

| Domaine                | Findings                                                                                          | Criticité max |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| Dead Code              | 4 hooks jamais importés, 1 barrel export inutilisé, 1 hook mock actif                             | IMPORTANT     |
| DB Performance         | 3 politiques auth.uid() non wrappées encore actives, fetch all sans filtre DB                     | CRITIQUE      |
| Code Performance       | 10 fichiers avec pattern useEffect+supabase, 13 select('\*'), 1 fetch all orders sans filtre date | HIGH          |
| Bundle                 | maplibre-gl + react-map-gl inutilisés (~1MB), date-fns absent du package.json local               | IMPORTANT     |
| Fichiers monolithiques | 8 fichiers > 1000 lignes (limite ESLint probablement dépassée)                                    | MEDIUM        |

**Total problèmes identifiés** : 40+ issues

---

## 1. Dead Code & Hooks Orphelins

### 1.1 Hooks jamais importés (dead code confirmé)

Vérification Grep : aucun import externe trouvé pour ces fichiers.

| Fichier                                                    | Exports                                                   | Verdict                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| `apps/back-office/src/hooks/use-archive-notifications.ts`  | `useArchiveNotifications`, `useArchiveNotificationsCount` | DEAD — 0 import                                       |
| `apps/back-office/src/hooks/base/use-supabase-query.ts`    | `useSupabaseQuery`, `QueryOptions`                        | DEAD — importé uniquement par `use-supabase-crud.ts`  |
| `apps/back-office/src/hooks/base/use-supabase-mutation.ts` | `useSupabaseMutation`                                     | DEAD — 0 import externe                               |
| `apps/back-office/src/hooks/base/use-supabase-crud.ts`     | `useSupabaseCrud`                                         | DEAD — importe use-supabase-query mais 0 consommateur |
| `apps/back-office/src/hooks/core/use-stock-core.ts`        | `useStockCore`                                            | DEAD — 0 import externe confirmé                      |

**Impact** : MEDIUM. Ces hooks génériques (~500 lignes au total) ont probablement été remplacés par React Query + hooks spécialisés lors des refactorings. Ils occupent inutilement le code et peuvent induire en erreur les nouveaux développeurs.

**Fix suggéré** : Supprimer après confirmation manuelle avec Grep (`grep -r "useSupabaseCrud\|useStockCore" apps/back-office/src`).

### 1.2 Barrel Export inutilisé

| Fichier                                                                        | Exporte     | Réalité                                                                             |
| ------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/index.ts` | 15+ exports | 0 import depuis cet index — tous les consommateurs importent directement par chemin |

**Impact** : LOW. Ce barrel export ne cause pas de problème de perf actuel mais peut nuire au tree-shaking si des bundlers l'incluent globalement.

**Fix suggéré** : Supprimer `index.ts` ou documenter qu'il est intentionnel.

### 1.3 Re-exports barrel causant tree-shaking fragile

| Fichier                                                                  | Pattern                                     |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| `apps/back-office/src/components/business/supplier-segment-select.tsx`   | `export * from '@verone/organisations/...'` |
| `apps/back-office/src/components/business/unified-organisation-form.tsx` | `export * from '@verone/organisations/...'` |

Ces fichiers sont des pass-through purs. Aucun import depuis ces wrappers n'a été trouvé (les consommateurs importent probablement directement depuis `@verone/organisations`). À vérifier avant suppression.

---

## 2. Code Performance

### 2.1 select('\*') — Overfetch confirmés (13 occurrences)

Les `select('*', { count: 'exact', head: true })` ont été exclus (COUNT seul, pas d'overfetch). Les occurrences réelles de données overfetchées :

| Fichier                                                             | Ligne | Table                     | Impact                                               |
| ------------------------------------------------------------------- | ----- | ------------------------- | ---------------------------------------------------- |
| `app/(protected)/messages/components/payment-notifications-tab.tsx` | 138   | `v_transactions_unified`  | HIGH — vue complexe multi-tables                     |
| `app/(protected)/contacts-organisations/customers/page.tsx`         | 254   | `organisations`           | MEDIUM — table large                                 |
| `app/(protected)/contacts-organisations/suppliers/page.tsx`         | 128   | `organisations`           | MEDIUM                                               |
| `app/(protected)/contacts-organisations/partners/page.tsx`          | 173   | `organisations`           | MEDIUM                                               |
| `app/(protected)/organisation/components/partners-tab.tsx`          | 53    | `organisations`           | MEDIUM                                               |
| `app/(protected)/organisation/components/suppliers-tab.tsx`         | 52    | `organisations`           | MEDIUM                                               |
| `app/(protected)/organisation/components/customers-tab.tsx`         | 78    | `organisations`           | MEDIUM                                               |
| `app/(protected)/parametres/emails/page.tsx`                        | 47    | `email_templates`         | LOW                                                  |
| `app/(protected)/parametres/emails/[slug]/edit/page.tsx`            | 62    | `email_templates`         | LOW                                                  |
| `app/(protected)/parametres/webhooks/[id]/edit/page.tsx`            | 68    | `webhooks`                | LOW                                                  |
| `app/(protected)/parametres/webhooks/page.tsx`                      | 76    | `webhooks`                | LOW                                                  |
| `hooks/base/use-supabase-query.ts`                                  | 106   | Générique (default `'*'`) | MEDIUM — hook non utilisé mais dangereux si réactivé |

**Cas particulier** : `payment-notifications-tab.tsx:138` — La vue `v_transactions_unified` est elle-même signalée comme SECURITY DEFINER problématique (audit 2026-03-11). Double problème.

**Fix suggéré** : Remplacer chaque `select('*')` par les colonnes réellement consommées dans le composant. Pour `organisations`, le composant affiche `trade_name, legal_name, type, email, logo_url, archived_at` typiquement.

### 2.2 Pattern useEffect + supabase (fetch legacy sans React Query)

Ces fichiers utilisent `useState([]) + useEffect(() => { fetchData() })` au lieu de `useQuery`. Pas de cache, pas de deduplication, pas de staleTime.

| Fichier                                                                                  | Lignes | Problème                                                                                          |
| ---------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `app/(protected)/canaux-vente/linkme/commissions/page.tsx`                               | 1151   | `useState + useEffect + fetchData` — 2 fetches (commissions + affiliates), pas de cache           |
| `app/(protected)/canaux-vente/linkme/commissions/components/CommissionDetailContent.tsx` | ~130   | `useState + useEffect + supabase.from('sales_order_items')` — chaque ouverture de modal re-fetche |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx`                            | 1063   | `useEffect + fetchOrder`                                                                          |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`                    | 856    | `useEffect + fetchOrder`                                                                          |
| `app/(protected)/canaux-vente/linkme/components/EnseignesSection.tsx`                    | 1164   | `useEffect + fetchOrganisationsIndependantes`                                                     |
| `app/(protected)/canaux-vente/linkme/components/AffiliatesSection.tsx`                   | 1215   | `useEffect + fetchAffiliates + fetchOrganisations` (2 fetches séparés)                            |
| `app/(protected)/canaux-vente/linkme/components/CommissionsSection.tsx`                  | 667    | `useEffect + fetchData`                                                                           |
| `app/(protected)/canaux-vente/linkme/components/SelectionsSection.tsx`                   | 987    | `useEffect + fetch`                                                                               |
| `app/(protected)/canaux-vente/linkme/utilisateurs/[id]/page.tsx`                         | 608    | `useEffect + supabase`                                                                            |
| `app/(protected)/devis/[id]/page.tsx`                                                    | 838    | `useEffect + fetch('/api/qonto/quotes/')`                                                         |

**Impact** : HIGH. Sans React Query :

- Pas de déduplication (si 2 composants montent = 2 requêtes)
- Pas de cache (chaque navigation = nouveau fetch)
- `loading` state dupliqué dans chaque composant
- Pas de `staleTime` = re-fetch à chaque re-render parent

**Fix suggéré** : Migrer vers `useQuery` de `@tanstack/react-query`. Pattern existant dans `use-linkme-orders.ts` à réutiliser.

### 2.3 useLinkMeDashboard — Fetch ALL orders sans filtre (CRITIQUE)

**Fichier** : `app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts` L173

```typescript
// LE PROBLEME : charge TOUTES les commandes historiques
const { data: allOrders } = await supabase
  .from('linkme_orders_with_margins') // vue avec 8 LEFT JOIN
  .select('id, total_ht, total_affiliate_margin, created_at')
  .order('created_at', { ascending: true });
// Pas de .limit() ni de filtre date
```

La vue `linkme_orders_with_margins` est elle-même lourde (8 LEFT JOIN). Le calcul de moyenne mensuelle se fait ensuite en JavaScript. En production avec 1000+ commandes, ce sera O(N) en mémoire côté client.

**Impact** : HIGH — Dashboard principal de LinkMe, affiché à chaque connexion.

**Fix suggéré** : Créer une RPC `get_linkme_dashboard_kpis()` qui effectue le calcul SQL côté serveur et retourne uniquement les KPIs agrégés (4 valeurs).

### 2.4 useLinkMeAnalytics — useState+useEffect (pattern legacy)

**Fichier** : `app/(protected)/canaux-vente/linkme/hooks/use-linkme-analytics.ts` L137-L200

Utilise `useState + useEffect + useCallback + createClient()` au lieu de `useQuery`. Ce hook est actif et consommé par `CommissionsStatusCard`, `SelectionsPerformanceTable`, `LinkMeRevenueChart`, `TopAffiliatesChart`.

**Impact** : MEDIUM — 4 composants recalculent leurs données indépendamment sans partager de cache.

### 2.5 useVercelAnalytics — Hook mock actif en production

**Fichier** : `app/(protected)/canaux-vente/site-internet/hooks/use-vercel-analytics.ts`

```typescript
// TODO: Remplacer par appel API réel
// Toute la fonction retourne des données hardcodées mock
return {
  pageviews: 12453, // FAUX
  uniqueVisitors: 8934, // FAUX
  // ...
};
```

Ce hook est utilisé dans `VercelAnalyticsDashboard.tsx` qui affiche ces données à des utilisateurs réels. Le dashboard site-internet affiche des métriques inventées.

**Impact** : HIGH (fonctionnel) — Données incorrectes affichées. Non un problème de perf mais un bug critique de feature.

### 2.6 prises-contact/[id]/actions.ts — Placeholder IDs en production

**Fichier** : `app/(protected)/prises-contact/[id]/actions.ts` L150-L223

```typescript
// TODO: Create actual sales_order
const placeholderOrderId = `ORDER-PLACEHOLDER-${Date.now()}`;
// ...
const placeholderConsultationId = `CONSULT-PLACEHOLDER-${Date.now()}`;
```

Ces actions server sont appelées via des boutons UI réels. Elles insèrent de faux IDs en base.

**Impact** : HIGH (fonctionnel) — Boutons "Convertir en commande" et "Créer consultation" créent des données corrompues.

---

## 3. DB Performance (nouveaux findings)

### 3.1 Rappel — Findings critiques non corrigés (audit 2026-03-11)

Ces problèmes identifiés en mars 2026 n'ont toujours pas de migration appliquée :

| Problème                             | Tables concernées                                                                                               | Impact                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------- |
| auth.uid() non wrappé dans RLS       | `notifications`, `user_profiles`, `stock_movements`, `user_sessions`, `user_activity_logs`, `product_drafts`    | CRITIQUE — seq_scan massifs |
| FK sans index                        | `affiliate_storage_requests` (3), `audit_opjet_invoices`, `financial_document_items`, `financial_documents` (2) | IMPORTANT                   |
| Vues SECURITY DEFINER problématiques | `v_linkme_users`, `v_transactions_unified`, etc.                                                                | CRITIQUE sécurité           |

Migrations créées mais non appliquées :

- `20260311030000_fix_rls_auth_uid_wrapper.sql`
- `20260311040000_optimize_get_linkme_orders.sql`
- `20260311060000_cleanup_duplicate_indexes.sql`

### 3.2 useLinkMeDashboard — Vue 8 LEFT JOIN sans filtre

La vue `linkme_orders_with_margins` est probablement une vue SECURITY DEFINER (détectée dans l'audit précédent). Son usage sans filtre date aggrave les seq_scan déjà élevés sur les tables sous-jacentes.

---

## 4. Bundle

### 4.1 maplibre-gl + react-map-gl — Dépendances inutilisées (~1MB)

**Fichier** : `apps/back-office/package.json`

```json
"maplibre-gl": "^4.7.1",   // ~900KB
"react-map-gl": "^7.1.9",  // ~150KB
"supercluster": "^8.0.1"   // ~50KB
```

Grep de tous les fichiers `.ts` / `.tsx` dans `src/` : **0 import trouvé** pour ces trois packages.

**Impact** : IMPORTANT — ~1.1MB ajoutés au bundle de production si ces packages ne sont pas tree-shakable. Vérification via `pnpm --filter @verone/back-office build` + `next-bundle-analyzer` recommandée avant suppression.

**Fix suggéré** : Supprimer ces 3 dépendances du `package.json` après confirmation qu'elles ne sont pas utilisées via des require() dynamiques non détectés.

### 4.2 date-fns — Absent du package.json back-office

**Fichier** : `apps/back-office/package.json`

`date-fns` est utilisé dans au moins 9 fichiers du back-office (format, formatDistanceToNow, etc.) mais n'est pas déclaré dans les dépendances directes — il est hérité depuis `package.json` racine (`"date-fns": "^4.1.0"`).

**Impact** : LOW — Fonctionne en monorepo mais rend le package non portable. Si la dépendance racine est retirée ou mise à jour en breaking change, le back-office cassera silencieusement.

**Fix suggéré** : Ajouter `"date-fns": "^4.1.0"` dans `apps/back-office/package.json`.

### 4.3 jspdf + html2canvas — Dynamic imports corrects

Ces packages sont correctement lazy-importés dans `SelectionProductDetailModal.tsx` L222-223 :

```typescript
const html2canvas = (await import('html2canvas')).default;
const jsPDF = (await import('jspdf')).default;
```

Pas de problème. Ils n'entrent dans le bundle que lors du clic sur "Télécharger PDF".

---

## 5. Fichiers Monolithiques

Ces fichiers dépassent la limite de 400 lignes recommandée (règle ESLint `max-lines` configurée récemment). Candidats prioritaires pour le prochain split.

| Fichier                                                                     | Lignes | Contenu                                    |
| --------------------------------------------------------------------------- | ------ | ------------------------------------------ |
| `hooks/use-linkme-catalog.ts`                                               | 1899   | 15+ hooks dans un seul fichier             |
| `app/(protected)/canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx` | 2130   | Modal + formulaire + validation tout-en-un |
| `app/(protected)/produits/catalogue/page.tsx`                               | 1756   | Page + 5 useEffect + filtres               |
| `app/(protected)/commandes/fournisseurs/page.tsx`                           | 1754   | Page + fetch inline + state management     |
| `app/(protected)/finance/transactions/page.tsx`                             | 1718   | Page + 3 fetch supabase inline             |
| `app/(protected)/canaux-vente/linkme/catalogue/page.tsx`                    | 1646   | Catalogue avec filtres complexes           |
| `app/(protected)/stocks/receptions/page.tsx`                                | 1563   | Page réceptions complète                   |
| `app/(protected)/factures/[id]/page.tsx`                                    | 1547   | Page facture détail                        |

**Impact** : MEDIUM — Mauvaise maintenabilité, re-renders difficiles à isoler, tests impossibles.

---

## Recommandations Prioritaires

### 1. CRITIQUE — Appliquer les migrations RLS en attente

Les migrations créées en mars 2026 ne sont pas appliquées. Le seq_scan sur `user_profiles` et `user_app_roles` continue à 99%+.

```bash
# Appliquer via MCP Supabase (database-architect)
# Fichiers : supabase/migrations/20260311030000_fix_rls_auth_uid_wrapper.sql
```

### 2. CRITIQUE — Corriger le hook useVercelAnalytics (données mock en prod)

Le dashboard site-internet affiche des données inventées. C'est un bug utilisateur, pas uniquement une dette technique.

**Action** : Soit implémenter l'API Vercel réelle, soit masquer le dashboard avec une feature flag.

### 3. CRITIQUE — Corriger les actions placeholder dans prises-contact

Les boutons "Convertir en commande" et "Créer consultation" créent des IDs `ORDER-PLACEHOLDER-xxx` en base. Ces données sont corrompues.

**Action** : Bloquer les boutons (disabled + tooltip "Fonctionnalité à venir") ou implémenter la vraie logique.

### 4. HIGH — useLinkMeDashboard sans filtre date

Migrer le calcul de moyenne mensuelle vers une RPC SQL côté serveur.

```sql
-- RPC suggérée
CREATE FUNCTION get_linkme_dashboard_kpis()
RETURNS JSON LANGUAGE plpgsql AS $$
BEGIN
  -- Retourne KPIs agrégés sans charger toutes les lignes
END;
$$;
```

### 5. HIGH — Migrer les 10 useEffect+supabase vers useQuery

Priorité sur les pages les plus visitées :

1. `commissions/page.tsx` (page principale linkme)
2. `commandes/[id]/page.tsx` (détail commande)
3. `EnseignesSection.tsx` + `AffiliatesSection.tsx` (sections dashboard)

### 6. IMPORTANT — Supprimer les 5 hooks dead code

`use-archive-notifications.ts`, `use-supabase-query.ts`, `use-supabase-mutation.ts`, `use-supabase-crud.ts`, `use-stock-core.ts`.

**Précaution** : Vérifier d'abord avec Grep étendu (pas d'import dynamique possible).

### 7. IMPORTANT — Retirer maplibre-gl, react-map-gl, supercluster

Confirmation requise via build analyzer. Si 0 usage confirmé = ~1.1MB économisés.

### 8. MEDIUM — Remplacer les 13 select('\*') restants

Focus sur `payment-notifications-tab.tsx` (vue complexe) et les 3 pages contacts-organisations (table organisations large).

### 9. LOW — Ajouter date-fns dans package.json back-office

Simple ajout pour éviter une régression silencieuse future.

---

## Points Positifs (par rapport à l'audit 2026-03-11)

- Les `invalidateQueries` dans `InvoicesSection.tsx` sont maintenant correctement awaités (fix appliqué).
- Les hooks `use-linkme-orders.ts`, `use-linkme-users.ts`, `use-linkme-catalog.ts`, `use-linkme-selections.ts` utilisent tous `await Promise.all([...])` correctement.
- `jspdf` et `html2canvas` sont lazy-importés correctement.
- La règle `max-lines` ESLint a été ajoutée — les nouveaux fichiers respecteront la limite.
- `@verone/customers`, `@verone/utils`, `@verone/finance` ont des `invalidateQueries` corrects dans leurs helpers.
- `use-linkme-dashboard.ts` utilise `useQuery` (React Query) — problème de perf data, pas de pattern.

---

## Annexe — Commandes de vérification

```bash
# Vérifier dead code hooks (confirmation)
grep -r "useSupabaseCrud\|useSupabaseQuery\|useSupabaseMutation\|useStockCore\|useArchiveNotifications" \
  apps/back-office/src --include="*.ts" --include="*.tsx"

# Vérifier maplibre/react-map-gl
grep -r "maplibre\|react-map-gl\|supercluster" apps/back-office/src --include="*.ts" --include="*.tsx"

# Type-check back-office
pnpm --filter @verone/back-office type-check

# Build bundle analysis (pour confirmer taille maplibre)
ANALYZE=true pnpm --filter @verone/back-office build
```
