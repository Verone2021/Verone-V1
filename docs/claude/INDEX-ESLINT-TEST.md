# INDEX : Documentation Test Workflow ESLint

**Date** : 2026-02-01
**Status** : Documentation complète validation workflow fix-warnings.md

---

## 📚 Fichiers Créés (Vue d'Ensemble)

| Fichier                              | Type                   | Usage              | Temps Lecture |
| ------------------------------------ | ---------------------- | ------------------ | ------------- |
| `QUICKSTART-TEST-ESLINT.md`          | Guide rapide           | ⭐ **START HERE**  | 2 min         |
| `PROMPT-TEST-ESLINT.txt`             | Prompt copier-coller   | Test sur 1 fichier | 30 sec        |
| `PROMPT-CONTINUE-ESLINT.txt`         | Prompt copier-coller   | Après test validé  | 30 sec        |
| `REPONSES-7-QUESTIONS-ESLINT.md`     | FAQ                    | Réponses rapides   | 5 min         |
| `eslint-test-workflow-validation.md` | Documentation complète | Toutes garanties   | 15 min        |
| `INDEX-ESLINT-TEST.md`               | Ce fichier             | Navigation         | 2 min         |

---

## 🚀 Pour Démarrer (3 étapes)

### Étape 1 : Lire le Guide Rapide (2 min)

```bash
cat docs/claude/QUICKSTART-TEST-ESLINT.md
```

**Contenu** :

- ✅ Checklist avant de lancer
- ✅ Commandes de vérification
- ✅ Que faire si test échoue

### Étape 2 : Copier le Prompt (30 sec)

```bash
cat docs/claude/PROMPT-TEST-ESLINT.txt
```

**Copier-coller EXACTEMENT dans Claude.**

### Étape 3 : Vérifier Résultat (5 min)

**Commandes** :

```bash
# 1. Fichier à 0 warnings
pnpm --filter @verone/back-office eslint --quiet <file.tsx>

# 2. Commit format correct
git log --oneline -1

# 3. Baseline ratchet initialisée
cat .eslint-baseline.json
```

**Si ✅ SUCCÈS** : Utiliser `PROMPT-CONTINUE-ESLINT.txt`

**Si ❌ ÉCHEC** : Consulter `eslint-test-workflow-validation.md` section "Que Faire si Test Échoue"

---

## 📖 Documentation par Cas d'Usage

### Cas 1 : Je veux démarrer MAINTENANT

**Fichier** : `QUICKSTART-TEST-ESLINT.md`

**Temps** : 2 minutes lecture + 5 minutes setup

---

### Cas 2 : J'ai des questions spécifiques

**Fichier** : `REPONSES-7-QUESTIONS-ESLINT.md`

**Questions couvertes** :

1. Quel prompt exact ?
2. Claude va établir un plan ?
3. Claude va consulter MCP Context7 ?
4. Claude va utiliser MCP Serena ?
5. Claude va lire CLAUDE.md ?
6. Claude va suivre le workflow ?
7. Peut-on tester avant 2666 warnings ?

---

### Cas 3 : Je veux TOUTES les garanties

**Fichier** : `eslint-test-workflow-validation.md`

**Contenu** :

- ✅ Déroulement étape par étape (7 phases)
- ✅ Outils attendus (Context7, Serena, Edit, Bash)
- ✅ Output attendu par phase
- ✅ Checklist validation post-test
- ✅ Scénarios échec + solutions
- ✅ Prompts suivants (après test validé)

**Temps** : 15 minutes lecture complète

---

### Cas 4 : Le test a échoué, que faire ?

**Fichier** : `eslint-test-workflow-validation.md`

**Section** : "🚨 Que Faire si Test Échoue ?"

**Scénarios couverts** :

- ❌ Claude n'a pas lu fix-warnings.md
- ❌ Claude ne consulte pas Context7
- ❌ Commit bloqué par hook ratchet
- ❌ Correction partielle (pas tous warnings)

---

### Cas 5 : Test réussi, je continue

**Fichier** : `PROMPT-CONTINUE-ESLINT.txt`

**Contenu** :

```
Pattern identique :
1. Discovery → 2. Analysis → 3. Planning → 4. Implementation → 5. Validation

Priorisation : Simple → Moyen → Complexe

UN commit par fichier complet.

Objectif : ~50 fichiers en 2 jours.
```

---

## 🎯 Workflow Complet (Vue d'Ensemble)

```
┌─────────────────────────────────────────┐
│  1. Lire QUICKSTART-TEST-ESLINT.md     │ (2 min)
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  2. Copier PROMPT-TEST-ESLINT.txt       │ (30 sec)
│     → Coller dans Claude                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  3. Claude exécute (20-30 min)          │
│     - Lit fix-warnings.md               │
│     - Valide checklist                  │
│     - Context7 (pattern officiel)       │
│     - Serena (patterns projet)          │
│     - Planning                          │
│     - Implementation (1 fichier)        │
│     - Self-verify                       │
│     - Commit + hook ratchet             │
└─────────────┬───────────────────────────┘
              │
              ▼
         Test réussi ?
              │
      ┌───────┴───────┐
      │               │
     OUI             NON
      │               │
      ▼               ▼
┌─────────────┐  ┌──────────────────────┐
│ PROMPT-     │  │ eslint-test-         │
│ CONTINUE-   │  │ workflow-validation  │
│ ESLINT.txt  │  │ → Section "Échec"    │
└─────────────┘  └──────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  4. Correction massive (1-2 jours)      │
│     - 50 fichiers × 20 min              │
│     - Workflow 5 phases par fichier     │
│     - Self-verify systématique          │
│     - Hook ratchet garantit qualité     │
└─────────────────────────────────────────┘
```

---

## 📊 Références Documentation Source

### Documentation Interne

| Fichier                                                   | Lignes  | Contenu                  |
| --------------------------------------------------------- | ------- | ------------------------ |
| `.claude/commands/fix-warnings.md`                        | 434     | Workflow expert 5 phases |
| `CLAUDE.md`                                               | 328-365 | Règles ESLint strictes   |
| `.serena/memories/eslint-workflow-enforcement-2026-02.md` | 220     | Contexte découverte      |

### Documentation Externe

- [Anthropic - Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Documentation-first approach
- [Anthropic - Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) - Self-verification
- [Addy Osmani - LLM Workflow 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) - AI-assisted 193 files in minutes

---

## 🔍 Recherche Rapide (Mots-Clés)

| Je cherche...          | Fichier                                                   | Section                     |
| ---------------------- | --------------------------------------------------------- | --------------------------- |
| Prompt exact           | `PROMPT-TEST-ESLINT.txt`                                  | Tout le fichier             |
| Commandes vérification | `QUICKSTART-TEST-ESLINT.md`                               | Étape 4                     |
| Outils attendus        | `eslint-test-workflow-validation.md`                      | Déroulement Étape par Étape |
| Scénarios échec        | `eslint-test-workflow-validation.md`                      | Que Faire si Test Échoue    |
| Réponses rapides       | `REPONSES-7-QUESTIONS-ESLINT.md`                          | Tableau Récapitulatif       |
| Workflow 5 phases      | `.claude/commands/fix-warnings.md`                        | Lignes 53-210               |
| Règles strictes        | `CLAUDE.md`                                               | Lignes 344-352              |
| Contexte découverte    | `.serena/memories/eslint-workflow-enforcement-2026-02.md` | Tout le fichier             |

---

## 💡 TL;DR

**Objectif** : Valider que Claude suivra le workflow expert AVANT correction massive 2666 warnings.

**Fichiers créés** : 6 (QUICKSTART, 2 prompts, FAQ, documentation complète, INDEX)

**Temps utilisateur** : 5 minutes (lire + copier-coller)

**Temps Claude** : 20-30 minutes (test sur 1 fichier)

**Garanties** : 7 questions → 7 réponses ✅ OUI avec preuves

**Workflow validé** : Discovery → Analysis → Planning → Implementation → Validation

**Temps correction complète** : 1-2 jours (50 fichiers × 20 min) vs 4-5 jours (ad-hoc)

---

**⭐ START HERE** : `docs/claude/QUICKSTART-TEST-ESLINT.md`

**Dernière mise à jour** : 2026-02-01
