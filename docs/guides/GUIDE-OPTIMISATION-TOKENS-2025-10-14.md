# 🎯 Guide Optimisation Tokens - Claude Code 2025

**Date:** 2025-10-14
**Objectif:** Éliminer consommation excessive tokens dans context Claude Code

---

## 📊 Résultats Optimisation

### CLAUDE.md Simplifié ✅

- **Avant:** 567 lignes (verbosité excessive)
- **Après:** 252 lignes (-55% / -315 lignes)
- **Gains:** ~8000 tokens économisés par session

### Améliorations Appliquées

1. ✅ Supprimé répétitions MCP Browser (5+ mentions → 1)
2. ✅ Condensé patterns classification (80 lignes → 8)
3. ✅ Simplifié credentials Supabase (35 lignes → 12)
4. ✅ Éliminé exemples TypeScript redondants
5. ✅ Gardé UNIQUEMENT règles absolues essentielles

### Credentials Supabase Préservés

```typescript
// 🔑 TOUJOURS accessible dans CLAUDE.md (lignes 84-97)
// Fichier: /Users/romeodossantos/verone-back-office-V1/.env.local
// Connection: aws-1-eu-west-3.pooler.supabase.com:5432
// Password: ADFVKDJCJDNC934

// Workflow automatisé:
1. Read .env.local pour DATABASE_URL
2. Essayer Session Pooler (5432) priorité
3. Si échec → Direct Connection (6543)
4. JAMAIS demander credentials manuellement
```

---

## 🗂️ Fichiers Identifiés - Archivage Recommandé

### MEMORY-BANK/sessions - Top 10 Volumineux

| Fichier                                                  | Lignes | Status          | Recommandation |
| -------------------------------------------------------- | ------ | --------------- | -------------- |
| `2025-10-10-plan-developpement-systeme-prix.md`          | 1722   | Plan ancien     | **Archive**    |
| `RAPPORT-SESSION-REFONTE-COMMANDES-ERP-2025-10-14.md`    | 1235   | Récent          | Garder         |
| `2025-10-09/AUDIT-CODE-QUALITY.md`                       | 1174   | Audit dépassé   | **Archive**    |
| `2025-10-11-FINANCE-PARTIE3-TREASURY-DASHBOARD.md`       | 1075   | Implémenté      | **Archive**    |
| `2025-10-09/AUDIT-DESIGN-UX.md`                          | 920    | Audit dépassé   | **Archive**    |
| `2025-10-09/RAPPORT-FINAL-PHASE-1.md`                    | 893    | Phase complétée | **Archive**    |
| `2025-10-10-recherche-best-practices-pricing-systems.md` | 859    | Recherche       | **Archive**    |
| `2025-10-09/AUDIT-ORCHESTRATION-ARCHITECTURE.md`         | 840    | Audit dépassé   | **Archive**    |
| `2025-10-09/AUDIT-PERFORMANCE.md`                        | 832    | Audit dépassé   | **Archive**    |
| `RAPPORT-SESSION-FEATURE5-NOTIFICATIONS-2025-10-14.md`   | 799    | Récent          | Garder         |

**Total archivable:** ~8000 lignes = ~20 000 tokens économisés

### manifests - Doublons Critiques 🚨

| Fichier                                       | Lignes | Problème                  |
| --------------------------------------------- | ------ | ------------------------- |
| `technical-specs/monitoring-observability.md` | 744    | **DOUBLON** avec archive/ |
| `technical-specs/data-validation.md`          | 712    | **DOUBLON** avec archive/ |
| `architecture/API-CATALOGUE-V1.md`            | 654    | **DOUBLON** avec archive/ |
| `technical-specs/security-requirements.md`    | 586    | **DOUBLON** avec archive/ |
| `architecture/ERD-CATALOGUE-V1.md`            | 584    | **DOUBLON** avec archive/ |
| `prd/PRD-CATALOGUE-IMPLEMENTATION-V2.md`      | 546    | **DOUBLON** avec archive/ |

**Total doublons:** ~4000 lignes × 2 = ~8000 lignes gaspillées = **20 000 tokens**

---

## 🔧 Actions d'Archivage Proposées

### Option 1: Archivage Sessions Anciennes (Recommandé)

```bash
# Déplacer sessions audit 2025-10-09 (obsolètes)
mv MEMORY-BANK/sessions/2025-10-09/* MEMORY-BANK/archive/sessions/2025-10-09/

# Déplacer plans développement anciens
mv MEMORY-BANK/sessions/2025-10-10-plan-developpement-systeme-prix.md \
   MEMORY-BANK/archive/sessions/

mv MEMORY-BANK/sessions/2025-10-10-recherche-best-practices-pricing-systems.md \
   MEMORY-BANK/archive/sessions/

# Gains: ~15 000 tokens
```

### Option 2: Suppression Doublons manifests/ (CRITIQUE)

```bash
# Supprimer fichiers dans manifests/ (garder archive/ comme référence)
rm manifests/technical-specs/monitoring-observability.md
rm manifests/technical-specs/data-validation.md
rm manifests/technical-specs/security-requirements.md
rm manifests/architecture/API-CATALOGUE-V1.md
rm manifests/architecture/ERD-CATALOGUE-V1.md

# OU inverser: Supprimer archive/, garder manifests/
rm -rf manifests/archive/technical-specs/
rm -rf manifests/archive/architecture/

# Gains: ~20 000 tokens
```

### Option 3: Compression PRDs (Avancé)

```bash
# Créer PRD condensés dans manifests/prd/current/
# Supprimer PRDs verbeux anciens manifests/prd/PRD-*.md

# Gains: ~10 000 tokens
```

---

## 📈 Impact Total Estimé

| Action                       | Tokens Économisés  | Complexité |
| ---------------------------- | ------------------ | ---------- |
| ✅ CLAUDE.md simplifié       | ~8 000             | Fait       |
| Option 1: Archive sessions   | ~15 000            | Faible     |
| Option 2: Supprimer doublons | ~20 000            | Moyenne    |
| Option 3: Compression PRDs   | ~10 000            | Élevée     |
| **TOTAL POSSIBLE**           | **~53 000 tokens** | -          |

---

## 🎯 Recommandation Finale

### Phase 1 (IMMÉDIAT) ✅

1. ✅ CLAUDE.md simplifié (FAIT)
2. Archiver dossier complet `MEMORY-BANK/sessions/2025-10-09/` (audits obsolètes)
3. Archiver plans recherche anciens (2025-10-10)

**Gain Phase 1:** ~23 000 tokens (-30% context)

### Phase 2 (APRÈS VALIDATION UTILISATEUR)

1. Décider stratégie doublons manifests/ vs archive/
2. Compresser PRDs anciens en format condensé
3. Créer index `MEMORY-BANK/sessions/INDEX.md` pour référence rapide

**Gain Phase 2:** ~30 000 tokens supplémentaires

---

## 🚨 Règles Sécurité Archivage

### ✅ À GARDER ABSOLUMENT

- `MEMORY-BANK/sessions/RAPPORT-TEST-ANNULATION-STOCKS-2025-10-14.md` (session actuelle)
- `MEMORY-BANK/sessions/RAPPORT-DEBUG-DELETE-RLS-2025-10-14.md` (bugs récents)
- `manifests/business-rules/` (TOUS - règles business actives)
- `manifests/prd/current/` (PRDs production alignés)

### ❌ À ARCHIVER

- Audits 2025-10-09 (dépassés)
- Plans recherche anciens (implémentés)
- Doublons manifests/archive/

### ⚠️ À VÉRIFIER AVEC UTILISATEUR

- PRDs verbeux (546+ lignes) - Condenser ou garder ?
- Sessions FINANCE (1075 lignes) - Implémenté ou encore actif ?

---

## 📝 Prochaines Étapes

1. **Valider stratégie avec utilisateur** (options 1-3)
2. **Exécuter archivage Phase 1** (gain immédiat ~23k tokens)
3. **Créer INDEX.md sessions** pour navigation rapide
4. **Monitorer consommation tokens** après optimisation

---

**Guide créé:** 2025-10-14
**Auteur:** Claude Code
**Status:** ✅ Prêt à appliquer après validation utilisateur
