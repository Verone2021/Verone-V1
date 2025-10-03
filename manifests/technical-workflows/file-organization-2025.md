# 📁 File Organization System - Professional Standards 2025

## 🎯 **RÈGLE ABSOLUE**

**JAMAIS créer de fichiers à la racine du projet**

---

## 📂 **Classification Automatique des Fichiers**

### **Documentation & Guides**
```typescript
// ✅ CORRECT placement
docs/
├── deployments/          # Deployment reports (DEPLOYMENT-REPORT-*.md)
├── migrations/           # Migration guides (MIGRATION_*.md)
├── architecture/         # Technical specifications
├── decisions/           # Architecture Decision Records (ADRs)
├── guides/             # User guides and tutorials
└── api/               # API documentation

// ❌ INTERDIT - Never at root
DEPLOYMENT_REPORT.md      # → docs/deployments/
MIGRATION_TESTS_2025.md   # → docs/migrations/
REVOLUTION_2025.md        # → docs/guides/
API_SPEC.md              # → docs/api/
```

### **Business & Project Management**
```typescript
// ✅ CORRECT placement
manifests/
├── business-rules/     # Validated business rules only
├── features/          # Feature specifications
├── prd/              # Product Requirements Documents
├── decisions/        # Business decisions with rationale
└── compliance/       # Legal and compliance docs

// ❌ INTERDIT - Never at root
BUSINESS_PLAN.md          # → manifests/prd/
FEATURE_SPEC.md          # → manifests/features/
COMPLIANCE.md            # → manifests/compliance/
```

### **Session & Context Management**
```typescript
// ✅ CORRECT placement
MEMORY-BANK/
├── sessions/          # Individual session summaries
├── context/          # Persistent context between sessions
├── learnings/        # Key insights and patterns
└── archive/          # Completed session archives

// ❌ INTERDIT - Never at root
SESSION_SUMMARY.md        # → MEMORY-BANK/sessions/
RAPPORT_SESSION.md        # → MEMORY-BANK/sessions/
CONTEXT_2025.md          # → MEMORY-BANK/context/
LEARNINGS.md             # → MEMORY-BANK/learnings/
```

### **Task & Project Tracking**
```typescript
// ✅ CORRECT placement
TASKS/
├── active/           # Current work in progress
├── completed/        # Finished tasks with summaries (RAPPORT-*.md)
├── backlog/         # Future planned work
└── testing/         # Test plans and strategies (TEST_*.md, VALIDATION_*.md)

// ❌ INTERDIT - Never at root
TODO.md                   # → TASKS/active/
RAPPORT_FINAL.md         # → TASKS/completed/
COMPLETED_TASKS.md       # → TASKS/completed/
TEST_PLAN.md             # → TASKS/testing/
VALIDATION_*.md          # → TASKS/testing/
START_HERE_*.md          # → TASKS/testing/
```

---

## 🤖 **Auto-Classification Rules**

### **File Type Detection (Pattern Matching)**
```typescript
// Automatic classification by filename patterns
*.md + "DEPLOYMENT" → docs/deployments/
*.md + "MIGRATION" → docs/migrations/
*.md + "RAPPORT" → TASKS/completed/
*.md + "SESSION" → MEMORY-BANK/sessions/
*.md + "TEST" → TASKS/testing/
*.md + "VALIDATION" → TASKS/testing/
*.md + "START_HERE" → TASKS/testing/
*.md + "RESUME" → TASKS/completed/
*.md + "business rule" → manifests/business-rules/
*.md + "API" → docs/api/
*.md + "architecture" → docs/architecture/
*.md + "decision" → docs/decisions/
```

### **Content-Based Classification**
```typescript
// Classification by content keywords (first 50 lines)
"PRD:" → manifests/prd/
"ADR:" → docs/decisions/
"Session:" → MEMORY-BANK/sessions/
"Migration:" → docs/migrations/
"Test Plan:" → TASKS/testing/
"Business Rule:" → manifests/business-rules/
"Deployment Report:" → docs/deployments/
```

---

## 📋 **Post-Task Automation Workflow**

### **SYSTEMATIC - Après CHAQUE tâche terminée**
```bash
1. /organize-files     # Classify and move files automatically
2. /session-summary   # Create summary in MEMORY-BANK/sessions/
3. /update-manifests  # Update business rules if needed
4. /context-preserve  # Update MEMORY-BANK/active-context.md
5. Git commit         # Commit with descriptive message
```

### **Quality Control Validation**
```typescript
// File placement validation checklist
1. Scan root directory for misplaced files
2. Auto-suggest correct location based on content
3. Move files to appropriate directories
4. Update all references and links in other files
5. Commit changes with descriptive message
6. Verify no files remain at root (except allowed)
```

### **Allowed Files at Root**
```bash
# Only these files are allowed at repository root:
README.md              # Project overview
CLAUDE.md             # Claude Code configuration
.gitignore            # Git configuration
package.json          # Node.js configuration
tsconfig.json         # TypeScript configuration
next.config.ts        # Next.js configuration
tailwind.config.ts    # Tailwind CSS configuration
.env.local.example    # Environment variables template
```

---

## 🔍 **File Organization Examples**

### **Example 1: Deployment Report**
```bash
# ❌ WRONG
/DEPLOYMENT-REPORT-MCP-AGENTS-2025.md

# ✅ CORRECT
/docs/deployments/deployment-mcp-agents-2025.md
```

### **Example 2: Session Summary**
```bash
# ❌ WRONG
/RAPPORT-SESSION-FINAL-2025-10-03.md
/RESUME-FINAL-SESSION.md

# ✅ CORRECT
/MEMORY-BANK/sessions/session-2025-10-03-final.md
/MEMORY-BANK/sessions/session-resume-2025-10-03.md
```

### **Example 3: Test Plans**
```bash
# ❌ WRONG
/START_HERE_TESTS_VALIDATION.md
/TESTS_WORKFLOW_SOURCING_COMPLET.md
/VALIDATION_FIXES_2_3_START_HERE.md

# ✅ CORRECT
/TASKS/testing/start-here-tests-validation.md
/TASKS/testing/tests-workflow-sourcing-complet.md
/TASKS/testing/validation-fixes-2-3.md
```

### **Example 4: Task Completion Reports**
```bash
# ❌ WRONG
/RAPPORT-FINAL-ERREURS-CRITIQUES.md

# ✅ CORRECT
/TASKS/completed/rapport-erreurs-critiques-2025-10-03.md
```

---

## 🚨 **Common Violations & Fixes**

### **Violation 1: Reports at Root**
```bash
# Problem: All session/task reports created at root
# Fix: Create in appropriate subdirectories

# Before:
ls /*.md
RAPPORT-*.md
SESSION-*.md
DEPLOYMENT-*.md

# After:
ls TASKS/completed/*.md
ls MEMORY-BANK/sessions/*.md
ls docs/deployments/*.md
```

### **Violation 2: Test Files at Root**
```bash
# Problem: Test plans and validation files at root
# Fix: Move to TASKS/testing/

# Before:
/START_HERE_*.md
/TESTS_*.md
/VALIDATION_*.md

# After:
TASKS/testing/start-here-*.md
TASKS/testing/tests-*.md
TASKS/testing/validation-*.md
```

### **Violation 3: Documentation at Root**
```bash
# Problem: Architecture and migration docs at root
# Fix: Move to docs/ subdirectories

# Before:
/MIGRATION_*.md
/ARCHITECTURE_*.md

# After:
docs/migrations/migration-*.md
docs/architecture/architecture-*.md
```

---

## ✅ **Success Criteria**

### **Repository Cleanliness**
- ✅ Root directory contains ONLY allowed config files
- ✅ All documentation in docs/
- ✅ All business rules in manifests/
- ✅ All session summaries in MEMORY-BANK/sessions/
- ✅ All task reports in TASKS/completed/
- ✅ All test plans in TASKS/testing/

### **Automated Validation**
```bash
# Run after each task
ls -1 *.md | wc -l    # Should be 2 (README.md + CLAUDE.md)
```

---

**File Organization 2025 : Professional Repository Standards** ✅

*Ce système garantit un repository propre et maintenable selon les meilleures pratiques professionnelles*
