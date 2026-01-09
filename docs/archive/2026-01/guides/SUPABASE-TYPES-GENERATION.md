# Génération Types Supabase

**Date**: 2025-12-27
**Statut**: Documentation

---

## Méthode Officielle

### Option 1: Via CLI (Local)

```bash
# 1. Login Supabase CLI
supabase login

# 2. Lier le projet
supabase link --project-ref aorroydfjsrygmosnzrl

# 3. Générer les types
supabase gen types typescript --project-id aorroydfjsrygmosnzrl > apps/back-office/src/types/supabase.ts
```

### Option 2: Via Dashboard (Manuel)

1. Aller sur https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/api
2. Onglet "API Docs" → "TypeScript Types"
3. Copier le contenu généré
4. Coller dans `apps/back-office/src/types/supabase.ts`

### Option 3: Via CI/CD (Automatisé)

```yaml
# .github/workflows/generate-types.yml
name: Generate Supabase Types

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  generate-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Generate types
        run: |
          supabase gen types typescript \
            --project-id ${{ secrets.SUPABASE_PROJECT_ID }} \
            > apps/back-office/src/types/supabase.ts
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Commit if changed
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update supabase types'
          file_pattern: 'apps/back-office/src/types/supabase.ts'
```

---

## Secrets Requis (pour CI)

| Secret                  | Description            | Où le trouver                           |
| ----------------------- | ---------------------- | --------------------------------------- |
| `SUPABASE_PROJECT_ID`   | `aorroydfjsrygmosnzrl` | Dashboard → Settings → General          |
| `SUPABASE_ACCESS_TOKEN` | Token personnel        | https://app.supabase.com/account/tokens |

---

## Workaround Actuel (2025-12-27)

Le hook `use-unified-transactions.ts` utilise `any` type car les types ne sont pas à jour:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformed: UnifiedTransaction[] = (data || []).map((tx: any) => {
```

**À faire après rotation credentials:**

1. `supabase login` avec nouveau token
2. `supabase gen types typescript --project-id aorroydfjsrygmosnzrl > apps/back-office/src/types/supabase.ts`
3. Supprimer les `any` du hook

---

## Vérification

```bash
# Vérifier que les types incluent la nouvelle vue
grep "v_transactions_unified" apps/back-office/src/types/supabase.ts

# Vérifier les fonctions
grep "get_transactions_stats" apps/back-office/src/types/supabase.ts
```

---

_Mis à jour: 2025-12-27_
