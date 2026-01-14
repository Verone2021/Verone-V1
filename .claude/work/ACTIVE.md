# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-14 (9329ba7e)

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]` (ex: BO-DASH-001, LM-ORD-002, WEB-CMS-001)
- Bypass: `[NO-TASK]` dans le message de commit (rare)
- Apres commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

## Taches Actives

---

## TASK: LM-ORD-004 — Pré-remplissage contacts clients (Phase 3-5)

**Contexte** : Feature pré-remplissage automatique des données contacts depuis la DB quand un client existant est sélectionné.

**Phase 1-2** : ✅ Terminées (CreateOrderModal)
**Phase 3-5** : En cours (OrderFormUnified + Tests)

### Phase 3 : Modifier OrderFormUnified (sélection publique)

- [ ] **LM-ORD-004-5** : Importer et utiliser le hook useOrganisationContacts
- [ ] **LM-ORD-004-6** : Pré-remplir quand organisation existante sélectionnée

### Phase 4 : LocalStorage pour utilisateurs publics (optionnel)

- [ ] **LM-ORD-004-7** : Ajouter cache localStorage dans OrderFormUnified

### Phase 5 : Tests

- [ ] **LM-ORD-004-8** : Tester CreateOrderModal (utilisateur authentifié)
- [ ] **LM-ORD-004-9** : Tester OrderFormUnified (sélection publique)
- [ ] **LM-ORD-004-10** : Tester cache localStorage

---

## TASK: LM-ORG-003 — Améliorer popup carte organisations (8 tâches, ~45 min)

**Contexte** : Le popup de la carte `/organisations?tab=map` est trop basique.

- [ ] **LM-ORG-003-1** : Étendre interface Organisation
- [ ] **LM-ORG-003-2** : Créer composant MapPopupCard
- [ ] **LM-ORG-003-3** : Design détaillé du popup
- [ ] **LM-ORG-003-4** : Intégrer MapPopupCard dans MapLibreMapView
- [ ] **LM-ORG-003-5** : Fallback logo intelligent
- [ ] **LM-ORG-003-6** : Fonction utilitaire formatAddress
- [ ] **LM-ORG-003-7** : Tester le popup
- [ ] **LM-ORG-003-8** : Tester responsive

---

## TASK: LM-SEL-003 — Optimiser UX sélections publiques (17 tâches, ~1h30)

**Contexte** : Améliorer pagination + barre de catégorisation.

### Phase 1 : Corrections rapides

- [ ] **LM-SEL-003-1** : Réduire pagination à 12 produits/page
- [ ] **LM-SEL-003-2** : Réduire taille bouton "Ajouter"

### Phase 2 : Enrichir les données

- [ ] **LM-SEL-003-3** : Modifier RPC `get_public_selection`
- [ ] **LM-SEL-003-4** : Mettre à jour interface ISelectionItem

### Phase 3 : Créer composants

- [ ] **LM-SEL-003-5** : Créer SelectionCategoryBar.tsx
- [ ] **LM-SEL-003-6** : Créer SelectionCategoryDropdown.tsx
- [ ] **LM-SEL-003-7** : Exporter les composants

### Phase 4 : Intégrer dans la page

- [ ] **LM-SEL-003-8** : Ajouter states et imports
- [ ] **LM-SEL-003-9** : Remplacer CategoryTabs par SelectionCategoryBar
- [ ] **LM-SEL-003-10** : Ajouter SelectionCategoryDropdown dans section filtres
- [ ] **LM-SEL-003-11** : Mettre à jour logique de filtrage
- [ ] **LM-SEL-003-12** : Supprimer ancien code CategoryTabs

### Phase 5 : Tests

- [ ] **LM-SEL-003-13** : Tester pagination
- [ ] **LM-SEL-003-14** : Tester bouton "Ajouter"
- [ ] **LM-SEL-003-15** : Tester barre de catégorisation
- [ ] **LM-SEL-003-16** : Tester dropdown sous-catégories
- [ ] **LM-SEL-003-17** : Vérifier responsive

---

## TASK: WEB-DEV-001 — Symlink cassé node_modules/next

**Contexte** : Symlink cassé empêche démarrage site-internet.

- [ ] **WEB-DEV-001-1** : Réinstaller les dépendances (`pnpm install --force`)
- [ ] **WEB-DEV-001-2** : Vérifier symlink
- [ ] **WEB-DEV-001-3** : Tester démarrage des 3 apps

---

## Notes

**Fichiers archivés** : `.claude/archive/plans-2026-01/ACTIVE-backup-*.md`

**Priorité** : LM-ORD-004-5 à 4-10 (continuité logique)

**Sentry DSN** : ✅ Configuré manuellement dans `.env.local`
