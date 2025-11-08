# 🚀 DEPLOYMENT CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail CI/CD, Vercel, rollback, PR

---

## ⚙️ CI/CD RULES

### Intégration Continue (CI)

**Exécution automatique sur chaque PR** :

1. ✅ **Lint & Format** : ESLint + Prettier (refus si non conforme)
2. ✅ **Tests unitaires** : Vitest (coverage > 80% pour nouveaux modules)
3. ✅ **Audit code** : jscpd, madge, knip (voir Scripts d'Audit)
4. ✅ **Zero Console Error** : Playwright browser console check
5. ✅ **Types** : TypeScript compilation sans erreurs
6. ✅ **Build** : Next.js build réussi

**Aucune PR ne peut être mergée si CI échoue.**

### Déploiement Continu (CD)

**Stratégie actuelle (Phase 1)** :

```
main branch → Vercel auto-deploy production
feature/* → Vercel preview deploy (URL unique par PR)
```

**Stratégie future (Phase 2 - Monorepo)** :

```bash
# Utiliser Nx ou Turborepo pour builds sélectifs
nx affected:build --base=main
nx affected:test --base=main
nx affected:deploy --base=main
```

---

## 🔀 WORKFLOW GITHUB

```bash
main                    # Production (protected)
├── feature/nom        # Feature branches
└── hotfix/critical    # Emergency fixes

# Règles branches protégées (main) :
- Require PR reviews (1 minimum)
- Require status checks (CI green)
- No force push
- No direct commits
```

---

## 📝 PULL REQUESTS (PR)

**Template obligatoire** : `.github/PULL_REQUEST_TEMPLATE.md`

**PR doit inclure** :

1. **Contexte** : Pourquoi ce changement ?
2. **Description** : Quoi exactement ?
3. **Tests** : Comment validé ?
4. **Risques** : Impacts potentiels ?
5. **Rollback** : Procédure retour arrière si problème
6. **Screenshots** : Si changement UI
7. **Console check** : Capture Playwright console clean

**PR atomiques** : 1 PR = 1 fonctionnalité cohérente (éviter mega-PRs)

---

## 🚩 FEATURE FLAGS

**Approche simple** : Variables d'environnement

```bash
# .env.local
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_SEARCH=false

# Vercel Environment Variables
# Production : FEATURE_NEW_DASHBOARD=true
# Staging : FEATURE_BETA_SEARCH=true
```

**Utilisation** :

```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
  betaSearch: process.env.FEATURE_BETA_SEARCH === 'true',
} as const

// Dans composants
import { featureFlags } from '@/lib/feature-flags'

export default function Dashboard() {
  return featureFlags.newDashboard ? <NewDashboard /> : <OldDashboard />
}
```

---

## 🌐 VERCEL DEPLOYMENT

**URL Production** : https://vercel.com/verone2021s-projects/verone-v1

**Workflow** :

```bash
# 1. Preview Deploy (CLI)
vercel --prod=false

# 2. Production Deploy (après validation preview)
vercel --prod

# 3. Rollback instantané (Vercel dashboard)
# → Sélectionner déploiement précédent → "Promote to Production"
```

---

## 🔙 ROLLBACK PROCEDURES

**Database** :

- Chaque migration DB doit avoir un script `down` documenté
- Backup quotidien Supabase (automatique)
- Backup manuel avant migration critique : `docs/ci-cd/rollback-procedures.md`

**Vercel** :

- Rollback instantané via dashboard (promote previous deployment)
- Historique illimité des déploiements

**Feature Flags** :

- Désactivation sans redéploiement (mise à jour env var Vercel)

---

## 📈 DÉPLOIEMENT PROGRESSIF (DARK LAUNCH)

1. **Phase 1** : Feature flag OFF, code déployé en prod (inactif)
2. **Phase 2** : Activation staging uniquement
3. **Phase 3** : Activation 10% users production (A/B testing)
4. **Phase 4** : Rollout 100% si metrics OK
5. **Phase 5** : Suppression ancien code + feature flag

---

## 📜 SCRIPTS D'AUDIT

### Outils installés

```bash
npm install -D jscpd madge dependency-cruiser knip ts-prune cspell
```

### Scripts package.json

```json
{
  "scripts": {
    "audit:duplicates": "jscpd src/ --min-lines 5 --min-tokens 50",
    "audit:cycles": "madge --circular src/",
    "audit:dependencies": "depcruiser --config .dependency-cruiser.js src/",
    "audit:deadcode": "knip",
    "audit:unused": "ts-prune",
    "audit:spelling": "cspell 'src/**/*.{ts,tsx,md}' 'docs/**/*.md'",
    "audit:all": "npm run audit:duplicates && npm run audit:cycles && npm run audit:deadcode && npm run audit:spelling"
  }
}
```

### GitHub Actions (CI)

Voir `.github/workflows/audit.yml` - Exécution automatique sur chaque PR.

**Seuils de tolérance** :

- Duplication : Max 5% (ajustable)
- Cycles : 0 toléré (strict)
- Dead code : Warning uniquement
- Spelling : Dictionnaire personnalisé (`.cspell.json`)

---

**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos
