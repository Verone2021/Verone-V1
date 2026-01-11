# Large Documentation Files Analysis Report

## Executive Summary

Exploration of `/docs/` folder structure completed. Found **145,204 total lines** of documentation across all markdown files. Identified the **50 largest files** that significantly impact token usage when loaded by MCP tools.

**Key Finding**: 10 files alone contain **~19,000 lines** (13% of total documentation). Top 3 files are particularly large for RLS policies, database triggers, and UI/UX audits.

---

## Critical Large Files (Over 2,000 lines)

### High Impact - Token Heavy Files

| File Path                                                         | Lines | Size | Content Type             | Token Impact  |
| ----------------------------------------------------------------- | ----- | ---- | ------------------------ | ------------- |
| `/docs/database/triggers.md`                                      | 2,487 | 76KB | **Database Triggers**    | ~5,000 tokens |
| `/docs/audits/2025-10/AUDIT-UX-UI-VERONE-2025-10-17.md`           | 2,677 | 76KB | **UI/UX Audit**          | ~5,300 tokens |
| `/docs/database/rls-policies.md`                                  | 1,988 | 48KB | **RLS Policies**         | ~4,000 tokens |
| `/docs/architecture/COMPOSANTS-CATALOGUE.md`                      | 1,969 | 40KB | **Components Catalog**   | ~3,900 tokens |
| `/docs/audits/2025-11/RAPPORT-AUDIT-TRIGGERS-STOCK-2025-11-12.md` | 1,901 | 68KB | **Stock Triggers Audit** | ~3,800 tokens |

---

## Medium Impact Files (1,000-2,000 lines)

| File Path                                                                                  | Lines | Size | Content Type            |
| ------------------------------------------------------------------------------------------ | ----- | ---- | ----------------------- |
| `/docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md`                            | 1,443 | 44KB | Components Architecture |
| `/docs/ux-research/MODAL-HAUTE-DENSITE-RESEARCH-2025.md`                                   | 1,374 | 52KB | UX Research             |
| `/docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md`                                           | 1,297 | 32KB | Design System Guide     |
| `/docs/guides/03-integrations/google-merchant/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md` | 1,235 | 36KB | Integration Guide       |
| `/docs/guides/01-onboarding/guide-novice-personnalise.md`                                  | 1,215 | 32KB | Onboarding Guide        |
| `/docs/audits/2025-11/RAPPORT-FINAL-SIMPLIFICATION-STOCK-MODULE-2025-11-02.md`             | 1,206 | 40KB | Stock Module Report     |
| `/docs/audits/2025-11/PLAN-REFACTORISATION-COMPOSANTS-2025.md`                             | 1,182 | 40KB | Refactoring Plan        |
| `/docs/architecture/CATALOGUE-ANALYSIS-2025.md`                                            | 1,154 | 40KB | Catalog Analysis        |
| `/docs/auth/rls-policies.md`                                                               | 1,096 | 28KB | Auth RLS Policies       |
| `/docs/modules/produits/catalogue/hooks.md`                                                | 1,033 | 28KB | Hooks Documentation     |

---

## Category Breakdown - By Function

### Database-Related (Highest Priority for Optimization)

Files that could significantly impact performance when loaded:

1. **Triggers Documentation** (`/docs/database/triggers.md` - 76KB)
   - Contains: SQL trigger definitions, automation logic
   - Used by: Database migrations, RLS policies context
   - Optimization: Archive to `/docs/archives/` if not actively used

2. **RLS Policies** (`/docs/database/rls-policies.md` - 48KB)
   - Contains: Security policy definitions
   - Used by: Security audits, auth context
   - Optimization: Split by module (auth, products, stock)

3. **Functions & RPC** (`/docs/database/functions-rpc.md` - 36KB)
   - Contains: Server-side function definitions
   - Used by: API/RPC context loading
   - Optimization: Index-based access instead of loading entire file

4. **Foreign Keys** (`/docs/database/foreign-keys.md` - 32KB)
   - Contains: Relationship constraints
   - Used by: Schema context
   - Note: Could be auto-generated from database

5. **Pricing Architecture** (`/docs/database/pricing-architecture.md` - 28KB)
   - Contains: Pricing business logic
   - Used by: Business rules context

6. **SCHEMA-REFERENCE** (`/docs/database/SCHEMA-REFERENCE.md` - 28KB)
   - Contains: Complete table definitions
   - Used by: Frequently referenced for lookups
   - Optimization: Could be generated from database directly

### Architecture Files (Moderate-High Impact)

1. **Components Catalog** (`/docs/architecture/COMPOSANTS-CATALOGUE.md` - 40KB, 1,969 lines)
   - Most frequently referenced in CLAUDE.md
   - Critical for preventing hallucinations
   - Recommendation: Keep accessible but optimize loading strategy

2. **Catalog Analysis** (`/docs/architecture/CATALOGUE-ANALYSIS-2025.md` - 40KB)
   - Analysis of product catalog structure
   - Lower frequency use
   - Candidate for: Lazy loading or archival

### Audit Files (High Volume, Moderate Priority)

**2025-11 Audits Directory** contains 73 audit files, many over 900 lines:

- RAPPORT-AUDIT-TRIGGERS-STOCK-2025-11-12.md (68KB, 1,901 lines) - High value
- AUDIT-SUPABASE-SECURITY-PERFORMANCE-955-PROBLEMES-2025-11-20.md (32KB)
- AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md (40KB)
- AUDIT-UNIVERSAL-PRODUCT-SELECTOR-2025-11-07.md (28KB)
- AUDIT-BOUTONS-CRUD-COMPLET.md (28KB)

**Recommendation**: Archive completed audits to `/docs/archives/audits-2025-11/` by month

### Workflow & Business Rules (Lower Priority)

- Admin workflows (28KB, 988 lines)
- Owner workflows (24KB, 851 lines)
- Data insertion process (20KB, 791 lines)
- Sales order cancellation (28KB, 840 lines)

---

## Token Calculation

**Approximate Token Usage** (using ~200 tokens per KB):

| Category        | Size        | Est. Tokens  |
| --------------- | ----------- | ------------ |
| Top 10 Files    | 404KB       | ~80,800      |
| Next 40 Files   | 952KB       | ~190,400     |
| Remaining Files | 1,644KB     | ~328,800     |
| **TOTAL**       | **2,900KB** | **~600,000** |

**Critical Insight**: If all `/docs/` files are loaded simultaneously, they consume ~600,000 tokens. At 200K token context, this would require 3 full context windows just for documentation.

---

## Recommendations for Token Optimization

### Priority 1: Archive Completed Work

- Move all completed 2025-10 audits to `/docs/archives/audits-2025-10/`
- Move obsolete phase documentation to `/docs/archives/phases/`
- Expected savings: **~200KB (~40,000 tokens)**

### Priority 2: Split Large Database Files

- Split `triggers.md` (2,487 lines) into:
  - `triggers-stock.md`
  - `triggers-orders.md`
  - `triggers-other.md`
- Split `rls-policies.md` (1,988 lines) into:
  - `rls-policies-auth.md`
  - `rls-policies-products.md`
  - `rls-policies-stock.md`
- Expected savings: **~80KB (~16,000 tokens)** when using specific context

### Priority 3: Lazy-Load Strategy

- Components catalog should be loaded only when:
  - Creating new UI component
  - Debugging component issues
- Trigger documentation should be loaded only when:
  - Debugging database issues
  - Writing migrations
- Expected savings: **~120KB (~24,000 tokens)** per session

### Priority 4: Generate from Source

- Foreign keys: Auto-generate from database schema
- SCHEMA-REFERENCE: Create from Supabase introspection
- Enums: Generate from TypeScript types
- Expected savings: **~90KB (~18,000 tokens)** of duplicated info

### Priority 5: Integration Guides - Review for Redundancy

- Google Merchant (36KB) - Check against actual implementation
- Qonto integration - Verify current status
- ABBY integration - Verify current status

---

## High-Value Context Files to Keep

**Keep these at full size - they're essential**:

1. `COMPOSANTS-CATALOGUE.md` - Used daily for anti-hallucination
2. `CLAUDE.md` (root) - Project instructions (already optimized)
3. `database/triggers.md` - Critical for stock/order automation
4. `database/rls-policies.md` - Security policies
5. `auth/rls-policies.md` - Authentication security

**Consider splitting**:

- `modules/produits/catalogue/` files (hooks 1,033 lines, workflows 994 lines)
- Audit reports by quarter instead of month

---

## Quick Reference: Top 15 Largest Files

```
1.  76KB - /docs/database/triggers.md (2,487 lines)
2.  76KB - /docs/audits/2025-10/AUDIT-UX-UI-VERONE-2025-10-17.md (2,677 lines)
3.  68KB - /docs/audits/2025-11/RAPPORT-AUDIT-TRIGGERS-STOCK-2025-11-12.md (1,901 lines)
4.  52KB - /docs/ux-research/MODAL-HAUTE-DENSITE-RESEARCH-2025.md (1,374 lines)
5.  48KB - /docs/database/rls-policies.md (1,988 lines)
6.  48KB - /docs/archives/phases/PHASE-1-DEPLOYMENT-2025-10-23.md (909 lines)
7.  44KB - /docs/audits/2025-11/RAPPORT-AUDIT-COMPOSANTS-UI-2025-11-07.md (1,008 lines)
8.  44KB - /docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md (1,443 lines)
9.  40KB - /docs/audits/2025-11/RAPPORT-FINAL-SIMPLIFICATION-STOCK-MODULE-2025-11-02.md (1,206 lines)
10. 40KB - /docs/audits/2025-11/PLAN-REFACTORISATION-COMPOSANTS-2025.md (1,182 lines)
11. 40KB - /docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md (990 lines)
12. 40KB - /docs/architecture/COMPOSANTS-CATALOGUE.md (1,969 lines)
13. 40KB - /docs/architecture/CATALOGUE-ANALYSIS-2025.md (1,154 lines)
14. 36KB - /docs/guides/03-integrations/google-merchant/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md (1,235 lines)
15. 36KB - /docs/database/functions-rpc.md (1,021 lines)
```

---

## Files by Content Type Summary

### Database Documentation

- **Triggers**: 76KB (triggers.md)
- **RLS Policies**: 48KB (database/rls-policies.md + auth/rls-policies.md = 56KB total)
- **Functions/RPC**: 36KB
- **Foreign Keys**: 32KB
- **Enums**: 20KB
- **Pricing Architecture**: 28KB
- **Schema Reference**: 28KB
- **Total DB Docs**: ~288KB (~57,600 tokens)

### Architecture & Design

- **Components Catalog**: 40KB (Critical - keep full)
- **Catalog Analysis**: 40KB
- **Component Generics**: 44KB
- **UX Research**: 52KB
- **Design System Guides**: 32KB
- **Total Architecture**: ~208KB (~41,600 tokens)

### Audits & Reports (2025-11)

- **68 audit files** in 2025-11 directory
- Largest: Triggers Stock (68KB), Debt Tech (40KB), Components UI (44KB)
- **Total 2025-11 Audits**: ~800KB (~160,000 tokens)

### Business Rules & Workflows

- **Admin workflow**: 28KB
- **Owner workflow**: 24KB
- **Business rules documents**: ~150KB total
- **Total Workflows/BR**: ~150KB (~30,000 tokens)

---

## Status Summary

**Total Documentation**: 2,900KB (~145,000 lines)
**Estimated Token Weight**: ~600,000 tokens (3 full contexts)
**Files Analyzed**: 500+ markdown files

**Next Steps**: User to approve optimization strategy before implementation
