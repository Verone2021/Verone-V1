# Dev Report — BO-RBAC-CATALOG-MGR-001

**Date** : 2026-04-28
**Branche** : `feat/BO-RBAC-CATALOG-MGR-001`
**Statut** : PR DRAFT — en attente ordre merge Romeo
**Commits** : 6 (depuis `bf8b9f5ad` post-PR #827)

---

## Ce qui a été livré

### Sprint 1 — Migration RLS helpers

`supabase/migrations/20260510_add_catalog_manager_role_helpers.sql` — 3 fonctions SECURITY DEFINER STABLE :

- `is_catalog_manager()` — true si role='catalog_manager' actif
- `is_back_office_owner()` — true si role='owner' actif (helper qui manquait)
- `is_back_office_admin_or_owner()` — true si role IN ('owner', 'admin')

**Migration appliquée en prod via MCP execute_sql.** Vérifié avec `pg_proc` : 3 fonctions présentes, SECURITY DEFINER, STABLE.

Régen types Supabase incluse (`packages/@verone/types/src/supabase.ts`, +6 / -27 lignes après prettier — diff réel petit malgré ce que MCP a remonté initialement).

**Décision** : aucune RLS policy existante n'a été modifiée. Le verrouillage des tables sensibles via RLS est reporté à `BO-RBAC-CATALOG-MGR-002` (défense en profondeur).

### Sprint 2 — Hook + helper serveur

- `packages/@verone/utils/src/hooks/use-current-bo-role.ts` — hook React Query (Infinity staleTime, dépend de useCurrentUserId), retourne `{ role, isLoading, isOwner, isAdmin, isCatalogManager, isAdminOrOwner, canEditSellingPrice, canPublishToChannel, canManageUsers }`
- `apps/back-office/src/lib/auth/get-current-bo-role.ts` — helper serveur + 3 fonctions de check + `gateAdminOrOwner()` (redirect vers /produits si pas owner/admin)

Type alignment avec `Database.public.Enums.user_role_type`.

### Sprint 3 — UI sélecteur rôle dans /admin/users

- `apps/back-office/src/components/admin/create-user-dialog.tsx` : ajouté `<SelectItem value="catalog_manager">` (manquait — seul edit-user-dialog l'avait). Aussi : `RoleBadge` passé en `showDetails={false}` pour éviter nested buttons dans le SelectItem.
- `packages/@verone/ui/src/components/ui/role-badge.tsx` : description `catalog_manager` corrigée pour matcher la matrice Romeo (retiré "Tarification produits", "Gestion catégories", "Gestion stocks" qui contredisaient les décisions).

La page `/admin/users` reste owner-only (gate inchangé) — cohérent avec la matrice (catalog_manager NE peut PAS gérer les users).

### Sprint 4 — Layout gating finance/factures/devis/ventes/linkme

5 layouts qui appellent `gateAdminOrOwner()` au début du Server Component :

- `app/(protected)/finance/layout.tsx` (nouveau)
- `app/(protected)/factures/layout.tsx` (nouveau)
- `app/(protected)/devis/layout.tsx` (nouveau)
- `app/(protected)/ventes/layout.tsx` (nouveau)
- `app/(protected)/canaux-vente/linkme/layout.tsx` (modifié — était passthrough)

Catalog managers atterrissent sur `/produits` en cas d'accès direct.

**Limite explicite** : verrous granulaires de champs (selling_price_ht en readonly, boutons "Publier sur LinkMe" cachés dans la page produit) reportés à `BO-RBAC-CATALOG-MGR-002`. Le layout-level gate est la première défense ; les UI granulaires sont la seconde et nécessitent ~10-15 fichiers à modifier dans `packages/@verone/products/`, `linkme/`, etc.

### Sprint 5 — Page Outils + endpoint download plugin Chrome

- `app/(protected)/parametres/outils/page.tsx` — page UI avec notice install 4 étapes + matrice des sites supportés et champs scrapés
- `app/api/extensions/sourcing-chrome/download/route.ts` — endpoint Node runtime, zip à la volée du dossier `chrome-extension/` via `archiver`, version lue depuis manifest.json (filename : `verone-sourcing-vX.Y.Z.zip`)
- `app/(protected)/parametres/page.tsx` — section "Outils" ajoutée pointant vers `/parametres/outils`
- Dépendance `archiver` + `@types/archiver` ajoutées à `apps/back-office/package.json`

**Auth endpoint** : tout staff BO actif (incl. catalog_manager). 401/403 sinon.

### Sprint 6 — User test + login Playwright

User créé via SQL idempotent :

- Email : `catalog-manager-test@verone.test`
- Password : `Abc123456!`
- ID : `3f248389-87a4-4524-bc5a-470ba8df8816`
- Role : `back-office` / `catalog_manager` / `is_active=true`
- Email confirmé

Creds stockés dans `.claude/test-credentials.md` (gitignored).

**Login validé sur prod** :

- Navigation vers `https://verone-backoffice.vercel.app/login`
- Form rempli, submit → redirection vers `/dashboard` ✅
- Capture : `.playwright-mcp/screenshots/20260428/dashboard-catalog-manager-login-prod-201600.png`

**Démonstration du problème actuel (sans gating)** :

Sur prod, le user `catalog_manager` peut accéder à `/finance` et voir le CA, les charges, etc. (capture `.playwright-mcp/screenshots/20260428/finance-page-prod-nogate-201700.png`). C'est exactement le problème que cette PR résout via les 5 layouts gating.

**Test du gating** : à faire sur le preview Vercel (URL fournie automatiquement par le bot Vercel quand la PR est créée) ou après merge sur staging. Pas testable sur prod tant que le code n'est pas déployé.

---

## Limites identifiées

1. **RLS pas durcies** — défense en profondeur reportée à `BO-RBAC-CATALOG-MGR-002`. Si un catalog_manager bypasse l'UI (DevTools, requête API directe), il peut potentiellement INSERT/UPDATE certaines tables sensibles. Acceptable V1 (pool sous-traitants identifiés).
2. **Verrous UI granulaires non posés** — champs `selling_price_ht`, `margin_rate`, `retrocession_rate` restent éditables si le catalog_manager arrive à atterrir sur la page détail produit (il y arrive : pas de gate là-dessus). Reporté `BO-RBAC-CATALOG-MGR-002`.
3. **Boutons "Publier sur LinkMe/Site/Meta"** dans la page détail produit : non cachés. Reporté `BO-RBAC-CATALOG-MGR-002`.
4. **Verrouillage optimiste produit** (concurrence édition par 2 catalog_managers) : pas implémenté. Reporté `BO-RBAC-CATALOG-MGR-003` car nécessite ajout d'une colonne `version` sur `products` (migration DB) + gestion conflits côté UI.
5. **Audit log fournisseurs** (Romeo a accepté édition libre des fournisseurs existants) : pas d'audit log spécifique. À ajouter si nécessaire.
6. **Auto-update du plugin Chrome** : non géré (limite native — auto-update Chrome marche uniquement via Web Store ou hébergement avec `update_url`). Romeo doit annoncer manuellement les nouvelles versions aux sourceurs.
7. **Erreur 409 sur `user_activity_logs`** vue lors du login catalog_manager : RLS audit table semble bloquer ce nouveau rôle. Erreur silencieuse (n'empêche pas le login). À investiguer dans `BO-RBAC-CATALOG-MGR-002`.

---

## Tests effectués

- ✅ Type-check `@verone/utils` (exit 0)
- ✅ Type-check `@verone/back-office` après chaque sprint (exit 0)
- ✅ Migration RLS appliquée sans erreur
- ✅ User catalog_manager créé en prod, vérifié via SELECT
- ✅ Login Playwright sur prod : redirection /login → /dashboard OK
- ⏳ Test gating layouts sur preview Vercel : à faire post-création PR
- ⏳ Test endpoint download plugin Chrome : à faire post-création PR
- ⏳ CI complète (lint + build + tests) : déclenchée à la création de la PR

---

## Files touchés (synthèse)

```
docs/restored/auth/roles-permissions-matrix.md          (restauré)
docs/restored/auth/rls-policies.md                      (restauré)
docs/restored/sourcing/sourcing-validation-workflow.md  (restauré)
docs/restored/INDEX.md                                  (sections 6+7 ajoutées)
docs/scratchpad/dev-plan-2026-04-28-BO-RBAC-CATALOG-MGR-001.md  (nouveau)
docs/scratchpad/dev-report-2026-04-28-BO-RBAC-CATALOG-MGR-001.md (ce fichier)

supabase/migrations/20260510_add_catalog_manager_role_helpers.sql (nouveau)
packages/@verone/types/src/supabase.ts                  (régen)

packages/@verone/utils/src/hooks/use-current-bo-role.ts (nouveau)
packages/@verone/utils/src/hooks/index.ts               (export)
packages/@verone/ui/src/components/ui/role-badge.tsx    (description corrigée)

apps/back-office/src/lib/auth/get-current-bo-role.ts    (nouveau)
apps/back-office/src/components/admin/create-user-dialog.tsx (catalog_manager option)

apps/back-office/src/app/(protected)/finance/layout.tsx (nouveau, gate)
apps/back-office/src/app/(protected)/factures/layout.tsx (nouveau, gate)
apps/back-office/src/app/(protected)/devis/layout.tsx (nouveau, gate)
apps/back-office/src/app/(protected)/ventes/layout.tsx (nouveau, gate)
apps/back-office/src/app/(protected)/canaux-vente/linkme/layout.tsx (modifié, gate)

apps/back-office/src/app/(protected)/parametres/outils/page.tsx (nouveau)
apps/back-office/src/app/(protected)/parametres/page.tsx (section Outils)
apps/back-office/src/app/api/extensions/sourcing-chrome/download/route.ts (nouveau)

apps/back-office/package.json + pnpm-lock.yaml          (archiver)

.claude/test-credentials.md                             (creds catalog_manager)
```

---

## Suivi attendu

1. PR DRAFT créée vers `staging`
2. Vérifier CI verte (type-check + build + tests + check drift TS)
3. Tester sur preview Vercel : login catalog_manager + accès /finance (doit redirect /produits) + accès /parametres/outils + téléchargement extension
4. Romeo donne l'ordre de merge → ops-agent prend le relais (pas dans cette session)
5. Post-merge : décider si on attaque `BO-RBAC-CATALOG-MGR-002` (RLS durcies + verrous UI granulaires) immédiatement ou plus tard

---

## Sortie OK : à signaler à Romeo

- 1 PR draft créée vers staging
- 1 user catalog_manager fonctionnel (login validé)
- 6 commits cohérents, 1 bloc thématique unique (conforme règle bundling 2026-04-28)
- Limites documentées et scopées en BO-RBAC-CATALOG-MGR-002 / 003
- ATTENTION : ne pas merger avant validation Romeo + CI verte + test preview Vercel
