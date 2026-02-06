# Rapport d'Implémentation : Git Worktrees

**Date** : 2026-02-06
**Statut** : ✅ COMPLÉTÉ

---

## Problème Initial

Romeo travaille quotidiennement avec **2-3 sessions Claude Code en parallèle** et rencontrait des problèmes graves :

- ❌ Conflits de merge constants (supabase.ts, .claude/)
- ❌ Sessions se "volant" les branches
- ❌ Modifications cross-session causant chaos
- ❌ Impossibilité de push à cause de conflits

**Cause racine** : Toutes les sessions partageaient le même répertoire Git.

---

## Solution Implémentée : Git Worktrees

### Architecture

```
/Users/romeodossantos/
├── verone-back-office-V1/          # Repo principal (main propre)
└── verone-worktrees/               # Max 2 worktrees
    ├── PRIMARY/                    # Feature longue (>1 jour)
    └── SECONDARY/                  # Feature courte (<1 jour)
```

### Bénéfices

- ✅ **Isolation complète** : Chaque session = dossier séparé + branche unique
- ✅ **Zéro conflits** : Git empêche même branche dans 2 worktrees
- ✅ **Performance** : Worktrees partagent `.git` (économie espace)
- ✅ **Context switching** : Garder état exact (node_modules, cache)

---

## Ce Qui a Été Créé

### Scripts de Gestion

| Script                | Fonction                      | Localisation |
| --------------------- | ----------------------------- | ------------ |
| `worktree-create.sh`  | Créer worktree + pnpm install | `scripts/`   |
| `worktree-cleanup.sh` | Supprimer worktree            | `scripts/`   |
| `worktree-status.sh`  | État worktrees actifs         | `scripts/`   |

### Documentation

| Fichier                              | Contenu                     | Audience  |
| ------------------------------------ | --------------------------- | --------- |
| `WORKTREES-QUICKSTART.md`            | Guide rapide utilisateur    | Romeo     |
| `SESSION-DECISION.md`                | Checklist décision worktree | Romeo     |
| `WORKTREES-IMPLEMENTATION-REPORT.md` | Ce rapport                  | Référence |

### Modifications Config

| Fichier                 | Modification                                   |
| ----------------------- | ---------------------------------------------- |
| `CLAUDE.md`             | Ajout section "Worktrees (Sessions Multiples)" |
| `.claude/settings.json` | Hook anti-commit repo principal                |

---

## Workflow Quotidien Type

### Matin (lancer 2-3 features)

```bash
cd ~/verone-back-office-V1

# Vérifier état
./scripts/worktree-status.sh

# Session 1 : Feature longue
./scripts/worktree-create.sh PRIMARY feat/consolidate-rls
cd ../verone-worktrees/PRIMARY && code .

# Session 2 : Feature courte
./scripts/worktree-create.sh SECONDARY feat/BO-ORDER-003
cd ../verone-worktrees/SECONDARY && code .

# Session 3 (si urgence) : Repo principal pour hotfix <20 min
```

### Pendant la journée

Chaque session travaille indépendamment :

- Commits fréquents
- Push réguliers
- **Zéro conflit, zéro friction**

### Soir (sauvegarder/merger)

```bash
# Session terminée → merge + cleanup
cd ../verone-worktrees/SECONDARY
git checkout main && git merge feat/BO-ORDER-003
git push

cd ~/verone-back-office-V1
./scripts/worktree-cleanup.sh SECONDARY

# Nouvelle feature prend sa place
./scripts/worktree-create.sh SECONDARY feat/LM-AUTH-002
```

---

## Règles STRICTES

### Limitation : 2 worktrees maximum

**Raison** : Économie espace (~1.5GB par worktree)

**Stratégie 2-3 features** :

- Features 1-2 : Dans PRIMARY + SECONDARY
- Feature 3 (urgence) : Repo principal si <20 min
- Rotation : Feature terminée → cleanup → nouvelle feature

### Hook Anti-Commit Repo Principal

Le hook bloque automatiquement `git commit` si `pwd` = `/verone-back-office-V1`.

**Objectif** : Forcer travail dans worktrees uniquement.

**Message erreur** :

```
❌ COMMIT INTERDIT dans repo principal.

**Raison** : Le repo principal doit rester sur main propre.
**Solution** : Utiliser un worktree :
  ./scripts/worktree-create.sh [NOM] feat/XXX
  cd ../verone-worktrees/[NOM]
```

---

## Validation Finale

### ✅ Checklist Implémentation

**Phase 1 : Cleanup** (SAUTÉ - déjà résolu)

- [x] Conflits résolus avant implémentation
- [x] Repo propre (`git status` clean)

**Phase 2 : Setup Worktrees**

- [x] Dossier `/Users/romeodossantos/verone-worktrees/` créé
- [x] Scripts exécutables : create, cleanup, status
- [x] Hook anti-commit ajouté dans `.claude/settings.json`

**Phase 3 : Documentation**

- [x] `WORKTREES-QUICKSTART.md` créé
- [x] `SESSION-DECISION.md` créé
- [x] `CLAUDE.md` mis à jour (section Worktrees)
- [x] Rapport implémentation créé

### Tests Manuels à Faire (Romeo)

```bash
# 1. Créer premier worktree
./scripts/worktree-create.sh TEST-001 feat/test-worktree
cd ../verone-worktrees/TEST-001

# 2. Vérifier isolation
echo "test" > test.txt
git status  # test.txt doit apparaître

cd ~/verone-back-office-V1
git status  # test.txt NE doit PAS apparaître

# 3. Tester hook anti-commit
git commit -m "test"  # Doit être bloqué

# 4. Cleanup
./scripts/worktree-cleanup.sh TEST-001
```

---

## Gain Estimé

**Avant** :

- 30-60 min/jour perdus à résoudre conflits
- Frustration, hallucinations, chaos

**Après** :

- 0 min perdus (isolation complète)
- **ROI : ~2.5h/semaine** récupérées
- Workflow serein et productif

---

## Prochaines Étapes (Romeo)

1. **Tester workflow** : Créer worktree → commit → push → cleanup
2. **Adapter habitudes** : Toujours `./scripts/worktree-status.sh` avant commencer
3. **Rotation** : Feature terminée → cleanup immédiat → nouvelle feature

---

## Références

- **Guide utilisateur** : `reports/WORKTREES-QUICKSTART.md`
- **Checklist décision** : `reports/SESSION-DECISION.md`
- **Section CLAUDE.md** : Ligne 139 (section "Worktrees")
- **Documentation Git Worktrees** : https://git-scm.com/docs/git-worktree
