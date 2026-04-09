# Build & Type-Check

**TOUJOURS filtrer sur le package concerne :**

```bash
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/linkme build
pnpm --filter @verone/site-internet build
```

**INTERDIT** : `pnpm build` ou `pnpm type-check` global (sauf PR finale ou changement transversal dans `@verone/types` ou `@verone/ui`).

**Nouveau package** : TOUJOURS ajouter scripts `"lint"` et `"type-check"` dans `package.json`.
