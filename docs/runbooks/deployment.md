# Deployment Runbook

Guide opérationnel pour les déploiements production.

## Status

⚠️ **TODO**: Documentation à compléter

## Contexte

Fichiers historiques supprimés lors du cleanup 2026-01-20:
- `.deploy-trigger` (trigger manuel déploiement)
- `.vercel-trigger` (CI/CD trigger)

## Déploiement Manuel

### Prérequis

```bash
# Vérifications avant déploiement
npm run type-check    # TypeScript sans erreurs
npm run build         # Build production réussit
npm run e2e:smoke     # Tests smoke UI (si disponibles)
```

### Procédure

**TODO**: Documenter la procédure complète

1. Vérifications pré-déploiement
2. Déploiement sur environnement de staging
3. Tests de validation
4. Déploiement production
5. Vérifications post-déploiement
6. Rollback si nécessaire

## Déploiement CI/CD

### Vercel

**TODO**: Documenter configuration Vercel

- Branches déployées automatiquement
- Variables d'environnement
- Preview deployments
- Production deployments

### GitHub Actions

**TODO**: Documenter workflows GitHub

- Tests automatiques
- Build validation
- Deploy hooks

## Triggers de Déploiement

**Historique**:
- Avant 2026-01-20: Fichiers `.deploy-trigger` et `.vercel-trigger` à la racine
- Après 2026-01-20: Supprimés (usage unclear, probablement obsolètes)

**Question ouverte**: Mécanisme de trigger actuel à documenter.

## Rollback

**TODO**: Procédure de rollback

1. Identifier la version stable précédente
2. Procédure de rollback
3. Vérifications post-rollback

## Secrets Management

Voir: [docs/security/secrets-rotation-procedure.md](../security/secrets-rotation-procedure.md)

## Monitoring Post-Déploiement

**TODO**: Checklist monitoring

- Sentry: Pas de nouvelles erreurs
- Logs: Patterns normaux
- Performance: Latency acceptable
- Database: Connexions OK

---

**Priorité**: Medium
**Assigné**: DevOps
**Créé**: 2026-01-20
**Dernière mise à jour**: 2026-01-20
