# /implement-wantitnow Command

## Description  
Phase d'implémentation TDD orchestrée avec coordination multi-agents pour features Want It Now avec business rules compliance.

## Usage
```
/implement-wantitnow [manifest-file] [phase?]
```

## Parameters
- `manifest-file`: Fichier manifeste créé par `/design-wantitnow` (required)
- `phase`: Phase TDD spécifique (red|green|verify) - optionnel, default: full cycle

## What it does

1. **📋 SETUP Phase**
   - Load implementation plan depuis manifeste
   - Validate business rules prerequisites  
   - Setup Smart Commit System avec backup
   - Activate TDD Enhanced output style

2. **🎭 ORCHESTRATOR COORDINATION**
   - Spawn wantitnow-orchestrator agent
   - Coordinate Playwright Expert + Shadcn Expert
   - Monitor business rules compliance
   - Track progress avec TodoWrite système

3. **🧪 TDD EXECUTION (Red → Green → Verify)**
   - **RED PHASE**: Tests business rules implementation
   - **GREEN PHASE**: Minimal code pour pass tests
   - **VERIFY PHASE**: User validation et performance check

4. **✅ QUALITY ASSURANCE**
   - Real-time Serena diagnostics
   - TypeScript compilation validation
   - Design system compliance check
   - Performance benchmarks validation

5. **🚀 SMART COMMIT & BACKUP**
   - Automatic smart commit avec traceability
   - Backup branch création à chaque phase
   - Business rules compliance documentation

## Examples

```bash
# Implementation complète depuis manifeste
/implement-wantitnow manifests/implementation-plans/phase-6-reservations.md

# Phase TDD spécifique seulement
/implement-wantitnow manifests/implementation-plans/quotas-validation.md red

# Continue implementation depuis phase green
/implement-wantitnow manifests/implementation-plans/property-photos.md green
```

## Execution Flow

### **Phase 1: Setup & Validation**
```markdown
## 📋 SETUP → Implementation Prerequisites

### 🔍 Manifest Validation
✅ **Business Rules**: [All rules loaded from manifest]
✅ **TDD Plan**: [Red/Green/Verify phases defined]
✅ **Agent Tasks**: [Coordination matrix confirmed]
✅ **Success Criteria**: [Benchmarks established]

### 🛡️ Prerequisites Check
- [ ] Manifests structure validated
- [ ] Business rules manifests accessible
- [ ] MCP tools connectivity confirmed
- [ ] Smart commit system ready

### 🚀 Environment Setup
- **Output Style**: TDD Enhanced activated
- **Backup Strategy**: Smart commit system enabled
- **Agent Coordination**: Orchestrator ready to spawn
- **Quality Gates**: Serena diagnostics monitoring
```

### **Phase 2: RED Phase (Tests First)**
```markdown
## 🔴 RED PHASE → Business Rules Tests Implementation

### 🧪 Tests Business Rules (Playwright Expert)
**Spawn Agent**: @agent-wantitnow-playwright-expert
**Task**: "Implement business rules test suite from [manifest-file]"

**Expected Results**:
- [ ] Business rule validation tests created
- [ ] Edge cases test scenarios implemented  
- [ ] Performance benchmark tests setup
- [ ] Tests failing as expected (RED phase success)

### 📊 Test Coverage Analysis
- **Business Rules**: [Expected coverage percentage]
- **Edge Cases**: [Boundary conditions tested]
- **Performance**: [Benchmark thresholds defined]

### ✅ RED Phase Completion Criteria
✅ All business rules tests implemented
✅ Tests failing with expected error messages
✅ Test coverage meets manifeste requirements
⭕ Implementation not yet created (expected)
```

### **Phase 3: GREEN Phase (Minimal Implementation)**
```markdown
## 🟢 GREEN PHASE → Minimal Implementation for Tests

### 🎨 UI Implementation (Shadcn Expert)
**Spawn Agent**: @agent-wantitnow-shadcn-expert  
**Task**: "Implement minimal UI components from [manifest-file] with Want It Now design"

**Expected Results**:
- [ ] Components created avec design system compliance
- [ ] Copper (#D4841A) et Green (#2D5A27) colors used
- [ ] Accessibility WCAG 2.1 AA standards met
- [ ] Responsive design implemented

### ⚙️ Backend Implementation (Orchestrator)
**Coordination**: Business logic implementation
- [ ] Server actions created/updated
- [ ] Database schema changes (if needed)
- [ ] Business rules validation implementation
- [ ] API endpoints avec proper error handling

### 📊 Real-time Quality Monitoring
- **Serena Diagnostics**: [TypeScript errors status]
- **Performance**: [Response time measurements]
- **Business Rules**: [Compliance validation status]

### ✅ GREEN Phase Completion Criteria  
✅ All tests passing
✅ Business rules compliance verified
✅ Design system standards met
✅ Performance benchmarks achieved
```

### **Phase 4: VERIFY Phase (User Validation)**
```markdown
## 🎯 VERIFY PHASE → Integration & User Validation

### 🔗 Integration Testing
- [ ] End-to-end workflows tested
- [ ] Cross-component integration verified
- [ ] Database consistency validated
- [ ] Performance under load tested

### 👤 User Validation Demo
**Demo Scenario**: [Specific user workflow from manifest]
- **Business Value**: [Clear value proposition]
- **User Experience**: [Smooth workflow demonstration]
- **Edge Cases**: [Error handling showcase]

### 📊 Final Quality Assessment
- **Business Rules**: [100% compliance confirmed]
- **Test Coverage**: [Actual coverage achieved]
- **Performance**: [Benchmarks met/exceeded]
- **User Feedback**: [Acceptance criteria satisfied]

### ✅ VERIFY Phase Completion Criteria
✅ Integration tests passing
✅ User acceptance criteria met
✅ Performance benchmarks satisfied  
✅ Business rules fully compliant
```

### **Phase 5: Smart Commit & Documentation**
```markdown
## 🚀 FINALIZATION → Smart Commit & Documentation

### 💾 Smart Commit Execution
**Commit Type**: [Auto-detected from changes]
**Message**: [Generated with full traceability]
**Backup**: [Backup branch created]

### 📚 Documentation Updates
- [ ] Manifeste marked as implemented
- [ ] Business rules compliance documented
- [ ] Performance benchmarks recorded
- [ ] User validation results logged

### 🎯 Next Steps Recommendations
1. **Deploy to Staging**: [If all criteria met]
2. **Additional Testing**: [If edge cases found]
3. **User Training**: [If UI changes significant]
4. **Performance Monitoring**: [If performance critical]
```

## Agent Coordination Details

### **🎭 Orchestrator Agent Responsibilities**
- Overall implementation coordination
- Business rules compliance monitoring
- Quality gates enforcement
- Cross-agent communication
- User validation coordination

### **🧪 Playwright Expert Agent Tasks**
- Business rules test suite création
- Edge cases et boundary testing
- Performance benchmarking
- Integration test scenarios
- Test maintenance et updates

### **🎨 Shadcn Expert Agent Tasks**
- UI components implementation
- Want It Now design system enforcement
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design multi-device
- Component library maintenance

## Smart Commit Integration

### **Automatic Commit Points**
- End of each TDD phase (Red/Green/Verify)
- Business rules milestone completion
- Integration testing completion
- User validation acceptance

### **Commit Message Templates Used**
- **RED Phase**: `🧪 TDD RED: [Feature] - Business Rules Tests`
- **GREEN Phase**: `✅ TDD GREEN: [Feature] - Minimal Implementation`  
- **VERIFY Phase**: `🎯 TDD VERIFY: [Feature] - User Validation Complete`
- **Final**: `🚀 FEATURE: [Feature] - TDD Complete & Business Rules Compliant`

## Error Handling & Recovery

### **Common Issues**

#### **Manifest File Not Found**
```bash
Error: Manifest file not found: [file-path]
Solution: 
1. Verify file path is correct
2. Run /design-wantitnow first to create manifest
3. Check manifests/ directory structure
```

#### **Business Rules Not Satisfied**
```bash
Error: Business rule compliance failed - [specific rule]
Solution:
1. Review business rule requirements in manifest
2. Check implementation against rule constraints
3. Run tests to identify specific failure points
4. Consult business rules manifests for clarification
```

#### **Agent Coordination Failure**
```bash  
Error: Agent spawn failed - [agent-name] unavailable
Solution:
1. Check .claude/settings.json agent configuration
2. Verify MCP tools connectivity
3. Restart Claude Code if necessary
4. Run manual implementation if agents unavailable
```

#### **Test Failures in RED Phase**
```bash
Success: Tests failing as expected in RED phase ✅
Action: Proceed to GREEN phase implementation
```

#### **Test Failures in GREEN Phase**
```bash
Error: Tests still failing after implementation
Solution:
1. Review implementation against business rules
2. Check test expectations vs implementation
3. Debug specific test failure points
4. Iterate implementation until tests pass
```

## Performance Monitoring

### **Real-time Metrics**
- **Compilation Time**: TypeScript build duration  
- **Test Execution**: Test suite run duration
- **Response Time**: API endpoint performance
- **Memory Usage**: Implementation resource consumption

### **Quality Thresholds**
- **Test Coverage**: Minimum 90% business logic
- **Performance**: API responses < 200ms
- **Accessibility**: WCAG 2.1 AA compliance 100%
- **Design System**: Want It Now compliance 100%

## Best Practices

### **Do's ✅**
- Always validate manifest file before starting
- Follow TDD phases strictly (Red → Green → Verify)
- Monitor business rules compliance continuously
- Use Smart Commit at each phase completion  
- Validate user acceptance before final commit
- Keep implementation minimal in GREEN phase
- Document all decisions et validation results

### **Don'ts ❌**
- Don't skip RED phase (tests first)
- Don't over-implement in GREEN phase
- Don't ignore business rules compliance warnings
- Don't proceed without user validation in VERIFY
- Don't commit without Smart Commit system
- Don't bypass quality gates ou diagnostics
- Don't ignore agent coordination failures

---

**Command `/implement-wantitnow` garantit une implémentation TDD complète avec business rules compliance et coordination multi-agents pour features Want It Now de haute qualité.**