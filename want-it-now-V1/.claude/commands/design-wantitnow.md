# /design-wantitnow Command

## Description
Phase de design TDD pour nouvelles fonctionnalités Want It Now avec business rules analysis et agent coordination.

## Usage
```
/design-wantitnow [feature-name] [manifest-file?]
```

## Parameters
- `feature-name`: Nom de la fonctionnalité à designer (ex: "phase-6-reservations")
- `manifest-file`: Fichier manifeste existant (optionnel, pour mise à jour)

## What it does

1. **🔍 ANALYSE Phase (Explorer Enhanced)**
   - Activate Sequential Thinking pour analysis complexe
   - Lecture manifests business rules existants
   - Analysis via Serena de l'état actuel codebase
   - Documentation research via Context7 + Ref

2. **📋 PLANIFICATION Phase (TDD Planning)**  
   - Création/update manifeste dans `/manifests/implementation-plans/`
   - Coordination plan multi-agents (Orchestrator → Playwright + Shadcn)
   - Business rules validation strategy
   - TDD approach avec Red/Green/Verify phases

3. **👥 AGENT COORDINATION**
   - Spawn Orchestrator agent pour coordination globale
   - Planning tasks Playwright Expert (tests business rules)
   - Planning tasks Shadcn Expert (UI Want It Now design)

4. **⏹️ USER VALIDATION CHECKPOINT**
   - Présentation plan complet utilisateur
   - Validation business rules et approach TDD
   - Confirmation avant phase implémentation

## Examples

```bash
# Nouvelle fonctionnalité de base
/design-wantitnow property-photos-management

# Phase complexe avec manifeste existant  
/design-wantitnow phase-6-reservations manifests/implementation-plans/phase-6-reservations.md

# Business rule spécifique
/design-wantitnow contrats-commission-validation
```

## Output Structure

### **Phase 1: Analysis Results**
```markdown
## 🔍 ANALYSE → [Feature Name] Design Strategy

### 📊 Business Rules Identified
✅ **[Rule 1]**: [Description avec validation requirements]
⚠️ **[Constraint]**: [Risk analysis et mitigation]
🎯 **[Success Criteria]**: [Measurable outcomes]

### 🧠 Technical Context
- **Current State**: [Serena analysis results]
- **Dependencies**: [Prerequisites identifiés]
- **Impact Analysis**: [Files/components affected]

### 📚 Best Practices Research
- **Framework Patterns**: [Context7 documentation findings]
- **Architecture References**: [Ref technical patterns]
- **Similar Implementations**: [Industry best practices]
```

### **Phase 2: Implementation Plan**
```markdown
## 📋 PLANIFICATION → TDD Strategy & Multi-Agent Coordination

### 🧪 TDD Approach Structured
**RED PHASE** ⭕  
- [ ] Business rule tests: [Specific failing tests]
- [ ] Edge case coverage: [Boundary conditions]
- [ ] Performance benchmarks: [Expected thresholds]

**GREEN PHASE** ✅
- [ ] Minimal implementation: [Scope définition]  
- [ ] Business compliance: [Validation checkpoints]
- [ ] Integration points: [API/DB/UI connections]

**VERIFY PHASE** 🎯
- [ ] User acceptance: [Demo scenarios]
- [ ] Performance validation: [Metrics confirmation]
- [ ] Business rule verification: [Compliance testing]

### 👥 Agent Coordination Matrix
**🎭 Orchestrator Tasks**
- [ ] Business rules oversight
- [ ] Quality gate enforcement  
- [ ] Cross-agent coordination
- [ ] Requirements traceability

**🧪 Playwright Expert Tasks**  
- [ ] Business rules test suite
- [ ] Edge cases automation
- [ ] Performance test scenarios
- [ ] Integration test workflows

**🎨 Shadcn Expert Tasks**
- [ ] Want It Now design system implementation
- [ ] Component création avec copper/green colors
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Responsive design multi-device
```

### **Phase 3: User Validation Checkpoint**
```markdown
## ⏹️ VALIDATION CHECKPOINT → User Confirmation Required

### 📊 Design Summary
- **Feature Scope**: [Clear scope definition]
- **Business Rules**: [All rules identified and planned]
- **Technical Approach**: [Architecture and implementation strategy]
- **Multi-Agent Plan**: [Coordination strategy confirmed]

### 🎯 Success Criteria
- [ ] **Business Compliance**: 100% business rules satisfaction
- [ ] **Test Coverage**: >90% business logic coverage
- [ ] **Design System**: 100% Want It Now compliance
- [ ] **Performance**: [Specific benchmarks to achieve]

### 🚀 Next Steps Proposed
1. **Proceed to Implementation** → Use `/implement-wantitnow [manifest-file]`
2. **Revise Design Plan** → Iterate based on feedback
3. **Pause for Research** → Additional analysis required

**⚠️ USER CONFIRMATION REQUIRED BEFORE PROCEEDING**
```

## Integration Points

### **With Smart Commit System**
- Manifests créés sont automatically tagged pour traceability
- Commit messages include design phase completion
- Backup branches créées avant major design changes

### **With TDD Enhanced Output Style**
- Automatic activation du TDD Enhanced output style
- Structured progress tracking avec TodoWrite
- Business rules first approach enforcement

### **With Agent System**
- Automatic spawn du wantitnow-orchestrator agent
- Coordination instructions pour agents spécialisés
- Quality gates et validation checkpoints

## Error Handling

### **Missing Prerequisites**
```bash
# Error: Manifests directory not found
Error: /manifests/ directory structure required
Solution: Run project setup or create basic manifest structure

# Error: Business rules not defined  
Error: No business rules found for [feature-name]
Solution: Create business rule manifests first
```

### **Invalid Feature Names**
```bash
# Error: Feature name validation
Error: Feature name should be kebab-case (ex: property-photos)
Solution: Use descriptive kebab-case names
```

## Best Practices

### **Do's ✅**
- Always start avec business rules identification
- Use Sequential Thinking pour complex features
- Validate avec user avant implementation phase
- Include performance et accessibility considerations
- Document all decisions dans manifests

### **Don'ts ❌**
- Don't skip business rules analysis
- Don't proceed without user validation checkpoint  
- Don't ignore existing manifests et architecture
- Don't design without considering TDD approach
- Don't forget multi-agent coordination planning

---

**Command `/design-wantitnow` garantit une phase de design complète avec business rules first et coordination multi-agents pour TDD success.**