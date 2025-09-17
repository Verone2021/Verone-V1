# 📄 Vérone Back Office - Configuration Claude Code

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**MVP Catalogue Partageable** : Next.js + Supabase + shadcn/ui
**Mission** : Créer un back-office totalement scalable.

---

## 🔄 **Workflow TDD Obligatoire**

**RÈGLE ABSOLUE** : Think → Test → Code → Verify

1. **Think** : Analyser `manifests/business-rules/` pertinents et architecture
2. **Test** : Tests manuels uniquement avec Chrome (JAMAIS de tests automatisés)
3. **Code** : Implémentation minimale pour passer tests (GREEN)
4. **Verify** : Re-tester jusqu'à validation complète + performance

**Sequential Thinking** : Utiliser `think` pour planification complexe

---

## ⚡ **Commandes Essentielles**

```bash
# Développement
npm run dev              # Next.js development server
npm run build           # Production build validation
npm run lint            # ESLint + TypeScript check
npm run test            # ❌ INTERDIT - Tests manuels Chrome uniquement

# Vérifications pré-commit
cat MEMORY-BANK/project-context.md      # Contexte projet
ls manifests/business-rules/             # Règles métier disponibles
cat .env.local                          # Variables environnement
```

---

## 🚨 **Règles Business Critiques**

### **JAMAIS de Données Mock**
```typescript
// ❌ INTERDIT
const mockData = [...]
const fakeProducts = [...]

// ✅ OBLIGATOIRE - Hooks Supabase réels
const { products, loading } = useProducts()
await createProduct(formData) // Sauvegarde directe DB
```

### **Design System Vérone**
```css
/* ✅ Couleurs autorisées uniquement */
--verone-primary: #000000    /* Noir signature */
--verone-secondary: #FFFFFF  /* Blanc pur */
--verone-accent: #666666     /* Gris élégant */

/* ❌ INTERDIT ABSOLU */
/* Aucune couleur jaune/dorée/ambre dans le système */
```

### **Business Rules First**
- ✅ **Consulter `manifests/business-rules/`** avant toute implémentation
- ✅ **Tests E2E obligatoires** avec vraie base de données Supabase
- ✅ **Performance SLOs** : Dashboard <2s, Feeds <10s, PDF <5s

---

## 🧱 **Tech Stack**

- **Framework** : Next.js 15 App Router + React 18 + TypeScript strict
- **Backend/DB** : Supabase (PostgreSQL + Auth + RLS + Storage)
- **UI** : shadcn/ui + Tailwind CSS + Design System Vérone
- **Testing** : Playwright E2E + Jest unit tests
- **Deployment** : Vercel + CI/CD automatique

---

## 🛠 **MCP Tools Configuration**

### **Serena** - Analyse Code & Édition Intelligente
- Analyse symbolique, refactoring, diagnostics TypeScript
- Utiliser pour exploration codebase avant modification

### **Supabase** - Database & RLS Validation
- Queries DB directes, validation RLS policies
- Tests migrations et triggers

### **Tests E2E - MANUELS CHROME UNIQUEMENT**
- **❌ INTERDICTION ABSOLUE** : Tests automatisés, `npx playwright test`
- **✅ OBLIGATOIRE** : Tests manuels avec Chrome extension uniquement
- Validation workflows complets (catalogue → partage → PDF)
- Tests business rules avec données réelles
- **Règles détaillées** : `MEMORY-BANK/testing-rules-absolute.md`

### **Sequential Thinking** - Architecture Complexe
- Planification features multi-modules
- Analyse business rules et intégrations

### **Context7** - Documentation Frameworks
- Next.js, React, Tailwind CSS, shadcn/ui docs
- Patterns et best practices officielles

### **Ref** - Documentation & API Reference
- Clé API : ref-adba3c10044809167187
- Documentation technique et références API
- Accès aux specs et exemples de code

---

## 🔑 **Variables d'Environnement**

**Localisation** : `.env.local` (vérifier AVANT de demander credentials)

```bash
# Supabase (critiques)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_ACCESS_TOKEN

# Optionnels
GITHUB_TOKEN
VERCEL_API_TOKEN
```

---

## 📁 **Organisation Repository**

```
src/                    # Code application Next.js
manifests/business-rules/   # Règles métier (CONSULTER EN PREMIER)
MEMORY-BANK/           # Contexte projet centralisé
TASKS/                 # Gestion tâches actuelles
supabase/migrations/   # Migrations DB uniquement
tests/                 # Tests E2E et fixtures
```

**Règle** : Consulter `manifests/business-rules/` et `MEMORY-BANK/` avant implémentation

---

## 🎯 **Success Metrics MVP**

**Business** : -70% temps catalogues, 15% conversion catalogue→devis, >99% uptime
**Technical** : Dashboard <2s, Feeds <10s, >90% test coverage, 0 régression
**Workflow** : Think→Test→Code→Verify systématique pour toute feature

---

*Vérone Back Office - Transforming interior design business through technology excellence*