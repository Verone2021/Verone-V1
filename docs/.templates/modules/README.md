# [MODULE_NAME] - Overview

**Status** : ✅ Phase 1 Complete
**Last Audit** : [AUDIT_DATE]
**Test Coverage** : [COVERAGE]%
**Performance** : ✅ Meets SLOs

---

## 📋 Quick Start

### Basic Usage

```typescript
// 1. Navigate to module
/[module-route]

// 2. Main actions available
- View list
- Create new item
- Edit existing item
- Delete item (if applicable)
- Apply filters/search
```

### Key Components

- **Main Page** : `apps/back-office/apps/back-office/src/app/[module]/page.tsx`
- **Main Hook** : `apps/back-office/apps/back-office/src/hooks/use-[module].ts`
- **Primary Component** : `apps/back-office/apps/back-office/src/components/business/[module]-card.tsx`

---

## 🏗️ Architecture Overview

### Module Structure

```
apps/back-office/src/app/[module]/
├── page.tsx              # Main list view
├── [id]/
│   └── page.tsx         # Detail view
└── new/
    └── page.tsx         # Creation form
```

### Data Flow

```
Page → Hook → Supabase Query → Components → UI
```

### Key Dependencies

- **Hooks** : [list hooks]
- **Components** : [list components]
- **API Routes** : [list routes]
- **Database Tables** : [list tables]

---

## ✨ Key Features

### Feature 1: [Name]

**Description** : [What it does]
**Usage** : [How to use]
**Implementation** : [Key files]

### Feature 2: [Name]

**Description** : [What it does]
**Usage** : [How to use]
**Implementation** : [Key files]

### Feature 3: [Name]

**Description** : [What it does]
**Usage** : [How to use]
**Implementation** : [Key files]

---

## ⚡ Performance Targets

### SLOs (Service Level Objectives)

- **Page Load** : <2s ✅
- **API Response** : <500ms ✅
- **Database Query** : <1s ✅
- **Total Interactive** : <2s ✅

### Current Performance (as of [DATE])

- Page Load : [X]s
- API Response : [X]ms
- Database Query : [X]ms
- Total Interactive : [X]s

### Optimizations Applied

- [Optimization 1]
- [Optimization 2]
- [Optimization 3]

---

## 🧪 Testing

### Test Coverage

- **E2E Tests** : [X]/[Y] flows covered
- **Unit Tests** : [X]% coverage
- **Integration Tests** : [list critical paths]

### Key Test Scenarios

1. List view loading
2. Detail view navigation
3. Create new item
4. Edit existing item
5. Delete item
6. Filters & search
7. Error states

### Console Errors

✅ **Zero errors** (validated [DATE])

---

## 📊 Business Rules

### Critical Rules

- [Rule 1 reference] : [Description]
- [Rule 2 reference] : [Description]

### Validation Logic

- [Validation 1]
- [Validation 2]

### Permissions (RLS)

- **Owner** : Full access
- **Admin** : [specific permissions]
- **User** : [specific permissions]

---

## 🔗 Documentation Index

### Technical Documentation

- [Architecture Details](./architecture.md) - Code structure & design
- [Hooks Reference](./hooks.md) - Custom hooks usage
- [Components Guide](./components.md) - Business components
- [API Routes](./api-routes.md) - Backend endpoints
- [Database Schema](./database.md) - Tables & queries

### Guides

- [Testing Guide](./testing.md) - How to test module
- [Performance Guide](./performance.md) - Optimization techniques
- [Troubleshooting](./troubleshooting.md) - Common issues

---

## 🚀 Recent Changes

### [VERSION] - [DATE]

- [Change 1]
- [Change 2]
- [Change 3]

---

## 🔮 Roadmap (Phase 2)

### Planned Improvements

- [ ] [Improvement 1]
- [ ] [Improvement 2]
- [ ] [Improvement 3]

### Known Limitations

- [Limitation 1] → [Planned fix]
- [Limitation 2] → [Planned fix]

---

**Module [MODULE_NAME] - Production Ready** ✅
