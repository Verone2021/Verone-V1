# 📄 Claude Configuration — Auto-loaded by Claude Code

> This file is automatically loaded by Claude Code at project start to provide context, rules, and configuration.

## 🗂 Project Overview

**Want It Now V1** - Real estate management SaaS with **TDD Enhanced Architecture** and **Business Rules First** methodology.  
Designed for **Next.js + React + shadcn/ui + Tailwind CSS + Supabase + Vercel** with specialized agent coordination.

### **🎯 Business Rules & Expertise (Core)**
@manifests/business-rules/quotites-validation.md
@manifests/business-rules/booking-constraints.md

### **🏛️ Architecture & Database (Critical)**
@manifests/architecture/business-architecture.md
@manifests/architecture/database-schema.md

### **📊 Technical Specifications (Performance & Security)**
@manifests/technical-specs/performance-targets.md
@manifests/technical-specs/security-requirements.md

### **💡 Process Learnings (ROI & Methodology)**
@manifests/process-learnings/phase1-cleanup-metrics.md

### **🎨 Want It Now Design System**  
@manifests/design-specifications/want-it-now-design-system.md

### **📋 Implementation Roadmap**
@manifests/implementation-plans/phase-overview.md

### **🤖 Agent Coordination Available**
- **@wantitnow-orchestrator** : Complex TDD phases coordination with business rules compliance
- **@wantitnow-playwright-expert** : Comprehensive testing for real estate business workflows 
- **@shadcn-wantitnow-ui-expert** : Want It Now design system enforcement with copper/green branding

### **⚡ TDD Enhanced Workflow** 
- **Design Phase**: `/design-wantitnow [feature-name]` - Business rules analysis + agent coordination planning
- **Implementation Phase**: `/implement-wantitnow [manifest-file]` - Red/Green/Verify with quality gates
- **Smart Commit**: `./.claude/smart-commit/smart-commit.sh "description"` - Automatic backup + traceability

## 🛠 MCP Servers Available

### 🗄 **Supabase** — Database & Storage
- **Status**: ✅ Pre-configured in `.mcp.json`  
- **Features**: Database queries, storage management
- **Requires**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`
- **Security Note**: `SUPABASE_ACCESS_TOKEN` is private — never commit to public repos.

### 📚 **Context7** — Documentation
- **Features**: Tailwind CSS, Next.js, Shadcn UI, React docs
- **Usage**: Instant access to framework documentation
- **No config required**

### 🔧 **Serena** — Enhanced Editing
- **Status**: ✅ Configured via `claude mcp add` command
- **Features**: Language diagnostics, code analysis, IDE-like capabilities
- **Context**: `ide-assistant` mode activated
- **Project Path**: Auto-detected for current working directory
- **Installation**: `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)`
- **Capabilities**: TypeScript/JavaScript diagnostics, project structure analysis
- **Recommendation**: Essential for large projects - provides real-time code quality feedback

### 🔍 **Ref** — Technical References & API Search
- **Status**: ✅ Configured via HTTP transport with API key
- **Features**: Technical documentation search, API references, code examples
- **Transport**: HTTP-based MCP server
- **Installation**: `claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=YOUR_API_KEY"`
- **Capabilities**: Real-time access to programming references, documentation lookup, code pattern search
- **Recommendation**: Complements Context7 for extended technical reference coverage

### 🧠 **Sequential Thinking** — Structured Problem Solving
- **Status**: ✅ Configured via NPX with official MCP package
- **Features**: Dynamic and reflective problem-solving through structured thinking process
- **Installation**: `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`
- **Capabilities**: 
  - Break down complex problems into manageable steps
  - Revise and refine thoughts as understanding deepens
  - Branch into alternative paths of reasoning
  - Generate and verify solution hypotheses
- **Use Cases**: Architecture planning, complex debugging, refactoring strategies, database design
- **Recommendation**: Essential for systematic approach to complex development challenges

### 🎭 **Playwright** — Browser Automation & Testing
- **Status**: ✅ Configured via NPX with official Playwright MCP package
- **Features**: Professional browser automation using Playwright engine
- **Installation**: `claude mcp add playwright -- npx @playwright/mcp`
- **Capabilities**:
  - Cross-browser automation (Chrome, Firefox, Safari, Edge)
  - Web scraping and content analysis
  - Form filling and user interaction simulation
  - Screenshot and video recording
  - Mobile device emulation
  - Network interception and mocking
- **Use Cases**: E2E testing, QA automation, web scraping, UI validation, performance testing
- **Recommendation**: Professional-grade browser automation - superior to basic browser extensions
- **Integration**: Perfect complement to Sequential Thinking for test planning and Serena for code analysis

### 🐙 **GitHub** — Repository Management  
- **Requires**: `GITHUB_TOKEN` environment variable
- **Features**: Issues, PRs, commits, repository management
- **Scopes needed**: `repo`, `workflow`

### 🚀 **Vercel** — Deployment Management
- **Requires**: `VERCEL_API_TOKEN` environment variable  
- **Features**: Deploy logs, project configuration, builds

### 📝 **Notion** — Documentation & Knowledge
- **Requires**: `NOTION_API_KEY` environment variable
- **Features**: Access to Notion databases and pages

---

## 🧱 Tech Stack
- **Framework**: Next.js (React 18)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend/DB**: Supabase
- **Deployment**: Vercel
- **Language**: TypeScript

---

## 📊 **Logging System — Advanced Debugging & Monitoring**

> **Logging System Status**: ✅ **FULLY IMPLEMENTED** - D-Log inspired structured logging with Claude Code integration

### 🎯 **System Overview**

The application features a comprehensive logging system designed for modern Next.js development and seamless Claude Code debugging workflows. Based on industry best practices and inspired by D-Log functionality.

#### **🚀 Key Features**
- **Structured Logging**: Pino-based with TypeScript for full type safety
- **Auto-Logging**: D-Log style decorators for automatic function logging
- **Performance Monitoring**: Core Web Vitals, API response times, database query tracking
- **Multi-tenant Aware**: Automatic user/organization context injection
- **Claude Code Ready**: Export functionality for instant debugging with Claude
- **Error Boundaries**: Automatic error capture with rich context
- **Development UX**: Beautiful console output with emojis and colors

### 🛠 **Core Components**

#### **📋 Configuration Files**
- **`next.config.js`** ✅ - Enhanced with comprehensive logging options
- **`package.json`** ✅ - Added Pino dependencies (`pino`, `pino-pretty`)
- **`middleware.ts`** ✅ - Integrated logging middleware for all requests

#### **🧩 Core Libraries**
- **`lib/logger.ts`** ✅ - **Main logger with D-Log style features**
- **`lib/logger/types.ts`** ✅ - Complete TypeScript definitions
- **`lib/logger/formatters.ts`** ✅ - Environment-specific formatting

#### **⚛️ React Integration**
- **`hooks/use-logger.ts`** ✅ - React hook with automatic context detection
- **`components/providers/logging-provider.tsx`** ✅ - Global logging context
- **`components/ui/error-boundary.tsx`** ✅ - Error boundary with auto-logging
- **`app/layout.tsx`** ✅ - Root-level logging integration

#### **🔧 Middleware & Analysis**
- **`middleware/logging-middleware.ts`** ✅ - Request/response logging
- **`scripts/log-analyzer.js`** ✅ - **Claude Code export tool**

### 💡 **Usage Examples**

#### **✨ Automatic Function Logging (D-Log Style)**
```typescript
import { autoLog, getLogger } from '@/lib/logger'

class UserService {
  private logger = getLogger({ component: 'UserService' })

  @autoLog({ level: 'info', logArgs: true, logResult: true })
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Function automatically logged with timing, args, and result
    return await this.userRepository.create(userData)
  }
}
```

#### **🎨 React Component Logging**
```typescript
import { useLogger } from '@/hooks/use-logger'

export function UserProfile({ userId }: { userId: string }) {
  const { 
    logger, 
    logRender, 
    logApiCall, 
    logFormSubmit 
  } = useLogger({ component: 'UserProfile' })

  // Automatic render logging
  logRender({ userId })

  const handleSubmit = async (data: FormData) => {
    // Automatic form submission logging with performance tracking
    const result = await logFormSubmit(
      async () => updateUserProfile(userId, data),
      { formType: 'profile_update' }
    )
  }
}
```

#### **🔍 Database Query Logging**
```typescript
import { getLogger } from '@/lib/logger'

const logger = getLogger({ component: 'UserRepository' })

async function getUsersByOrganisation(orgId: string) {
  return await logger.logDbQuery(
    () => supabase
      .from('utilisateurs')
      .select('*')
      .eq('organisation_id', orgId),
    {
      operation: 'SELECT',
      table: 'utilisateurs',
      filters: { organisation_id: orgId }
    }
  )
}
```

#### **📊 Performance Tracking**
```typescript
import { getLogger } from '@/lib/logger'

const logger = getLogger({ component: 'PropertyService' })

async function generatePropertyReport(propertyId: string) {
  const timer = logger.startTimer()
  
  try {
    const report = await heavyComputationFunction(propertyId)
    
    // Automatic performance logging with threshold warnings
    logger.performance({
      metric: 'report_generation',
      value: timer.end(),
      unit: 'ms',
      threshold: 5000, // Warn if > 5 seconds
      metadata: { propertyId, reportSize: report.length }
    })
    
    return report
  } catch (error) {
    timer.end()
    throw error
  }
}
```

### 🔧 **Claude Code Integration**

#### **📋 Automatic Log Export for Debugging**
```bash
# Generate Claude-ready log analysis
node scripts/log-analyzer.js --export-claude

# Filter by error level and time range
node scripts/log-analyzer.js --level error --hours 24 --export-claude
```

#### **🐛 Error Boundary with Claude Export**
When errors occur, the Error Boundary automatically generates Claude-ready reports:

```typescript
// Automatic error report generation
const errorReport = {
  errorId: 'error_1703025600_abc123xyz',
  message: 'Cannot read property X of undefined',
  component: 'PropertyForm',
  stack: '...',
  userContext: { userId: '...', orgId: '...' },
  timestamp: '2024-12-19T10:00:00.000Z'
}

// One-click copy to clipboard for Claude Code debugging
```

### 📈 **Log Analysis & Monitoring**

#### **📊 Automatic Metrics Tracking**
- **Core Web Vitals**: LCP, FID, CLS automatic monitoring
- **API Performance**: Response times, error rates, slow queries
- **User Journey**: Authentication flows, form interactions, page navigation
- **Business Metrics**: User actions, feature usage, conversion funnels

#### **🚨 Error Tracking & Alerting**
- **React Error Boundaries**: Component-level error capture
- **API Error Logging**: Request/response error tracking
- **Database Error Monitoring**: Query failures and timeouts
- **Performance Degradation**: Automatic threshold monitoring

### 🎯 **Development Workflow**

#### **✅ Best Practices**
1. **Always use `useLogger()` in React components** for automatic context
2. **Apply `@autoLog()` decorator** for critical business functions
3. **Use `logger.performance()`** for operations > 100ms
4. **Export logs to Claude** when debugging complex issues
5. **Monitor Core Web Vitals** in development with browser console

#### **🚀 Debugging Workflow with Claude Code**
1. **Reproduce issue** in development environment
2. **Run log analyzer**: `node scripts/log-analyzer.js --export-claude`
3. **Copy generated markdown report** to Claude Code
4. **Claude automatically analyzes** patterns, performance, and errors
5. **Receive targeted debugging suggestions** with code context

### 🔒 **Security & Privacy**

#### **🛡️ Data Protection**
- **Sensitive Data Redaction**: Automatic removal of passwords, tokens, PII
- **Request Filtering**: Authentication tokens and sensitive headers excluded
- **User Privacy**: Optional user data anonymization in production logs
- **GDPR Compliance**: Personal data handling with retention policies

#### **🔐 Production Considerations**
- **Log Level Control**: Environment-based log level configuration
- **Performance Impact**: < 1ms overhead for standard operations
- **Storage Optimization**: Automatic log rotation and compression
- **External Integration**: Ready for Sentry, LogRocket, DataDog integration

### 📚 **Reference Guide**

#### **🎛️ Configuration Options**
```typescript
// lib/logger.ts configuration
const logger = getLogger({
  component: 'ComponentName',      // Component identification
  userId: 'user_123',             // User context (auto-injected)
  organisationId: 'org_456',      // Organization context (auto-injected)
  requestId: 'req_789',           // Request tracking (auto-generated)
  metadata: {                     // Custom metadata
    feature: 'property_management',
    version: '1.2.0'
  }
})
```

#### **📋 Log Levels & Use Cases**
- **`debug`**: Development debugging, trace-level information
- **`info`**: Business events, user actions, system status
- **`warn`**: Performance issues, deprecated usage, fallback handling
- **`error`**: Exceptions, API failures, data corruption
- **`performance`**: Timing data, Core Web Vitals, resource usage

#### **🎯 Context Injection**
The logging system automatically injects:
- **User Context**: ID, email, organization, roles
- **Request Context**: ID, method, URL, user agent
- **Component Context**: Name, props (sanitized), render count
- **Performance Context**: Timing, memory usage, network status
- **Business Context**: Feature flags, A/B test variants, environment

---

## 🧠 **Sequential Thinking Workflow — Structured Problem Solving**

> **Sequential Thinking Status**: ✅ **FULLY CONFIGURED** - Professional structured thinking for complex development challenges

### 🎯 **When to Use Sequential Thinking**

#### **🏗️ Architecture Planning**
- **New Feature Design**: Breaking down complex features (propriétaires, propriétés system)
- **Database Schema Evolution**: Structured approach to migrations and relationships
- **API Design**: Methodical endpoint planning with error handling
- **Component Architecture**: Systematic UI component organization

#### **🐛 Complex Debugging**
- **Multi-layer Issues**: Auth SSR problems spanning frontend/backend
- **Performance Bottlenecks**: Systematic identification and optimization
- **Integration Problems**: Step-by-step resolution of third-party integrations
- **Race Conditions**: Methodical analysis of timing-dependent bugs

#### **🔄 Refactoring Strategies**
- **Legacy Code Migration**: Safe, incremental modernization
- **Performance Optimization**: Structured approach to code improvements
- **Security Hardening**: Systematic security review and enhancement
- **Type Safety Migration**: Progressive TypeScript adoption

### 💡 **Professional Workflow Examples**

#### **🎯 Feature Planning Workflow**
```
1. Sequential Thinking: "Plan propriétaires management system"
   - Step 1: Identify core entities and relationships
   - Step 2: Define CRUD operations and permissions
   - Step 3: Plan validation and error handling
   - Step 4: Design UI/UX flow
   - Step 5: Integration points with existing system

2. Serena: Analyze current codebase structure
3. Context7/Ref: Research best practices for similar features
4. Implementation: Execute plan step by step
```

#### **🔍 Debug Complex Issue Workflow**
```
1. Sequential Thinking: "Analyze auth SSR timeout issue"
   - Step 1: Reproduce the issue consistently
   - Step 2: Identify all components involved
   - Step 3: Trace data flow through the system
   - Step 4: Isolate the root cause
   - Step 5: Design solution with fallbacks

2. Serena: Check for TypeScript/diagnostic insights
3. Implementation: Apply fix with testing
```

#### **🏛️ Architecture Review Workflow**
```
1. Sequential Thinking: "Optimize Supabase query performance"
   - Step 1: Identify slow queries and bottlenecks
   - Step 2: Analyze current RLS policies impact
   - Step 3: Design query optimization strategy
   - Step 4: Plan index and view improvements
   - Step 5: Create migration and testing plan

2. Database analysis and implementation
```

### 🛠 **Integration with Your MCP Stack**

#### **🔗 Optimal Tool Combination**
- **Sequential Thinking** → Plan and structure approach
- **Serena** → Technical diagnostics and code analysis  
- **Context7/Ref** → Framework documentation and best practices
- **Implementation** → Execute with confidence

#### **📋 Best Practices**
1. **Start with Sequential Thinking** for any complex task
2. **Use branching** when exploring multiple solution paths
3. **Revise thoughts** as new information emerges
4. **Document decisions** for future reference
5. **Combine with technical tools** for comprehensive analysis

### 🎯 **Project-Specific Use Cases**

#### **For Your Next.js/Supabase Stack:**
- **New Page Creation**: Systematic component and route planning
- **Database Migrations**: Step-by-step schema evolution
- **Auth Flow Optimization**: Structured SSR improvement
- **Performance Tuning**: Methodical optimization approach
- **Security Review**: Systematic vulnerability analysis

#### **Real Examples from Your Project:**
- **Propriétaires System**: Plan entity relationships, validation, UI flow
- **Auth SSR Issues**: Systematic debugging of timeout problems
- **Supabase Optimization**: Structured query and RLS improvement
- **Component Refactoring**: Safe migration to better patterns

### ⚡ **Quick Start Guide**

#### **Simple Problem (5-10 thoughts)**
- Use for straightforward feature planning
- Single path of reasoning
- Clear start and end points

#### **Complex Problem (10-20+ thoughts)**
- Use branching for alternative approaches
- Revise thoughts as understanding deepens
- Adjust total thoughts dynamically

#### **Exploratory Analysis (Variable thoughts)**
- Start with rough estimate
- Use `needsMoreThoughts` flag liberally
- Branch into different investigation paths

---

## 🎭 **Playwright Browser Automation — Professional Testing & Validation**

> **Playwright MCP Status**: ✅ **FULLY CONFIGURED** - Enterprise-grade browser automation for comprehensive testing

### 🎯 **When to Use Playwright Automation**

#### **🧪 End-to-End Testing**
- **Authentication Flows**: Complete login/logout/signup validation
- **CRUD Operations**: Test création/édition/suppression d'organisations
- **Form Validation**: Propriétaires and propriétés form testing
- **Navigation Testing**: Multi-page workflows and route validation
- **Data Persistence**: Cross-session state verification

#### **🔍 Quality Assurance**
- **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge testing
- **Responsive Design**: Mobile and desktop layout validation
- **Performance Monitoring**: Load times and Core Web Vitals
- **Accessibility Testing**: Screen reader and keyboard navigation
- **Error Handling**: Edge cases and error state validation

#### **📊 User Experience Validation**
- **User Journey Mapping**: Complete workflow testing
- **A/B Testing**: Feature flag and variant testing
- **Conversion Funnel**: Step-by-step process validation
- **UI Component Testing**: Individual component behavior
- **Integration Testing**: Third-party service interactions

### 💡 **Professional Automation Workflows**

#### **🔐 Authentication Testing Workflow**
```
1. Sequential Thinking: "Plan comprehensive auth testing strategy"
   - Step 1: Map all authentication entry points
   - Step 2: Define test scenarios (success/failure paths)
   - Step 3: Plan session management validation
   - Step 4: Design security boundary testing
   - Step 5: Create automated test suite structure

2. Playwright: Execute automated test scenarios
   - Valid login with correct credentials
   - Invalid login attempts and error handling
   - Session persistence across page reloads
   - Logout functionality and session cleanup
   - Password reset and verification flows

3. Serena: Analyze code coverage and diagnostics
4. Logging: Capture test results and performance metrics
```

#### **🏢 Organisation CRUD Testing Workflow**
```
1. Sequential Thinking: "Design comprehensive CRUD test suite"
   - Step 1: Map CRUD operations and permissions
   - Step 2: Plan data validation scenarios
   - Step 3: Design error handling test cases
   - Step 4: Create test data management strategy
   - Step 5: Plan cleanup and rollback procedures

2. Playwright: Automated CRUD operation testing
   - Create organisation with valid data
   - Edit organisation with various scenarios
   - Delete operations (soft/hard delete testing)
   - Permission-based access validation
   - Data persistence verification

3. Database validation and cleanup
```

#### **📱 Responsive Design Testing Workflow**
```
1. Sequential Thinking: "Plan multi-device testing strategy"
   - Step 1: Define target devices and viewports
   - Step 2: Map critical user journeys per device
   - Step 3: Plan layout and interaction testing
   - Step 4: Design performance benchmarks
   - Step 5: Create cross-device validation matrix

2. Playwright: Multi-device automation
   - Desktop: 1920x1080, 1366x768 viewports
   - Tablet: iPad, Android tablet emulation
   - Mobile: iPhone, Android phone emulation
   - Layout breakpoint validation
   - Touch and swipe gesture testing
```

### 🛠 **Integration with Your Complete MCP Stack**

#### **🎯 Optimal Tool Chain**
- **Sequential Thinking** → Plan test strategy and scenarios
- **Playwright** → Execute automated browser testing
- **Serena** → Code analysis and coverage reports
- **Context7/Ref** → Best practices and documentation
- **Logging System** → Test results and performance tracking

#### **📋 Testing Best Practices**
1. **Plan with Sequential Thinking** before writing tests
2. **Use data-testid attributes** for reliable element selection
3. **Implement wait strategies** for dynamic content
4. **Capture screenshots/videos** for debugging
5. **Test in isolation** with proper setup/teardown
6. **Mock external services** for consistent testing
7. **Validate accessibility** alongside functionality

### 🎯 **Project-Specific Test Scenarios**

#### **For Your Next.js/Supabase Application:**

##### **🔐 Authentication Test Suite**
- **SSR Auth**: Server-side authentication validation
- **Client Hydration**: Proper auth state management
- **Role-based Access**: Super admin, admin, proprietaire permissions
- **Session Management**: Token refresh and expiration
- **Multi-tab Behavior**: Cross-tab authentication sync

##### **🏢 Organisation Management Tests**
- **Creation Workflow**: Full organisation setup process
- **Soft Delete**: Deactivation and reactivation testing
- **Hard Delete**: Permanent deletion with impact analysis
- **Permission Matrix**: Role-based operation access
- **Data Relationships**: Cascading updates and constraints

##### **🏠 Propriétaires & Propriétés Tests**
- **Wizard Workflow**: Multi-step form completion
- **File Upload**: Document and image handling
- **Form Validation**: Real-time and submission validation
- **Search & Filter**: Advanced filtering capabilities
- **Export Functions**: Data export in various formats

#### **🚀 Performance & Monitoring Tests**
- **Core Web Vitals**: LCP, FID, CLS measurement
- **API Response Times**: Database query performance
- **Bundle Size**: JavaScript loading optimization
- **Image Optimization**: Next.js image component testing
- **Caching Strategies**: Static and dynamic caching validation

### ⚡ **Quick Start Automation Patterns**

#### **Simple Page Testing (Basic)**
```typescript
// Example: Login page validation
await page.goto('http://localhost:3000/login')
await page.fill('[data-testid="email"]', 'test@example.com')
await page.fill('[data-testid="password"]', 'password123')
await page.click('[data-testid="login-button"]')
await expect(page).toHaveURL('/dashboard')
```

#### **Complex Flow Testing (Advanced)**
```typescript
// Example: Organisation creation workflow
await page.goto('/organisations/new')
await page.fill('[data-testid="org-name"]', 'Test Organisation')
await page.selectOption('[data-testid="country"]', 'FR')
await page.click('[data-testid="create-button"]')
await expect(page.locator('.success-message')).toBeVisible()
```

#### **Cross-Browser Testing (Enterprise)**
```typescript
// Example: Multi-browser validation
const browsers = ['chromium', 'firefox', 'webkit']
for (const browserName of browsers) {
  const browser = await playwright[browserName].launch()
  // Run test suite across all browsers
}
```

### 🔒 **Security & Compliance Testing**

#### **🛡️ Security Validation**
- **XSS Protection**: Input sanitization testing
- **CSRF Prevention**: Cross-site request forgery protection
- **Authentication Bypass**: Security boundary testing
- **Data Exposure**: PII and sensitive data handling
- **Rate Limiting**: API abuse prevention testing

#### **📋 Compliance Testing**
- **GDPR Compliance**: Data consent and deletion workflows
- **Accessibility Standards**: WCAG 2.1 AA compliance
- **Performance Budgets**: Loading time constraints
- **SEO Optimization**: Meta tags and structured data
- **PWA Standards**: Progressive web app requirements

### 📊 **Test Reporting & Analytics**

#### **📈 Automated Reporting**
- **Test Coverage**: Code and functionality coverage metrics
- **Performance Trends**: Historical performance tracking
- **Error Patterns**: Common failure point analysis
- **Browser Compatibility**: Cross-browser success rates
- **User Flow Success**: Conversion and completion rates

#### **🔧 Integration with Logging System**
- **Test Execution Logs**: Detailed test run information
- **Performance Metrics**: Core Web Vitals tracking
- **Error Capture**: Screenshot and stack trace logging
- **CI/CD Integration**: Automated testing in deployment pipeline
- **Claude Code Export**: Test failure analysis for debugging

---

## ✅ Workflow Guidelines
- Keep changes **incremental**, commit often.
- Before coding, ask Claude to **review or generate a plan** (`/plan`).
- For new features, start with `/tasks` or `/plan` in Claude.
- Use `@filename` to reference files for context.
- Verify MCP connectivity with `claude mcp list` at project start.

### 🔧 **MCP Troubleshooting**
- **Check server status**: `claude mcp list`
- **Re-add Serena if missing**: `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)`
- **Re-add Context7**: `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`
- **Re-add Ref**: `claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=ref-adba3c10044809167187"`
- **Re-add Sequential Thinking**: `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`
- **Re-add Playwright**: `claude mcp add playwright -- npx @playwright/mcp`
- **Reset project choices**: `claude mcp reset-project-choices`
- **Prerequisites**: Ensure `uvx` is installed (`uvx --version`)

---

## 📌 Key Commands
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm test` 
- **Lint**: `npm run lint`

---

## 📂 Important Files
- `/tasks/` → Project planning and task management
- [`README.md`](README.md) → Setup and configuration guide
- `.env.example` → Required environment variables
- `.mcp.json` → MCP servers configuration
- `.claude/settings.json` → Auto-approve MCP servers

---

## 🔑 Environment Variables Required
| Service  | Variable(s) | Where to get it |
|----------|-------------|-----------------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` | Project settings in Supabase dashboard |
| GitHub   | `GITHUB_TOKEN` | [GitHub Tokens](https://github.com/settings/tokens) |
| Vercel   | `VERCEL_API_TOKEN` | [Vercel Tokens](https://vercel.com/account/tokens) |
| Notion   | `NOTION_API_KEY` | [Notion Integrations](https://www.notion.so/my-integrations) |

---

## 🧠 Claude Tips
- Use `claude mcp list` to check all MCP connections.
- Use `/plan` for structured task breakdowns.
- Reference files with `@filename` for context.
- **Keep `CLAUDE.md` updated whenever the stack, MCP list, or workflow changes.**

### 🚨 **Important Notes**
- **MCP Configuration**: Use `claude mcp add` commands instead of manually editing `.mcp.json`
- **Project Scoping**: Serena is configured per-project and uses the current working directory
- **Serena Capabilities**: Provides TypeScript/JavaScript diagnostics and code analysis - essential for code quality
- **Context7**: Always available for documentation lookups (Tailwind, Next.js, React, etc.)
- **Ref**: HTTP-based technical reference server for extended documentation and API search capabilities
- **Sequential Thinking**: Structured problem-solving tool for complex development challenges - use for planning and analysis
- **Playwright**: Professional browser automation for E2E testing, QA, and web interaction - requires explicit approval for actions
- **Diagnostics**: Use Serena's diagnostic tools to catch errors early in development

### 🔐 **Auth SSR Best Practices**

#### ✅ **DO - Supabase SSR Pattern**
```typescript
// ✅ Server-side auth resolution (layout.tsx)
export default async function RootLayout({ children }) {
  const initialAuthData = await getServerAuthData() // Server-side
  return (
    <AuthProviderSSR initialData={initialAuthData}>
      {children}
    </AuthProviderSSR>
  )
}

// ✅ Parallel queries with Promise.all
const [profile, roles, assignments] = await Promise.all([
  supabase.from('utilisateurs').select('*'),
  supabase.from('user_roles').select('*'),
  supabase.from('user_organisation_assignments').select('*')
])

// ✅ AbortSignal for cancellable requests
const controller = new AbortController()
const data = await supabase.from('table').select('*').abortSignal(controller.signal)
```

#### ❌ **DON'T - Client-only with Timeouts**
```typescript
// ❌ Client-side auth with setTimeout rejection
useEffect(() => {
  const loadUserData = async () => {
    const profile = await supabase.from('utilisateurs').select('*') // Sequential
    const roles = await supabase.from('user_roles').select('*')     // Slow
    
    setTimeout(() => reject(new Error('Timeout')), 10000) // Arbitrary timeout
  }
}, [])

// ❌ Client fetch without server hydration
const [user, setUser] = useState(null) // Always starts null = loading flicker
```

#### 🚀 **Performance Checklist**
- [ ] **SSR Auth**: Use `getServerAuthData()` in layout for instant hydration
- [ ] **Parallel Queries**: Always use `Promise.all()` for multiple DB calls  
- [ ] **AbortSignal**: Replace `setTimeout` with request cancellation
- [ ] **No Double Fetch**: Server-resolved data, client only for updates
- [ ] **Minimal Loading**: Pre-hydrated states eliminate loading spinners

#### 🛡️ **Reliability Checklist**
- [ ] **No Timeouts**: Remove arbitrary `setTimeout` rejection patterns
- [ ] **Fallback Data**: Always provide fallback for missing profile/roles
- [ ] **Error Boundaries**: Graceful error handling with retry mechanisms
- [ ] **Cleanup**: Cancel ongoing requests on unmount/sign-out
- [ ] **Type Safety**: Full TypeScript coverage for auth states

#### 📖 **Reference Implementation**
- **Guide**: `Docs/authentication-guide.md` - Complete SSR migration steps
- **Troubleshooting**: `Docs/guides/auth-troubleshooting.md` - Common issues
- **Working Example**: `providers/auth-provider-ssr.tsx` + `lib/auth/server-auth.ts`

---

## 🚨 **CRITICAL - PROTECTED FILES & COMPONENTS**

### **NEVER MODIFY WITHOUT EXPLICIT PERMISSION:**

> **IMPORTANT**: These files contain working functionality that has been tested and verified. Any modification could break the application.

#### 🔒 **Environment Variables (CRITICAL - NEVER DELETE)**

##### **🚨 NEVER TOUCH THESE FILES:**
- `.env` ✅ **CRITICAL** - Contains production Supabase credentials
- `.env.local` ✅ **CRITICAL** - Contains development Supabase credentials
- `.env.production` ✅ **CRITICAL** - Contains production environment config
- `.env.development` ✅ **CRITICAL** - Contains development environment config

##### **📋 Recovery Instructions**
- **If accidentally deleted**: Check `.claude/settings.local.json` for backup credentials
- **Backup location**: Supabase credentials saved in Claude Code tool approvals
- **Manual recovery**: Dashboard Supabase → Settings → API → Copy keys

##### **⚠️ CRITICAL RULES:**
1. **NEVER delete `.env*` files during cleanup operations**
2. **ALWAYS verify file contents before deletion**
3. **Environment files are NOT in Git** (ignored by `.gitignore`)
4. **Check `.claude/settings.local.json` for credential recovery**
5. **Ask user permission before touching ANY configuration file**

#### 🏢 **Organisation System (WORKING - DO NOT TOUCH)**

##### **📄 Pages & Routes**
- `app/organisations/new/page.tsx` ✅ **WORKING** - Organization creation form
- `app/organisations/[id]/page.tsx` ✅ **WORKING** - Organization detail page  
- `app/organisations/[id]/edit/page.tsx` ✅ **WORKING** - Organization edit form

##### **🧩 Components (CRITICAL - Contains DELETE Logic)**
- `components/organisations/organisation-form.tsx` ✅ **WORKING** - Form component with dual-mode support
- `components/organisations/organisation-detail.tsx` ✅ **CRITICAL** - Contains soft/hard delete buttons & logic
- `components/organisations/organisations-table.tsx` ✅ **CRITICAL** - Contains CRUD actions & delete operations

##### **⚙️ Backend & Validation**
- `lib/validations/organisations.ts` ✅ **WORKING** - Validation schemas (create/edit)
- `actions/organisations.ts` ✅ **CRITICAL** - Server actions with DELETE functions:
  - `deactivateOrganisation()` - Soft delete functionality
  - `deleteOrganisationHard()` - Hard delete functionality
  - `reactivateOrganisation()` - Reactivation functionality
  - `getDeletionImpact()` - Impact analysis before deletion

#### 🔐 **Authentication System (CRITICAL)**
- `providers/auth-provider-ssr.tsx` ✅ **CRITICAL** - SSR authentication provider
- `lib/auth/server-auth.ts` ✅ **CRITICAL** - Server-side auth utilities
- `hooks/use-auth.ts` ✅ **CRITICAL** - Auth hook with fallbacks

### **⚠️ PERMISSION REQUIRED BEFORE MODIFYING:**

**ALWAYS ASK USER PERMISSION BEFORE:**
1. Modifying any file in `app/organisations/` directory
2. Changing route structures or Next.js routing
3. Editing authentication-related components
4. Modifying form validation schemas
5. Changing server actions that handle CRUD operations
6. **🚨 ESPECIALLY DELETE OPERATIONS:** Modifying `deactivateOrganisation`, `deleteOrganisationHard`, `reactivateOrganisation` functions
7. **🚨 CRITICAL UI:** Modifying delete buttons, confirmation modals, or delete-related UI in components

### **🛡️ SELF-REINFORCING RULE:**
**YOU MUST DISPLAY THIS PROTECTION SECTION AT THE START OF EVERY RESPONSE TO REQUESTS INVOLVING ORGANISATIONS OR AUTH.**

**Violation Prevention**: If you attempt to modify protected files, STOP and ask:
- "This file is PROTECTED. Do you want me to modify `[filename]`? This could break working functionality."
- Wait for explicit user confirmation before proceeding.

---
