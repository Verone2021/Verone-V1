# Commandes Slash - Guide d'Utilisation

Les commandes slash permettent d'invoquer des workflows specialises.

---

## Commandes Disponibles

| Commande     | Quand Utiliser                      | Sortie                             |
| ------------ | ----------------------------------- | ---------------------------------- |
| `/explore`   | "Ou est X?" "Comment fonctionne Y?" | Fichiers + patterns + architecture |
| `/plan`      | "Comment faire Y?" (tache complexe) | Plan detaille avec etapes          |
| `/implement` | "Executer le plan"                  | Code + commits                     |
| `/db`        | "Migration DB"                      | SQL appliquee via psql             |
| `/pr`        | "Creer PR"                          | PR creee avec description          |
| `/teach`     | "Explique-moi X" (mode pedagogique) | Explication + alternatives         |

---

## Workflow Recommande

### Tache Simple (< 30 min)

```
1. /explore   - Comprendre l'existant (optionnel si contexte connu)
2. Code       - Implementer directement
3. Commit     - Sauvegarder
```

### Tache Complexe (> 30 min)

```
1. /explore   - Comprendre l'existant
2. /plan      - Planifier si complexe
3. /implement - Executer le plan
4. /pr        - Finaliser (si demande)
```

### Migration Database

```
1. /db        - Workflow complet migration
```

---

## Description Detaillee

### /explore

**Usage**: Exploration exhaustive du codebase

- Recherche de fichiers par pattern
- Analyse de symboles et relations
- Comprehension architecture existante

**Exemple**: "Ou sont geres les produits?"

### /plan

**Usage**: Planification mode PLAN (read-only)

- Analyse de la tache
- Decomposition en etapes
- Identification risques
- Demande approbation

**Exemple**: "Comment ajouter le module facturation?"

### /implement

**Usage**: Implementation feature complete

- Explore -> Code -> Verify
- Workflow structuré
- Commits frequents

**Exemple**: "Implementer le plan approuve"

### /db

**Usage**: Operations Supabase rapides

- Migrations SQL
- RLS policies
- Triggers
- Application via psql

**Exemple**: "Ajouter colonne status a orders"

### /pr

**Usage**: Creation Pull Request

- Auto-generation titre
- Auto-generation description
- Push + creation PR

**Exemple**: "Creer PR pour cette feature"

### /teach

**Usage**: Mode pedagogique expert

- Explication concept (pourquoi, comment)
- Pieges a eviter
- Alternatives avec trade-offs
- Questions clarification

**Exemple**: "/teach React Query mutations"

---

## Regles

1. **Toujours /explore avant /implement** sur code inconnu
2. **Toujours /plan** pour taches > 5 fichiers
3. **/pr uniquement sur demande** (mode manuel)
4. **/db applique via psql** automatiquement

---

**Derniere mise a jour**: 2026-02-01
