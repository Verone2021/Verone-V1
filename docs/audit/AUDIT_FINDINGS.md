# AUDIT FINDINGS - Détails et Preuves

**Date** : 2025-12-15
**Méthode** : Script `repo-audit.sh` + exploration manuelle

---

## FINDINGS MAJEURS

### C-01b : Co-Authored-By Claude dans commands

**Gravité** : 🟠 MAJOR
**Impact** : Bloque Vercel si utilisé dans commits

**Preuve** :

```bash
$ grep -r "Co-Authored-By.*Claude" .claude/commands/
.claude/commands/senior-stabilization-protocol.md:Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Fichier concerné** : `.claude/commands/senior-stabilization-protocol.md` (ligne 175)

**Extrait** :

```bash
git commit -m "fix(core): [Description du fix]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Problème** :

- L'email `noreply@anthropic.com` n'est pas un compte GitHub valide
- Vercel rejette les commits avec co-auteurs sans accès au projet
- Mémoire `git-commits-no-coauthor-claude.md` (2025-12-12) interdit explicitement ce pattern

**Recommandation** : Supprimer la ligne `Co-Authored-By` du fichier

---

### C-03 : Branch Strategy Mismatch

**Gravité** : 🟠 MAJOR
**Impact** : Confusion sur branche de déploiement

**Preuve** :

```bash
$ grep "production-stable.*Production" CLAUDE.md
production-stable  → Production Vercel (auto-deploy)
```

```bash
$ grep "main.*Production" docs/BRANCHING.md
| `main`       | Production (Vercel auto-deploy) | Ruleset "Protect main"      |
```

**Fichier A** : `CLAUDE.md` (ligne 467)

```markdown
production-stable → Production Vercel (auto-deploy)
main → Staging/Development (tests)
```

**Fichier B** : `docs/BRANCHING.md` (ligne 12)

```markdown
| `main` | Production (Vercel auto-deploy) | Ruleset "Protect main" |
| `production` | Legacy (gelée, lecture seule) | Ruleset "Freeze production" |
```

**Analyse** :

- `CLAUDE.md` date de la Phase 4 (Nov 2025)
- `docs/BRANCHING.md` date du 2025-12-13 (plus récent)
- Le ruleset "Protect main" confirme que `main` = Production

**Recommandation** : Mettre à jour CLAUDE.md pour aligner avec BRANCHING.md

---

### C-02 : Deployment Strategy Contradiction

**Gravité** : 🟠 MAJOR
**Impact** : Confusion sur workflow déploiement

**Preuve** :

```bash
$ cat .serena/memories/vercel-manual-deployment-only.md
# État : SUPPRIMÉ (2025-12-15)
# Contenait : "JAMAIS attendre un auto-deploy - il ne se déclenchera PAS"
```

```bash
$ grep "auto-deploy" docs/DEPLOYMENT.md
│  Production ◄──── auto-deploy depuis main               │
```

**Fichier A** (supprimé) : `.serena/memories/vercel-manual-deployment-only.md`

- Créé : 2025-12-12
- Affirmait : "webhooks GitHub → Vercel ne sont pas configurés"

**Fichier B** : `docs/DEPLOYMENT.md` (ligne 21)

- Créé : 2025-12-13
- Affirme : "auto-deploy depuis main"

**Analyse** :

- La mémoire Serena était un état temporaire (problème résolu depuis)
- Les docs canon sont plus récentes et reflètent l'état actuel
- Mémoire supprimée le 2025-12-15 par cet audit

**Recommandation** : ✅ Résolu (mémoire supprimée)

---

## FINDINGS MINEURS

### M-02 : Mémoires Oct 2025 obsolètes

**Gravité** : 🟡 MINOR
**Impact** : Pollution de l'espace mémoire

**Preuve** :

```bash
$ find .serena/memories -name "*2025-10*" -type f
.serena/memories/vercel-deployment-status-2025-10-20.md
.serena/memories/vercel-deployment-success-2025-10-20.md
```

**Analyse** :

- Ces mémoires datent de 2 mois
- Peuvent contenir des informations dépassées
- N'ont pas été archivées lors de la migration Dec 2025

**Recommandation** : Archiver ou supprimer après review

---

## FINDINGS INFORMATIFS

### I-02 : Hardcoded Supabase Project IDs

**Gravité** : 🔵 INFO
**Impact** : Non-portable pour forks

**Preuve** :

```bash
$ grep -r "aorroydfjsrygmosnzrl" .claude/ docs/ | wc -l
      37
```

**Locations** :

- `.claude/commands/db.md` (plusieurs occurrences)
- `.claude/contexts/database.md`
- `docs/database/` (plusieurs fichiers)

**Analyse** :

- Project ID Supabase hardcodé dans 37 emplacements
- Fonctionnel pour ce projet spécifique
- Non-portable si quelqu'un fork le repo

**Recommandation** : Considérer utilisation de variables d'environnement (non urgent)

---

## RÉSUMÉ STATISTIQUE

| Gravité  | Count | Action     |
| -------- | ----- | ---------- |
| CRITICAL | 0     | -          |
| MAJOR    | 3     | Fix requis |
| MINOR    | 1     | Review     |
| INFO     | 1     | Optionnel  |

**Total** : 5 findings

---

## COMMANDE D'AUDIT

Pour reproduire cette analyse :

```bash
./scripts/repo-audit.sh --json
```

Rapport généré dans :

- `reports/repo-audit-report.md` (humain)
- `reports/repo-audit-report.json` (machine)

---

**Dernière exécution** : 2025-12-15 05:02:35
