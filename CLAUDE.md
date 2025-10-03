# 🚀 Vérone Back Office - Configuration Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js + Supabase + shadcn/ui

---

## 🇫🇷 **LANGUE - RÈGLE ABSOLUE**

✅ **TOUJOURS en français** : messages, documentation, commentaires, erreurs
❌ **JAMAIS en anglais**

---

## 🧠 **WORKFLOW RÉVOLUTIONNAIRE 2025**

**RÈGLE** : Plan-First → Agent Orchestration → Console Clean → Deploy

### **Phase 1: PLAN-FIRST**
- Sequential Thinking **MANDATORY** pour planification complexe (>3 étapes)

### **Phase 2: AGENT ORCHESTRATION**
```typescript
Think     → Sequential Thinking + Serena
Research  → Context7 + Serena
Implement → Serena + Supabase
Test      → Playwright (MCP Browser) + Supabase
Deploy    → GitHub + Vercel
Monitor   → Sentry + Supabase
```

### **Phase 3: CONSOLE ERROR CHECKING (MCP BROWSER ONLY)**
```typescript
🚫 INTERDIT: Créer scripts test (*.js, *.mjs, *.ts)
✅ OBLIGATOIRE: MCP Playwright Browser direct

1. mcp__playwright__browser_navigate(url)
2. mcp__playwright__browser_console_messages()
3. Zero tolerance: 1 erreur = STOP → Fix → Re-test
4. mcp__playwright__browser_take_screenshot() (proof)
5. Sentry MCP escalation si critique
```

### **Phase 4: AUTO-UPDATE REPOSITORY**
```typescript
Après CHAQUE tâche:
1. Update manifests/business-rules/
2. Update MEMORY-BANK/active-context.md
3. Update TASKS/completed/
4. Git commit avec description
```

---

## 📁 **FILE ORGANIZATION - RÈGLE ABSOLUE**

**JAMAIS créer fichiers à la racine du projet**

### **Classification Automatique**
```typescript
// Documentation
docs/deployments/     → DEPLOYMENT-*.md
docs/migrations/      → MIGRATION-*.md
docs/architecture/    → Architecture specs
docs/guides/         → User guides

// Business
manifests/business-rules/  → Business rules validées
manifests/prd/            → PRDs
manifests/features/       → Feature specs

// Session Context
MEMORY-BANK/sessions/     → SESSION-*.md, RAPPORT-*.md
MEMORY-BANK/context/      → Contexte persistant
MEMORY-BANK/learnings/    → Insights clés

// Tasks
TASKS/completed/          → RAPPORT-*.md, RESUME-*.md
TASKS/testing/           → TEST-*.md, VALIDATION-*.md, START_HERE-*.md
TASKS/active/            → TODO-*.md
```

### **Auto-Classification Patterns**
```typescript
*.md + "DEPLOYMENT"  → docs/deployments/
*.md + "RAPPORT"     → TASKS/completed/
*.md + "SESSION"     → MEMORY-BANK/sessions/
*.md + "TEST"        → TASKS/testing/
*.md + "VALIDATION"  → TASKS/testing/
```

### **Post-Task Workflow (SYSTEMATIC)**
```bash
1. /organize-files     # Auto-classify
2. /session-summary   # Create in MEMORY-BANK/sessions/
3. /update-manifests  # Update business rules
4. /context-preserve  # Update active-context.md
5. Git commit
```

📚 **Détails complets** : [manifests/technical-workflows/file-organization-2025.md](manifests/technical-workflows/file-organization-2025.md)

---

## 🤖 **AGENTS MCP - ORCHESTRATION**

### **9 MCPs Disponibles**
- **Serena** : Code intelligence (symbolic editing)
- **Supabase** : Database operations
- **Playwright** : Browser testing (MCP direct, JAMAIS scripts)
- **Context7** : Documentation officielle
- **Sequential Thinking** : Planification complexe
- **GitHub** : Repository management
- **Sentry** : Monitoring production
- **Filesystem** : File operations sécurisées
- **Memory** : Knowledge graph persistant

### **7 Agents Spécialisés**
- **verone-orchestrator** : Coordination multi-modules
- **verone-design-expert** : UI/UX design system
- **verone-test-expert** : Tests E2E business workflows
- **verone-code-reviewer** : Code quality + security
- **verone-debugger** : Debug systématique
- **verone-performance-optimizer** : SLOs validation
- **verone-security-auditor** : Security + RLS audit

---

## 🧪 **STRATÉGIE TESTS 2025**

### **Révolution : 677 → 50 tests**
```typescript
Dashboard : 5 tests critiques (vs 59)
Catalogue : 7 tests essentiels (vs 134)
Stocks    : 4 tests bloquants (vs 87)

Priorités:
1. Console Error Checking (Playwright MCP)
2. Sentry MCP monitoring temps réel
3. Tests manuels ciblés browser
4. Accessibility snapshots
```

---

## ⚡ **COMMANDES ESSENTIELLES**

```bash
# Développement
npm run dev              # Next.js dev server
npm run build           # Production build
npm run lint            # ESLint + TypeScript

# Workflows
/feature-start "nom"    # Branch + planning
/error-check            # Console error checking
/test-critical          # Tests essentiels
/context-update         # Update manifests/memory-bank
```

---

## 🔄 **GITHUB FLOW**

```bash
main → Production deployable
├── feature/* → Feature branches
└── hotfix/*  → Emergency fixes

Workflow: /feature-start → Code → /error-check → /test-critical → PR → Deploy
```

---

## 🚨 **RÈGLES CRITIQUES**

### **Console Errors**
- **Zero tolerance** : 1 erreur console = échec total
- MCP Browser visible ALWAYS (transparence maximale)
- Fix ALL errors before success declaration

### **Agent Usage**
- Complex Planning → Sequential Thinking MANDATORY
- Code Changes → Serena symbolic analysis FIRST
- New Features → Context7 docs REQUIRED
- Testing → MCP Playwright Browser ALWAYS (JAMAIS scripts)

### **Design System Vérone**
```css
--verone-primary: #000000    /* Noir signature */
--verone-secondary: #FFFFFF  /* Blanc pur */
--verone-accent: #666666     /* Gris élégant */
/* INTERDIT: jaune/doré/ambre */
```

---

## 📁 **REPOSITORY STRUCTURE**

```
.claude/         # Claude Code config + agents
src/            # Next.js application
docs/           # Documentation technique
manifests/      # Business rules
MEMORY-BANK/    # Context management
TASKS/          # Task tracking
archive/        # Archives consolidées
```

---

## 🎯 **SUCCESS METRICS**

**Performance** : Dashboard <2s, Catalogue <3s, Feeds <10s, PDF <5s
**Quality** : 0 console errors, 100% agent usage, 100% auto-updates
**Efficiency** : -80% temps tests, +300% vitesse dev, 10x déploiement

---

## 🏆 **RÉVOLUTION 2025**

✅ **50 tests ciblés** (vs 677 exhaustifs)
✅ **Agent orchestration** (vs développement manuel)
✅ **Auto-update system** (vs maintenance manuelle)
✅ **GitHub Flow simple** (vs GitFlow complexe)
✅ **Zero tolerance errors** (vs errors ignorées)

*Vérone Back Office 2025 - Professional AI-Assisted Development Excellence*
