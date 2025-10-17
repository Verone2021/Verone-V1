# /plan - Architecture & Planning Complexe

Utiliser Sequential Thinking pour planifier tâches complexes >5 étapes ou décisions architecturales.

## Usage
```bash
/plan <description-tache>
```

## Quand Utiliser

### ✅ Cas d'Usage Idéaux
- **Architecture complexe** : Nouveau module multi-composants
- **Refactoring majeur** : Restructuration code existant
- **Migration technique** : Changement framework/library
- **Intégration externe** : API tierce, services externes
- **Performance optimization** : Amélioration systémique
- **Database schema** : Modifications tables/relations complexes

### ❌ Ne PAS Utiliser Pour
- Simple bug fix (1-2 fichiers)
- Changement CSS/styling basique
- Ajout feature triviale
- Documentation updates

## Workflow Sequential Thinking

### 1. Comprehensive Analysis
```typescript
mcp__sequential-thinking__sequentialthinking({
  thought: "Analyser requirements complets",
  thoughtNumber: 1,
  totalThoughts: 10, // Estimation initiale (ajustable)
  nextThoughtNeeded: true
})
```

### 2. Architecture Breakdown
**Pensées structurées :**
- **Thought 1-2**: Comprendre le problème + contraintes
- **Thought 3-4**: Explorer solutions alternatives
- **Thought 5-6**: Choisir architecture optimale + justification
- **Thought 7-8**: Identifier dépendances + impacts
- **Thought 9-10**: Plan d'implémentation étape par étape
- **Thought 11+**: Si nécessaire, ajuster totalThoughts

### 3. Code Context (Serena)
Après planning initial :
- `mcp__serena__get_symbols_overview` sur fichiers impactés
- `mcp__serena__find_symbol` pour comprendre intégrations
- `mcp__serena__read_memory` pour décisions passées similaires

### 4. Database Impact (Supabase)
Si database concernée :
- Analyser schéma existant
- Planifier migrations nécessaires
- `mcp__supabase__get_advisors` pour validation approche

### 5. Documentation Research (Context7)
Pour frameworks/libraries :
- `mcp__context7__resolve-library-id`
- `mcp__context7__get-library-docs` pour patterns recommandés

### 6. Decision Documentation
**Créer ADR (Architecture Decision Record) :**
```markdown
# ADR-[NUM]: [TITRE]

## Context
[Problème à résoudre]

## Decision
[Solution choisie]

## Alternatives Considered
1. [Option A] - Rejetée car [raison]
2. [Option B] - Rejetée car [raison]

## Consequences
**Positives:**
- [avantage 1]

**Negatives/Risks:**
- [risque 1] → Mitigation: [plan]

## Implementation Plan
1. [step 1]
2. [step 2]

## Success Metrics
- [metric 1]
```

Sauvegarder dans `manifests/architecture/adr/`

### 7. Memory Persistence
- `mcp__serena__write_memory` avec plan complet
- Sauvegarder context pour implémentation
- Links vers ADR créé

## Exemple Complet

### Command
```bash
/plan Refactoring module products pour supporter variants + SKU dynamiques
```

### Sequential Thinking Process
```
Thought 1: Analyser structure actuelle module products
→ Tables: products, product_images, categories
→ Problème: SKU statique, pas de variants support

Thought 2: Explorer solutions variants
→ Option A: EAV (Entity-Attribute-Value)
→ Option B: JSONB attributes
→ Option C: Table product_variants dédiée

Thought 3: Évaluer Option A (EAV)
→ Flexibilité: Excellente
→ Performance: Médiocre (JOINs complexes)
→ Type safety: Faible
→ Conclusion: ❌ Rejeter

Thought 4: Évaluer Option B (JSONB)
→ Flexibilité: Bonne
→ Performance: Excellente (indexes GIN)
→ Type safety: Moyenne (validation app-level)
→ PostgreSQL native: ✅
→ Conclusion: 🤔 Viable

Thought 5: Évaluer Option C (Table dédiée)
→ Flexibilité: Bonne
→ Performance: Excellente
→ Type safety: Excellente (schema strict)
→ Queries: Simples (JOINs standards)
→ Conclusion: ✅ RETENU

Thought 6: Architecture finale retenue
→ Nouvelle table: product_variants
  - id, product_id, sku, attributes (JSONB), stock, price
→ Migration produits existants vers variants par défaut
→ RLS policies: hériter de products

Thought 7: Plan implémentation
1. Migration Supabase: créer table + RLS
2. Types TypeScript: ProductVariant interface
3. Hook useProductVariants()
4. UI: Variant selector component
5. Tests: CRUD variants + stock management

Thought 8: Risques identifiés
→ Migration data existante (2000+ products)
→ Breaking changes API
→ Performance queries avec variants
→ Mitigation: migration progressive + feature flag

Thought 9: Success metrics
→ Performance: queries <300ms avec variants
→ Data integrity: 100% products migrés
→ Tests: 100% coverage variants CRUD
→ Console: zero errors après migration

Thought 10: Ready for implementation
→ ADR créé et validé
→ Plan détaillé disponible
→ Prêt pour /feature-start product-variants-refactoring
```

## Résultat
✅ Architecture complète pensée et documentée
✅ Alternatives évaluées avec justifications
✅ Risks identifiés avec plans mitigation
✅ Plan implémentation étape par étape
✅ ADR créé pour référence future
✅ Context sauvegardé en mémoire

## Next Step
```bash
/feature-start product-variants-refactoring
```

**AVANTAGE : Évite 80% des refactorings ratés grâce au planning rigoureux !**
