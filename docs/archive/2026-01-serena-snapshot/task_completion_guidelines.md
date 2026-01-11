# Guidelines Task Completion Vérone

## ✅ Checklist Obligatoire Avant Commit

### 🔍 1. Code Quality

```bash
npm run lint:fix         # Auto-fix ESLint errors
npm run type-check       # Zero TypeScript errors
npm run test             # All unit tests pass
```

### 🧪 2. Business Validation

- **Business Rules** : Conformité manifests/business-rules/
- **Performance SLOs** : Dashboard <2s, Feeds <10s, PDF <5s
- **Security RLS** : Row-Level Security policies testées

### 🎨 3. UX/UI Standards

- **Design System** : Composants shadcn/ui + tokens Vérone
- **Responsive** : Mobile-first (>40% usage mobile catalogues)
- **Accessibility** : WCAG AA compliance

### 📊 4. Testing Strategy

```bash
# Tests E2E workflows critiques
npm run test:e2e         # Playwright business scenarios

# Performance validation
npm run test:e2e:ui      # Interface tests avec metrics

# Coverage minimum
npm run test:coverage    # >90% target coverage
```

## 🎯 Definition of Done Features

### 📋 Requirements Obligatoires

- [ ] **Business rules** : Respect strict manifests/business-rules/
- [ ] **Tests E2E** : Workflows complets validés avec Playwright
- [ ] **Performance** : SLOs respectés (dashboard <2s, feeds <10s)
- [ ] **Security** : RLS policies testées + validation permissions
- [ ] **UX responsive** : Design system appliqué, mobile-first
- [ ] **Documentation** : Manifests/ mis à jour avec learnings
- [ ] **Integration** : APIs externes testées (Brevo, Meta/Google)

### 🚀 Workflow TDD Enhanced

1. **📖 Documentation First** : Analyser manifests/ business rules
2. **🧪 Tests First** : Tests E2E qui échouent (RED)
3. **⚡ Code Minimal** : Implémentation pour GREEN tests
4. **🔧 Refactor** : Optimisation performance + clean code
5. **📊 Verify** : Validation SLOs + business compliance

## 🤖 Agents Coordination Obligatoire

### 🎯 Pour Features Complexes

- **verone-orchestrator** : Coordination business rules + architecture
- **verone-test-expert** : Tests E2E workflows métier
- **verone-design-expert** : UX validation + design system

### 📝 Documentation Update

- **Process learnings** : Retours d'expérience dans manifests/
- **Business rules** : Mise à jour si nouvelles règles découvertes
- **Architecture decisions** : Documentation choix techniques

## 🚨 Critères Bloquants

### ❌ Ne PAS merger si :

- TypeScript errors présents
- Tests unitaires en échec
- Performance SLOs non respectés
- Business rules violées
- Security vulnerabilities détectées
- Mobile UX cassée

### ⚠️ Alerts Performance

- Dashboard >2s → Investigation obligatoire
- Feeds generation >10s → Optimisation requise
- PDF export >5s → Refactoring nécessaire
- Search >1s → Index database à vérifier
