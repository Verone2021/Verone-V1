# Claude Autonomy Guidelines - 2026-01-17

## Context

L'utilisateur Romeo a clarifié de manière définitive les attentes concernant l'autonomie de Claude dans le projet Verone Back Office.

## Règle Fondamentale

**Claude doit être 100% autonome pour toutes les actions techniques.**

## Responsabilités de Claude (TOUT faire)

### Exploration & Planification
- Explorer le codebase (Glob, Grep, Read)
- Planifier les implémentations (EnterPlanMode)
- Analyser les erreurs et diagnostiquer les problèmes

### Développement
- Écrire/modifier le code (Edit, Write)
- Suivre les patterns existants du codebase
- Respecter les conventions (TypeScript, Next.js 15, etc.)

### Qualité & Vérification
- Vérifier le code (type-check, build, tests)
- Exécuter les tests E2E si nécessaire
- Valider que tout fonctionne avant de merger

### Git & GitHub
- Créer les commits avec le format convention `[APP-DOMAIN-NNN] type: description`
- Créer les PRs via `gh pr create`
- **Merger les PRs** via `gh pr merge --squash --delete-branch`
- Pousser les branches et gérer les conflits

### Déploiement & Infrastructure
- **Configurer Vercel** (variables d'env, settings) via CLI ou MCP Playwright
- **Vérifier la production** via tests automatisés (curl, Playwright)
- **Redéployer** si nécessaire via commits ou Vercel CLI
- Diagnostiquer les problèmes de déploiement

### Documentation
- Documenter les changements
- Créer des rapports pour l'utilisateur
- Expliquer les décisions techniques

## Responsabilités de l'Utilisateur (SEULEMENT)

1. **Donner des instructions** : Clarifier ce qu'il veut accomplir
2. **Répondre aux questions de clarification** : Quand Claude ne sait pas quelle direction prendre
3. **Être la source de vérité** : Fournir des informations que Claude ne peut pas découvrir seul (credentials, décisions business)
4. **Recevoir et valider** : Recevoir la documentation et les explications de Claude

## Ce que Claude NE DOIT JAMAIS faire

❌ Demander à l'utilisateur de merger une PR
❌ Demander à l'utilisateur d'aller sur Vercel Dashboard
❌ Demander à l'utilisateur de configurer des variables d'env
❌ Demander à l'utilisateur de redéployer
❌ Demander à l'utilisateur de faire des actions CLI/techniques
❌ Demander à l'utilisateur de pousser des commits
❌ Demander à l'utilisateur d'exécuter des commandes
❌ Demander à l'utilisateur de vérifier manuellement la production

## Outils Autonomes Disponibles

### CLI Tools
- **gh CLI** : `gh pr merge`, `gh pr create`, `gh issue create`, `gh pr view`
- **Vercel CLI** : `vercel env add`, `vercel deploy`, `vercel env ls`
- **git** : Tous les commandes git standard
- **npm/pnpm** : Build, test, dev
- **curl** : Tester les APIs et endpoints

### MCP Servers
- **MCP Playwright (2 lanes)** :
  - Naviguer Vercel Dashboard pour config UI
  - Tester l'application en production
  - Prendre screenshots de vérification
  - Automatiser les workflows web

### Bash
- Tous les outils système UNIX disponibles

## Exemple Workflow Autonome

### Scénario : Merger une PR et configurer production

1. ✅ Claude merge la PR : `gh pr merge 55 --squash --delete-branch`
2. ✅ Claude configure Vercel : `vercel env add VAR_NAME production`
3. ✅ Claude redéploie : commit vide pour trigger redeploy
4. ✅ Claude vérifie : `curl https://app.vercel.app/api/health`
5. ✅ Claude teste UI : MCP Playwright pour naviguer et vérifier
6. ✅ Claude documente : Rapport final pour l'utilisateur

❌ **Jamais** : "Peux-tu merger la PR ?", "Va sur Vercel Dashboard", "Vérifie en production"

## Exceptions (Quand demander à l'utilisateur)

1. **Informations secrètes** : API keys, tokens (l'utilisateur peut les fournir)
2. **Décisions business** : "Veux-tu X ou Y pour cette feature ?"
3. **Clarifications** : "Je ne comprends pas ton instruction, peux-tu clarifier ?"
4. **Approbation de plans** : EnterPlanMode → ExitPlanMode (workflow standard)

## Validation

Cette mémoire a été créée après que Romeo ait corrigé une incompréhension majeure de Claude concernant son niveau d'autonomie attendu. Claude pensait devoir demander à l'utilisateur de faire certaines actions techniques (merger PRs, configurer Vercel, etc.), alors qu'en réalité Claude doit TOUT faire de manière autonome.

## Statut

✅ **Actif et définitif** - À respecter pour TOUTES les sessions futures sur ce projet.

---

**Date création** : 2026-01-17
**Créé par** : Claude (sur instruction Romeo)
**Version** : 1.0
