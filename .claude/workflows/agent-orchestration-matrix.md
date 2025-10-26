# 🤖 Agent Orchestration Matrix 2025

**Guide systématique** pour l'utilisation des 8 agents MCP selon les phases de développement

---

## 🎯 Philosophy: Right Agent, Right Time, Right Task

### **Core Principle**
Chaque agent MCP a des **forces spécifiques**. L'orchestration intelligente maximise l'efficacité en combinant leurs capacités selon un workflow structuré.

---

## 📋 Workflow Standard: Think → Research → Implement → Test → Deploy → Monitor

### **🧠 PHASE 1: THINK (Planning & Architecture)**

#### **Primary Agent: Sequential Thinking**
```typescript
// MANDATORY pour tâches complexes (>3 étapes)
mcp__sequential-thinking__sequentialthinking
```
**Usage Pattern:**
- Planification architectural
- Breakdown tâches complexes
- Décisions avec multiples variables
- Hypothesis generation & validation

#### **Secondary Agent: Serena (Context)**
```typescript
// Pour comprendre codebase existant
mcp__serena__read_memory
mcp__serena__get_symbols_overview
```
**Usage Pattern:**
- Récupérer context sessions précédentes
- Explorer structure code existant
- Identifier dépendances et impacts

---

### **📚 PHASE 2: RESEARCH (Information Gathering)**

#### **Primary Agent: Context7**
```typescript
// TOUJOURS consulter docs officielles AVANT implémentation
mcp__context7__resolve-library-id
mcp__context7__get-library-docs
```
**Usage Pattern:**
- Next.js, React, Tailwind documentation
- API references et best practices
- Framework patterns et examples

#### **Secondary Agent: Serena (Code Analysis)**
```typescript
// Analyse symbolique approfondie
mcp__serena__find_symbol
mcp__serena__find_referencing_symbols
mcp__serena__search_for_pattern
```
**Usage Pattern:**
- Localiser code existant pertinent
- Analyser impact des changements
- Comprendre architecture actuelle

#### **Tertiary Agent: Supabase (Data Context)**
```typescript
// Comprendre contraintes database
mcp__supabase__list_tables
mcp__supabase__get_advisors
```
**Usage Pattern:**
- Schema database current
- Contraintes et relations
- Sécurité et performance insights

---

### **⚙️ PHASE 3: IMPLEMENT (Development)**

#### **Primary Agent: Serena (Symbolic Editing)**
```typescript
// TOUJOURS utiliser pour modifications code
mcp__serena__replace_symbol_body
mcp__serena__insert_after_symbol
mcp__serena__insert_before_symbol
```
**Usage Pattern:**
- Éditions précises et ciblées
- Modifications sans casser architecture
- Préservation des patterns existants

#### **Secondary Agent: Supabase (Data Operations)**
```typescript
// Pour changements database
mcp__supabase__apply_migration
mcp__supabase__execute_sql
mcp__supabase__generate_typescript_types
```
**Usage Pattern:**
- Migrations schema database
- Tests queries et validations
- Types TypeScript synchronisés

#### **Context Preservation: Serena (Memory)**
```typescript
// Sauvegarder decisions et context
mcp__serena__write_memory
```
**Usage Pattern:**
- Décisions architecturales importantes
- Context pour sessions futures
- Learnings et insights

---

### **🧪 PHASE 4: TEST (Validation & Quality)**

#### **Primary Agent: Playwright (Console & UI Testing)**
```typescript
// RÈGLE SACRÉE: Console Error Checking FIRST
mcp__playwright__browser_console_messages
mcp__playwright__browser_navigate
mcp__playwright__browser_snapshot
```
**Usage Pattern:**
- Console errors detection (zero tolerance)
- Navigation et UI interactions
- Accessibility validation

#### **Secondary Agent: Supabase (Backend Validation)**
```typescript
// Valider backend et database
mcp__supabase__get_logs
mcp__supabase__get_advisors
```
**Usage Pattern:**
- API errors et performance
- Database health check
- Security recommendations

---

### **🚀 PHASE 5: DEPLOY (Release & Automation)**

#### **Primary Agent: GitHub**
```typescript
// Automated PR creation et deployment
mcp__github__create_pull_request
mcp__github__create_branch
mcp__github__push_files
```
**Usage Pattern:**
- Feature branches (GitHub Flow)
- PR avec descriptions automatiques
- Code reviews et merges

#### **Secondary Agent: Vercel (if available)**
```typescript
// Auto-deployment configuration
// Integration via GitHub Actions
```
**Usage Pattern:**
- Production deployments
- Preview deployments PR
- Environment management

---

### **📊 PHASE 6: MONITOR (Production & Maintenance)**

#### **Primary Agent: Sentry MCP (if available)**
```typescript
// Production monitoring temps réel
```
**Usage Pattern:**
- Erreurs production detection
- Performance monitoring
- Automatic issue escalation

#### **Secondary Agent: Supabase (Health Monitoring)**
```typescript
// Database et API monitoring
mcp__supabase__get_logs
mcp__supabase__get_advisors
```
**Usage Pattern:**
- Database performance
- API health checks
- Security audits réguliers

---

## 🎭 Agent Combination Patterns

### **Pattern 1: New Feature Development**
```typescript
1. Sequential Thinking → Plan feature architecture
2. Context7 → Research framework patterns
3. Serena → Analyze existing code structure
4. Serena → Implement with symbolic editing
5. Playwright → Test console errors + UI
6. GitHub → Create PR with deployment
7. Serena → Write memory with learnings
```

### **Pattern 2: Bug Investigation**
```typescript
1. Playwright → Reproduce error (console check)
2. Supabase → Check API logs for issues
3. Serena → Find referencing symbols
4. Sequential Thinking → Analyze root cause
5. Serena → Apply targeted fix
6. Playwright → Validate fix (console clean)
7. GitHub → Create hotfix PR
```

### **Pattern 3: Performance Optimization**
```typescript
1. Playwright → Baseline performance measurement
2. Supabase → Database performance analysis
3. Context7 → Research optimization patterns
4. Sequential Thinking → Plan optimization strategy
5. Serena → Implement optimizations
6. Playwright → Validate improvements
7. Sentry → Monitor production impact
```

### **Pattern 4: Architecture Refactoring**
```typescript
1. Sequential Thinking → Plan refactoring approach
2. Serena → Map all affected symbols
3. Serena → Analyze dependencies (referencing symbols)
4. Context7 → Research modern patterns
5. Serena → Execute refactoring systematically
6. Playwright → Comprehensive testing
7. Supabase → Validate data integrity
8. GitHub → Large PR with detailed description
```

---

## ⚡ Quick Reference: Agent by Task Type

### **📝 Code Analysis & Understanding**
- **Serena** → `get_symbols_overview`, `find_symbol`
- **Serena** → `find_referencing_symbols` for impact analysis

### **🔍 Research & Documentation**
- **Context7** → `resolve-library-id`, `get-library-docs`
- **Supabase** → `list_tables`, `get_advisors`

### **⚙️ Code Implementation**
- **Serena** → `replace_symbol_body`, `insert_after_symbol`
- **Supabase** → `apply_migration`, `execute_sql`

### **🧪 Testing & Validation**
- **Playwright** → `browser_console_messages` (PRIORITY #1)
- **Playwright** → `browser_navigate`, `browser_snapshot`
- **Supabase** → `get_logs` for API debugging

### **📋 Planning & Decision Making**
- **Sequential Thinking** → `sequentialthinking` for complex problems
- **Serena** → `write_memory` for context preservation

### **🚀 Deployment & Automation**
- **GitHub** → `create_pull_request`, `push_files`
- **Sentry** → `get_recent_issues` for monitoring

---

## 🚨 Critical Rules (Never Break)

### **RULE 1: Console Error Checking First**
```typescript
// TOUJOURS avant toute validation
mcp__playwright__browser_console_messages
// Zero errors = proceed, Any error = STOP & FIX
```

### **RULE 2: Serena Before Code Changes**
```typescript
// TOUJOURS analyser avant modifier
mcp__serena__get_symbols_overview
mcp__serena__find_symbol // locate target
// Then: replace_symbol_body or insert_*
```

### **RULE 3: Context7 Before New Implementation**
```typescript
// TOUJOURS consulter docs officielles
mcp__context7__resolve-library-id
mcp__context7__get-library-docs
// Never implement without official patterns
```

### **RULE 4: Sequential Thinking for Complex Tasks**
```typescript
// Tasks >3 steps = MANDATORY Sequential Thinking
mcp__sequential-thinking__sequentialthinking
// Plan first, execute second
```

### **RULE 5: Memory Preservation**
```typescript
// TOUJOURS after major changes
mcp__serena__write_memory
// Context for future sessions
```

---

## 🎯 Success Metrics

### **Agent Utilization Target**
- ✅ **100% Console Error Checking** on all validations
- ✅ **100% Serena Analysis** before code changes
- ✅ **100% Context7 Research** for new implementations
- ✅ **100% Sequential Thinking** for complex planning
- ✅ **100% Memory Updates** after major work

### **Quality Indicators**
- ✅ **Zero console errors** in production
- ✅ **Zero breaking changes** (proper impact analysis)
- ✅ **Documentation always current** (auto-updates)
- ✅ **Context preserved** between sessions

---

*Agent Orchestration Matrix 2025 - Maximize AI-Assisted Development Efficiency*