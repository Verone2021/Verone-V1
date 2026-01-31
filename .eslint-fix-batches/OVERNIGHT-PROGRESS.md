# Session Longue Supervisée - ESLint Migration Complète

**Start:** 2026-01-31 (heure de début)
**Target:** 3,446 warnings → 0 warnings
**Strategy:** TIER 1 → TIER 5 (aucun eslint-disable autorisé)
**Session:** Longue supervisée (terminal reste ouvert)

---

## 🎯 Objectif

Fixer **TOUS les 3,446 warnings** sans AUCUN `eslint-disable`.

**RÈGLE ABSOLUE** : ❌ INTERDICTION TOTALE de `eslint-disable`, `eslint-disable-next-line`, ou toute forme de suppression de warnings.

---

## 📊 Progress Tracker

### État Actuel

- **Warnings totaux** : 3,446
- **Warnings fixés** : 0
- **Pourcentage** : 0%

### Distribution par TIER

- [ ] **TIER 1** : 37 fichiers (~37 warnings) - QUICK WINS
- [ ] **TIER 2** : 87 fichiers (~250-300 warnings) - FACILES
- [ ] **TIER 3** : 88 fichiers (~900 warnings) - MOYENS
- [ ] **TIER 4** : 35 fichiers (~1,300 warnings) - DIFFICILES
- [ ] **TIER 5** : 3 fichiers (~492 warnings) - MONSTRES (TOUS les warnings fixés proprement)

---

## 📝 Commits Log

_Auto-updated après chaque commit_

### Batch 0 : Baseline

- **Commit** : `[BO-LINT-006] prep: baseline (3,446 warnings)`
- **Status** : En cours...

---

## 🚨 Issues & Blocages

_Aucun pour l'instant_

---

## ⏱️ Temps Estimé par TIER

| TIER      | Fichiers | Warnings  | Temps Estimé         | Status        |
| --------- | -------- | --------- | -------------------- | ------------- |
| 1         | 37       | ~37       | 30-45 min            | ⏳ En attente |
| 2         | 87       | ~250-300  | 1-2h                 | ⏳ En attente |
| 3         | 88       | ~900      | 2-3h                 | ⏳ En attente |
| 4         | 35       | ~1,300    | 3-4h                 | ⏳ En attente |
| 5         | 3        | ~492      | 3-5h (AUCUN DISABLE) | ⏳ En attente |
| **TOTAL** | **250**  | **3,446** | **10-15h**           | ⏳ En attente |

---

## 📚 Workflow par Fichier

1. **Read** : Lire le fichier complet
2. **Analyze** : Identifier patterns de warnings
3. **Research** : Consulter docs (MCP Context7) + patterns projet
4. **Fix** : Corriger TOUS les warnings proprement
5. **Validate** : `pnpm eslint <file> --quiet` → 0 warnings
6. **Type-check** : `pnpm type-check` → 0 errors
7. **Commit** : Format `[BO-LINT-006] fix: batch N - X warnings in Y files (tier Z)`

---

## 🎯 Stratégie TIER 5 (Monster Files)

**NOUVELLE STRATÉGIE** (pas d'eslint-disable) :

1. **CreateLinkMeOrderModal.tsx** (vérifier si déjà fixé dans PR #119)
2. **stocks/expeditions/page.tsx** (180 warnings) → Fixer UN PAR UN
3. **stocks/receptions/page.tsx** (230 warnings) → Fixer UN PAR UN

**Approche** :

- Grouper warnings par type (`no-unsafe-member-access`, `no-explicit-any`, etc.)
- Consulter docs TypeScript/React Query pour patterns corrects
- Chercher patterns similaires déjà corrigés dans le projet
- Appliquer corrections par groupe logique
- Valider après chaque groupe (type-check + ESLint)

---

**DÉMARRAGE IMMINENT** 🚀
