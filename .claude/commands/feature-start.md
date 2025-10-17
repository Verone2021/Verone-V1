# /feature-start - Démarrer Nouvelle Fonctionnalité

Initialiser une nouvelle feature avec planning complet, branch Git, et contexte persistant.

## Usage
```bash
/feature-start <feature-name>
```

## Workflow Automatisé

### 1. Planning avec Sequential Thinking (Mandatory pour >3 étapes)
- Analyser les requirements avec `mcp__sequential-thinking__sequentialthinking`
- Identifier modules impactés et dépendances
- Définir étapes d'implémentation détaillées
- Estimer complexité et risques

### 2. Code Analysis (Serena)
- `mcp__serena__get_symbols_overview` sur fichiers concernés
- `mcp__serena__find_symbol` pour localiser points d'intégration
- `mcp__serena__read_memory` pour contexte projet existant

### 3. Documentation Framework (Context7)
- `mcp__context7__resolve-library-id` pour frameworks utilisés
- `mcp__context7__get-library-docs` pour best practices officielles

### 4. Database Context (Supabase)
- Lire credentials depuis `.env.local` automatiquement
- Analyser schéma si feature touche database
- `mcp__supabase__get_advisors` pour recommandations sécurité/performance

### 5. Git Branch Creation
- `mcp__github__create_branch` avec nom `feature/$ARGUMENTS`
- Branch depuis `main` (GitHub Flow simple)

### 6. Context Persistence
- `mcp__serena__write_memory` avec plan complet
- Sauvegarder dans `MEMORY-BANK/active-features/<feature-name>.md`

## Résultat
✅ Plan détaillé avec Sequential Thinking
✅ Analyse code existant (Serena)
✅ Documentation consultée (Context7)
✅ Branch `feature/<name>` créée
✅ Contexte sauvegardé pour prochaines sessions
