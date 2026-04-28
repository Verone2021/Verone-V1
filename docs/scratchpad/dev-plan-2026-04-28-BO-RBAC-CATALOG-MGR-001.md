# Dev Plan — BO-RBAC-CATALOG-MGR-001

**Date** : 2026-04-28
**Branche** : `feat/BO-RBAC-CATALOG-MGR-001`
**Auteur** : Claude (sous direction Romeo)
**Type** : Feature majeure — nouveau rôle BO + intégration plugin sourcing

---

## Contexte

Romeo veut un nouveau rôle BO `catalog_manager` pour des sous-traitants/salariés qui font du sourcing produit. Actuellement le système est binaire : `is_backoffice_user()` retourne `true` pour tout staff BO actif sans distinction de rôle. Le rôle `catalog_manager` est déjà déclaré dans la contrainte CHECK `valid_backoffice_role` (depuis migration 20260210_001) mais **aucun gating ne le différencie** d'un owner.

Matrice des capacités validée par Romeo (session 2026-04-27/28) :

| Capacité                              | catalog_manager                              |
| ------------------------------------- | -------------------------------------------- |
| Voir catalogue produit                | OUI                                          |
| Créer/éditer fiches sourcing          | OUI                                          |
| Importer via plugin Chrome            | OUI                                          |
| Saisir prix d'achat (`base_price_ht`) | OUI                                          |
| **Saisir prix de vente**              | **NON**                                      |
| Créer variantes produit               | OUI                                          |
| Créer/éditer catégories               | NON (suggestion → owner valide)              |
| Voir stock réel + prévisionnels       | LECTURE SEULE                                |
| Canaux de vente (publication)         | LECTURE SEULE (badges visibles, pas publier) |
| Créer fournisseurs                    | OUI                                          |
| Éditer fournisseurs existants         | OUI (édition libre selon décision Romeo)     |
| Concurrence édition produit           | Verrouillage optimiste                       |
| Finance, Qonto, ambassadeurs, RH      | NON                                          |
| Gestion utilisateurs                  | NON (owner-only)                             |

---

## Découpage en sprints

### Sprint 1 — Migration RLS helpers (FEU ROUGE — autorisé par Romeo)

Fichier : `supabase/migrations/20260428000001_add_catalog_manager_role_helpers.sql`

3 nouvelles fonctions SECURITY DEFINER STABLE :

- `is_catalog_manager()` — true si user courant a role=`catalog_manager` actif
- `is_back_office_owner()` — true si role=`owner` actif (helper manquant aujourd'hui)
- `is_back_office_admin_or_owner()` — true si role IN (owner, admin) actif

**Décision pragmatique** : on **ne touche PAS aux RLS existantes** dans ce sprint. Les RLS continuent d'utiliser `is_backoffice_user()` qui retourne true pour `catalog_manager` (cohérent : il EST staff BO). Le verrouillage des actions sensibles se fait côté UI + route API. Une 2e PR `BO-RBAC-CATALOG-MGR-002` pourra renforcer les RLS sur les tables critiques (finance, qonto, ambassadeurs) en défense en profondeur.

Régen types Supabase obligatoire (cf. règle bundling 2026-04-28).

### Sprint 2 — Hook `useCurrentBoRole` + helper serveur

- `apps/back-office/src/lib/auth/get-current-bo-role.ts` (server-side)
- `packages/@verone/hooks/src/use-current-bo-role.ts` (client-side, React Query)

Retourne : `'owner' | 'admin' | 'catalog_manager' | 'manager' | 'user' | 'sales' | 'partner_manager' | null`

### Sprint 3 — Page `/admin/users` : sélecteur de rôles à jour

Vérifier que `apps/back-office/src/app/(protected)/admin/users/*` permet bien de créer un user avec `role='catalog_manager'`. Ajouter si absent.

### Sprint 4 — Verrous UI catalogue

Champs/actions à verrouiller pour `catalog_manager` :

- Page `/produits/catalogue/[productId]` : champs `selling_price_ht`, `margin_rate`, `retrocession_rate` → **readonly + tooltip** ("Réservé à l'admin")
- Modals `QuickEditPriceDialog` : section prix de vente cachée
- Boutons "Publier sur LinkMe / Site / Meta" : cachés
- Actions sur catégories (`/produits/catalogue/categories`) : créer/éditer/supprimer cachés (lecture OK)
- Pages finance/qonto/ambassadeurs : redirect 403 si catalog_manager (gate côté layout)

### Sprint 5 — Page Outils + plugin Chrome

- Nouvelle page `/parametres/outils` (sidebar : sous-section "Outils")
- Section "Extension Sourcing Verone" : bouton télécharger + notice install 3 étapes (chrome://extensions → mode développeur → charger non empaquetée)
- Endpoint `app/api/extensions/sourcing-chrome/download/route.ts` :
  - Gate : `is_backoffice_user()` requis (ouvert à tout staff BO)
  - Zip à la volée du dossier `chrome-extension/` (avec `archiver` ou équivalent natif)
  - Stream avec `Content-Disposition: attachment; filename="verone-sourcing-vX.Y.Z.zip"`
  - Version lue depuis `chrome-extension/manifest.json`

Pourquoi pas Supabase Storage : zip à la volée plus simple, toujours synchronisé avec le code, pas de cron de upload à maintenir.

### Sprint 6 — Test E2E

- Création user `catalog-manager-test@verone.test` via `auth.admin.createUser` (ou INSERT direct si MCP autorisé)
- INSERT `user_app_roles` row : `app='back-office', role='catalog_manager', is_active=true`
- Stocker creds dans `.claude/test-credentials.md` (gitignored)
- Login Playwright MCP lane-2 sur prod (post-merge) ou sur dev local si serveur tourne
- Captures écran : login OK + page catalogue accessible + champ prix de vente verrouillé + bouton publier caché

### Sprint 7 — Dev-report + PR draft

- `docs/scratchpad/dev-report-2026-04-28-BO-RBAC-CATALOG-MGR-001.md`
- PR draft vers `staging` avec description complète, captures, limites
- **NE PAS MERGER** — attendre ordre Romeo

---

## Limites identifiées (à documenter dans dev-report)

1. **RLS pas durcies** dans cette PR — défense en profondeur reportée à BO-RBAC-CATALOG-MGR-002. Si un catalog_manager bypasse l'UI (DevTools), il peut potentiellement INSERT/UPDATE des tables sensibles via API directe. Acceptable pour V1 car pool d'utilisateurs = sous-traitants identifiés (pas un public ouvert).
2. **Plugin Chrome** : zip à la volée pas optimal pour des téléchargements fréquents. Si > 100 téléchargements/jour, passer à Supabase Storage.
3. **Auto-update du plugin** : pas géré (Chrome auto-update marche uniquement via Web Store ou hébergement avec `update_url` dans manifest). À adresser si besoin.
4. **Audit log fournisseurs** : Romeo a accepté le risque d'écrasement de conditions négociées (voir matrice §4 question 4). Audit log pourra être ajouté en BO-RBAC-CATALOG-MGR-003 si nécessaire.

---

## Structure de la PR

1 PR `[BO-RBAC-CATALOG-MGR-001]` avec ~7 commits :

1. docs: restore historical role/RLS/sourcing docs (déjà commité c1f89e1ff, **squashée** dans la PR)
2. feat(db): add catalog_manager role helpers (is_catalog_manager, is_back_office_owner, is_back_office_admin_or_owner)
3. chore: regenerate Supabase TS types
4. feat: add useCurrentBoRole hook + getCurrentBoRole server helper
5. feat: lock selling_price + publication actions for catalog_manager in /produits/catalogue
6. feat: add /parametres/outils page with Chrome extension download
7. test: e2e validation catalog_manager login + UI restrictions (Playwright captures)
8. docs: dev-report 2026-04-28 BO-RBAC-CATALOG-MGR-001

---

## Sortie attendue de la session

- 1 PR DRAFT vers staging
- User test fonctionnel (login validé)
- Captures écran preuves de bon comportement
- Romeo donne l'ordre de merge → ops-agent prend le relais

Pas de merge automatique. Pas de release main. Pas de bypass CI.
