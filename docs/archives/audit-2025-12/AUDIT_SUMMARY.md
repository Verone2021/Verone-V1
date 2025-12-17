# AUDIT SUMMARY - Verone Repo

**Date** : 2025-12-15
**Repository** : Verone2021/Verone-V1
**Status** : Audit complet avec plan de remédiation

---

## CE QU'ON A AUJOURD'HUI (10 bullets)

1. **Monorepo Turborepo** avec 3 apps (`back-office`, `linkme`, `site-internet`) + 25 packages `@verone/*`
2. **Production sur Vercel** : `main` = auto-deploy, PR obligatoire via ruleset "Protect main"
3. **Supabase unique** : 1 seul projet partagé entre DEV/PREVIEW/PROD (78 tables, 158 triggers, 239 RLS)
4. **GitHub Rulesets** : 2 status checks requis (`Vercel – verone-back-office`, `Vercel – linkme`)
5. **Stack** : Next.js 15 + Supabase + shadcn/ui + Turborepo + pnpm
6. **LinkMe en PROD** : App d'affiliation déployée et fonctionnelle
7. **Documentation canon** : `docs/DEPLOYMENT.md`, `docs/BRANCHING.md`, `docs/governance/GITHUB-RULESETS.md`
8. **45 mémoires Serena** : Cache non-autoritaire avec quelques obsolètes
9. **32 scripts actifs** : Organisés dans `scripts/` avec README à jour
10. **Script d'audit** : `scripts/repo-audit.sh` (détection automatique contradictions)

---

## LES CONTRADICTIONS QUI FONT PERDRE DU TEMPS (10 bullets)

1. **CLAUDE.md dit "production-stable"** mais canon dit **"main"** = Production
2. **Mémoire Serena obsolète** : `vercel-manual-deployment-only.md` contredit DEPLOYMENT.md (SUPPRIMÉE)
3. **Co-Authored-By Claude** : Encore présent dans `senior-stabilization-protocol.md` (bloque Vercel)
4. **CLAUDE.md workflow commit** : Inclut signatures que `/commit` dit d'éviter
5. **2 mémoires Oct 2025** : Possiblement obsolètes, non archivées
6. **37 Project IDs hardcodés** : `aorroydfjsrygmosnzrl` dans docs/commands (non-portable)
7. **Liste mémoires dans update-docs.md** : Incomplète, références obsolètes
8. **Aucun index docs/** : Pas de README central pointant vers les canons
9. **Pas de lifecycle headers** : Docs sans `Status: ACTIVE/DEPRECATED/ARCHIVED`
10. **Pas de CI docs hygiene** : Aucun lint markdown ou check liens

---

## PLAN RECOMMANDÉ (10 bullets)

1. **PR #1** : Script repo-audit + reports/ ✅ (déjà fait)
2. **PR #2** : Fix CLAUDE.md (branch strategy + supprimer Co-Authored-By)
3. **PR #3** : Fix `senior-stabilization-protocol.md` (supprimer Co-Authored-By)
4. **PR #4** : Archiver mémoires Oct 2025 obsolètes
5. **PR #5** : Créer `docs/README.md` avec index vers canons
6. **PR #6** : Ajouter lifecycle headers aux 3 docs canon
7. **PR #7** : Mettre à jour `update-docs.md` avec liste mémoires correcte
8. **PR #8** : Créer `.github/workflows/docs-lint.yml` (markdownlint + link-check)
9. **PR #9** : Centraliser env vars dans `.env.example` documenté
10. **PR #10** : Archiver docs obsolètes dans `docs/archive/`

---

## 5 RÈGLES D'OR (À NE JAMAIS VIOLER)

### 1. AUCUN PUSH DIRECT SUR MAIN

```
Workflow unique : branche → PR → merge
Ruleset "Protect main" = actif avec status checks
```

### 2. AUCUN CO-AUTHORED-BY CLAUDE

```
L'email noreply@anthropic.com bloque Vercel
Format autorisé : "🤖 Generated with Claude Code" (sans Co-Authored-By)
```

### 3. MAIN = PRODUCTION

```
docs/BRANCHING.md = Source de vérité
Branche "production-stable" n'existe plus
```

### 4. SERENA = CACHE, PAS VÉRITÉ

```
Hiérarchie : docs/*.md (canon) > CLAUDE.md > Mémoires Serena
En cas de conflit, le doc canon le plus récent gagne
```

### 5. PREUVES AVANT AFFIRMATIONS

```
Toute affirmation technique doit citer : fichier + ligne ou commit
Sinon : marquer "NON CONFIRMÉ"
```

---

## FICHIERS DE CET AUDIT

| Fichier                   | Description                             |
| ------------------------- | --------------------------------------- |
| `AUDIT_SUMMARY.md`        | Ce résumé (vous êtes ici)               |
| `AUDIT_FINDINGS.md`       | Détails des contradictions avec preuves |
| `DOCS_DRIFT_MAP.md`       | Liste des fichiers à archiver/réécrire  |
| `DEPLOYMENT_TRUTH.md`     | Vérité unique sur le déploiement        |
| `DB_SCHEMA_SUMMARY.md`    | Résumé base de données                  |
| `PR_PLAN.md`              | Plan de nettoyage par PRs               |
| `CONTEXT_PACK_FOR_GPT.md` | Pack handoff pour assistant externe     |

---

## COMMANDE POUR VÉRIFIER L'ÉTAT

```bash
# Exécuter l'audit automatique
./scripts/repo-audit.sh

# Avec rapport JSON
./scripts/repo-audit.sh --json

# Voir le rapport
cat reports/repo-audit-report.md
```

---

**Prochaine étape** : Implémenter PR #2 (Fix CLAUDE.md)
