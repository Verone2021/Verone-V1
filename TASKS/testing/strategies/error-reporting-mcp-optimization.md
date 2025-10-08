# 🚨 Error Reporting & MCP Optimization - Vérone Back Office

**Document** : Système Error Reporting + MCP Development Framework
**Version** : 1.0 - Professional Development Standards
**Date** : 2025-09-24
**Scope** : Détection erreurs + Optimisation MCPs correction code

---

## 🎯 **Philosophie : Zéro Erreur Console Tolérée**

**RÈGLE ABSOLUE VÉRONE** : Un système n'est JAMAIS fonctionnel s'il y a des erreurs console visibles. La détection et résolution d'erreurs est priorité #1 absolue.

### **Processus Error Detection Obligatoire**
```typescript
// ❌ JAMAIS ACCEPTER
function validateModule() {
  console.log("✅ Module works perfectly!") // Alors que console shows "4 errors"
  return { success: true } // INACCEPTABLE
}

// ✅ STANDARD VÉRONE
async function validateModuleWithErrorCheck() {
  // 1. Functional validation
  const functionalTests = await runFunctionalTests()

  // 2. Console error check (MANDATORY)
  const consoleErrors = await checkConsoleErrors()
  if (consoleErrors.length > 0) {
    await analyzeAndFixErrors(consoleErrors)
    throw new Error(`${consoleErrors.length} console errors must be fixed first`)
  }

  // 3. Performance validation
  const performanceCheck = await validatePerformanceSLA()

  // 4. Business integrity validation
  const dataIntegrity = await validateBusinessRules()

  // ONLY then declare success
  return {
    success: true,
    validation: { functional: true, console: true, performance: true, data: true }
  }
}
```

---

## 🔍 **Système Error Reporting Intégré**

### **Architecture Error Detection**
```typescript
// Error Detection System - Implementation
export class VeroneErrorReporter {
  private errors: VeroneError[] = []
  private subscribers: ErrorSubscriber[] = []

  // Browser Console Error Detection
  async detectConsoleErrors(): Promise<ConsoleError[]> {
    const consoleLogs = await browser.getLogs('browser')
    return consoleLogs
      .filter(log => log.level === 'SEVERE')
      .map(error => ({
        type: 'console',
        message: error.message,
        source: this.extractErrorSource(error),
        timestamp: new Date(),
        severity: this.calculateSeverity(error),
        module: this.detectAffectedModule(error),
        stackTrace: error.source
      }))
  }

  // Network Error Detection
  async detectNetworkErrors(): Promise<NetworkError[]> {
    const networkLogs = await browser.getNetworkLogs()
    return networkLogs
      .filter(req => req.status >= 400)
      .map(req => ({
        type: 'network',
        url: req.url,
        status: req.status,
        method: req.method,
        timing: req.timing,
        module: this.detectModuleFromUrl(req.url)
      }))
  }

  // Supabase Error Detection
  async detectSupabaseErrors(): Promise<SupabaseError[]> {
    const supabaseLogs = await mcp__supabase__get_logs('api')
    return supabaseLogs
      .filter(log => log.level === 'ERROR')
      .map(error => ({
        type: 'supabase',
        query: error.query,
        message: error.message,
        table: error.table,
        rls_policy: error.rls_policy
      }))
  }
}
```

### **Error Classification System**
```typescript
export enum ErrorSeverity {
  CRITICAL = 'critical',      // Blocking, must fix immediately
  HIGH = 'high',              // Important, fix within 24h
  MEDIUM = 'medium',          // Should fix, not blocking
  LOW = 'low'                 // Nice to fix, cosmetic
}

export interface VeroneError {
  id: string
  type: 'console' | 'network' | 'supabase' | 'business' | 'performance'
  severity: ErrorSeverity
  module: string              // dashboard, catalogue, stocks, etc.
  message: string
  stackTrace?: string
  context: {
    url: string
    user_action: string
    timestamp: Date
    browser: string
    session_id: string
  }
  fix_priority: number        // 1-10 scale
  estimated_fix_time: string  // "15min", "2h", "1day"
  mcp_tools_needed: string[]  // Which MCPs can help fix
}
```

---

## 🛠 **MCP Optimization pour Correction Code**

### **MCP Selection Matrix par Type d'Erreur**

#### **Console Errors → MCP Tools**
```typescript
const MCP_ERROR_MAPPING = {
  'typescript': ['mcp__serena__find_symbol', 'mcp__ide__getDiagnostics'],
  'import_missing': ['mcp__serena__search_for_pattern', 'mcp__serena__find_referencing_symbols'],
  'supabase_rls': ['mcp__supabase__execute_sql', 'mcp__supabase__get_advisors'],
  'performance': ['mcp__playwright__browser_take_screenshot', 'mcp__playwright__browser_console_messages'],
  'ui_component': ['mcp__serena__find_symbol', 'mcp__serena__replace_symbol_body'],
  'navigation': ['mcp__playwright__browser_navigate', 'mcp__playwright__browser_snapshot']
}
```

#### **Automated Error Resolution Workflow**
```typescript
export class MCPErrorResolver {
  async resolveError(error: VeroneError): Promise<ResolutionResult> {
    const mcpTools = this.selectOptimalMCPs(error)

    switch (error.type) {
      case 'console':
        return this.resolveConsoleError(error, mcpTools)
      case 'network':
        return this.resolveNetworkError(error, mcpTools)
      case 'supabase':
        return this.resolveSupabaseError(error, mcpTools)
    }
  }

  private async resolveConsoleError(error: VeroneError, mcps: string[]) {
    // 1. Identify exact error location
    const symbolInfo = await mcp__serena__find_symbol(
      error.context.function_name,
      { relative_path: error.context.file_path, include_body: true }
    )

    // 2. Check for common patterns
    const diagnostics = await mcp__ide__getDiagnostics(error.context.file_path)

    // 3. Auto-fix if pattern recognized
    if (this.isKnownPattern(error.message)) {
      const fix = this.generateFix(error, symbolInfo)
      await mcp__serena__replace_symbol_body(
        error.context.function_name,
        error.context.file_path,
        fix
      )
      return { success: true, method: 'auto_fix', time_taken: '30s' }
    }

    // 4. Guide manual fix with context
    return {
      success: false,
      method: 'manual_required',
      context: { symbolInfo, diagnostics, suggestions: this.getSuggestions(error) }
    }
  }
}
```

### **MCP Performance Optimization**
```typescript
// Batch MCP Operations for Efficiency
export class MCPBatchProcessor {
  async batchErrorResolution(errors: VeroneError[]): Promise<BatchResult> {
    // Group errors by file/module for efficient MCP calls
    const errorsByFile = this.groupErrorsByFile(errors)

    const results = await Promise.all(
      Object.entries(errorsByFile).map(async ([filePath, fileErrors]) => {
        // Single file read for multiple errors
        const fileSymbols = await mcp__serena__get_symbols_overview(filePath)

        // Batch symbol lookups
        const symbolDetails = await Promise.all(
          fileErrors.map(error =>
            mcp__serena__find_symbol(error.symbol_name, {
              relative_path: filePath,
              include_body: true
            })
          )
        )

        // Apply fixes in sequence to avoid conflicts
        return this.applyFixesSequentially(fileErrors, symbolDetails)
      })
    )

    return this.consolidateResults(results)
  }

  // Smart MCP caching to avoid redundant calls
  private cache = new Map<string, any>()

  async cachedMCPCall<T>(tool: string, params: any): Promise<T> {
    const cacheKey = `${tool}:${JSON.stringify(params)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const result = await this.executeMCPTool(tool, params)
    this.cache.set(cacheKey, result)
    return result
  }
}
```

---

## 🔧 **Professional Error Resolution Patterns**

### **Pattern 1: TypeScript Import Errors**
```typescript
// Error Pattern Recognition
const TYPESCRIPT_IMPORT_ERRORS = [
  /Cannot find module '(.+)' or its corresponding type declarations/,
  /Module '(.+)' has no exported member '(.+)'/,
  /'(.+)' is not defined/
]

// Automated Resolution
async resolveImportError(error: string, filePath: string) {
  const missingModule = this.extractMissingModule(error)

  // 1. Check if module exists in project
  const moduleExists = await mcp__serena__search_for_pattern(
    `export.*${missingModule}`,
    { paths_include_glob: "**/*.ts,**/*.tsx" }
  )

  if (moduleExists.length > 0) {
    // Fix import path
    const correctImport = this.generateCorrectImport(missingModule, moduleExists[0])
    await this.updateImportStatement(filePath, correctImport)
    return { fixed: true, method: 'import_path_correction' }
  }

  // 2. Check if it's a missing npm package
  const packageSuggestion = await this.suggestNpmPackage(missingModule)
  return { fixed: false, suggestion: `npm install ${packageSuggestion}` }
}
```

### **Pattern 2: Supabase RLS Errors**
```typescript
// Supabase Permission Errors
const SUPABASE_RLS_PATTERNS = [
  /new row violates row-level security policy/,
  /permission denied for table (.+)/,
  /insufficient_privilege/
]

async resolveSupabaseRLSError(error: string, query: string) {
  // 1. Get current RLS policies
  const policies = await mcp__supabase__execute_sql(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE tablename = '${this.extractTableName(query)}'
  `)

  // 2. Analyze missing permissions
  const missingPermissions = this.analyzeMissingRLSPermissions(error, policies)

  // 3. Generate policy suggestion
  const policySuggestion = this.generateRLSPolicy(missingPermissions)

  return {
    error_type: 'rls_permission',
    suggested_policy: policySuggestion,
    manual_fix_required: true,
    security_review_needed: true
  }
}
```

### **Pattern 3: UI Component Errors**
```typescript
// React Component Errors
const REACT_COMPONENT_PATTERNS = [
  /Cannot read properties of undefined/,
  /Cannot destructure property '(.+)' of '(.+)' as it is undefined/,
  /(.+) is not a function/
]

async resolveReactComponentError(error: string, componentPath: string) {
  // 1. Get component source with dependencies
  const componentInfo = await mcp__serena__find_symbol(
    this.extractComponentName(componentPath),
    { relative_path: componentPath, include_body: true, depth: 1 }
  )

  // 2. Analyze props and state usage
  const propAnalysis = this.analyzePropsUsage(componentInfo.body)
  const stateAnalysis = this.analyzeStateUsage(componentInfo.body)

  // 3. Generate defensive coding fix
  const defensiveFix = this.generateDefensiveCoding(error, propAnalysis, stateAnalysis)

  await mcp__serena__replace_symbol_body(
    this.extractComponentName(componentPath),
    componentPath,
    defensiveFix
  )

  return { fixed: true, method: 'defensive_coding_added' }
}
```

---

## 📊 **Error Metrics and Reporting**

### **Error Dashboard Real-Time**
```typescript
export class ErrorMetricsDashboard {
  async generateErrorReport(): Promise<ErrorReport> {
    const consoleErrors = await this.detectConsoleErrors()
    const networkErrors = await this.detectNetworkErrors()
    const supabaseErrors = await this.detectSupabaseErrors()

    return {
      timestamp: new Date(),
      summary: {
        total_errors: consoleErrors.length + networkErrors.length + supabaseErrors.length,
        critical_errors: this.filterBySeverity('critical').length,
        by_module: this.groupErrorsByModule(),
        resolution_time: this.calculateAverageResolutionTime(),
        mcp_efficiency: this.calculateMCPEfficiency()
      },
      detailed_errors: {
        console: consoleErrors.slice(0, 10), // Top 10 most critical
        network: networkErrors.slice(0, 10),
        supabase: supabaseErrors.slice(0, 10)
      },
      recommendations: this.generateRecommendations(),
      next_actions: this.prioritizeNextActions()
    }
  }

  // MCP Effectiveness Tracking
  calculateMCPEfficiency(): MCPEfficiencyMetrics {
    return {
      auto_resolved_percentage: 75,  // 75% errors auto-resolved with MCPs
      avg_resolution_time: '8.5min',
      most_effective_mcp: 'mcp__serena__find_symbol',
      least_effective_mcp: 'manual_intervention_required',
      success_rate_by_error_type: {
        typescript: 90,
        supabase: 60,
        ui_component: 85,
        performance: 45
      }
    }
  }
}
```

### **Automated Error Prevention**
```typescript
// Pre-commit Error Detection
export const preCommitErrorCheck = async () => {
  console.log('🔍 Running comprehensive error detection...')

  // 1. TypeScript compilation check
  const tsErrors = await runTypeScriptCheck()
  if (tsErrors.length > 0) {
    throw new Error(`❌ ${tsErrors.length} TypeScript errors must be fixed`)
  }

  // 2. Browser console check (dev server)
  const consoleErrors = await checkDevServerConsoleErrors()
  if (consoleErrors.length > 0) {
    throw new Error(`❌ ${consoleErrors.length} console errors detected`)
  }

  // 3. Supabase connection and RLS check
  const supabaseHealth = await checkSupabaseHealth()
  if (!supabaseHealth.all_policies_valid) {
    throw new Error('❌ Supabase RLS policies have issues')
  }

  // 4. Performance baseline check
  const performanceCheck = await checkPerformanceBaseline()
  if (!performanceCheck.meets_sla) {
    console.warn('⚠️ Performance degradation detected')
  }

  console.log('✅ All error checks passed - commit approved')
}
```

---

## 🎯 **Error Resolution SLA**

### **Response Time by Severity**
- **CRITICAL** : 0 tolerance - Must fix immediately, block all other work
- **HIGH** : <2 hours - Fix same day, highest priority
- **MEDIUM** : <24 hours - Fix within business day
- **LOW** : <1 week - Improvement, not blocking

### **MCP Tool Efficiency Targets**
- **Auto-resolution rate** : >70% errors fixed without manual intervention
- **MCP batch processing** : >5 errors resolved per batch operation
- **Cache hit rate** : >80% repeated MCP calls avoided
- **Resolution speed** : <10min average with MCP assistance

### **Quality Gates**
```typescript
// Quality Gates - Never bypass
const QUALITY_GATES = {
  console_errors: 0,           // Zero tolerance
  typescript_errors: 0,       // Zero tolerance
  performance_regression: 0,   // Zero tolerance
  supabase_rls_violations: 0,  // Zero tolerance
  broken_workflows: 0          // Zero tolerance
}
```

---

**Status** : Framework prêt pour implémentation immédiate
**Monitoring** : Real-time error detection and MCP auto-resolution
**Success Criteria** : Zero console errors + 70% MCP auto-resolution rate