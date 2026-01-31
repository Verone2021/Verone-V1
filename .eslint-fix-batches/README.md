# ESLint Fix Batches - Working Directory

**Date** : 2026-01-31
**Objectif** : Dossier de travail pour la migration ESLint 5,690 warnings

---

## 📋 Contenu

Ce dossier contient les listes de warnings ESLint par package, utilisées pour organiser les batches de correction.

**Fichiers générés** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- `back-office-all.txt` - Tous les warnings Back-Office (~4,587)
- `linkme-all.txt` - Tous les warnings LinkMe (~1,092)
- `site-internet-all.txt` - Tous les warnings Site-Internet (~11)

**Fichiers de travail** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- `batch-N-*.txt` - Listes de fichiers pour chaque batch
- `progress.md` - Suivi de progression (optionnel)

---

## 🎯 Utilisation

### Générer Liste Complète

```bash
# Back-Office
pnpm --filter @verone/back-office lint > .eslint-fix-batches/back-office-all.txt 2>&1

# LinkMe
pnpm --filter @verone/linkme lint > .eslint-fix-batches/linkme-all.txt 2>&1

# Site-Internet
pnpm --filter @verone/site-internet lint > .eslint-fix-batches/site-internet-all.txt 2>&1
```

### Analyser Warnings par Type

```bash
# Compter warnings par règle
grep -oE "@typescript-eslint/[a-z-]+" .eslint-fix-batches/back-office-all.txt | sort | uniq -c | sort -rn

# Trouver fichiers avec le plus de warnings
grep -E "\.tsx?:" .eslint-fix-batches/back-office-all.txt | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

### Créer Batch

```bash
# Exemple: Batch 1 - prefer-nullish-coalescing
grep "prefer-nullish-coalescing" .eslint-fix-batches/back-office-all.txt | \
  grep -oE "/[^:]+\.tsx?" | sort | uniq -c | sort -rn | head -15 > \
  .eslint-fix-batches/batch-1-nullish.txt
```

---

## 🗑️ Nettoyage

Ce dossier est temporaire (non tracké dans Git). Une fois la migration terminée (0 warnings), supprimer :

```bash
rm -rf .eslint-fix-batches/
```

---

## 📚 Références

- **Plan complet** : `.plans/eslint-5690-warnings-plan.md`
- **Workflow correction** : `.claude/commands/fix-warnings.md`
- **Ratchet progressif** : `docs/current/eslint-progressive-ratchet.md`
