# 📋 Plan d'Implémentation Serena MCP - Partie 2/2

> **Documentation Serena MCP** - État actuel et prochaines étapes du projet Want It Now V1

## 🎯 **État Actuel du Projet (Décembre 2024)**

### **✅ Fonctionnalités Complètement Implémentées**

#### **1. Système Propriétaires & Quotités**
- **Architecture**: Propriétaires indépendants avec quotités flexibles
- **Business Rules**: Validation 100% des quotités implémentée avec triggers PostgreSQL
- **CRUD Complet**: Création, modification, suppression propriétaires
- **Calculs Automatiques**: Prix d'acquisition calculé automatiquement selon `(prix_achat + frais_notaire + frais_annexes) × pourcentage`
- **Fallback Manuel**: Saisie manuelle si données financières incomplètes

#### **2. Système Propriétés**
- **CRUD Complet**: Toutes opérations propriétés fonctionnelles
- **Statuts Intelligents**: Gestion automatique brouillon ↔ disponible + contrôles manuels
- **Formulaires Complets**: Tous champs (financier, caractéristiques, localisation) implémentés
- **Validation Business**: Contraintes métier appliquées

#### **3. Architecture Database**
- **Migrations**: 123 migrations appliquées, schema cohérent
- **RLS Policies**: Sécurité row-level complète
- **Triggers**: Validation quotités, audit trail automatique
- **Performance**: Index optimisés, queries < 200ms

#### **4. UI/UX Want It Now Design System**
- **Couleurs**: Copper (#D4841A) + Green (#2D5A27) appliquées
- **Composants**: shadcn/ui avec branding Want It Now
- **Responsive**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

## 🏗️ **Architecture Technique Actuelle**

### **Stack Validé en Production**
```typescript
// Technologies principales
Framework: Next.js 15 + React 18 + TypeScript
UI: shadcn/ui + Tailwind CSS + Want It Now Design System
Database: Supabase (PostgreSQL) + RLS + Triggers
Auth: Supabase Auth SSR + Role-based access
Deployment: Vercel + GitHub Actions CI/CD
```

### **Patterns Architecturaux Établis**
```typescript
// Server Actions Pattern
export async function createPropriete(data: ProprieteFormData): Promise<ActionResult> {
  // 1. Validation Zod
  // 2. Auth verification
  // 3. Business rules check
  // 4. Database operation with RLS
  // 5. Type-safe response
}

// Component Pattern avec Want It Now Design
<Button className="bg-[#D4841A] hover:bg-[#B8741A] text-white">
  <Plus className="w-4 h-4 mr-2" />
  Action Principale
</Button>

// Calculs Business avec PostgreSQL Functions
await supabase.rpc('calculate_quotite_prix_acquisition', {
  p_propriete_id: proprieteId,
  p_pourcentage: pourcentage
})
```

## 📊 **Database Schema Critique**

### **Tables Principales Stabilisées**
```sql
-- Propriétaires (Indépendants - Architecture ADR-003)
CREATE TABLE proprietaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type proprietaire_type_enum NOT NULL,
  nom VARCHAR(255) NOT NULL,
  forme_juridique VARCHAR(50) REFERENCES country_legal_forms(legal_form),
  iban VARCHAR(34), -- SEPA 2025 ready
  -- ... autres champs
);

-- Propriétés (Liées aux organisations)
CREATE TABLE proprietes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) NOT NULL,
  prix_achat DECIMAL(15,2),
  frais_notaire DECIMAL(15,2), -- ✅ NOUVEAU (Migration 123)
  frais_annexes DECIMAL(15,2), -- ✅ NOUVEAU (Migration 123)
  -- ... autres champs
);

-- Quotités (Table liaison avec business rules)
CREATE TABLE property_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID REFERENCES proprietaires(id) NOT NULL,
  propriete_id UUID REFERENCES proprietes(id) NOT NULL,
  quotite_numerateur INTEGER NOT NULL,
  quotite_denominateur INTEGER NOT NULL,
  prix_acquisition DECIMAL(15,2), -- Calculé automatiquement
  -- ... trigger validation 100%
);
```

### **Business Rules Critiques Implémentées**
```sql
-- 1. Validation Quotités = 100%
CREATE OR REPLACE FUNCTION validate_property_ownership_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Validation stricte total = 1.0 (100%)
  IF total_quotites > 1.0001 THEN
    RAISE EXCEPTION 'Total quotités dépasse 100%%';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Calcul Automatique Prix Acquisition
CREATE OR REPLACE FUNCTION calculate_quotite_prix_acquisition(
  p_propriete_id UUID,
  p_pourcentage DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT (COALESCE(prix_achat, 0) + COALESCE(frais_notaire, 0) + COALESCE(frais_annexes, 0)) * (p_pourcentage / 100.0)
    FROM proprietes 
    WHERE id = p_propriete_id
  );
END;
$$;
```

## 🚀 **Prochaines Phases d'Implémentation**

### **Phase 6: Système Réservations (Priorité Haute)**
```typescript
// Business Rules à implémenter
interface BookingConstraints {
  // Contrainte exclusive: Property XOR Unit
  property_id: string | null;
  unit_id: string | null;
  // Contrainte: Jamais les deux simultanément
  
  // Validation conflits
  start_date: Date;
  end_date: Date;
  // Logique: Conflit si même unité + dates overlap
}

// Tests Playwright requis
const bookingTestScenarios = [
  'booking_sur_propriete_sans_unites',
  'booking_force_sur_unite_si_propriete_a_unites',
  'prevention_double_attribution_property_et_unit',
  'validation_conflits_calendrier'
];
```

### **Phase 7: Contrats Variables (En Cours)**
```typescript
// Logique métier contrats variables
interface ContratsVariables {
  commission_percentage: 10; // Fixe 10%
  max_days_per_year: 60; // Maximum 60 jours/an
  calculation_mode: 'automatic' | 'manual';
  // Integration avec quotités système
}
```

### **Phase 8: Dashboard Analytics**
```typescript
// KPIs Business requis
interface DashboardKPIs {
  revpar: number; // Revenue Per Available Room
  occupancy_rate: number; // Taux d'occupation
  average_daily_rate: number; // Prix moyen journalier
  proprietaires_actifs: number;
  proprietes_disponibles: number;
}
```

## 🧪 **Testing Strategy (TDD Enhanced)**

### **Tests Playwright Implémentés**
```typescript
// Tests business rules quotités
✅ quotites_somme_exactement_100_percent
✅ rejet_somme_quotites_incorrecte  
✅ ajustement_dynamique_quotites
✅ proprietaire_unique_100_percent
✅ gestion_precision_decimales

// Tests calculs automatiques
✅ calcul_auto_prix_acquisition_base_sur_pourcentage
✅ fallback_manuel_si_donnees_financieres_manquantes
✅ indication_visuelle_calcul_automatique
```

### **Tests à Créer (Phase 6)**
```typescript
// Tests booking constraints
❌ booking_property_xor_unit_exclusivity
❌ conflict_detection_same_unit_overlapping_dates
❌ booking_calendar_integration_workflows
❌ property_conversion_units_impact_bookings
```

## 📁 **Structure Fichiers Critique**

### **Actions Server (Fonctionnelles)**
```
actions/
├── proprietes.ts ✅ CRUD + calculateQuotitePrixAcquisition()
├── proprietes-quotites.ts ✅ CRUD quotités + validation
├── proprietaires.ts ✅ CRUD complet
└── organisations.ts ✅ CRUD + soft/hard delete
```

### **Composants UI (Design System Appliqué)**
```
components/
├── proprietes/
│   ├── proprietes-edit-form.tsx ✅ Tous champs + frais_notaire/annexes
│   ├── propriete-status-controls.tsx ✅ Contrôles statut manuels
│   └── quotites/
│       ├── quotite-edit-form.tsx ✅ Calcul auto + fallback manuel
│       └── quotites-table.tsx ✅ Affichage + actions
├── proprietaires/ ✅ CRUD complet
└── ui/ ✅ shadcn/ui + Want It Now branding
```

### **Validations (Type Safety Complète)**
```
lib/validations/
├── proprietes.ts ✅ + frais_notaire/annexes + determineStatutFromBrouillon()
├── proprietaires.ts ✅ Schemas Zod complets
└── quotites.ts ✅ Validation 100% + business rules
```

## 🔧 **Outils de Développement**

### **MCP Servers Configurés**
```json
// .mcp.json - Serena pour IDE assistance
{
  "serena": {
    "command": "uvx",
    "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "ide-assistant", "--project", "/Users/romeodossantos/project-template/want-it-now-V1"]
  }
}
```

### **Scripts Utilitaires**
```bash
# Development
npm run dev # Port 3006 (stable)
npm run build # Production build
npm run lint # ESLint + TypeScript check

# Database
npx supabase db push # Apply migrations
psql $DATABASE_URL -f migration.sql # Direct SQL
```

## 📋 **Checklist État Actuel**

### **✅ Complété (Production Ready)**
- [x] Architecture propriétaires indépendants (ADR-003)
- [x] Validation quotités 100% (triggers + UI)
- [x] Calculs automatiques prix acquisition
- [x] Gestion statuts cohérente (brouillon ↔ disponible)
- [x] Formulaires complets (tous champs affichés)
- [x] Design system Want It Now appliqué
- [x] RLS policies sécurisées
- [x] Tests Playwright business rules

### **🚧 En Cours (Phase Active)**
- [ ] Système réservations (booking constraints)
- [ ] Contrats variables (10% commission, 60 jours max)
- [ ] Tests Playwright booking workflows

### **⏳ Planifié (Phases Futures)**
- [ ] Dashboard analytics (RevPAR, occupancy)
- [ ] Exports Excel/PDF
- [ ] Internationalisation (FR/EN/PT)
- [ ] Integration booking platforms (Airbnb, Booking.com)

## 🎯 **Recommandations pour Serena**

### **Pour Nouveaux Développements**
1. **Suivre patterns établis** : Server actions + Zod validation + RLS
2. **Utiliser design system** : Couleurs Want It Now (#D4841A, #2D5A27)
3. **Tests business rules** : Playwright pour workflows complexes
4. **Consulter manifests** : `/manifests/business-rules/` pour règles métier

### **Pour Debugging**
1. **Logs structurés** : Système de logging D-Log implémenté
2. **Database direct** : Toujours vérifier schema Supabase avant modifications
3. **Types TypeScript** : Utiliser interfaces dans `/lib/validations/`

### **Pour Modifications**
1. **Migrations idempotentes** : Tester avec `npx supabase db push`
2. **Backward compatibility** : RLS policies doivent rester cohérentes
3. **Business rules** : Valider avec triggers PostgreSQL

---

## 💡 **Notes Importantes pour Serena**

### **Architecture Décision Records (ADR)**
- **ADR-003** : Propriétaires indépendants (vs liés aux organisations)
- Cette décision est **CRITIQUE** et ne doit PAS être remise en question

### **Protected Files (NE JAMAIS MODIFIER)**
- `.env*` : Credentials Supabase
- `actions/organisations.ts` : Fonctions delete critiques
- Database triggers : Validation quotités

### **Business Rules Non-Négociables**
- Quotités = 100% exactement (mathématiquement)
- Booking Property XOR Unit (jamais les deux)
- RLS policies : Sécurité multi-tenant

---

**Cette documentation Partie 2/2 complète le plan d'implémentation Serena MCP. Utiliser avec Partie 1/2 pour contexte complet.**

**État**: Projet stable, fonctionnalités core complètes, prêt pour Phase 6 (Réservations)