# GitHub Rulesets - Verone Monorepo

**Date** : 2025-12-15
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
- Require status checks:
  - `Vercel – verone-back-office`
  - `Vercel – linkme`
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

### Configuration Multi-App (Décembre 2025)

```
Apps déployées : 2 (back-office, linkme)
Status checks requis :
  - "Vercel – verone-back-office"
  - "Vercel – linkme"
```

**Contexte** :

Depuis le déploiement de LinkMe (PR #16, 2025-12-15), Vercel émet deux contexts distincts :

```json
// Status émis par Vercel sur chaque commit
{ "context": "Vercel – verone-back-office", "state": "success" }
{ "context": "Vercel – linkme", "state": "success" }
```

Les deux checks doivent passer pour qu'une PR soit mergeable vers main.

---

## TODO : Migration site-internet (Phase E - Future)

> **Quand ?** Lors du déploiement de `site-internet` sur Vercel.

### État Actuel ✅

- [x] `back-office` déployé → Check `Vercel – verone-back-office`
- [x] `linkme` déployé → Check `Vercel – linkme`
- [ ] `site-internet` à déployer → Check `Vercel – site-internet`

### Action Future pour site-internet

Ajouter le troisième check au ruleset :

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
| 2025-12-15 | Déploiement LinkMe: ajout check `Vercel – linkme` au ruleset       | Claude Code |
| 2025-12-15 | Migration config mono-app → multi-app (2 checks requis)            | Claude Code |

---

**Dernière mise à jour** : 2025-12-15
