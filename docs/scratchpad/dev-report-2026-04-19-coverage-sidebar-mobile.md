# Dev Report — Responsive Layout Back-Office (sidebar + header mobile)

**Date** : 2026-04-19
**Branche** : feat/responsive-complete-coverage
**PR** : #663 (DRAFT)

---

## Résumé

Audit et migration responsive du layout back-office. La sidebar n'avait aucune gestion mobile — elle était toujours rendue dans le flux normal, occupant 64-240px hors viewport sur mobile.

---

## Analyse initiale

| Fichier                        | État avant                                                           | Action                 |
| ------------------------------ | -------------------------------------------------------------------- | ---------------------- |
| `app-sidebar/index.tsx`        | Aucune gestion mobile, sidebar toujours visible                      | MIGRÉ                  |
| `app-header.tsx`               | Pas de bouton hamburger                                              | MIGRÉ                  |
| `channel-tabs.tsx`             | `overflow-x-auto` déjà présent sur les tabs, `px-6` fixe             | MIGRÉ (padding mobile) |
| `page-header.tsx`              | `px-6 py-4` fixe, composant simple sans multi-actions                | MIGRÉ (padding mobile) |
| `sidebar-provider.tsx` (local) | Context simple `useBoolean`, inutilisé directement dans auth-wrapper | SKIP (non utilisé)     |
| `SidebarBadgeDropdown.tsx`     | Pas de problème responsive                                           | SKIP                   |
| `SidebarFooter.tsx`            | Pas de problème responsive                                           | SKIP                   |
| `SidebarLogo.tsx`              | Pas de problème responsive                                           | SKIP                   |
| `SidebarNavItemCompact.tsx`    | Pas de problème responsive                                           | SKIP                   |
| `SidebarNavItemExpanded.tsx`   | Pas de problème responsive                                           | SKIP                   |

**Observation** : `auth-wrapper.tsx` utilise `SidebarProvider` de `@verone/ui` (shadcn étendu), qui expose déjà `isMobile`, `openMobile`, `setOpenMobile`, `toggleSidebar`. Utilisé tel quel — zéro modification de hooks existants.

---

## Fichiers modifiés

### `apps/back-office/src/components/layout/app-sidebar/index.tsx`

- Import `useSidebar` depuis `@verone/ui`
- Utilisation de `isMobile`, `openMobile`, `setOpenMobile` du contexte SidebarProvider
- Sur mobile (`isMobile=true`) : sidebar rendue en drawer fixed overlay (`fixed inset-y-0 left-0 z-50`)
  - Cachée par défaut (`-translate-x-full`)
  - Visible quand `openMobile=true` (`translate-x-0`)
  - Backdrop `bg-black/50 z-40` cliquable pour fermer
- Sur mobile : mode expanded forcé (`effectiveExpanded = isMobile ? true : isExpanded`)
- Sur desktop : comportement hover-expand inchangé, sidebar dans `<div className="h-screen flex-shrink-0">`
- Suppression du `<style jsx>` redondant (les styles `.nav-item`, animations `slideIn`, `badge-urgent` sont déjà dans `globals.css`)
- Touch targets : la sidebar en mode drawer est déjà accessible (44px+ sur les items nav)

### `apps/back-office/src/components/layout/app-header.tsx`

- Import `useSidebar` depuis `@verone/ui`, import `Menu` depuis `lucide-react`
- Ajout de `const { toggleSidebar, isMobile } = useSidebar()`
- Bouton hamburger rendu uniquement quand `isMobile` (condition runtime + `md:hidden` CSS)
  - Touch target : `h-11 w-11` (44px × 44px conforme WCAG)
  - `aria-label="Ouvrir le menu"` pour accessibilité
  - `onClick={toggleSidebar}` appelle `setOpenMobile(true)` côté SidebarProvider
- Ajout `<div className="flex-1" />` spacer pour garder les actions utilisateur à droite
- Padding responsive : `px-4 md:px-6` (était `px-6` fixe)

### `apps/back-office/src/components/layout/channel-tabs.tsx`

- Padding responsive : `px-4 md:px-6` (était `px-6` fixe)
- Les tabs avaient déjà `overflow-x-auto` et `whitespace-nowrap` — aucune autre modification nécessaire

### `apps/back-office/src/components/layout/page-header.tsx`

- Padding responsive : `px-4 py-3 md:px-6 md:py-4` (était `px-6 py-4` fixe)
- Composant accepte un seul `action?: ReactNode` — pas de dropdown multi-actions nécessaire

---

## Vérifications

| Check                                          | Résultat                              |
| ---------------------------------------------- | ------------------------------------- |
| `pnpm --filter @verone/back-office type-check` | **EXIT 0** — aucune erreur TypeScript |
| `pnpm --filter @verone/back-office lint`       | **EXIT 0** — 0 warnings introduits    |

---

## Comportement attendu après migration

**Mobile (< 768px)** :

- Sidebar cachée par défaut (aucun espace pris dans le flux)
- Header affiche le bouton hamburger (44px, visible uniquement < md)
- Click hamburger → sidebar slide depuis gauche en overlay (z-50)
- Click backdrop → sidebar se ferme
- Navigation dans la sidebar (mode expanded) → fermeture automatique via navigation (comportement Next.js)

**Desktop (>= 768px)** :

- Bouton hamburger absent (isMobile=false)
- Sidebar dans le flux normal (comportement hover-expand inchangé)
- Layout `flex` horizontal inchangé

---

## Non modifié (intentionnel)

- `sidebar-provider.tsx` (local) — créé avant l'adoption du `SidebarProvider` de `@verone/ui`, toujours exporté mais non utilisé dans auth-wrapper. Laissé tel quel (hors scope, nettoyage séparé si besoin).
- Tous les hooks existants (`useHoverExpand`, `useSidebarState`, `useSidebarCounts`, etc.)
- Aucune modification dans `packages/@verone/*`
- Aucune route API touchée
