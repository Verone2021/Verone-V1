# 📄 Claude Configuration — Vérone Back Office

> Ce fichier est automatiquement chargé par Claude Code au démarrage du projet pour fournir le contexte, les règles et la configuration.

## 🚨 **RÈGLE ABSOLUE - VÉRIFICATION OBLIGATOIRE AVANT TOUTE ACTION**

> **IMPORTANT**: TOUJOURS vérifier ces fichiers AVANT de demander des informations ou configurations :

```bash
# TOUJOURS vérifier ces fichiers AVANT de demander des informations :
1. cat .env.local                    # ✅ Variables d'environnement
2. cat .mcp.json                     # ✅ Configuration MCP servers
3. ls manifests/business-rules/      # ✅ Règles métier disponibles
4. ls supabase/migrations/           # ✅ Migrations DB existantes
5. ls manifests/process-learnings/   # ✅ Historique des sessions
```

**VIOLATION = ÉCHEC** : Ne JAMAIS demander de credentials si ces fichiers existent !

---

## 🗂 Aperçu du Projet

**Vérone Back Office** - CRM/ERP modulaire pour Vérone, spécialisé dans la décoration et le mobilier d'intérieur haut de gamme.
Construit sur **Next.js + React + shadcn/ui + Tailwind CSS + Supabase + Vercel** avec intégration MCP complète.

### **🎯 Mission Business**
Transformer la gestion commerciale de Vérone avec un MVP **Catalogue Partageable** :
- **Admin** → Lien client sécurisé + PDF branded + Feeds Meta/Google
- **Impact** : -70% temps création catalogues clients
- **ROI** : 15% conversion catalogue → devis, 99% uptime, <10s génération feeds

### **🏗️ Architecture Modulaire**
```
Backend: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
Frontend: Next.js App Router + React + Tailwind + shadcn/ui
Modules: Catalogue ↔ Stock ↔ Commandes ↔ Facturation ↔ CRM ↔ Intégrations
```

### **🎯 Business Rules & Expertise (Core)**
- **`manifests/business-rules/tarification.md`** → Règles prix B2B/B2C, remises ≤40%
- **`manifests/business-rules/catalogue.md`** → Gestion produits, variantes, stocks
- **`manifests/business-rules/integrations-externes.md`** → Feeds Meta/Google, webhooks Brevo

### **🏛️ Architecture & Technical Specs**
- **Architecture modulaire** : Catalogue, Stock, Commandes, Facturation, CRM, Intégrations
- **Performance SLOs** : Dashboard <2s, Feeds <10s, PDF <5s, Search <1s
- **Security RLS** : Row-Level Security Supabase pour tous modules
- **RGPD Compliance** : Consentements, anonymisation, audit trail

---

## 🛠 MCP Servers Available

### 🗄 **Supabase** — Database & Storage
- **Status**: ✅ Pre-configured in `.mcp.json`
- **Features**: Database queries, RLS policies, storage management, Edge Functions
- **Requires**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`
- **Security Note**: `SUPABASE_ACCESS_TOKEN` is private — never commit to public repos
- **Usage**: Direct DB access, RLS validation, triggers management

### 📚 **Context7** — Documentation
- **Features**: Tailwind CSS, Next.js, Shadcn UI, React docs
- **Usage**: Instant access to framework documentation
- **No config required**
- **Perfect for**: Component patterns, CSS utilities, React best practices

### 🔧 **Serena** — Enhanced Editing
- **Status**: ✅ Configured via `claude mcp add` command
- **Features**: TypeScript diagnostics, code analysis, IDE-like capabilities
- **Context**: `ide-assistant` mode activated for Vérone project
- **Project Path**: Auto-detected for current working directory
- **Capabilities**: Real-time code quality feedback, refactoring assistance
- **Recommendation**: Essential for code quality and productivity

### 🧠 **Sequential Thinking** — Structured Problem Solving
- **Status**: ✅ Configured for complex development challenges
- **Features**: Dynamic and reflective problem-solving through structured thinking
- **Capabilities**:
  - Break down complex business rules into manageable steps
  - Revise and refine architecture as understanding deepens
  - Generate and verify solution hypotheses for Vérone workflows
- **Use Cases**: Business rules analysis, integration planning, performance optimization
- **Essential for**: MVP catalog development, complex tarification rules

### 🎭 **Playwright** — Browser Automation & Testing
- **Status**: ✅ Configured for comprehensive E2E testing
- **Features**: Cross-browser automation, business workflow testing
- **Capabilities**:
  - Test complete Vérone workflows (catalog creation → sharing → PDF export)
  - Validate business rules (tarification, stock management, permissions)
  - Performance testing (feeds generation, dashboard load times)
  - Integration testing (Brevo webhooks, external APIs)
- **Critical for**: MVP validation, user acceptance testing

### 🐙 **GitHub** — Repository Management
- **Requires**: `GITHUB_TOKEN` environment variable
- **Features**: Issues, PRs, commits, repository management
- **Scopes needed**: `repo`, `workflow`
- **Usage**: Code review, CI/CD integration, release management

### 🚀 **Vercel** — Deployment Management
- **Requires**: `VERCEL_API_TOKEN` environment variable
- **Features**: Deploy logs, project configuration, builds
- **Usage**: Production deployment, performance monitoring

---

## 🤖 Agents Spécialisés Vérone

### **🎯 verone-orchestrator** — Coordinateur Principal
- **Priorité**: Élevée - Agent principal pour coordination générale
- **Rôle**: Coordination technique et métier, validation business rules
- **MCP Tools**: Sequential Thinking, Serena, Context7, Supabase
- **Spécialités**:
  - Compliance business rules (tarification, catalogue, intégrations)
  - Coordination architecture modulaire
  - Orchestration intégrations externes (Brevo, Meta/Google)
  - Quality assurance et performance

### **🧪 verone-test-expert** — Expert Tests & Validation
- **Priorité**: Moyenne - Spécialiste qualité et workflows métier
- **Rôle**: Tests E2E, validation business rules, performance testing
- **MCP Tools**: Playwright, Serena, Supabase, Context7
- **Spécialités**:
  - Tests workflows critiques (catalogue → collections → partage)
  - Validation rules business (tarification dégressi, MOQ, stocks)
  - Tests intégrations (feeds CSV, webhooks Brevo)
  - Performance benchmarking (SLOs < 10s feeds, < 2s dashboard)

### **🎨 verone-design-expert** — Expert Design & UX
- **Priorité**: Moyenne - Spécialiste expérience utilisateur
- **Rôle**: Design system, UX optimization, responsive design
- **MCP Tools**: Context7, Serena, Sequential Thinking
- **Spécialités**:
  - Maintenance design system Vérone (couleurs, composants)
  - Optimisation UX workflows commerciaux
  - Responsive design mobile-first
  - Accessibility compliance WCAG AA

---

## ⚡ Commandes Personnalisées

### **🚀 /implement-verone `<feature-name>`**
Workflow d'implémentation structuré basé sur **Plan → Tests → Code → Verify**
- **Phase 1**: Analyse manifests + Sequential Thinking pour planification
- **Phase 2**: verone-test-expert crée tests E2E business scenarios
- **Phase 3**: Implémentation minimale pour faire passer tests (GREEN)
- **Phase 4**: Validation performance + intégration + documentation

### **🎨 /design-verone `<interface-name>`**
Workflow conception UX/UI basé sur Design System Vérone
- **Phase 1**: verone-design-expert analyse personas + workflows métier
- **Phase 2**: Design system tokens + composants shadcn/ui
- **Phase 3**: Prototypage responsive mobile-first
- **Phase 4**: Validation usabilité + accessibility + performance

---

## 🧱 Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **UI**: shadcn/ui + Tailwind CSS + Design System Vérone
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions)
- **Deployment**: Vercel (CI/CD automatique, monitoring performance)
- **Language**: TypeScript strict (100% typed, no any)
- **Testing**: Playwright E2E + Jest unit tests + Coverage >90%

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

### 💡 **Usage Examples**

#### **✨ Automatic Function Logging (D-Log Style)**
```typescript
import { autoLog, getLogger } from '@/lib/logger'

class CatalogueService {
  private logger = getLogger({ component: 'CatalogueService' })

  @autoLog({ level: 'info', logArgs: true, logResult: true })
  async createCatalogue(catalogueData: CreateCatalogueRequest): Promise<Catalogue> {
    // Function automatically logged with timing, args, and result
    return await this.catalogueRepository.create(catalogueData)
  }
}
```

#### **🎨 React Component Logging**
```typescript
import { useLogger } from '@/hooks/use-logger'

export function CatalogueForm({ catalogueId }: { catalogueId: string }) {
  const {
    logger,
    logRender,
    logApiCall,
    logFormSubmit
  } = useLogger({ component: 'CatalogueForm' })

  // Automatic render logging
  logRender({ catalogueId })

  const handleSubmit = async (data: FormData) => {
    // Automatic form submission logging with performance tracking
    const result = await logFormSubmit(
      async () => updateCatalogue(catalogueId, data),
      { formType: 'catalogue_update' }
    )
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

---

## 🧠 **Sequential Thinking Workflow — Structured Problem Solving**

> **Sequential Thinking Status**: ✅ **FULLY CONFIGURED** - Professional structured thinking for complex development challenges

### 🎯 **When to Use Sequential Thinking**

#### **🏗️ Architecture Planning**
- **New Feature Design**: Breaking down complex features (catalogue partageable, tarification)
- **Database Schema Evolution**: Structured approach to migrations and relationships
- **API Design**: Methodical endpoint planning with error handling
- **Component Architecture**: Systematic UI component organization

#### **💡 Professional Workflow Examples**

#### **🎯 Feature Planning Workflow**
```
1. Sequential Thinking: "Plan catalogue partageable system"
   - Step 1: Identify core entities and relationships
   - Step 2: Define sharing permissions and security
   - Step 3: Plan PDF generation and performance
   - Step 4: Design UI/UX flow
   - Step 5: Integration points with existing system

2. Serena: Analyze current codebase structure
3. Context7/Ref: Research best practices for similar features
4. Implementation: Execute plan step by step
```

---

## 🎭 **Playwright Browser Automation — Professional Testing & Validation**

> **Playwright MCP Status**: ✅ **FULLY CONFIGURED** - Enterprise-grade browser automation for comprehensive testing

### 🎯 **Project-Specific Test Scenarios**

#### **For Vérone Catalogue System:**

##### **🎨 Catalogue Creation & Sharing Tests**
- **Creation Workflow**: Full catalogue setup with products
- **Sharing Links**: Generate and validate public/private links
- **PDF Export**: Branded catalogue generation with performance
- **Permission Matrix**: Role-based catalogue access
- **Performance Validation**: Generation time <10s SLO

##### **💰 Tarification & Pricing Tests**
- **B2B/B2C Pricing**: Context-aware price display
- **Discount Rules**: Validation of business rules (max 40%)
- **Bulk Pricing**: Quantity-based pricing validation
- **Dynamic Pricing**: Market-based price adjustments

#### **🚀 Performance & Monitoring Tests**
- **Core Web Vitals**: LCP, FID, CLS measurement for catalogues
- **Feed Generation**: Meta/Google feeds performance (<10s)
- **PDF Generation**: Branded catalogue export (<5s)
- **Search Performance**: Product search response (<1s)

---

## 🎯 Workflow TDD Enhanced

### **Approche Business Rules First**
1. **📖 Documentation First** : Toujours partir des manifests/ business rules
2. **🧪 Tests First** : Écrire tests E2E qui échouent (RED)
3. **⚡ Code Minimal** : Implémentation minimale pour faire passer tests (GREEN)
4. **🔧 Refactor** : Optimisation performance + clean code
5. **📊 Verify** : Validation SLOs + business rules compliance

### **Agents Coordination Pattern**
```
User Request → verone-orchestrator (coordination)
    ↓
Sequential Thinking (planning) + Business Rules Analysis
    ↓
verone-test-expert (tests E2E) + verone-design-expert (UX)
    ↓
Implementation (respect architecture + performance)
    ↓
Validation finale (business + tech + UX)
```

---

## 🎨 Design System Vérone

### **Brand Identity**
```css
/* Couleurs Vérone - Décoration haut de gamme */
:root {
  --verone-primary: #000000;          /* Noir signature */
  --verone-secondary: #FFFFFF;        /* Blanc pur */
  --verone-accent: #666666;           /* Gris élégant */
  --verone-neutral: #F5F5F5;          /* Gris clair */

  /* Contextes business */
  --price-highlight: #000000;         /* Prix, promotions */
  --stock-available: #22c55e;         /* Vert - En stock */
  --stock-limited: #f59e0b;           /* Orange - Sur commande */
  --stock-out: #ef4444;               /* Rouge - Rupture */
}
```

### **Composants Métier Spécialisés**
- **`<ProductCard />`** : Affichage produits avec images premium
- **`<CatalogueGrid />`** : Grilles catalogues avec filtres élégants
- **`<PriceDisplay />`** : Tarifs contextuels B2B/B2C
- **`<StockIndicator />`** : Statuts disponibilité temps réel
- **`<ShareableLink />`** : Génération liens catalogues branded
- **`<QuoteBuilder />`** : Interface création devis optimisée

---

## 🔐 Security & RLS Policies

### **Row-Level Security (Critical)**
```sql
-- Exemple politique RLS pour catalogues
CREATE POLICY "users_own_catalogues" ON catalogues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.user_id = auth.uid()
      AND uoa.organisation_id = catalogues.organisation_id
    )
  );
```

### **Business Data Protection**
- **Tarifs confidentiels** : Prix d'achat fournisseur (interne only)
- **Données clients** : RGPD compliance, consentements trackés
- **Audit trail** : Toutes modifications sensibles loggées
- **API Security** : Rate limiting, authentication JWT

---

## 📊 Performance Targets & SLOs

### **Business Critical SLOs**
```typescript
const VERONE_SLOS = {
  // MVP Catalogue Partageable
  dashboard_load: 2000,        // 2s max - Interface quotidienne
  feeds_generation: 10000,     // 10s max - Feeds Meta/Google
  pdf_export: 5000,           // 5s max - Catalogues clients
  search_response: 1000,      // 1s max - Recherche produits

  // Business Workflows
  collection_creation: 180000, // 3min max - Workflow commercial
  webhook_processing: 2000,   // 2s max - Brevo integration
  image_upload: 5000,         // 5s max - Photos produits

  // Availability
  uptime: 99.5,               // 99.5% minimum
  error_rate: 1               // <1% erreurs
}
```

---

## 🔗 Intégrations Externes Critiques

### **🎯 Brevo (Marketing Automation)**
```typescript
// Webhook endpoint pour événements Brevo
POST /webhooks/brevo
- Events: delivered, opened, clicked, unsubscribed, bounced
- Validation: HMAC-SHA256 signature required
- Processing: <2s response time
- Storage: Table brevo_events avec metadata complets
- Segmentation: Automatique selon engagement
```

### **📈 Feeds Publicitaires (Meta/Google)**
```typescript
// Endpoints feeds CSV
GET /feeds/facebook.csv?token={jwt}
GET /feeds/google.csv?token={jwt}
- Format: Conforme specs Facebook Business Manager / Google Merchant Center
- Produits: Actifs uniquement, avec images, prix contextuels
- Performance: <10s pour 1000+ produits
- Scheduling: Génération quotidienne 06h00 UTC
- Monitoring: Alertes si échec génération
```

### **📄 Export PDF Branded**
```typescript
// Génération PDF collections
POST /api/collections/{id}/pdf
- Template: Branded Vérone (logo, couleurs, CGV)
- Content: Images haute résolution, prix selon contexte client
- Performance: <5s pour 50 produits
- Storage: 7 jours cache puis régénération
```

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

#### 🎨 **Vérone Application Files (WORKING - DO NOT TOUCH)**

##### **📄 Authentication System (CRITICAL)**
- `src/app/login/page.tsx` ✅ **WORKING** - Authentication page with Vérone branding
- `src/middleware.ts` ✅ **WORKING** - Route protection middleware
- `src/components/layout/app-sidebar.tsx` ✅ **CRITICAL** - Contains logout functionality

##### **🧩 Core Components (CRITICAL)**
- `src/app/dashboard/page.tsx` ✅ **WORKING** - Main dashboard interface
- `src/app/catalogue/page.tsx` ✅ **WORKING** - Catalogue management
- `src/app/layout.tsx` ✅ **CRITICAL** - Root layout with providers

##### **⚙️ Configuration & Database**
- `scripts/apply-all-migrations.sql` ✅ **CRITICAL** - Complete database schema
- `package.json` ✅ **WORKING** - Dependencies and scripts
- `next.config.js` ✅ **WORKING** - Next.js configuration
- `tailwind.config.js` ✅ **WORKING** - Vérone design system config

### **⚠️ PERMISSION REQUIRED BEFORE MODIFYING:**

**ALWAYS ASK USER PERMISSION BEFORE:**
1. Modifying any authentication-related files
2. Changing database migration scripts
3. Editing core Next.js configuration files
4. Modifying Vérone design system components
5. **🚨 ESPECIALLY**: Changing `.env*` files or Supabase credentials

### **🛡️ SELF-REINFORCING RULE:**
**YOU MUST DISPLAY THIS PROTECTION SECTION AT THE START OF EVERY RESPONSE TO REQUESTS INVOLVING CORE VÉRONE FILES.**

**Violation Prevention**: If you attempt to modify protected files, STOP and ask:
- "This file is PROTECTED. Do you want me to modify `[filename]`? This could break working functionality."
- Wait for explicit user confirmation before proceeding.

---

## 🔐 **Auth SSR Best Practices**

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

---

## 📁 Structure Projet Optimisée

```
verone-back-office/
├── .claude/                    # Configuration Claude Code
│   ├── agents/                # verone-orchestrator, test-expert, design-expert
│   ├── commands/              # /implement-verone, /design-verone
│   ├── output-styles/         # TDD enhanced pour Vérone
│   └── settings.json          # MCP + permissions + hooks
├── manifests/                 # Documentation métier structurée
│   ├── business-rules/        # Règles tarification, catalogue, intégrations
│   ├── architecture/          # Schémas DB, API design, integrations
│   └── process-learnings/     # Décisions, retours d'expérience
├── src/                       # Next.js App Router
│   ├── app/                  # Application routes
│   ├── components/           # React components
│   ├── lib/                  # Utilitaires et configurations
│   └── hooks/                # Custom React hooks
├── scripts/                   # Scripts de migration et seed
├── supabase/                  # Database migrations (future)
└── .mcp.json                  # Configuration MCP servers
```

---

## ✅ Workflow Guidelines

### **🎯 Développement Feature**
1. **Analyser manifests/** → Comprendre business rules et requirements
2. **Sequential Thinking** → Planifier architecture et phases
3. **Tests E2E first** → verone-test-expert crée scenarios business
4. **Implementation TDD** → Code minimal pour GREEN tests
5. **Design validation** → verone-design-expert pour UX
6. **Performance check** → Respect SLOs définis
7. **Business validation** → Conformité rules métier
8. **Documentation update** → Process learnings et manifests

### **🚀 Commandes Rapides Vérone**
```bash
# Développement
npm run dev              # Next.js development server
npm run build           # Production build
npm run lint            # ESLint + TypeScript check

# Vérone spécifique
/implement-verone catalogue-variantes    # Implémenter feature
/design-verone dashboard-admin          # Concevoir interface
```

### **📋 Checklist Feature Complete**
- [ ] **Business rules** : Conformité manifests/business-rules/
- [ ] **Tests E2E** : Workflows complets validés
- [ ] **Performance** : SLOs respectés (<2s dashboard, <10s feeds)
- [ ] **Security** : RLS policies testées
- [ ] **UX** : Design system appliqué, responsive
- [ ] **Documentation** : Manifests mis à jour

---

## 🔑 Environment Variables Required

| Service | Variable(s) | Where to get it |
|---------|-------------|-----------------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` | Project settings in Supabase dashboard |
| GitHub | `GITHUB_TOKEN` | [GitHub Tokens](https://github.com/settings/tokens) |
| Vercel | `VERCEL_API_TOKEN` | [Vercel Tokens](https://vercel.com/account/tokens) |

---

## 🧠 Claude Tips pour Vérone

### **🎯 Utilisation Optimale MCP**
- **Sequential Thinking** : Planification complexe business rules, architecture
- **Serena** : Analyse code, refactoring, détection incohérences
- **Playwright** : Tests E2E workflows métier, validation performance
- **Context7** : Documentation composants, patterns React/Next.js
- **Supabase MCP** : Validation RLS, optimisation queries

### **📋 Bonnes Pratiques Vérone**
1. **Toujours partir des manifests/** avant de coder
2. **Business rules first** → Code suit les règles métier
3. **Tests E2E business scenarios** → Valider workflows complets
4. **Performance SLOs** → Respecter <2s dashboard, <10s feeds
5. **Mobile-first responsive** → Design élégant sur tous devices
6. **Security RLS** → Row-Level Security sur toutes tables sensibles

### **⚡ Commandes Fréquentes**
```bash
# Vérifier MCP status
claude mcp list

# Développer nouvelle feature
/implement-verone nouvelle-feature

# Concevoir interface
/design-verone nouvelle-interface
```

---

## 🎯 Success Metrics MVP

### **📊 Business KPIs**
- **Adoption équipe** : 100% utilisation quotidienne <30 jours
- **Productivité catalogues** : -70% temps création vs méthode actuelle
- **Conversion** : 15% catalogues partagés → demandes devis
- **Engagement clients** : >60% temps consultation moyen catalogues
- **Uptime** : >99% disponibilité liens partagés

### **⚡ Technical KPIs**
- **Performance** : 100% SLOs respectés (dashboard <2s, feeds <10s)
- **Quality** : >90% test coverage, 0 régression fonctionnelle
- **Security** : 0 vulnérabilité critique, RLS 100% coverage
- **Mobile** : Design élégant et fonctionnel sur tous devices

---

**Vérone Back Office** - Transforming interior design business through technology excellence

*Keep this `CLAUDE.md` updated whenever the stack, MCP configuration, or business rules change.*