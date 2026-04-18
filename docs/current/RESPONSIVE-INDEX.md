# Infrastructure Responsive Verone — Index

**Tout ce qui a ete mis en place pour rendre les 3 apps Verone responsive.**

Installation realisee le 2026-04-18 par Romeo (manuellement).

---

## 🎯 Objectif

Les 3 apps Verone (back-office, linkme, site-internet) doivent fonctionner
parfaitement de **320px a 2560px** :

- iPhone SE (320px) au Galaxy Fold plie
- Tablettes (768px+)
- Laptops 11/13/14/15/16 pouces
- Desktop et ecrans externes

**Criteres** :

- Aucun bouton inaccessible
- Aucun contenu tronque
- Touch targets 44px sur mobile
- Zero scroll horizontal parasite

---

## 📚 Documentation

### Documents lus par les agents automatiquement

- [`CLAUDE.md`](../../CLAUDE.md) — regles globales + section STANDARDS RESPONSIVE
- [`.claude/rules/responsive.md`](../../.claude/rules/responsive.md) — regle detaillee
- [`.claude/agents/reviewer-agent.md`](../../.claude/agents/reviewer-agent.md) — Axe 4 Responsive
- [`.claude/agents/dev-agent.md`](../../.claude/agents/dev-agent.md) — Mobile-First obligatoire

### Documents lus par le developpeur

- [`docs/current/GUIDE-RESPONSIVE.md`](./GUIDE-RESPONSIVE.md) — guide complet avec exemple
- [`docs/current/RESPONSIVE-SETUP-RECAP.md`](./RESPONSIVE-SETUP-RECAP.md) — recap installation
- [`docs/current/RESPONSIVE-INDEX.md`](./RESPONSIVE-INDEX.md) — ce fichier

### Documents par application

- [`apps/back-office/CLAUDE.md`](../../apps/back-office/CLAUDE.md)
- [`apps/linkme/CLAUDE.md`](../../apps/linkme/CLAUDE.md)
- [`apps/site-internet/CLAUDE.md`](../../apps/site-internet/CLAUDE.md)

### Template sprint

- [`.claude/templates/sprint-responsive-template.md`](../../.claude/templates/sprint-responsive-template.md)

---

## 🛠️ Code

### Hooks

```ts
import {
  useBreakpoint,
  useBreakpointUp,
  useBreakpointDown,
  BREAKPOINTS,
} from '@verone/hooks';

const bp = useBreakpoint();
// bp.isMobile, bp.isTablet, bp.isLaptop, bp.isDesktop
// bp.isMobileOrTablet, bp.isLaptopOrLarger
// bp.width, bp.isReady
```

### Composants UI

```tsx
import {
  ResponsiveActionMenu, // Dropdown auto sur mobile
  ResponsiveDataView, // Table/cards auto
  ResponsiveToolbar, // Header de page
} from '@verone/ui';
```

### Tests

```ts
import {
  RESPONSIVE_VIEWPORTS, // 5 tailles standards
  testAtAllViewports, // Test multi-viewport
  assertTouchTargetsOnMobile, // Verif 44px mobile
  assertFullyVisible, // Verif pas de debordement
} from '../fixtures/responsive';
```

---

## 🎨 Les 5 techniques

1. **Transformation table -> cartes sur mobile** via `ResponsiveDataView`
2. **Colonnes masquables progressivement** avec `hidden lg:table-cell` / `hidden xl:table-cell` / `hidden 2xl:table-cell`
3. **Actions en dropdown sur mobile** via `ResponsiveActionMenu`
4. **Touch targets 44px sur mobile** : `h-11 w-11 md:h-9 md:w-9`
5. **Largeurs fluides** : `min-w-*` sur colonne principale, `w-*` fixe sur colonnes techniques

---

## 📏 Breakpoints

| Nom     | Largeur | Appareils                            |
| ------- | ------- | ------------------------------------ |
| default | 0-639px | iPhone SE, iPhone 14, Fold plie      |
| `sm:`   | 640px+  | Grand mobile, petite tablette        |
| `md:`   | 768px+  | Tablette, iPad, Fold ouvert          |
| `lg:`   | 1024px+ | Laptop S (MacBook Air 11")           |
| `xl:`   | 1280px+ | Laptop M (MacBook 13/14)             |
| `2xl:`  | 1536px+ | Desktop (MacBook 16", ecran externe) |

Source constante : `@verone/hooks` `BREAKPOINTS`.

---

## 🚫 Anti-patterns interdits

- `w-auto` sur tableau ou conteneur large
- `max-w-[NNNpx]` artificiel bloquant
- `w-screen` (casse avec sidebar)
- `w-[NNNpx]` largeur fixe sur colonne principale
- `<Table>` nu sur < md sans wrapper
- 4+ boutons icone sur mobile sans dropdown
- Modal sans scroll interne
- `text-xs` sous 640px

Ces patterns provoquent un **FAIL automatique** du reviewer-agent.

---

## ✅ Composants a utiliser selon le besoin

| Besoin                                 | Solution                                      |
| -------------------------------------- | --------------------------------------------- |
| Liste de donnees tabulaires            | `ResponsiveDataView` (table + cards auto)     |
| Menu d'actions multiple (3+)           | `ResponsiveActionMenu` (dropdown mobile auto) |
| Header de page (titre + filtres + CTA) | `ResponsiveToolbar`                           |
| Detecter breakpoint en runtime         | `useBreakpoint()` hook                        |
| Test simple mobile/desktop             | `useMobile()` hook                            |
| Tests Playwright multi-viewport        | `testAtAllViewports()`                        |

---

## 🔄 Workflow de migration

Pour chaque page a migrer vers responsive :

1. Copier `.claude/templates/sprint-responsive-template.md`
2. Identifier le pattern (A/B/C/D/E/F)
3. Appliquer les 3 composants standards
4. Ajouter les classes `hidden lg:/xl:/2xl:table-cell`
5. Tests Playwright aux 5 tailles
6. Screenshots avant/apres en PR
7. Reviewer-agent PASS sur Axe 4
8. Merge squash vers staging

---

## 📊 Suivi

Tracking des sprints dans `.claude/work/ACTIVE.md` section "Sprints Responsive".

Sprints prevus :

- [BO-UI-RESP-001] : infrastructure (a commiter demain)
- [BO-UI-RESP-002] : audit global 147+ pages
- [BO-UI-RESP-003] a [BO-UI-RESP-009] : migration progressive par pattern

Estimation totale : **8-10 jours de travail**.

---

## 🆘 Support

Questions frequentes :

**Q: Un tableau doit-il vraiment disparaitre en cartes sur mobile ?**
R: Oui, OBLIGATOIRE. Un tableau n'est PAS lisible sous 768px. Les seniors
(Stripe, Linear, Shopify) font tous cela.

**Q: Combien de colonnes peut-on garder sur tablette ?**
R: 4 a 5 max. Masquer les colonnes secondaires avec `hidden lg:table-cell`.

**Q: Les actions critiques doivent-elles etre toujours visibles ?**
R: Oui. Marquer `alwaysVisible: true` dans `ResponsiveActionMenu` pour
l'action principale (ex: Voir). Les autres passent en dropdown sur mobile.

**Q: Quelle taille de bouton sur mobile ?**
R: 44x44px minimum (norme Apple/Google accessibility). Utiliser
`h-11 w-11 md:h-9 md:w-9`.

**Q: Scroll horizontal acceptable ?**
R: NON sauf si absolument inevitable. Preferer masquer des colonnes,
transformer en cartes, ou utiliser dropdown actions.

---

## 📖 References externes

Les 5 techniques viennent de l'etat de l'art 2024-2026 :

- Stripe Dashboard (reference B2B)
- Linear App
- Shopify Admin
- Vercel Dashboard
- Notion
- Figma

Tous utilisent exactement ces memes patterns. Rien de magique, juste de la
discipline appliquee rigoureusement.
