# Template Sprint Responsive — [APP-UI-RESP-NNN]

**Copier ce fichier pour chaque nouveau sprint de migration responsive.**

---

## Metadata du sprint

- **Task ID** : `[APP-UI-RESP-NNN]` (BO / LM / WEB)
- **Pattern cible** : A | B | C | D | E | F
- **Pages couvertes** : 5-15 pages similaires
- **Effort estime** : 1 jour (S) / 2 jours (M) / 3 jours (L)
- **Dependance** : `BO-UI-RESP-001` (infrastructure) doit etre merge

---

## Checklist avant de commencer

- [ ] Lire `CLAUDE.md` racine (section STANDARDS RESPONSIVE)
- [ ] Lire `.claude/rules/responsive.md`
- [ ] Lire le `CLAUDE.md` de l'app concernee
- [ ] Verifier que `@verone/ui` expose bien les composants responsive :
  - `ResponsiveDataView`
  - `ResponsiveActionMenu`
  - `ResponsiveToolbar`
- [ ] Verifier que `@verone/hooks` expose `useBreakpoint`
- [ ] Lister les N pages du sprint (inventaire precis)

---

## Plan d'execution

### Etape 1 : Audit page par page

Pour chaque page du sprint, documenter dans
`docs/scratchpad/sprint-plan-{TASK_ID}.md` :

```markdown
## Page /xxx (Pattern X)

### Etat actuel

- Probleme observe (colonne coupee, actions inaccessibles, etc.)
- Code actuel : lien fichier + lignes

### Etat cible

- Colonnes fixes : N°, Client, Montant, Actions
- Colonnes masquables :
  - `hidden lg:table-cell` : Date
  - `hidden xl:table-cell` : Echeance
  - `hidden 2xl:table-cell` : Paiement
- Actions via `ResponsiveActionMenu` :
  - Voir (alwaysVisible)
  - Modifier
  - Telecharger
  - Supprimer (destructive, separatorBefore)
- Card mobile :
  - Header : N° + Statut badge
  - Body : Client + Montant + Date
  - Footer : Actions

### Breakpoints

- 375px : mode card
- 768px : mode table, 4 colonnes
- 1024px : + colonne Date
- 1280px : + colonne Echeance
- 1536px : + colonne Paiement
```

### Etape 2 : Implementation par page

Pour chaque page, appliquer dans l'ordre :

1. Remplacer `<Table>` brut par `<ResponsiveDataView>`
2. Extraire les actions en `<ResponsiveActionMenu>`
3. Remplacer le header par `<ResponsiveToolbar>` si applicable
4. Ajouter les classes `hidden md:table-cell` / `hidden lg:table-cell` etc.
5. Ajuster les tailles de bouton pour touch targets 44px mobile
6. Supprimer les `w-auto`, `max-w-*` artificiels

### Etape 3 : Tests Playwright

Pour chaque page modifiee :

```typescript
// tests/e2e/responsive-{sprint-id}.spec.ts
import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'laptop-small', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 },
];

for (const viewport of VIEWPORTS) {
  test(`responsive - /factures @ ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/factures');
    await page.waitForLoadState('networkidle');

    // Screenshot automatique
    await page.screenshot({
      path: `screenshots/responsive/{sprint-id}-factures-${viewport.name}.png`,
      fullPage: true,
    });

    // Verifications obligatoires
    await expect(
      page.getByRole('button', { name: /nouvelle facture/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /voir/i }).first()
    ).toBeVisible();
  });
}
```

### Etape 4 : Review avant PR

Auto-checklist :

- [ ] Testes a 375, 768, 1024, 1440, 1920 px
- [ ] Bouton primaire TOUJOURS visible et accessible
- [ ] Actions CRUD accessibles a TOUTES les tailles
- [ ] Aucun scroll horizontal parasite
- [ ] Aucun texte coupe sans `truncate` + `title`
- [ ] `pnpm --filter @verone/{app} type-check` PASS
- [ ] `pnpm --filter @verone/{app} build` PASS
- [ ] Aucune regression sur les autres pages de l'app

### Etape 5 : PR

Format PR :

```markdown
# [APP-UI-RESP-NNN] feat: responsive migration pattern X (N pages)

## Pages migrees

- /page-1
- /page-2
- ...

## Avant / Apres

Screenshots aux 5 tailles pour chaque page migree.

## Composants utilises

- ResponsiveDataView
- ResponsiveActionMenu
- ResponsiveToolbar

## Tests

- [x] type-check
- [x] build
- [x] Playwright 5 tailles
- [x] Verification manuelle sur Chrome + Safari

## Checklist reviewer

- [ ] 5 techniques responsive appliquees
- [ ] Aucun anti-pattern detecte
- [ ] Touch targets 44px mobile
- [ ] Zero regression
```

---

## Livrables attendus

1. PR mergee sur staging
2. Screenshots avant/apres dans `docs/screenshots/responsive/{sprint-id}/`
3. Scratchpad dev-plan complet
4. Update `.claude/work/ACTIVE.md` (marquer sprint comme FAIT)

---

## Criteres d'acceptation

- Aucun element inaccessible a aucune taille entre 320 et 2560 px
- Touch targets 44px min sur mobile
- Reviewer-agent PASS sur axe 4 (Responsive)
- Tests Playwright verts sur les 5 tailles standards
