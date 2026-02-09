# LinkMe Public Selection Routing - LOGIQUE CRITIQUE

**Status** : PRODUCTION CRITICAL - NE PAS MODIFIER SANS REVIEW
**Owner** : Romeo
**Last Updated** : 2026-02-09

## Pourquoi cette logique existe

Les sélections LinkMe sont accessibles publiquement via 2 formats d'URL :

- `/s/{uuid}` - Format UUID (rétrocompatibilité, rare)
- `/s/{slug}` - Format slug (SEO-friendly, cas principal)

Le dashboard LinkMe génère des liens avec **slug** :

```typescript
// apps/linkme/src/app/(main)/ma-selection/page.tsx
href={`/s/${selection.slug ?? selection.id}`}
```

## Schéma DB

Table `linkme_selections` :

- `id` : uuid (clé primaire)
- `slug` : text NOT NULL (URL-friendly, ex: "collection-mobilier-pokawa")
- `published_at` : timestamptz (NULL = brouillon, NOT NULL = publié)

## RPCs Disponibles

| RPC                                         | Paramètre | Usage             |
| ------------------------------------------- | --------- | ----------------- |
| `get_public_selection(p_selection_id uuid)` | UUID      | Accès par UUID    |
| `get_public_selection_by_slug(p_slug text)` | Slug      | Accès par slug ✅ |

Migrations :

- `20251223_002_get_selection_by_slug.sql` - Création RPC slug
- `20260109_008_add_branding_to_public_selection_rpc.sql` - Update RPC UUID

## Logique de Détection (CRITIQUE)

```typescript
// OBLIGATOIRE : Détecter UUID vs slug AVANT d'appeler Supabase
const isUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const { data, error } = await supabase.rpc(
  isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
  isUuid ? { p_selection_id: id } : { p_slug: id }
);
```

**INTERDIT** :

```typescript
// ❌ NE FONCTIONNE QUE AVEC UUID, CASSE LES SLUGS
.from('linkme_selections')
.eq('id', id)  // id peut être un slug, pas un UUID
```

## Historique Régressions

| Date       | Commit     | Régression                                     | Fix                                    |
| ---------- | ---------- | ---------------------------------------------- | -------------------------------------- |
| 2026-02-09 | `fa2cc973` | Suppression détection UUID/slug → slugs cassés | Restauration logique commit `3c8d51da` |

## Impact Business

- URLs partagées aux clients finaux (B2B2C)
- Génération de revenus (commandes via sélections publiques)
- Visibilité de marque (white-label affiliés)
- SEO (slugs propres vs UUIDs)

## Tests E2E

Voir `packages/@verone/playwright-tests/src/linkme-public-selection.spec.ts` :

- ✅ Test `/s/{uuid}` → Charge correctement
- ✅ Test `/s/{slug}` → Charge correctement
- ✅ Test slug inexistant → Affiche erreur gracieuse

## Références

**Best Practices** :

- [Code Documentation Best Practices (Qodo 2026)](https://www.qodo.ai/blog/code-documentation-best-practices-2026/)
- [Playwright Best Practices](https://github.com/microsoft/playwright/blob/main/docs/src/best-practices-js.md)

**Git Commits** :

- `3c8d51da` : Commit initial avec logique UUID/slug (FONCTIONNAIT)
- `fa2cc973` : Refactor qui a cassé la logique (RÉGRESSION)

**Migrations DB** :

- `supabase/migrations/20251223_002_get_selection_by_slug.sql`
- `supabase/migrations/20260109_008_add_branding_to_public_selection_rpc.sql`
