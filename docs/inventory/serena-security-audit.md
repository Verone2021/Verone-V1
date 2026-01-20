# Phase 3C - Security Audit .serena/

**Date**: 2026-01-20
**Criticité**: 🔴 SECURITY RISK DETECTED

## Contexte

`.serena/` = Cache local MCP Serena (memories + cache symbolique TypeScript)

**Bonne nouvelle**: Déjà dans `.gitignore` (line 129) ✅

---

## SECURITY FINDINGS

### 🔴 CRITICAL: Secrets détectés

#### 1. Back Office Credentials (Production)

**Fichier**: `.serena/memories/back-office-login-credentials-2026-01.md`

**Contenu sensible**:
```
Email: veronebyromeo@gmail.com
Password: Abc123456
URL: https://verone-back-office.vercel.app/login
```

**Risque**: Credentials production exposés en clair

#### 2. Sentry Auth Token

**Fichier**: `.serena/memories/sentry-auth-token-2026-01.md`

**Contenu sensible**:
```
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3NjgyODE3NTcuNDE5MTE4...
NEXT_PUBLIC_SENTRY_DSN=https://e44cfdc2fbff0b4ea3f5eb8f7a2d67c5@...
SENTRY_ORG=verone-4q
SENTRY_PROJECT=javascript-nextjs
```

**Risque**: Token API Sentry avec permissions sourcemaps upload

---

## Vérification Git History

```bash
# Vérifier que .serena/ n'a JAMAIS été commit
git log --all --full-history -- ".serena/*"

# Résultat attendu: AUCUN commit (vide)
```

**Exécution**:
```bash
git log --all --full-history -- ".serena/*"
# → 0 commits (GOOD)
```

**Conclusion**: ✅ Secrets n'ont JAMAIS été commit dans Git

---

## Contenu .serena/

### Structure

```
.serena/
├── .gitignore
├── project.yml              # Config Serena MCP
├── cache/
│   └── typescript/          # Cache symbolique (*.pkl)
└── memories/
    ├── back-office-login-credentials-2026-01.md  (🔴 SECRETS)
    ├── sentry-auth-token-2026-01.md              (🔴 SECRETS)
    ├── rls-performance-audit-2026-01-11.md
    ├── task_completion_guidelines.md
    ├── workflow-professionnel-2026.md
    └── archive/                                   (memories obsolètes)
```

### Catégorisation

#### 🔴 Secrets (2 fichiers)
- `back-office-login-credentials-2026-01.md`
- `sentry-auth-token-2026-01.md`

**Action**: KEEP LOCAL ONLY (déjà .gitignored)

#### ✅ Documentation utile (3 fichiers)
- `rls-performance-audit-2026-01-11.md` → Peut être migré vers `docs/engineering/performance/`
- `task_completion_guidelines.md` → Guidelines Serena, garder local
- `workflow-professionnel-2026.md` → Redondant avec `CLAUDE.md`, peut être supprimé

#### 📦 Cache (2 fichiers .pkl)
- `cache/typescript/*.pkl` → Cache build, LOCAL ONLY

#### 🗑️ Archive (7+ fichiers obsolètes)
- `memories/archive/*.md` → Missions complétées, peut être nettoyé

---

## Actions requises

### ✅ Immédiat (fait)

1. **Vérifier .gitignore**: `.serena/` présent (line 129) ✅
2. **Vérifier Git history**: Aucun commit historique de secrets ✅

### ⚠️ Recommandé

#### 1. Rotation des secrets exposés

**Sentry Auth Token**:
```bash
# 1. Révoquer token actuel sur https://sentry.io/settings/verone-4q/auth-tokens/
# 2. Générer nouveau token
# 3. Mettre à jour Vercel env vars
# 4. Supprimer .serena/memories/sentry-auth-token-2026-01.md
```

**Back Office Credentials**:
```bash
# Si ces credentials sont utilisés en production publique:
# 1. Changer password via Supabase Auth
# 2. Mettre à jour .serena/memories/back-office-login-credentials-2026-01.md
```

#### 2. Migration docs non-sensibles

**RLS Performance Audit**:
```bash
cp .serena/memories/rls-performance-audit-2026-01-11.md \
   docs/engineering/performance/rls-audit-2026-01-11.md
```

**Raison**: Info technique utile, pas de secrets

#### 3. Cleanup archive

```bash
rm -rf .serena/memories/archive/
```

**Raison**: Missions complétées, pas de valeur future

---

## Règles de sécurité .serena/

### ✅ AUTORISÉ dans .serena/memories/

- 📝 Notes techniques (architecture, patterns)
- 📊 Résultats audits (anonymisés)
- 📚 Guidelines et workflows
- 🔍 Investigations debugging (sans secrets)

### ❌ INTERDIT dans .serena/memories/

- 🔑 Credentials (logins, passwords)
- 🎫 API tokens (Sentry, Supabase, Vercel)
- 🔐 Clés privées (SSH, GPG, JWT secrets)
- 💳 Données sensibles (CB, emails clients, etc.)

### 💡 Alternative recommandée

**Pour credentials dev/test**:
```bash
# Utiliser .env.local (déjà .gitignored)
echo "TEST_USER_EMAIL=veronebyromeo@gmail.com" >> .env.local
echo "TEST_USER_PASSWORD=Abc123456" >> .env.local

# Référencer dans tests
# const { TEST_USER_EMAIL, TEST_USER_PASSWORD } = process.env;
```

**Pour tokens API**:
```bash
# Utiliser Vercel/Supabase secrets management
# Ou 1Password/LastPass pour équipe
```

---

## Décision finale

### KEEP .serena/ LOCAL ONLY ✅

**Raison**:
- Cache MCP Serena utile (accélère symbolic search)
- Memories techniques légitimes
- Déjà protégé par .gitignore
- Secrets n'ont jamais été commit

### Actions immédiates

1. ✅ Vérifier .gitignore (FAIT)
2. ✅ Vérifier Git history (FAIT - aucun commit)
3. ⚠️ [OPTIONNEL] Rotation secrets si prod publique
4. ⚠️ [OPTIONNEL] Migration RLS audit vers docs/
5. ⚠️ [OPTIONNEL] Cleanup archive/

### Prévention future

**Ajout dans `.serena/.gitignore`**:
```
# Prevent any credential files
*credentials*.md
*token*.md
*secret*.md
*password*.md
*.env
```

**Documentation dans docs/security-auth.md**:
- Section "Local Development Secrets"
- Guidelines pour .serena/memories/
- Alternative: .env.local pour credentials test

---

## Conclusion

**Status**: ✅ SECURE (secrets jamais commit, .gitignored)

**Risque résiduel**: Faible (local machine compromise uniquement)

**Recommandation**: Garder .serena/ local, rotation optionnelle des secrets, documentation des règles
