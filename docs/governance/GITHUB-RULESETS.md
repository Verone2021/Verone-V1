# GitHub Rulesets - Verone Monorepo

**Date** : 2025-12-13
**Repository** : Verone2021/Verone-V1

---

## Rulesets Actifs

### 1. "Protect main"

| Paramètre       | Valeur                   |
| --------------- | ------------------------ |
| **ID**          | 11086775                 |
| **Target**      | `~DEFAULT_BRANCH` (main) |
| **Enforcement** | Active                   |

**Règles appliquées** :

- Require pull request before merging (0 approvals minimum)
- Require status checks: `Vercel`
- Block force pushes
- Block deletions

### 2. "Freeze production"

| Paramètre       | Valeur       |
| --------------- | ------------ |
| **Target**      | `production` |
| **Enforcement** | Active       |

**Règles appliquées** :

- Block force pushes
- Block deletions
- (Branche legacy, lecture seule)

---

## Status Check "Vercel" - État Actuel

### Configuration Mono-App (Décembre 2025)

```
Apps déployées : 1 (back-office)
Status check requis : "Vercel"
```

**Pourquoi `Vercel` et non `Vercel – verone-back-office` ?**

Vercel émet actuellement un seul context de status check : `Vercel`.
Le nom affiché dans Vercel Dashboard (`verone-back-office`) n'est PAS utilisé comme context Git.

```json
// Status émis par Vercel sur chaque commit
{ "context": "Vercel", "state": "success" }
```

---

## TODO : Migration Multi-App (Phase E)

> **Quand ?** Lors du déploiement de `linkme` et `site-internet` sur Vercel.

### Actions Requises

1. **Configurer les contexts Vercel par projet** :
   - Vercel Dashboard → Project Settings → Git → Commit Statuses
   - Définir un "Status Name" unique par projet :
     - `verone-back-office` → `Vercel – verone-back-office`
     - `verone-linkme` → `Vercel – linkme`
     - `verone-site-internet` → `Vercel – site-internet`

2. **Mettre à jour le ruleset "Protect main"** :

   ```json
   {
     "type": "required_status_checks",
     "parameters": {
       "required_status_checks": [
         { "context": "Vercel – verone-back-office" },
         { "context": "Vercel – linkme" },
         { "context": "Vercel – site-internet" }
       ]
     }
   }
   ```

3. **Vérifier** : Chaque PR doit passer les 3 checks avant merge.

### Commande de Mise à Jour (Future)

```bash
gh api -X PUT repos/Verone2021/Verone-V1/rulesets/11086775 \
  --input - << 'EOF'
{
  "name": "Protect main",
  "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"]}},
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "pull_request", "parameters": {"required_approving_review_count": 0}},
    {"type": "required_status_checks", "parameters": {
      "required_status_checks": [
        {"context": "Vercel – verone-back-office"},
        {"context": "Vercel – linkme"},
        {"context": "Vercel – site-internet"}
      ]
    }}
  ]
}
EOF
```

---

## Règles de Conduite

1. **Aucune modification ruleset sans GO explicite** du propriétaire du repo
2. Si un merge est bloqué par un status check :
   - Diagnostiquer le context attendu vs émis
   - Proposer une solution
   - Attendre validation avant modification
3. Documenter tout changement dans ce fichier

---

## Historique des Modifications

| Date       | Changement                                                         | Auteur      |
| ---------- | ------------------------------------------------------------------ | ----------- |
| 2025-12-13 | Création ruleset "Protect main" avec `Vercel – verone-back-office` | Claude Code |
| 2025-12-13 | Fix context: `Vercel – verone-back-office` → `Vercel` (match réel) | Claude Code |
| 2025-12-13 | Documentation créée                                                | Claude Code |

---

**Dernière mise à jour** : 2025-12-13
