# [BO-MKT-002] Studio Marketing — générateur de prompts Nano Banana

**Date** : 2026-05-02
**Branche** : `feat/BO-MKT-002-studio-prompts`
**Worktree** : `/Users/romeodossantos/verone-mkt-002`

## Contexte

Premier brique du Studio Marketing : générateur de prompts Nano Banana intégré au back-office.
Source : `docs/scratchpad/matrices-prompts-nano-banana-2026-04-30.md` (27 presets V1-V6 / B1-B7 / S1-S7 / F1-F7).

## Scope atomique

- Nouveau package `packages/@verone/marketing` (n'existe pas)
- Composant `<PromptBuilder>` :
  - Dropdown marque (4 marques : Vérone / Bohemia / Solar / Flos)
  - Dropdown preset filtré par marque (V1-V6 / B1-B7 / S1-S7 / F1-F7 — 27 presets)
  - Combobox produit (autocomplete sur le catalogue back-office) ou champ description libre fallback
  - Textarea description produit (placeholder remplaçant `[Produit X]`)
  - Génération du prompt structuré (Subject + Action + Scene + Camera + Lighting + Style + Realism + Format)
  - Aperçu du prompt final + bouton "Copier le prompt" avec toast feedback
- Page `/marketing/prompts` dans back-office (route protégée)
- 27 presets stockés en TypeScript (`src/data/presets.ts`) — pas de DB

## Hors scope

- Reverse prompt
- Banque de prompts perso
- API Gemini Vision
- DAM bibliothèque (sprint suivant BO-MKT-001)
- Migration DB (zéro)

## Architecture cible

```
packages/@verone/marketing/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                          # types Brand, Preset, PromptInputs
    ├── data/
    │   ├── brands.ts                     # 4 marques avec identités visuelles
    │   └── presets.ts                    # 27 presets V1-V6 / B1-B7 / S1-S7 / F1-F7
    ├── lib/
    │   └── compose-prompt.ts             # logique de substitution [Produit X]
    └── components/
        └── PromptBuilder/
            ├── PromptBuilder.tsx
            ├── BrandSelector.tsx
            ├── PresetSelector.tsx
            ├── ProductInput.tsx
            ├── PromptPreview.tsx
            └── index.ts

apps/back-office/src/app/(protected)/marketing/
└── prompts/
    └── page.tsx                          # route protégée + sidebar nav
```

## Étapes

1. Scaffolder `packages/@verone/marketing` + dépendances (`@verone/ui`, `@verone/utils`)
2. Définir types + data (4 brands + 27 presets)
3. `compose-prompt.ts` : substituer `[Produit X]` dans le template du preset
4. Composant `<PromptBuilder>` avec sous-composants
5. Page `/marketing/prompts` route Next.js
6. Sidebar nav item "Marketing"
7. Type-check + build
8. Commit + push
9. Reviewer-agent (blind audit)
10. Promote ready si PASS

## Fichiers touchés (visibilité multi-agents)

- nouveau : `packages/@verone/marketing/**` (~12 fichiers)
- nouveau : `apps/back-office/src/app/(protected)/marketing/prompts/page.tsx`
- modifié : `apps/back-office/src/components/layout/app-sidebar/sidebar-nav-items.ts` (ajout entrée Marketing)
- modifié : `apps/back-office/package.json` (ajout dépendance `@verone/marketing`)
- modifié : `pnpm-workspace.yaml` (rien — workspace include `packages/@verone/*`)

## Tu ne dois PAS toucher à (autres agents)

- `packages/@verone/types/src/supabase.ts`
- `apps/back-office/src/app/api/qonto/*`
- triggers DB
