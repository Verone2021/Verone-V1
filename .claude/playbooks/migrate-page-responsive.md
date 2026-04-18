# Playbook — Migrate page responsive

Pattern rodé sur le pilote v2 `/factures` (commit 51bced9e5). Valide pour toute migration de liste Pattern A/B back-office ou LinkMe.

**Référence complète** : `docs/scratchpad/BO-UI-RESP-LISTS-pilot-v2-template.md`.

---

## Quand utiliser

- Migration d'une page « liste » (tableau de données CRUD) vers responsive
- Page contient une `<Table>` (ou `<table>` HTML natif) qui déborde sur mobile
- Actions CRUD multiples (voir, modifier, supprimer, télécharger, etc.)

**Ne pas utiliser pour** :
- Pages détail (Pattern C) → pas de table, layout 2 colonnes → autre pattern
- Pages dashboard (Pattern D) → KpiGrid suffit → pas de playbook dédié
- Formulaires (Pattern F) → grid responsive simple → pas besoin

---

## Étapes

### 1. Triple lecture

```bash
# Lire le code actuel de la page et ses composants
# Identifier :
# - Nombre de colonnes
# - Actions disponibles (combien, contextuelles ou non)
# - Composants enfants (page.tsx est souvent juste orchestrateur)
# - Types des props (Invoice, PurchaseOrder, etc.)
```

Lire **obligatoirement** :
- `.claude/rules/responsive.md` (5 techniques)
- `docs/scratchpad/BO-UI-RESP-LISTS-pilot-v2-template.md` (diagnostic bug React v1 + template v2)
- `packages/@verone/ui/src/components/ui/responsive-data-view.tsx` (API du composant)
- `packages/@verone/ui/src/components/ui/responsive-action-menu.tsx` (API actions)
- `packages/@verone/hooks/src/use-breakpoint.ts` (breakpoints Verone)

### 2. Décomposition obligatoire en 3 fichiers

Pour chaque page liste :

```
components/
├── [Entity]Table.tsx        (~250 L) — Orchestrateur ResponsiveDataView
├── [Entity]MobileCard.tsx   (~200 L) — Card mode mobile
└── [Entity]Actions.tsx      (~200 L) — ResponsiveActionMenu commun
```

**Règles non-négociables** :
- Chaque fichier < 400 lignes (voir `.claude/rules/code-standards.md`)
- `[Entity]Table.tsx` ne contient **AUCUN hook dans les callbacks** `renderCard`/`renderTable` — ils instancient des vrais composants
- `[Entity]MobileCard.tsx` reçoit toutes les props actions explicitement (pas de « spread » magique)
- `[Entity]Actions.tsx` utilise `ResponsiveActionMenu` avec `alwaysVisible: true` uniquement sur l'action critique (ex : Voir)

### 3. Règles hooks React (évite le bug « Rendered more hooks »)

- **TOUS** les hooks au TOP du composant
- JAMAIS de hook après early return
- JAMAIS de hook dans un `if`/`else`/`try`/`catch`
- JAMAIS de hook dans une fonction passée en prop
- Si logique conditionnelle : appeler le hook, puis conditionner l'utilisation de son résultat

### 4. Classes Tailwind obligatoires

Colonnes :
- `hidden lg:table-cell` — masque sous 1024px
- `hidden xl:table-cell` — masque sous 1280px
- `hidden 2xl:table-cell` — masque sous 1536px

Colonnes toujours visibles : identifiant, libellé principal, montant/total, actions.

Largeurs :
- `w-[100px]` — colonne technique fixe (N°, montant, actions)
- `min-w-[160px]` — colonne principale fluide (client, produit)

Touch targets :
- `h-11 w-11 md:h-9 md:w-9` sur tous les boutons icons

### 5. Checklist avant commit (OBLIGATOIRE, dans l'ordre)

```bash
# 5.1 Limite 400 lignes
wc -l apps/back-office/src/app/\(protected\)/[page]/components/*.tsx
# Chaque résultat < 400

# 5.2 Zéro w-auto
grep -rn "w-auto" apps/back-office/src/app/\(protected\)/[page]/
# Doit être vide

# 5.3 Zéro hook conditionnel (heuristique grep)
grep -rn "if.*return" apps/back-office/src/app/\(protected\)/[page]/components/ | grep -A1 "useState\|useEffect\|useMemo\|useCallback"
# Inspecter manuellement si matches

# 5.4 Type-check
pnpm --filter @verone/back-office type-check
# Exit 0

# 5.5 Build
pnpm --filter @verone/back-office build
# Exit 0

# 5.6 Script anti-pattern
bash .claude/scripts/check-responsive-violations.sh
# Zero violation critique
```

### 6. Playwright runtime (ÉTAPE CRITIQUE — absente en v1 = bug React non détecté)

Demander à Romeo de démarrer le dev server (`pnpm dev:safe`), puis :

```
Utilise playwright-lane-1 MCP pour :

1. browser_navigate http://localhost:3000/[page-url]
2. Attendre 3 secondes
3. browser_console_messages level=error
   → Doit être VIDE. Une seule erreur = FAIL.
4. browser_take_screenshot (desktop 1440px)
5. Redimensionner via nouveau browser_navigate avec viewport 375px
6. browser_take_screenshot (mobile 375px)
7. browser_console_messages level=error à nouveau
   → Doit être VIDE.

Sauvegarder screenshots : .playwright-mcp/screenshots/[page]-migration-[desktop|mobile]-20260419.png

Si TOUT PASS → commit autorisé
Si UNE erreur → REVERT (git reset --hard HEAD), rapport bug, STOP
```

### 7. Commit et push

```bash
git add apps/back-office/src/app/\(protected\)/[page]/
git commit -m "[BO-UI-RESP-NNN] refactor: migrate /[page] to responsive pattern"
git push
```

**PAS de PR intermédiaire.** La PR est créée uniquement quand le bloc de pages est entièrement migré.

### 8. Rapport

Créer `docs/scratchpad/dev-report-[date]-[task-id].md` avec :
- Liste des fichiers modifiés + `wc -l` de chacun
- Résultat Playwright (screenshots + console messages)
- Checklist des 5 techniques appliquées
- Pièges rencontrés + solutions

---

## Critères de succès

- [ ] 3 fichiers créés (Table, MobileCard, Actions) tous < 400 lignes
- [ ] Zéro `w-auto` dans les fichiers migrés
- [ ] Zéro hook conditionnel
- [ ] Type-check + build PASS
- [ ] Playwright runtime PASS (0 erreur console desktop + mobile)
- [ ] Screenshots 5 tailles sauvegardés
- [ ] Commit avec Task ID + push sur feature branch
- [ ] Dev-report dans scratchpad

---

## Pièges courants

### « Le fichier dépasse 400 lignes »

Décomposer plus. Créer un 4e fichier `[Entity]TableRow.tsx` qui extrait une ligne du tableau.

### « Plusieurs actions contextuelles selon statut (draft, validated, cancelled…) »

Dans `[Entity]Actions.tsx`, construire le tableau `actions: ResponsiveAction[]` avec des `.push()` conditionnels **au début du composant** (c'est un vrai composant React, les conditions sur le contenu sont OK, pas sur les hooks).

### « Le composant enfant (ex : InvoiceStatusBadge) utilise un hook qui crash »

Bisection : commenter les imports un par un et retester. Si un composant @verone/* interne casse, créer une tâche dédiée `[INFRA-UI-NNN]` pour le fixer dans son package.

### « L'action "Voir" doit rester un vrai bouton sur mobile »

`alwaysVisible: true` dans `ResponsiveAction`. Les autres actions passent en dropdown.

### « La page a plusieurs tables (ex : /factures a 4 onglets) »

Chaque onglet = 3 fichiers (Table, MobileCard, Actions). Partager les utilitaires (types, formatters) mais pas les composants.

### « Table HTML natif au lieu de <Table> de @verone/ui »

Migrer d'abord vers `<Table>` de @verone/ui, puis envelopper dans ResponsiveDataView. Ne pas essayer de faire les deux en même temps.
