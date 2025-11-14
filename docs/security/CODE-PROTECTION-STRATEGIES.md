# 🔒 Guide Protection Code contre Modifications IA

**Date création** : 2025-10-10
**Version** : 1.0
**Objectif** : Protéger code critique Vérone contre modifications accidentelles par agents IA

---

## 🎯 POURQUOI PROTÉGER LE CODE ?

### Risques Identifiés

1. **Modifications Accidentelles** : Agent IA modifie fichier critique en voulant "optimiser"
2. **Regressions Invisibles** : Changement subtil casse fonctionnalité existante
3. **Security Bypasses** : Vulnerabilités découvertes permettent bypass restrictions
4. **Over-Engineering** : Agent refactorise code stable sans bénéfice réel

### Code Critique à Protéger (Vérone)

**Priorité CRITIQUE** :

- `apps/back-office/apps/back-office/src/lib/supabase/server.ts` (configuration Supabase SSR)
- `.env`, `.env.local`, `.env.production` (secrets)
- `supabase/migrations/**` (schéma BDD)
- `manifests/business-rules/**` (règles métier validées)

**Priorité HAUTE** :

- `apps/back-office/apps/back-office/src/lib/supabase/client.ts` (client Supabase)
- `apps/back-office/apps/back-office/src/hooks/use-supabase-*.tsx` (hooks critiques)
- `MEMORY-BANK/sessions/**` (rapports validés)
- `docs/architecture/**` (architecture validée)

**Priorité MOYENNE** :

- Components UI stabilisés après tests complets
- Scripts de production (`scripts/deploy-*.ts`)
- Configuration CI/CD (`.github/workflows/`)

---

## 🛡️ 5 STRATÉGIES DE PROTECTION

---

## ⭐⭐⭐⭐⭐ STRATÉGIE #1 : `settings.json` permissions.deny

**Niveau Protection** : **MAXIMUM** ✅
**Fiabilité** : **TRÈS HAUTE** (blocage technique complet)
**Effort Setup** : **FAIBLE** (10 minutes)

### 🎯 Principe

Utiliser le système de permissions intégré de Claude Code pour **bloquer complètement** l'accès (lecture + écriture) à certains fichiers ou dossiers.

### 📋 Configuration

**Fichier** : `.claude/settings.json`

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Edit(./.env*)",
      "Read(./apps/back-office/src/lib/supabase/server.ts)",
      "Edit(./apps/back-office/src/lib/supabase/server.ts)",
      "Read(./apps/back-office/src/lib/supabase/client.ts)",
      "Edit(./apps/back-office/src/lib/supabase/client.ts)",
      "Edit(./supabase/migrations/**)",
      "Read(./supabase/migrations/**)",
      "Edit(./manifests/business-rules/**)",
      "Read(./config/credentials.json)",
      "Edit(./MEMORY-BANK/sessions/**)",
      "Edit(./scripts/deploy-*.ts)",
      "Edit(./.github/workflows/**)"
    ]
  }
}
```

### 🔑 Syntaxe Patterns

| Pattern                | Signification                             | Exemple                 |
| ---------------------- | ----------------------------------------- | ----------------------- |
| `Read(./path/file.ts)` | Bloque lecture fichier exact              | `Read(./.env)`          |
| `Edit(./path/file.ts)` | Bloque écriture fichier exact             | `Edit(./server.ts)`     |
| `Read(./path/**)`      | Bloque lecture récursive dossier          | `Read(./migrations/**)` |
| `Edit(./path/*.ts)`    | Bloque écriture tous .ts du dossier       | `Edit(./scripts/*.ts)`  |
| `.env*`                | Wildcard pour .env.local, .env.prod, etc. | `Read(./.env*)`         |

### ✅ Avantages

- ✅ **Blocage technique complet** : Impossible de read/edit même en contournement
- ✅ **Granularité fine** : Protège fichiers spécifiques ou dossiers entiers
- ✅ **Performance** : Aucun impact, vérification au niveau système
- ✅ **Maintenance simple** : Un seul fichier `.claude/settings.json` à gérer

### ⚠️ Limitations

- ⚠️ Nécessite Claude Code ≥ 0.9.0 (feature récente)
- ⚠️ Si agent a vraiment besoin lire fichier protégé (debug), il ne pourra pas
- ⚠️ Pas de "read-only mode" (c'est tout ou rien : deny read ET edit)

### 📝 Exemple Vérone Production

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Edit(./.env*)",
      "Read(./apps/back-office/src/lib/supabase/server.ts)",
      "Edit(./apps/back-office/src/lib/supabase/server.ts)",
      "Edit(./supabase/migrations/**)",
      "Edit(./manifests/business-rules/**)",
      "Edit(./MEMORY-BANK/sessions/**)"
    ],
    "allow": [
      "Read(./src/**/*.tsx)",
      "Edit(./apps/back-office/src/components/**/*.tsx)",
      "Read(./docs/**/*.md)"
    ]
  }
}
```

### 🚀 Activation

```bash
# 1. Créer fichier si n'existe pas
mkdir -p .claude
touch .claude/settings.json

# 2. Copier configuration ci-dessus

# 3. Vérifier activation
# Claude affichera "Permission denied" si tente accéder fichier bloqué
```

**Recommandation** : ⭐⭐⭐⭐⭐ **UTILISER EN PRIORITÉ** pour code critique production

---

## ⭐⭐⭐☆☆ STRATÉGIE #2 : `.gitignore` Respect

**Niveau Protection** : **MOYEN** ⚠️
**Fiabilité** : **PARTIELLE** (bugs connus)
**Effort Setup** : **TRÈS FAIBLE** (déjà existant)

### 🎯 Principe

Claude Code **respecte par défaut** les fichiers listés dans `.gitignore`. Ils sont exclus des opérations `Read()` et `Edit()`.

### 📋 Configuration

**Fichier** : `.gitignore` (déjà existant dans projet)

```gitignore
# Secrets (déjà protégés)
.env
.env.local
.env.production

# Build artifacts
.next/
out/
build/

# Dossiers à exclure de l'agent IA
node_modules/
.turbo/
.vercel/

# Fichiers temporaires
*.log
*.tmp
.DS_Store
```

### ✅ Avantages

- ✅ **Déjà en place** : Aucune configuration supplémentaire
- ✅ **Standard Git** : Familier pour tous développeurs
- ✅ **Performance** : node_modules/ déjà exclu (énorme gain)

### ⚠️ Limitations CRITIQUES

**🚨 BUG REPORTÉ (GitHub Issue #1373)** :

```
Read() bypasses .claude/claude.json and .gitignore restrictions
for ignored files
```

Certaines versions Claude Code permettent à `Read()` de lire fichiers `.gitignore` malgré la documentation officielle affirmant le contraire.

**Verdict** : ⚠️ **NE PAS UTILISER SEUL** - Toujours combiner avec Stratégie #1

---

## ⭐⭐⭐☆☆ STRATÉGIE #3 : CLAUDE.md Instructions

**Niveau Protection** : **FAIBLE** (compliance-based)
**Fiabilité** : **DÉPEND DE L'AGENT** ⚠️
**Effort Setup** : **TRÈS FAIBLE** (10 minutes)

### 🎯 Principe

Documenter explicitement dans `CLAUDE.md` les fichiers **interdits de modification** avec explications du pourquoi.

### 📋 Configuration

**Fichier** : `CLAUDE.md` (section ajoutée)

```markdown
## 🔒 CODE PROTECTION RULES

### ❌ INTERDIT ABSOLU - NE JAMAIS MODIFIER

**Fichiers critiques production** :

- `apps/back-office/apps/back-office/src/lib/supabase/server.ts` : Configuration Supabase SSR validée (commit 005b68b)
  - Raison : Modifications cassent auth Admin API
  - Si besoin modification : Demander approbation utilisateur AVANT

- `.env*` : Variables environnement et secrets
  - Raison : Sécurité application
  - Jamais lire, jamais modifier, jamais logger

- `supabase/migrations/**` : Schéma BDD production
  - Raison : Modifications irréversibles en production
  - Migrations uniquement via workflow validé

- `manifests/business-rules/**` : Règles métier validées
  - Raison : Documentation référence après validation utilisateur
  - Édition uniquement après confirmation explicite

### ⚠️ MODIFICATION AVEC PRÉCAUTIONS

**Fichiers stables nécessitant review** :

- `apps/back-office/apps/back-office/src/lib/supabase/client.ts` : Demander avant modification
- `MEMORY-BANK/sessions/**` : Rapports sessions validés (append-only)
- `scripts/deploy-*.ts` : Scripts production sensibles

### ✅ MODIFICATION LIBRE

**Fichiers non critiques** :

- `apps/back-office/apps/back-office/src/components/**/*.tsx` : Components UI (sauf validés)
- `docs/guides/**` : Documentation guides
- `TASKS/**` : Task management files
```

### ✅ Avantages

- ✅ **Documentation explicite** : Explique le "pourquoi" aux développeurs humains aussi
- ✅ **Contexte métier** : Agent comprend raison protection (pas juste règle arbitraire)
- ✅ **Flexible** : Peut adapter comportement selon contexte

### ⚠️ Limitations

- ⚠️ **Pas de garantie technique** : Agent peut ignorer (accidentellement ou jailbreak)
- ⚠️ **Dépend compliance** : Si agent mal configuré, instructions ignorées
- ⚠️ **Pas de blocage** : Avertissement uniquement, pas enforcement

**Verdict** : ⭐⭐⭐☆☆ **UTILISER EN COMPLÉMENT** de Stratégie #1 (documentation + blocage technique)

---

## ⭐⭐⭐⭐☆ STRATÉGIE #4 : Git Worktrees Isolation

**Niveau Protection** : **TRÈS HAUTE** (isolation complète)
**Fiabilité** : **MAXIMALE** ✅
**Effort Setup** : **MOYEN** (20 minutes apprentissage)

### 🎯 Principe

Créer des **branches Git worktrees séparées** pour expérimentations risquées. Code production (`main`) reste intact physiquement dans dossier différent.

### 📋 Configuration

```bash
# 1. Créer worktree pour tests agent IA
git worktree add ../verone-ai-sandbox feature/ai-experiments

# 2. Agent travaille dans ../verone-ai-sandbox/
cd ../verone-ai-sandbox/

# 3. Production reste dans ../verone-back-office-V1/ (intacte)
# Impossible pour agent de modifier production depuis worktree
```

### 🔄 Workflow Type

**Scenario : Tester refactoring risqué**

```bash
# 1. Créer worktree sandbox
git worktree add ../verone-sandbox feature/refactor-dangerous

# 2. Lancer Claude Code dans sandbox
cd ../verone-sandbox/
claude-code

# 3. Agent fait modifications (tout autorisé ici, c'est un sandbox)
# Modifications affectent uniquement ../verone-sandbox/

# 4. Review modifications
git diff main

# 5a. Si bon : Merge vers main
git checkout main
git merge feature/refactor-dangerous

# 5b. Si mauvais : Supprimer worktree complet
cd ..
git worktree remove verone-sandbox
git branch -D feature/refactor-dangerous
# Production jamais touchée !
```

### ✅ Avantages

- ✅ **Isolation physique complète** : Impossible modifier production (dossiers séparés)
- ✅ **Rollback instantané** : Supprimer worktree = suppression complète expérience
- ✅ **Parallélisation** : Production continue pendant expérimentations
- ✅ **Git natif** : Feature standard Git, pas de tooling custom

### ⚠️ Limitations

- ⚠️ **Complexité mentale** : Développeurs doivent comprendre worktrees
- ⚠️ **Espace disque** : Duplique codebase (worktree ≈ clone local)
- ⚠️ **Pas automatique** : Développeur doit penser créer worktree avant task risquée

**Verdict** : ⭐⭐⭐⭐☆ **EXCELLENT pour tests expérimentaux** (refactoring, nouvelles architectures)

---

## 📊 TABLEAU COMPARATIF DES 4 STRATÉGIES

| Stratégie             | Protection | Fiabilité  | Effort      | UX Dev    | Recommandation         |
| --------------------- | ---------- | ---------- | ----------- | --------- | ---------------------- |
| #1 settings.json deny | ⭐⭐⭐⭐⭐ | Très haute | Faible      | Excellent | ✅ PRIORITÉ 1          |
| #2 .gitignore         | ⭐⭐⭐☆☆   | Partielle  | Très faible | Excellent | ⚠️ Backup uniquement   |
| #3 CLAUDE.md          | ⭐⭐⭐☆☆   | Variable   | Très faible | Excellent | ✅ Complément #1       |
| #4 Git Worktrees      | ⭐⭐⭐⭐☆  | Maximale   | Moyen       | Bon       | ✅ Tests expérimentaux |

---

## 🎯 STRATÉGIE RECOMMANDÉE VÉRONE

### 🥇 Configuration Standard (Développement)

**Multi-layer Defense** :

```
Layer 1 (Technique) : settings.json permissions.deny
  ↓ Bloque complètement accès fichiers critiques

Layer 2 (Documentation) : CLAUDE.md instructions
  ↓ Explique pourquoi + contexte métier

Layer 3 (Backup) : .gitignore respect
  ↓ Protection redondante (même si bugs connus)
```

**Fichiers protégés** :

- `.env*` (secrets)
- `apps/back-office/apps/back-office/src/lib/supabase/server.ts` (config critique)
- `supabase/migrations/**` (schéma BDD)
- `manifests/business-rules/**` (règles validées)

### 🥈 Configuration Avancée (Tests Risqués)

**Ajout Git Worktrees** :

```bash
# Créer sandbox pour refactoring expérimental
git worktree add ../verone-refactor feature/experimental-refactor

# Agent travaille dans sandbox
cd ../verone-refactor/
# Modifications autorisées ici (c'est un sandbox)

# Production ../verone-back-office-V1/ reste intacte
```

### 🥉 Configuration Paranoid (Production Critique)

**Container Read-Only** :

Si Vérone devient critique (client Fortune 500, données santé, finance) :

- Agent ne peut QUE lire + suggérer code
- Modifications appliquées manuellement après review
- Environnement isolé avec permissions restrictives

---

## 🚀 MISE EN PLACE POUR VÉRONE

### Étape 1 : Protection Immédiate (10 minutes)

```bash
# 1. Créer settings.json
mkdir -p .claude
touch .claude/settings.json

# 2. Copier configuration (voir section suivante)
# 3. Ajouter instructions CLAUDE.md (voir Stratégie #3)
# 4. Vérifier .gitignore déjà en place
```

### Étape 2 : Configuration settings.json Production

Voir fichier `.claude/settings.example.json` fourni dans ce repository.

### Étape 3 : Validation Protection

```bash
# Test : Demander à Claude de modifier fichier protégé
# Attendu : "Permission denied" ou équivalent

# Exemple test :
"Claude, modifie apps/back-office/src/lib/supabase/server.ts pour ajouter un log"
# Résultat attendu : Refus avec message permission denied
```

---

## 📚 SOURCES & RECHERCHE

### Documentation Officielle

1. **Anthropic Claude Code Settings**
   - URL : https://docs.claude.com/en/docs/claude-code/settings
   - Détails : Configuration permissions.deny, syntaxe patterns

2. **Anthropic Best Practices**
   - URL : https://www.anthropic.com/engineering/claude-code-best-practices
   - Détails : Allowlist approach, safeguards, CLAUDE.md guidelines

### Bugs & Issues Connus

3. **GitHub Issue #1373**
   - Titre : "Read() bypasses .gitignore restrictions"
   - Status : Reporté, non résolu toutes versions
   - Impact : .gitignore non fiable à 100%

4. **GitHub Issue #1304**
   - Titre : "Need for dedicated .claudeignore file"
   - Status : Feature request (community demand)
   - Context : .gitignore insuffisant projets multi-platform

### Security Research

5. **Cymulate Blog - CVE-2025-54795**
   - Titre : "InversePrompt: Turning Claude Against Itself"
   - Finding : Prompt injections permettent bypass restrictions
   - Mitigation : Human-in-the-loop + permissions strictes

6. **Backslash Security**
   - Titre : "Claude Code Security Best Practices"
   - Recommendations : Disable auto-run, container isolation, permissions granulaires

### Community Best Practices

7. **Reddit r/ClaudeAI**
   - Topic : Senior developers code protection strategies
   - Consensus : Multi-layer defense (deny + documentation + isolation)

8. **Stack Overflow**
   - Question : "How to protect production code from AI modifications?"
   - Top Answer : Git worktrees + read-only containers pour code critique

---

## ✅ CHECKLIST PROTECTION COMPLÈTE

### Niveau 1 : Protection Basique (MINIMUM)

- [ ] `.claude/settings.json` créé avec permissions.deny
- [ ] Fichiers critiques listés dans deny (server.ts, .env, migrations)
- [ ] Section "CODE PROTECTION RULES" ajoutée à CLAUDE.md
- [ ] .gitignore vérifié (secrets déjà exclus)

### Niveau 2 : Protection Avancée (RECOMMANDÉ)

- [ ] Git worktrees documenté dans workflow équipe
- [ ] Scripts helper créés (`create-sandbox.sh`, etc.)
- [ ] Tests validation protection effectués
- [ ] Documentation partagée avec équipe

### Niveau 3 : Protection Paranoid (PRODUCTION CRITIQUE)

- [ ] Environnement isolé avec permissions restrictives
- [ ] Network isolation validée (no internet)
- [ ] User permissions restrictives (non-root)
- [ ] Audit trail outputs agent versionnés
- [ ] Compliance documentation générée (SOC2, ISO27001)

---

## 🎓 LEÇONS APPRISES

### ✅ Best Practices Validées

1. **Defense in Depth** : Jamais une seule protection, toujours multi-couches
2. **Documentation + Technique** : CLAUDE.md explique, settings.json enforce
3. **Test Validation** : Toujours tester protection (essayer bypass volontairement)
4. **Progressive Enhancement** : Commencer simple (#1), ajouter layers si besoin

### ⚠️ Pièges à Éviter

1. **❌ Dépendre uniquement .gitignore** : Bugs connus, pas fiable
2. **❌ Oublier documenter "pourquoi"** : Instructions sans contexte = ignorées
3. **❌ Over-engineering prématuré** : Container read-only pas nécessaire dès jour 1
4. **❌ Pas tester protection** : Assumer que ça marche sans validation = risqué

---

## 🚨 EN CAS DE MODIFICATION ACCIDENTELLE

### Procédure Récupération

```bash
# 1. STOP agent immédiatement
# Ctrl+C ou kill process Claude Code

# 2. Vérifier dégâts
git status
git diff

# 3a. Si modifications non commitées : Rollback Git
git checkout -- apps/back-office/src/lib/supabase/server.ts

# 3b. Si commit déjà fait : Revert commit
git revert HEAD
# OU restaurer version spécifique
git checkout 005b68b -- apps/back-office/src/lib/supabase/server.ts

# 4. Renforcer protection
# Ajouter fichier modifié à settings.json deny

# 5. Documenter incident
# MEMORY-BANK/incidents/[DATE]-accidental-modification.md

# 6. Post-mortem
# Pourquoi protection n'a pas marché ?
# Comment améliorer pour éviter récurrence ?
```

---

**Guide créé** : 2025-10-10
**Version** : 1.0
**Sources** : Anthropic Docs + GitHub Issues + Security Research + Community Best Practices

_Vérone Back Office - Secure AI-Assisted Development Excellence_
