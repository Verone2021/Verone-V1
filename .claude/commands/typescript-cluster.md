# /typescript-cluster

Lance le clustering automatique des erreurs TypeScript et génère le plan de correction.

## Usage

```bash
/typescript-cluster
```

## Workflow Automatique

1. **Export erreurs TypeScript**
   ```bash
   npm run type-check 2>&1 > ts-errors-raw.log
   ```

2. **Exécution script clustering**
   ```bash
   node scripts/cluster-ts-errors.js
   # → Génère error-clusters.json
   ```

3. **Analyse et priorisation**
   - Parse `ts-errors-raw.log`
   - Groupe par code erreur (TS2322, TS2345, etc.)
   - Groupe par pattern message (regex similarity)
   - Calcule priorité P0-P3
   - Estime effort par famille

4. **Génération plan**
   - Crée `TS_ERRORS_PLAN.md` à la racine
   - Liste toutes familles avec métadonnées
   - Checklist progression
   - Milestones définies

## Output Généré

**Fichiers créés :**
- `ts-errors-raw.log` : Export brut
- `error-clusters.json` : Clusters structurés
- `TS_ERRORS_PLAN.md` : Plan correction

**Exemple error-clusters.json :**
```json
{
  "totalErrors": 975,
  "clusters": [
    {
      "id": "TS2322-null-undefined",
      "errorCode": "TS2322",
      "count": 150,
      "priority": "P1",
      "pattern": "Type 'X | null' is not assignable to type 'X'",
      "files": ["file1.tsx", "file2.ts"],
      "strategy": "null-coalescing",
      "estimation": "3-4h"
    }
  ]
}
```

## Prochaine Étape

Après clustering, utiliser `/typescript-fix <famille>` pour démarrer corrections.

## Agents MCP Utilisés

- **Sequential Thinking** : Planning clustering
- **Serena** : Code analysis patterns
- **Filesystem** : File operations
