# Want It Now - Vue d'ensemble Phases d'Implémentation

## 🗺️ **Roadmap Générale (Migration depuis PERSONNEL/)**

Basé sur `PERSONNEL/roadmap_updated.md` avec enrichissement TDD + Tests Playwright.

## 📋 **Phases d'Implémentation**

### **Phase 0 – Boot (Pas de dépendance)**
**Status** : ✅ **COMPLÉTÉ**
- ✅ Repo GitHub + Turborepo  
- ✅ Supabase initialisé
- ✅ Next.js 15, Tailwind, shadcn/ui
- ✅ CI/CD GitHub Actions + Vercel
- ✅ **Guide Visuel Complet** → Migré vers `/manifests/design-specifications/`

### **Phase 1 – Base de données (ordre strict)**  
**Status** : ✅ **COMPLÉTÉ**
- ✅ `organizations`, `profiles`, `owners`, `shareholders`
- ✅ `properties`, `units`, `property_ownership`
- ✅ `seasonal_bookings` et `transactions` avec contraintes exclusives
- ✅ Triggers globaux : validation quotités, règles exclusives
- ✅ **Nouvelle architecture** : Migrations réorganisées dans `/supabase/migrations/01-core/` à `/05-contrats/`

### **Phase 2 – UI + Auth**
**Status** : ✅ **COMPLÉTÉ**  
- ✅ Pages login/register/forgot
- ✅ Layout `<AppShell>` (Header, Sidebar)
- ✅ Connexion Supabase Auth SSR
- ✅ Thème Want It Now (copper + green)
- ✅ **Guide Visuel intégré** dans design system

### **Phase 3 – Vertical Slices (fonctionnalités clés)**
**Status** : ✅ **EN COURS** (Contrats phase active)
- ✅ CRUD Owners (API, UI, tests)
- ✅ CRUD Properties & Units (UI + Map view + wizard)  
- 🚧 **Contrats** : `actions/contrats.ts`, `app/contrats/`, `components/contrats/`, `types/contrats.ts`
- ⏳ Bookings & Calendar (phase suivante après contrats)

### **Phase 4 – Fonctions transversales**
**Status** : ⏳ **PLANIFIÉ**
- Dashboard KPIs (RevPAR, taux d'occupation)
- RLS avancée (RBAC + tenants) 
- Internationalisation (FR/EN/PT)
- Audit a11y complet

### **Phase 5 – Finances & Opérations**  
**Status** : 🚧 **EN COURS** (Contrats)
- 🚧 **Contrats fixes/variables** et calculs automatiques  
- ⏳ Payouts mensuels
- ⏳ Inventaire et inspections (photos)
- ⏳ Export Excel/PDF

### **Phase 6 – Réservations (NOUVELLE)**
**Status** : ⏳ **PLANIFIÉ** (Prochaine phase)
- Système réservations avancé
- Calendrier intégré avec conflits
- Workflow approbation
- Integration booking platforms
- **Tests Playwright** pour workflows réservations complexes

## 🧪 **Stratégie TDD par Phase**

### **Approach Test-Driven pour Phases Restantes**

#### **Phase 3 (Bookings) - TDD Workflow**
1. **RED** : Tests Playwright pour constraints booking exclusifs
2. **GREEN** : Implémentation minimale calendrier + bookings  
3. **VERIFY** : Validation utilisateur workflows

#### **Phase 6 (Réservations) - TDD Avancé**
1. **Planning** : Manifeste business rules réservations
2. **RED** : Tests Playwright scénarios complexes (conflits, multi-unités)
3. **GREEN** : Implementation système réservations
4. **VERIFY** : Validation E2E workflows complets

## 📊 **Métriques de Progression**

### **Completion Tracking**
- ✅ **Phase 0** : 100% Complete
- ✅ **Phase 1** : 100% Complete  
- ✅ **Phase 2** : 100% Complete
- 🚧 **Phase 3** : 80% Complete (Contrats en cours)
- ⏳ **Phase 4** : 0% (Planifié)
- 🚧 **Phase 5** : 30% Complete (Contrats financial logic)
- ⏳ **Phase 6** : 0% (Specifications ready)

### **Testing Coverage par Phase**
```typescript
// Métriques tests par phase
interface PhaseTestMetrics {
  phase3_bookings: {
    playwright_tests: 15, // Tests constraints + workflows
    business_rules: 5,    // Tests quotités + exclusifs  
    edge_cases: 8,        // Tests conversion + conflits
    coverage: "85%"
  },
  phase6_reservations: {
    planned_tests: 25,    // Tests système complet
    workflow_tests: 12,   // Tests approbation
    integration_tests: 8, // Tests platforms externes
    target_coverage: "90%"
  }
}
```

## 🔗 **Dependencies & Prerequisites**

### **Phase 3 → Phase 6 Dependencies**
- Phase 3 Bookings doit être **100% complète** avant Phase 6 Réservations
- Business rules `booking-constraints.md` implémentées
- Tests Playwright booking exclusifs validés

### **Technical Prerequisites Phase 6**
- Système calendrier (Phase 3)
- Workflow approbation (Phase 4)  
- Export/reporting (Phase 5)
- **Manifeste réservations** (dans `/manifests/business-rules/`)

## 🚀 **Next Actions**

### **Immediate (Phase 3 Completion)**
1. **Finaliser tests Playwright** contrats + bookings
2. **Valider business rules** booking exclusifs
3. **Completion bookings calendar** avec gestion conflits

### **Préparation Phase 6**  
1. **Créer manifeste** `reservation-constraints.md`
2. **Design tests Playwright** scénarios réservations
3. **Planifier integration** booking platforms (Airbnb, Booking.com)

---

**Chaque phase suit l'approche Vertical Slice : DB → API → UI → Tests avant de passer à la suivante.**  
**Toutes les migrations sont idempotentes, testées par TDD Playwright.**