# 🚀 Vérone Back Office - Configuration Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**MVP Catalogue Partageable** : Next.js + Supabase + shadcn/ui

---

## 🇫🇷 **LANGUE - RÈGLE ABSOLUE**

**TOUJOURS COMMUNIQUER EN FRANÇAIS UNIQUEMENT**
- ✅ Tous les messages en français
- ✅ Documentation en français
- ✅ Commentaires code en français
- ✅ Messages d'erreur en français
- ❌ JAMAIS utiliser l'anglais dans les réponses

---

## 🧠 **WORKFLOW RÉVOLUTIONNAIRE 2025**

**RÈGLE ABSOLUE** : Plan-First → Agent Orchestration → Console Clean → Deploy

### **🎯 Phase 1: PLAN-FIRST (Sequential Thinking Mandatory)**
```typescript
// TOUJOURS utiliser Sequential Thinking pour planification complexe
mcp__sequential-thinking__sequentialthinking
```

### **🤖 Phase 2: AGENT ORCHESTRATION (Systématique)**
```typescript
// Workflow type par phase
Think: Sequential Thinking + Serena (symbols overview)
Research: Context7 (docs officielles) + Serena (code analysis)
Implement: Serena (symbolic editing) + Supabase (data validation)
Test: Playwright (console errors) + Supabase (logs)
Deploy: GitHub (PR creation) + Vercel (auto-deployment)
Monitor: Sentry (real-time issues) + Supabase (advisors)
```

### **🚨 Phase 3: CONSOLE ERROR CHECKING (Règle Sacrée)**
```typescript
// JAMAIS déclarer succès avec erreurs console
1. Playwright: browser_console_messages()
2. Si erreurs → STOP → Fix ALL errors
3. Sentry MCP: escalate si critique
4. Re-test jusqu'à console 100% clean
```

### **📦 Phase 4: AUTO-UPDATE REPOSITORY**
```typescript
// Après CHAQUE tâche terminée
1. Update manifests/business-rules/ (règles validées)
2. Update MEMORY-BANK/active-context.md (session courante)
3. Update TASKS/completed/ (tâche archivée)
4. GitHub commit automatique avec description
```

### **🛡️ Phase 5: SECURITY & YOLO MODE (2025)**
```typescript
// Mode YOLO sécurisé UNIQUEMENT
1. Docker container isolation MANDATORY
2. Backup automatique avant modifications
3. Security scan avant exécution
4. Filesystem restrictions actives
5. Network isolation pour protection données
```

---

## 📁 **FILE ORGANIZATION RULES 2025**

**RÈGLE ABSOLUE** : JAMAIS créer de fichiers à la racine du projet

### **🎯 Classification Automatique des Fichiers**

#### **Documentation & Guides**
```typescript
// ✅ CORRECT placement
docs/
├── migrations/           # Migration guides (ex: MIGRATION_TESTS_2025.md)
├── architecture/         # Technical specifications
├── decisions/           # Architecture Decision Records (ADRs)
├── guides/             # User guides and tutorials
└── api/               # API documentation

// ❌ INTERDIT - Never at root
MIGRATION_TESTS_2025.md     # → docs/migrations/
REVOLUTION_2025.md          # → docs/guides/
API_SPEC.md                # → docs/api/
```

#### **Business & Project Management**
```typescript
// ✅ CORRECT placement
manifests/
├── business-rules/     # Validated business rules only
├── features/          # Feature specifications
├── prd/              # Product Requirements Documents
├── decisions/        # Business decisions with rationale
└── compliance/       # Legal and compliance docs

// ❌ INTERDIT - Never at root
BUSINESS_PLAN.md           # → manifests/prd/
FEATURE_SPEC.md           # → manifests/features/
COMPLIANCE.md             # → manifests/compliance/
```

#### **Session & Context Management**
```typescript
// ✅ CORRECT placement
MEMORY-BANK/
├── sessions/          # Individual session summaries
├── context/          # Persistent context between sessions
├── learnings/        # Key insights and patterns
└── archive/          # Completed session archives

// ❌ INTERDIT - Never at root
SESSION_SUMMARY.md        # → MEMORY-BANK/sessions/
CONTEXT_2025.md          # → MEMORY-BANK/context/
LEARNINGS.md             # → MEMORY-BANK/learnings/
```

#### **Task & Project Tracking**
```typescript
// ✅ CORRECT placement
TASKS/
├── active/           # Current work in progress
├── completed/        # Finished tasks with summaries
├── backlog/         # Future planned work
└── testing/         # Test plans and strategies

// ❌ INTERDIT - Never at root
TODO.md                   # → TASKS/active/
COMPLETED_TASKS.md       # → TASKS/completed/
TEST_PLAN.md             # → TASKS/testing/
```

### **🤖 Auto-Classification Rules**

#### **File Type Detection**
```typescript
// Automatic classification patterns
*.md + "migration" → docs/migrations/
*.md + "test plan" → TASKS/testing/
*.md + "business rule" → manifests/business-rules/
*.md + "session" → MEMORY-BANK/sessions/
*.md + "API" → docs/api/
*.md + "architecture" → docs/architecture/
*.md + "decision" → docs/decisions/
```

#### **Content-Based Classification**
```typescript
// Classification by content keywords
"PRD:" → manifests/prd/
"ADR:" → docs/decisions/
"Session:" → MEMORY-BANK/sessions/
"Migration:" → docs/migrations/
"Test Plan:" → TASKS/testing/
"Business Rule:" → manifests/business-rules/
```

### **📋 Auto-Update Workflow**

#### **Post-Task Automation (SYSTEMATIC)**
```bash
# Après chaque tâche terminée
/organize-files     # Classify and move files automatically
/session-summary   # Create summary in MEMORY-BANK/sessions/
/update-manifests  # Update business rules if needed
/context-preserve  # Update active context
```

#### **Quality Control Rules**
```typescript
// File placement validation
1. Scan root directory for misplaced files
2. Auto-suggest correct location based on content
3. Move files to appropriate directories
4. Update all references and links
5. Commit changes with descriptive message
```

---

## 🎮 **CUSTOM COMMANDS SYSTEM**

**Localisation** : `.claude/commands/` (voir dossier pour commandes disponibles)

### **Commandes Principales Disponibles**
```bash
/feature-start <name>     # Démarrer nouvelle fonctionnalité
/error-check              # Console error checking complet
/test-critical            # Tests essentiels uniquement (pas 677!)
/deploy-check             # Validation pré-déploiement
/context-update           # Mise à jour manifests/memory-bank
```

---

## 🤖 **AGENTS MCP - ORCHESTRATION INTELLIGENTE**

### **🧠 Serena - Code Intelligence (Usage Prioritaire)**
```typescript
// TOUJOURS utiliser avant modification code
mcp__serena__get_symbols_overview      // Explorer fichier
mcp__serena__find_symbol               // Localiser symboles
mcp__serena__replace_symbol_body       // Édition précise
mcp__serena__write_memory              // Context persistant
```

### **🗄️ Supabase - Database Operations**
```typescript
mcp__supabase__execute_sql             // Queries directes
mcp__supabase__get_logs                // Debug API
mcp__supabase__get_advisors            // Sécurité/performance
mcp__supabase__generate_typescript_types  // Types après migrations
```

### **🌐 Playwright - Browser Testing (Simplifié)**
```typescript
// FINI l'usine à gaz 677 tests !
mcp__playwright__browser_navigate      // Navigation ciblée
mcp__playwright__browser_console_messages  // Erreurs console
mcp__playwright__browser_snapshot      // Accessibility check
// Usage: 5-10 tests critiques MAX par module
```

### **📚 Context7 - Documentation Officielle**
```typescript
mcp__context7__resolve-library-id      // Find library docs
mcp__context7__get-library-docs        // Framework officiel
// TOUJOURS consulter avant implémentation nouvelle
```

### **🔧 Sequential Thinking - Architecture Complexe**
```typescript
mcp__sequential-thinking__sequentialthinking
// Usage: Planification, architecture, décisions complexes
// MANDATORY pour tâches > 3 étapes
```

### **🐙 GitHub - Repository Management**
```typescript
mcp__github__create_pull_request       // PR automatisées
mcp__github__create_branch             // Feature branches
mcp__github__push_files                // Commits batch
// GitHub Flow: feature → main (simple!)
```

### **🚨 Sentry MCP - Monitoring Production**
```typescript
mcp__sentry__get_recent_issues         // Issues temps réel
mcp__sentry__create_issue              // Escalation auto
// Monitoring continu sans tests manuels exhaustifs
```

### **🚀 Vercel - Deployment**
```typescript
// Auto-deployment sur push main
// Configuration CI/CD GitHub Actions
```

---

## 🧪 **STRATÉGIE TESTS RÉVOLUTIONNAIRE 2025**

### **❌ TERMINÉ : Système 677 Tests "Usine à Gaz"**
- Parser complexe supprimé
- Hooks sur-engineered supprimés
- Sync Supabase exhaustive supprimée

### **✅ NOUVEAU : Tests Ciblés Intelligents**
```typescript
// Dashboard: 5 tests critiques (vs 59)
// Catalogue: 7 tests essentiels (vs 134)
// Stocks: 4 tests bloquants (vs 87)
// Total: ~50 tests max (vs 677!)

// Stratégie:
1. Console Error Checking (Playwright) - PRIORITÉ 1
2. Sentry MCP monitoring temps réel - PRIORITÉ 2
3. Tests manuels ciblés browser - PRIORITÉ 3
4. Accessibility snapshots - PRIORITÉ 4
```

### **🎯 Tests par Module (Révolutionnaire)**
```bash
# Dashboard (5 tests vs 59)
/test-dashboard-critical   # KPIs load, navigation, errors

# Catalogue (7 tests vs 134)
/test-catalogue-core       # Products list, search, details

# Workflow automatisé
/error-check → /test-critical → /deploy-check
```

---

## ⚡ **COMMANDES ESSENTIELLES 2025**

```bash
# Développement
npm run dev              # Next.js development server
npm run build           # Production build validation
npm run lint            # ESLint + TypeScript check

# Workflows automatisés
/feature-start "nom"    # Custom command: branch + planning
/error-check            # Console error checking complet
/context-update         # Update manifests/memory-bank post-task

# Vérifications rapides
ls .claude/commands/    # Commandes disponibles
cat manifests/business-rules/WORKFLOWS.md  # Règles métier
```

---

## 🔄 **GITHUB FLOW SIMPLIFIÉ 2025**

### **Branching Strategy**
```bash
main                    # Production deployable
├── feature/dashboard   # Feature branches uniquement
├── feature/catalogue   # Auto-deployment on merge
└── hotfix/critical     # Emergency fixes only
```

### **Workflow Automatisé**
```typescript
1. /feature-start → Create branch + Sequential Planning
2. Code avec agents MCP systématiques
3. /error-check → Console 100% clean mandatory
4. /test-critical → Tests essentiels uniquement
5. GitHub PR avec description auto + deployment
6. /context-update → Update manifests/memory-bank
```

---

## 🚨 **RÈGLES BUSINESS CRITIQUES 2025**

### **Console Error Checking Protocol**
```typescript
// WORKFLOW OBLIGATOIRE (Règle Sacrée)
1. browser_console_messages() avant TOUTE validation
2. Zero tolerance: 1 erreur = échec système
3. Fix ALL errors before success declaration
4. Sentry MCP escalation si récurrent
```

### **Agent Usage Patterns**
```typescript
// Complex Planning: Sequential Thinking MANDATORY
// Code Changes: Serena symbolic analysis FIRST
// New Features: Context7 official docs REQUIRED
// Testing: Playwright console check ALWAYS
// Production: Sentry MCP monitoring CONTINUOUS
```

### **Repository Auto-Update**
```typescript
// Post-Task Automation (SYSTEMATIC)
manifests/business-rules/    # Validated rules
MEMORY-BANK/active-context/  # Current session
TASKS/completed/            # Archived tasks
// GitHub commit avec description détaillée
```

### **Design System Vérone (Unchanged)**
```css
/* Couleurs autorisées uniquement */
--verone-primary: #000000    /* Noir signature */
--verone-secondary: #FFFFFF  /* Blanc pur */
--verone-accent: #666666     /* Gris élégant */
/* INTERDIT ABSOLU: jaune/doré/ambre */
```

---

## 📁 **REPOSITORY STRUCTURE 2025**

```
.claude/                   # Claude Code 2025 configuration
├── commands/             # Custom slash commands
└── workflows/           # Agent orchestration templates

src/                     # Next.js application code
├── app/                # App Router (inchangé)
├── components/         # shadcn/ui + business
├── hooks/              # Supabase hooks optimisés
└── lib/                # Utilities et configurations

manifests/              # Business rules (auto-updated)
├── business-rules/     # Règles métier validées
├── prd/               # PRDs à jour
├── architecture/      # Schémas techniques
└── archive-2025/      # Archive automatique sessions

MEMORY-BANK/           # Context management system
├── active-context.md  # Session courante
├── ai-context.md      # Context IA persistant
└── process-archive/   # Sessions archivées

TASKS/                 # Task management (auto-updated)
├── active/           # Tâches en cours
├── completed/        # Tâches terminées
└── templates/        # Templates tâches

supabase/migrations/  # Database migrations uniquement
```

---

## 🎯 **SUCCESS METRICS 2025**

### **Performance Targets (Inchangés)**
- Dashboard <2s, Catalogue <3s, Feeds <10s, PDF <5s

### **Development Efficiency (Révolutionnaire)**
- **-80% temps tests** (50 vs 677 tests)
- **+300% vitesse dev** (agents systématiques)
- **0 erreur console** (checking automatisé)
- **10x déploiement** (GitHub Flow simple)

### **Quality Assurance**
- Console errors: 0 tolérance
- Agent utilization: 100% systematic
- Repository updates: 100% automatic
- Documentation: Always current

---

## 🏆 **RÉVOLUTION WORKFLOW 2025**

**Transformation complète :**
- ❌ **677 tests exhaustifs** → ✅ **50 tests ciblés**
- ❌ **Développement manuel** → ✅ **Agent orchestration**
- ❌ **Repository maintenance** → ✅ **Auto-update system**
- ❌ **GitFlow complexe** → ✅ **GitHub Flow simple**
- ❌ **Console errors ignored** → ✅ **Zero tolerance policy**

*Vérone Back Office 2025 - Professional AI-Assisted Development Excellence*