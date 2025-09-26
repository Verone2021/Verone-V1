# /feature-start - Démarrer Nouvelle Fonctionnalité

## Description
Command pour initialiser une nouvelle fonctionnalité selon le workflow révolutionnaire 2025 : Plan-First → Agent Orchestration → Branch Creation

## Usage
```bash
/feature-start <feature-name>
```

## Workflow Automatisé

### Phase 1: PLAN-FIRST (Sequential Thinking Mandatory)
1. **Utiliser Sequential Thinking** pour planifier la fonctionnalité :
   - Analyser les requirements avec `mcp__sequential-thinking__sequentialthinking`
   - Identifier les modules impactés
   - Définir les étapes d'implémentation
   - Estimer la complexité et les dépendances

### Phase 2: RESEARCH & ANALYSIS
1. **Serena Code Analysis** :
   - `mcp__serena__get_symbols_overview` sur les fichiers concernés
   - `mcp__serena__find_symbol` pour localiser les points d'intégration
   - `mcp__serena__read_memory` pour contexte projet existant

2. **Documentation Officielle** :
   - `mcp__context7__resolve-library-id` pour les frameworks utilisés
   - `mcp__context7__get-library-docs` pour best practices

3. **Database Analysis** :
   - `mcp__supabase__list_tables` pour comprendre le schéma
   - `mcp__supabase__get_advisors` pour sécurité/performance

### Phase 3: BRANCH CREATION
1. **GitHub Branch Management** :
   - `mcp__github__create_branch` avec nom : `feature/$ARGUMENTS`
   - Créer depuis `main` (GitHub Flow simple)

### Phase 4: MEMORY UPDATE
1. **Context Persistence** :
   - `mcp__serena__write_memory` avec plan détaillé
   - Sauvegarder dans `MEMORY-BANK/active-context.md`

## Arguments
- `$ARGUMENTS` : Nom de la fonctionnalité (ex: "dashboard-metrics", "catalogue-filters")

## Exemple
```bash
/feature-start dashboard-metrics
```

## Résultat Attendu
- ✅ Plan détaillé créé avec Sequential Thinking
- ✅ Analyse code existant complète (Serena)
- ✅ Documentation framework consultée (Context7)
- ✅ Branch `feature/dashboard-metrics` créée
- ✅ Context sauvegardé en mémoire
- ✅ Prêt pour implémentation avec workflow 2025