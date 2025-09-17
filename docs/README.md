# 📚 Documentation Technique Vérone Back Office

Ce dossier contient la documentation technique détaillée du projet Vérone Back Office, complémentaire à l'organisation business dans `manifests/`, `MEMORY-BANK/` et `TASKS/`.

## 🗂️ **NOUVELLE ARCHITECTURE DOCUMENTAIRE**

### **📁 Repository Organization**
```
verone-back-office/
├── MEMORY-BANK/           # 🧠 Contexte projet centralisé
├── TASKS/                 # ✅ Gestion tâches centralisée
├── manifests/             # 📋 Documentation business structurée
├── docs/ (ce dossier)     # 🔧 Documentation technique
├── src/                   # 💻 Code application
└── ...
```

## 📁 **Documentation Technique (docs/)**

### `deployment/`
Guides de déploiement et mise en production :
- Configuration Vercel optimisée
- Variables d'environnement sécurisées
- Process de release avec CI/CD
- Monitoring production (performance + business)

### `development/`
Setup et guides pour les développeurs :
- Installation projet + dépendances MCP
- Configuration locale Supabase
- Convention de code (TypeScript strict)
- Workflow TDD avec tests E2E

### `troubleshooting/`
Guide de résolution des problèmes courants :
- Erreurs fréquentes et solutions
- Debug tests Playwright + Browser MCP
- Problèmes Supabase/RLS + Storage
- Performance et optimisation catalogue

### `api/`
Documentation technique des APIs :
- Endpoints REST Supabase
- Edge Functions specifications
- Authentification JWT + RLS
- Exemples requêtes avec curl

## 🧠 **Documentation Business Centralisée**

### **MEMORY-BANK/** - Contexte Projet
- `project-context.md` → Vision globale + stakeholders
- `current-roadmap.md` → Roadmap actuelle + priorités
- `implementation-status.md` → État modules + métriques
- `business-decisions.md` → Décisions importantes + justifications
- `ai-context.md` → Contexte spécialisé pour IA

### **TASKS/** - Gestion Centralisée
- `active-sprints.md` → Sprint actuel + tâches en cours
- `backlog-prioritized.md` → Backlog priorisé avec scoring
- `completed-archive.md` → Historique accomplissements
- `blocked-issues.md` → Problèmes bloquants + solutions
- `templates/` → Templates standardisés (feature/bug/refactor)

### **manifests/** - Spécifications Business
- `business-rules/` → Règles métier par module
- `technical-specs/` → ✨ **NOUVEAU** - Specs performance/sécurité
- `architecture/` → Architecture + API design (fusionné avec api/)
- `prd/` → Product Requirements (fusionné avec product-requirements/)

## 🎯 **Navigation par Besoin**

### **🔥 Développement Immédiat**
- **Context actuel** → `MEMORY-BANK/project-context.md`
- **Tâches prioritaires** → `TASKS/active-sprints.md`
- **Setup technique** → `docs/development/`

### **📋 Planning & Roadmap**
- **Roadmap business** → `MEMORY-BANK/current-roadmap.md`
- **Backlog priorisé** → `TASKS/backlog-prioritized.md`
- **Status implémentation** → `MEMORY-BANK/implementation-status.md`

### **🛠️ Problèmes & Debug**
- **Blockers actuels** → `TASKS/blocked-issues.md`
- **Solutions techniques** → `docs/troubleshooting/`
- **Règles business** → `manifests/business-rules/`

### **🎯 Nouvelle Feature**
1. **Template** → `TASKS/templates/feature-template.md`
2. **Business rules** → `manifests/business-rules/`
3. **Technical specs** → `manifests/technical-specs/`
4. **Implementation** → `docs/development/`

## 🔄 **Workflow Documentation**

### **📝 Avant toute intervention**
1. Lire `MEMORY-BANK/project-context.md`
2. Vérifier `TASKS/active-sprints.md`
3. Consulter business rules pertinentes

### **⚡ Pendant intervention**
1. Documenter décisions importantes
2. Mettre à jour tâches en temps réel
3. Respecter conventions CLAUDE.md

### **✅ Après intervention**
1. Mettre à jour `MEMORY-BANK/implementation-status.md`
2. Archiver tâches terminées
3. Documenter apprentissages

## 🚨 **RÈGLES CRITIQUES**

### **🚫 Interdictions Absolues**
- ❌ **Couleurs jaunes/dorées** dans le système
- ❌ **Données mock** en production (toujours Supabase réel)
- ❌ **Fichiers temporaires** à la racine (→ tests/debug/)

### **✅ Standards Obligatoires**
- ✅ **Business rules first** → Code suit les règles métier
- ✅ **Tests E2E obligatoires** avec données réelles
- ✅ **Documentation à jour** après chaque feature

## 🎯 **Métriques Success Documentation**

- **Contexte IA** : Temps compréhension projet <5min
- **Onboarding développeur** : Setup projet <30min
- **Résolution problèmes** : Troubleshooting self-service >80%
- **Cohérence décisions** : Documentation alignée business

## 🔄 Maintenance

Cette documentation est maintenue par l'équipe technique et mise à jour à chaque changement architectural significatif.