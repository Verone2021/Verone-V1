# 🚀 Commande /implement-verone

> **Usage** : `/implement-verone <feature-name>`

## 📋 Description

Workflow d'implémentation structuré pour les fonctionnalités Vérone, basé sur l'approche **Plan → Tests → Code → Verify** avec validation des règles métier.

## 🎯 Workflow Automatique

### **Phase 1 : Analyse & Planification**
1. **Analyser** le manifeste correspondant (`manifests/business-rules/`, `manifests/prd/`)
2. **Sequential Thinking** → Plan détaillé avec architecture + phases
3. **Validation métier** → Conformité business rules Vérone
4. **Coordination agents** → Délégation design + tests si nécessaire

### **Phase 2 : Tests First (TDD)**
1. **verone-test-expert** → Création tests E2E business scenarios
2. **Tests unitaires** → Logique métier critique (tarifs, stocks, validations)
3. **Mock intégrations** → APIs externes (Brevo, Meta, Google)
4. **Validation RED** → Tests échouent avant implémentation

### **Phase 3 : Implémentation**  
1. **Code minimal** → Faire passer les tests (GREEN)
2. **Respect architecture** → Modules Supabase + Next.js + React
3. **Business rules** → Application stricte règles métier
4. **Error handling** → Gestion robuste erreurs + edge cases

### **Phase 4 : Vérification**
1. **Tests coverage** → >95% business logic, >90% overall
2. **Performance** → Respect SLOs (feeds <10s, dashboard <2s)
3. **Integration** → Tests avec modules existants
4. **Documentation** → Mise à jour manifests si évolution

## 🛠️ Outils Utilisés

### **Coordination**
- **Sequential Thinking** : Planification complexe, architecture
- **verone-orchestrator** : Coordination générale + validation métier
- **Serena** : Analyse code, refactoring, optimisations

### **Testing & Quality**  
- **verone-test-expert** : Tests E2E Playwright spécialisés
- **Playwright** : Tests cross-browser, performance, responsiveness
- **Jest** : Tests unitaires logique métier

### **Development**
- **Context7** : Documentation Next.js, Supabase, React patterns
- **Supabase MCP** : Database, RLS, triggers, migrations
- **GitHub** : Issues, PRs, code review, CI/CD

## 🎭 Examples d'Usage

### **Feature Catalogue**
```bash
/implement-verone catalogue-variantes

# Workflow automatique:
# 1. Analyse manifests/business-rules/catalogue.md
# 2. Plan architecture variantes + product_group_id  
# 3. Tests E2E: création variantes, mapping feeds, affichage
# 4. Implémentation: DB schema + API + UI
# 5. Validation: performance + intégration
```

### **Integration Externe**  
```bash
/implement-verone brevo-webhooks

# Workflow automatique:
# 1. Analyse manifests/business-rules/integrations-externes.md
# 2. Plan endpoint + validation HMAC + events processing
# 3. Tests: webhook resilience, signature validation, data storage
# 4. Implémentation: Edge Function + database + error handling
# 5. Validation: integration tests + monitoring
```

### **Feature UI/UX**
```bash  
/implement-verone collections-partageables

# Workflow automatique:
# 1. Analyse manifests/prd/PRD-MVP-CATALOGUE.md
# 2. verone-design-expert → UX flows + composants
# 3. Tests E2E: création collection → partage → consultation
# 4. Implémentation: UI responsive + backend + PDF export
# 5. Validation: performance + user experience
```

## 🔧 Standards de Qualité

### **Code Requirements**
- **TypeScript strict** : 100% typed, no any
- **Business rules compliance** : Validation vs manifests/
- **Error handling** : Try/catch + user feedback + logging
- **Performance** : Respect SLOs définis dans technical-specs/

### **Testing Requirements**
- **Unit tests** : Business logic >95% coverage
- **Integration tests** : APIs + database + external services  
- **E2E tests** : User workflows complets
- **Performance tests** : Load testing sur scenarios critiques

### **Documentation Requirements**
- **ADR** : Architecture decisions dans process-learnings/
- **Business rules** : Mise à jour si nouvelle logique
- **API documentation** : OpenAPI specs si nouvelles routes
- **User documentation** : Guides si nouvelle feature UI

## 🚀 Contexte Vérone

### **Modules Prioritaires MVP**
1. **Catalogue** → Produits, variantes, catégories, images
2. **Collections** → Sélections partageables avec liens sécurisés  
3. **Exports** → PDF branded + feeds Meta/Google CSV
4. **Intégrations** → Webhooks Brevo + APIs externes
5. **Back-office** → Interface admin responsive

### **Business Rules Non-Négociables**
- **Tarification** : Cohérence prix particuliers/pros, remises ≤40%
- **Stock** : Statuts temps réel, réservations soft/hard
- **Catalogue** : Validation complète avant publication
- **RGPD** : Consentements + anonymisation + audit trail

### **Performance SLOs**
- **Dashboard** : <2s load time
- **Feeds generation** : <10s pour 1000+ produits  
- **PDF export** : <5s pour collections 50 produits
- **Search** : <1s results avec 10,000+ produits
- **Webhook processing** : <2s response time

## 💡 Bonnes Pratiques

### **Avant l'Implémentation**
1. **Lire le manifeste** → Comprendre business context
2. **Analyser impact** → Dépendances avec autres modules
3. **Planifier tests** → Scenarios critique + edge cases
4. **Estimer performance** → Respect SLOs prévu

### **Pendant l'Implémentation**  
1. **Tests first** → RED → GREEN → REFACTOR
2. **Commits granulaires** → Faciliter review + rollback
3. **Error handling** → Graceful degradation + user feedback
4. **Performance monitoring** → Métriques temps réel

### **Après l'Implémentation**
1. **Code review** → Standards + business rules compliance
2. **Integration testing** → Impact autres modules
3. **User acceptance** → Validation équipe Vérone
4. **Documentation update** → Manifests + process learnings

La commande `/implement-verone` garantit que chaque fonctionnalité respecte l'excellence technique et métier attendue du système CRM/ERP Vérone.