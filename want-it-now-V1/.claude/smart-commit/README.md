# 🚀 Want It Now Smart Commit System

## 🎯 **Overview**

Système automatique de commit intelligent avec backup, traceability business rules, et templates TDD pour Want It Now.

## ⚡ **Quick Start**

### **Installation** 
```bash
# Script déjà configuré dans .claude/smart-commit/
chmod +x .claude/smart-commit/smart-commit.sh

# Optionnel: Créer alias global
echo 'alias wsc=".claude/smart-commit/smart-commit.sh"' >> ~/.bashrc
source ~/.bashrc
```

### **Usage Basique**
```bash
# Stage your changes first
git add .

# Run smart commit
./.claude/smart-commit/smart-commit.sh "Implement property validation"

# Ou avec alias
wsc "Add quotas business rule"
```

## 📋 **Commit Types & Detection**

### **🎯 Feature Implementation** 
```bash
wsc "Add property CRUD operations"
# Auto-détecte: nouveau composant, pages, API routes
# Template: Feature implementation avec TDD phases
```

### **⚖️ Business Rules**
```bash  
wsc "Implement quotas 100% validation" business-rules
# Auto-détecte: fichiers manifests/business-rules/, lib/validations/
# Template: Business rules compliance avec database constraints
```

### **🎨 UI Implementation**
```bash
wsc "Create property form with Want It Now design"
# Auto-détecte: components/, styles/, UI-related changes
# Template: Design system compliance avec accessibility
```

### **🐛 Bug Fix**
```bash
wsc "Fix auth timeout in SSR" bug-fix  
# Auto-détecte: mots-clés "fix", "bug" dans description
# Template: Root cause analysis avec prevention measures
```

### **🔧 Technical Improvement**
```bash
wsc "Optimize Supabase queries performance" 
# Auto-détecte: lib/, utils/, config/ modifications
# Template: Performance metrics avec rollback plan
```

## 🔒 **Backup Strategy**

### **Automatic Backups**
Chaque commit crée automatiquement:
- **Backup Branch**: `backup-YYYYMMDD_HHMMSS-[commit-type]`
- **Stash Snapshot**: Work-in-progress preservation
- **Manifest State**: Business rules snapshot

### **Backup Recovery**
```bash
# Voir tous les backups
git branch | grep backup

# Restaurer un backup spécifique  
git checkout backup-20241219_143022-business-rules

# Créer branch de recovery
git checkout -b recovery-quotas-fix
```

## 📊 **Commit Templates Explained**

### **🎯 Feature Implementation Template**
```
🎯 FEATURE: [Description] - [Business Rule Compliance]

## Summary
- Implementation: Clear description of what was built
- Business Rules: Which rules are now compliant  
- Testing: Coverage achieved and validation status

## TDD Phases Completed
✅ RED: Tests created with expected failures
✅ GREEN: Minimal implementation created
✅ VERIFY: User validation completed

## Files Changed
- Added/Modified/Removed with clear reasoning

## Business Impact
- Compliance status and performance metrics
- User experience improvements

## Traceability  
- Links to manifests, issues, project phases
```

### **⚖️ Business Rules Template**
```
⚖️ BUSINESS RULES: [Rule Name] - [Compliance Status]

## Rule Implementation
- Specific business rule enforced
- Validation mechanisms deployed  
- Edge cases properly handled

## Database Changes
- Schema modifications for rule enforcement
- Triggers and constraints implementation

## Test Coverage
- Unit tests for rule validation
- Integration tests for workflow compliance
- Edge case boundary testing
```

## 🎨 **Want It Now Integration**

### **Design System Compliance**
Tous les commits UI incluent automatiquement:
- ✅ **Colors**: Copper (#D4841A) et Green (#2D5A27) usage
- ✅ **Components**: shadcn/ui compliance
- ✅ **Accessibility**: WCAG 2.1 AA standards
- ✅ **Responsive**: Mobile-first design validation

### **Business Rules Validation**
Commits business rules incluent:
- ✅ **Quotas**: 100% ownership validation  
- ✅ **Booking**: Property XOR Unit constraints
- ✅ **Contracts**: Commission 10% calculations
- ✅ **Performance**: Database query optimization

## 🚀 **Advanced Usage**

### **Batch Commits avec Context**
```bash
# Multiple related changes
git add components/properties/
wsc "Property management UI implementation" ui-implementation

git add manifests/business-rules/quotas-validation.md  
wsc "Add quotas validation business rule" business-rules

git add actions/properties.ts
wsc "Property CRUD server actions" feature-implementation
```

### **Emergency Rollback**
```bash
# Quick rollback to last backup
git checkout $(git branch | grep backup | tail -1)

# Create emergency fix branch
git checkout -b emergency-fix-$(date +%s)

# Return to main after fix
git checkout main
git merge emergency-fix-xxxxx
```

### **Commit Log Analysis**
```bash  
# View smart commit history
tail -20 .claude/smart-commit/commit-log.txt

# Business rules commits only
git log --grep="BUSINESS RULES" --oneline

# Performance-related commits
git log --grep="IMPROVE" --oneline
```

## 🔧 **Configuration Options**

### **Environment Variables**
```bash
# Optional customization in .env
SMART_COMMIT_BACKUP_RETENTION=30  # Days to keep backups
SMART_COMMIT_AUTO_PUSH=false      # Auto-push after commit
SMART_COMMIT_RUN_TESTS=true       # Run tests before commit
```

### **Custom Templates**
```bash
# Add custom template
cp .claude/smart-commit/smart-commit-templates.md custom-templates.md
# Edit and customize for specific needs
```

## 📊 **Metrics & Analytics**

### **Commit Quality Metrics**
- **Business Rules Compliance**: Tracked per commit
- **Test Coverage**: Measured and reported
- **Performance Impact**: Response time tracking
- **Design System**: Component consistency validation

### **Project Health Dashboard**
```bash
# Generate health report
git log --grep="🎯\|⚖️\|🎨\|🐛\|🔧" --pretty=format:"%h %s" | head -20
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"No staged changes"**
```bash
# Solution: Stage your changes first
git add .
# Then run smart commit
wsc "Your commit description"
```

#### **"TypeScript errors"**  
```bash
# Smart commit continues with warnings
# Fix errors and create follow-up commit
wsc "Fix TypeScript compilation errors" bug-fix
```

#### **"Backup branch exists"**
```bash
# Clean old backups periodically  
git branch | grep backup | xargs git branch -D
```

## 🎯 **Best Practices**

### **Do's ✅**
- Stage changes before running smart commit
- Use descriptive commit descriptions
- Let auto-detection choose template type
- Review commit message preview before confirming
- Keep business rules compliance in mind

### **Don'ts ❌**  
- Don't commit unstaged changes
- Don't ignore TypeScript/linting errors consistently
- Don't skip user validation for business rules
- Don't delete backup branches immediately
- Don't bypass the commit message preview

---

**Le Smart Commit System garantit la traceability complète et la qualité TDD à chaque commit Want It Now.**