# DEV_READINESS.md - Audit Environnement Développement

**Date** : 2025-12-15
**Scope** : Vérone V1 Monorepo (Back-office + LinkMe)
**Mode** : READ-ONLY Audit

---

## 1. Ce qui est en place

### Tooling

| Outil      | Version | Status            | Preuve                                                     |
| ---------- | ------- | ----------------- | ---------------------------------------------------------- |
| Claude CLI | 2.0.69  | ✅ Installé       | `which claude` → `/Users/romeodossantos/.local/bin/claude` |
| GitHub CLI | N/A     | ✅ OAuth keychain | `gh auth status` → Verone2021 (keyring)                    |
| Node.js    | N/A     | ✅                | Turborepo fonctionne                                       |
| pnpm       | N/A     | ✅                | Workspace monorepo actif                                   |

### GitHub Auth Compliance

**Status** : ✅ CONFORME

```bash
# Preuve : gh auth status
github.com
  ✓ Logged in to github.com account Verone2021 (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'

# Preuve : Pas de tokens env
env | grep -E 'GH_TOKEN|GITHUB_TOKEN' → (vide)

# Preuve : Git credential helper
credential.helper=osxkeychain
credential.https://github.com.helper=!/opt/homebrew/bin/gh auth git-credential
```

**Variables Claude CLI (session uniquement)** :

- `CLAUDE_CODE_SSE_PORT=28635`
- `CLAUDE_CODE_ENTRYPOINT=cli`
- `CLAUDECODE=1`

→ Ce ne sont PAS des conflits d'auth, ce sont des variables de session Claude Code normales.

### Repo Doctor Results

**Script** : `./scripts/repo-doctor.sh`
**Status** : ✅ OK AVEC WARNINGS (0 erreurs, 7 warnings)

```
==============================================
  REPO DOCTOR - Diagnostic Verone Monorepo
==============================================

[0/8] Tokens environnement     ✅ Aucun token (OAuth keychain actif)
[1/8] Auth GitHub              ✅ Authentifié comme: Verone2021
[2/8] Branche courante         ✅ Sur branche principale (main)
[3/8] Commits non poussés      ✅ Tous les commits sont poussés
[4/8] Changements non commités ✅ Working directory propre
[5/8] Branches locales         ⚠️ 7 branches mergées à nettoyer
[6/8] Branches remote          ⚠️ 5 branches PRs ouvertes
[7/8] Scan anti-secrets        ✅ Aucun secret détecté
[8/8] .env.example             ⚠️ Valeurs suspectes (mais non-secrets)
```

**Warnings détaillés** :

| Warning                    | Impact                | Action                                   |
| -------------------------- | --------------------- | ---------------------------------------- |
| 7 branches locales mergées | Pollution locale      | `git branch -d <branch>` après merge PRs |
| 5 branches remote          | Normal (PRs ouvertes) | Aucune action                            |
| .env.example valeurs       | Emails/URLs exemples  | Documenter comme "valeurs démo"          |

---

## 2. Governance & Deploy Alignment

### GitHub Rulesets (État Réel)

**Source** : `gh api repos/Verone2021/Verone-V1/rulesets/11086775`

```json
{
  "name": "Protect main",
  "enforcement": "active",
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": { "required_approving_review_count": 0 }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          { "context": "Vercel – verone-back-office" },
          { "context": "Vercel – linkme" }
        ]
      }
    }
  ]
}
```

**Status Checks Requis** :

- ✅ `Vercel – verone-back-office` (SUCCESS sur toutes PRs)
- ✅ `Vercel – linkme` (SUCCESS sur toutes PRs)

### Documentation vs Réalité

| Aspect         | docs/governance/GITHUB-RULESETS.md (main) | État Réel                                         |
| -------------- | ----------------------------------------- | ------------------------------------------------- |
| Status checks  | "Vercel" (mono-app)                       | `Vercel – verone-back-office` + `Vercel – linkme` |
| Apps déployées | 1 (back-office)                           | 2 (back-office + linkme)                          |

**Gap** : La doc sur main est OBSOLÈTE. PR #21 corrige cela.

### Vercel Configuration

**Root** (`vercel.json`) :

```json
{
  "name": "verone-back-office",
  "framework": "nextjs",
  "buildCommand": "turbo run build --filter=@verone/back-office",
  "outputDirectory": "apps/back-office/.next"
}
```

**LinkMe** (`apps/linkme/vercel.json`) :

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@verone/linkme",
  "outputDirectory": ".next"
}
```

**Deployment Flow** :

1. Push/Merge sur main
2. Vercel détecte changements
3. Build Turborepo (turbo run build --filter=...)
4. Deploy preview ou production
5. Status check émis (Vercel – {project-name})

---

## 3. Risques / Dettes

### Risques Identifiés

| #   | Risque                    | Gravité | Impact                | Mitigation                            |
| --- | ------------------------- | ------- | --------------------- | ------------------------------------- |
| 1   | Pre-push hook timeout     | Moyen   | Bloque push docs-only | Issue #22 créée, déplacer check en CI |
| 2   | 7 branches locales stales | Bas     | Pollution locale      | Cleanup après merge PRs               |
| 3   | Doc rulesets obsolète     | Moyen   | Confusion             | PR #21 à merger                       |
| 4   | GitHub Actions FAILURE    | Info    | CI non-bloquant       | Vercel checks passent                 |

### GitHub Actions Status

**Observation** : Toutes les PRs ont des checks GitHub Actions en FAILURE (typescript-check, Audit Code Quality, Quality Gates) mais les checks Vercel sont SUCCESS.

**Analyse** :

- Les checks Vercel (déploiement) sont les seuls requis par le ruleset
- Les checks GitHub Actions sont informatifs mais non-bloquants
- Les PRs docs-only peuvent être mergées si Vercel passe

---

## 4. Ce qui manque avant "mettre des données + tester"

### Checklist Pré-Data Entry

| #   | Item                       | Status | Action                         |
| --- | -------------------------- | ------ | ------------------------------ |
| 1   | Merger PRs docs ouvertes   | ⏳     | Merger #17, #18, #19, #20, #21 |
| 2   | Cleanup branches locales   | ⏳     | `git branch -d` sur 7 branches |
| 3   | Vérifier RLS policies      | ⏳     | Audit tables linkme\_\*        |
| 4   | Seed minimal organisations | ⏳     | 1 organisation test            |
| 5   | Seed minimal produits      | ⏳     | 3 produits avec images         |
| 6   | Créer affiliate test       | ⏳     | 1 linkme_affiliates + user     |
| 7   | Test E2E LinkMe flow       | ⏳     | Login → Catalogue → Selection  |

### Ordre de Merge Recommandé (PRs)

```
1. PR #21 (GITHUB-RULESETS.md) - Aligne doc avec état réel
2. PR #20 (docs/ci-cd cleanup) - Supprime docs obsolètes
3. PR #19 (Co-Authored-By) - Fix minor
4. PR #17 (CLAUDE.md branch strategy) - Doc alignment
5. PR #18 (audit pack) - Audit files
```

**Raison** : PR #21 est la plus urgente car elle corrige une doc critique sur la gouvernance.

---

## 5. Preuves

### Commandes Exécutées

```bash
# Auth Claude CLI
which claude → /Users/romeodossantos/.local/bin/claude
claude --version → 2.0.69 (Claude Code)

# GitHub Auth
gh auth status → Verone2021 (keyring)
env | grep -E 'GH_TOKEN|GITHUB_TOKEN' → (vide)
git config -l | grep credential → osxkeychain + gh auth

# Repo Doctor
./scripts/repo-doctor.sh → 0 errors, 7 warnings

# Rulesets
gh api repos/Verone2021/Verone-V1/rulesets → 2 rulesets
gh api repos/Verone2021/Verone-V1/rulesets/11086775 → Protect main details

# PRs
gh pr list --state open → 5 PRs (#17, #18, #19, #20, #21)
```

### Fichiers Référencés

- `.husky/pre-push` : Hook pre-push avec check-console-errors
- `scripts/repo-doctor.sh` : Script diagnostic
- `scripts/monitoring/check-console-errors.ts` : Playwright console check
- `docs/governance/GITHUB-RULESETS.md` : Doc rulesets
- `vercel.json` : Config Vercel root
- `apps/linkme/vercel.json` : Config Vercel LinkMe

---

## 6. Décisions à prendre

### Decision 1: Pre-push Hook

**Options** :

1. **Augmenter timeout** (60-90s) - Simple mais ne résout pas le problème racine
2. **Changer networkidle → domcontentloaded** - Plus rapide mais moins complet
3. **Skip branches docs-only** - Logique conditionnelle dans hook
4. **Déplacer en CI (nightly)** - Recommandé, ne bloque plus le dev local

**Recommandation** : Option 4 (CI nightly) avec option 3 comme fallback immédiat.

### Decision 2: Merge PRs Order

**Options** :

1. **Merge toutes en batch** - Rapide mais risque de conflits
2. **Merge séquentiel (ordre recommandé)** - Safe, prévisible
3. **Squash toutes dans une PR** - Plus clean history

**Recommandation** : Option 2 (séquentiel) pour traçabilité.

---

**Dernière mise à jour** : 2025-12-15 13:15 UTC+1
