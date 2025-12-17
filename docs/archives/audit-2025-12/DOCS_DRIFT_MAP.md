# DOCS DRIFT MAP - Contradictions et Actions

**Date** : 2025-12-15
**Objectif** : Liste exhaustive des fichiers qui contredisent le canon

---

## LÉGENDE

| Status       | Description                                        |
| ------------ | -------------------------------------------------- |
| 🟢 CANON     | Source de vérité, ne pas modifier sauf mise à jour |
| 🟡 UPDATE    | Doit être mis à jour pour aligner avec canon       |
| 🟠 DEPRECATE | Marquer comme obsolète, garder pour référence      |
| 🔴 ARCHIVE   | Déplacer vers archive, plus utilisé                |
| ⚫ REMOVE    | Supprimer (très rare, justification requise)       |

---

## DOCUMENTS CANON (3)

| Fichier                              | Sujet           | Status   | Last Verified |
| ------------------------------------ | --------------- | -------- | ------------- |
| `docs/DEPLOYMENT.md`                 | Déploiement     | 🟢 CANON | 2025-12-13    |
| `docs/BRANCHING.md`                  | Branches Git    | 🟢 CANON | 2025-12-13    |
| `docs/governance/GITHUB-RULESETS.md` | Rulesets GitHub | 🟢 CANON | 2025-12-15    |

---

## DOCUMENTS À METTRE À JOUR (UPDATE)

### 1. CLAUDE.md

| Section       | Problème                         | Canon                                | Action    |
| ------------- | -------------------------------- | ------------------------------------ | --------- |
| Ligne 467     | "production-stable → Production" | BRANCHING.md dit "main → Production" | 🟡 UPDATE |
| Ligne 232-234 | Co-Authored-By Claude            | Mémoire interdit                     | 🟡 UPDATE |

**Preuve contradiction** :

```markdown
# CLAUDE.md (actuel)

production-stable → Production Vercel (auto-deploy)
main → Staging/Development (tests)

# docs/BRANCHING.md (canon)

| `main` | Production (Vercel auto-deploy) |
```

**Action** : PR #2 dans PR_PLAN.md

---

### 2. .claude/commands/senior-stabilization-protocol.md

| Ligne | Problème               | Action                |
| ----- | ---------------------- | --------------------- |
| 175   | Co-Authored-By: Claude | 🟡 UPDATE (supprimer) |

**Preuve** :

```bash
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Action** : PR #3 dans PR_PLAN.md

---

### 3. .claude/commands/update-docs.md

| Section        | Problème                         | Action    |
| -------------- | -------------------------------- | --------- |
| Liste mémoires | Incomplète, références obsolètes | 🟡 UPDATE |

**Action** : PR #7 dans PR_PLAN.md

---

## MÉMOIRES SERENA À ARCHIVER

### Mémoires Supprimées (✅ Fait)

| Fichier                            | Raison                  | Date suppression |
| ---------------------------------- | ----------------------- | ---------------- |
| `vercel-manual-deployment-only.md` | Contredit DEPLOYMENT.md | 2025-12-15       |

### Mémoires Archivées (✅ Fait - 2025-12-16)

| Fichier                                   | Raison            | Action            |
| ----------------------------------------- | ----------------- | ----------------- |
| `vercel-deployment-status-2025-10-20.md`  | Oct 2025, dépassé | ✅ SUPPRIMÉ 12/16 |
| `vercel-deployment-success-2025-10-20.md` | Oct 2025, dépassé | ✅ SUPPRIMÉ 12/16 |

---

## FICHIERS CI/CD OBSOLÈTES

### Dossier docs/ci-cd/ (Supprimé)

| Fichier                                         | Status Git    | Action      |
| ----------------------------------------------- | ------------- | ----------- |
| `docs/ci-cd/README.md`                          | `D` (deleted) | ✅ Supprimé |
| `docs/ci-cd/deployment-batch-74d-2025-10-29.md` | `D`           | ✅ Supprimé |
| `docs/ci-cd/rollback-procedures.md`             | `D`           | ✅ Supprimé |
| `docs/ci-cd/vercel-deployment-fix-2025-10.md`   | `D`           | ✅ Supprimé |

**Preuve** (git status):

```
D docs/ci-cd/README.md
 D docs/ci-cd/deployment-batch-74d-2025-10-29.md
 D docs/ci-cd/rollback-procedures.md
 D docs/ci-cd/vercel-deployment-fix-2025-10.md
```

**Note** : Ces fichiers ont été supprimés mais le changement n'est pas encore committé.

---

## MATRICE CONTRADICTIONS

| Sujet         | Doc A (Incorrect)   | Doc B (Canon)  | Contradiction                 | Action           |
| ------------- | ------------------- | -------------- | ----------------------------- | ---------------- |
| Branche prod  | CLAUDE.md           | BRANCHING.md   | "production-stable" vs "main" | UPDATE CLAUDE.md |
| Déploiement   | (mémoire supprimée) | DEPLOYMENT.md  | "manual" vs "auto"            | ✅ Résolu        |
| Co-Author     | senior-stab..md     | Mémoire Serena | Interdit mais présent         | UPDATE command   |
| Status checks | (ancienne doc)      | RULESETS.md    | 1 check vs 2 checks           | ✅ À jour        |

---

## FICHIERS SANS PROBLÈME (Conformes)

| Fichier                                     | Status                    |
| ------------------------------------------- | ------------------------- |
| `docs/database/README.md`                   | ✅ Conforme               |
| `docs/architecture/COMPOSANTS-CATALOGUE.md` | ✅ Conforme               |
| `docs/business-rules/**`                    | ✅ Conforme (93 dossiers) |
| `scripts/README.md`                         | ✅ Conforme               |
| `.claude/agents/**`                         | ✅ Conforme               |
| `.claude/contexts/**`                       | ✅ Conforme               |

---

## ACTIONS PAR PRIORITÉ

### P0 - Immédiat

1. [ ] `CLAUDE.md` : Corriger branch strategy
2. [ ] `senior-stabilization-protocol.md` : Supprimer Co-Authored-By

### P1 - Cette semaine

3. [ ] Archiver mémoires Oct 2025
4. [ ] Créer `docs/README.md` index

### P2 - Sprint suivant

5. [ ] Ajouter lifecycle headers aux canons
6. [ ] Update `update-docs.md`
7. [ ] CI docs lint (optionnel)

---

## CHECKLIST POST-NETTOYAGE

- [x] `./scripts/repo-audit.sh` retourne 0 findings MAJOR ✅ 2025-12-16
- [x] Aucune mention "production-stable" comme branche active ✅ 2025-12-16
- [x] Aucun Co-Authored-By Claude dans le repo ✅ 2025-12-16
- [x] Toutes mémoires Oct 2025 archivées ✅ 2025-12-16 (2 supprimées)
- [ ] `docs/README.md` existe avec liens vers canons

---

**Généré par** : Audit 2025-12-15
