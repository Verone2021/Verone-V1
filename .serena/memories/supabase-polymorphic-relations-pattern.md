# Pattern Relations Polymorphiques Supabase

## Référence
**ADR Complet** : `docs/architecture/decisions/0002-polymorphic-relations-pattern.md`

## Résumé Rapide
Pour relations polymorphiques (1 FK → plusieurs tables), utiliser **fetch manuel** :

```typescript
// 1. Query sans jointures polymorphiques
const { data } = await supabase.from('main_table').select('*')

// 2. Fetch manuel selon discriminant
const withRelations = await Promise.all(
  data.map(async item => {
    if (item.type === 'organization') {
      const { data: org } = await supabase.from('organisations').select('*').eq('id', item.customer_id).single()
      return { ...item, customer: org }
    }
    // ... autres types
  })
)
```

## Quand utiliser
- `customer_id` pointant vers `organisations` OU `individual_customers`
- Discriminant `customer_type` pour identifier la table cible
- Jointures automatiques Supabase impossibles
