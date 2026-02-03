# Audits ESLint - Documentation

**Dernière mise à jour** : 2026-02-01

## Rapports Disponibles

### 📊 Données Brutes (Utiles)

1. **`eslint-warnings-detailed-2026-02-01.md`** (250 KB)
   - TOUS les warnings ligne par ligne
   - Groupés par fichier puis par règle
   - Pour fix détaillé

2. **`eslint-critical-files-2026-02-01.md`**
   - Top 50 fichiers avec le plus de warnings
   - Priorisation refactoring

3. **`eslint-warnings-by-rule-2026-02-01.md`**
   - Warnings groupés par règle ESLint
   - Top fichiers affectés par règle
   - Patterns récurrents

4. **`EXECUTIVE-SUMMARY-2026-02-01.md`**
   - Snapshot global du 2026-02-01
   - Stats et métriques

5. **`eslint-fix-session-2026-02-01.md`**
   - Rapport de session de corrections
   - Historique des fixes

6. **`eslint-correction-guide.md`**
   - Guide de correction des patterns ESLint

---

## Utilisation

### Fix warnings maintenant

```bash
# Voir warnings détaillés d'un fichier
grep -A 20 "nom-fichier.tsx" .claude/audits/eslint-warnings-detailed-2026-02-01.md

# Workflow intelligent
/fix-warnings
```

### Trouver fichiers critiques

```bash
cat .claude/audits/eslint-critical-files-2026-02-01.md | head -30
```

---

## État Actuel

**Back-Office** : ~2,714 warnings (2026-02-01)
**LinkMe** : ~887 warnings (2026-02-01)
**Site-Internet** : 0 warnings ✅

**PRs en cours** : 4 PRs ESLint avec ~461 warnings corrigés (à merger après résolution conflits)
