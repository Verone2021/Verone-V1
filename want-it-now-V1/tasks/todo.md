# 🎯 WANT IT NOW V1 - RECONSTRUCTION SELON ARCHITECTURE CORRECTE

> **Discipline Framework** : Suivre strictement @CLAUDE.md - Zéro erreur, zéro supposition
> **Architecture Correcte** : Propriétaires indépendants ↔ Propriétés via quotités (pas lié aux organisations)
> **Deadline** : Livraison ce soir - Travail expert niveau

---

## 📊 **DIAGNOSTIC ÉTAT ACTUEL** ✅

### **✅ SYSTÈMES FONCTIONNELS À PRÉSERVER**
- [x] **Authentification SSR** - providers/auth-provider-ssr.tsx + lib/auth/server-auth.ts ✅
- [x] **Organisations** - CRUD complet avec soft/hard delete (app/organisations/) ✅
- [x] **Utilisateurs & Rôles** - Gestion super_admin/admin (app/admin/utilisateurs/) ✅
- [x] **Design System Want It Now** - gradient-copper, branding, shadcn/ui ✅
- [x] **Navigation & Layout** - AppShell, header, sidebar structure ✅
- [x] **Dashboard & Profile** - Pages utilisateur fonctionnelles ✅

### **❌ SYSTÈMES INCORRECTS À SUPPRIMER**
- [ ] **app/proprietaires/** - Architecture FAUSSE (lié directement organisations)
- [ ] **app/proprietes/** - Basé sur architecture incorrecte
- [ ] **components/proprietaires/** - Composants basés sur architecture incorrecte
- [ ] **components/proprietes/** - Composants basés sur architecture incorrecte
- [ ] **actions/proprietaires.ts** - Server actions incorrects
- [ ] **actions/proprietes.ts** - Server actions incorrects
- [ ] **lib/validations/proprietaires.ts** - Schemas incorrects
- [ ] **lib/validations/proprietes.ts** - Schemas incorrects
- [ ] **Migrations 061-067** - Toutes les migrations proprietaires/proprietes incorrectes

---

## 🏗️ **ARCHITECTURE CORRECTE SELON MODÈLE FONCTIONNEL**

### **Relations Entités (CORRECTES)**
```
Organisations (1 par pays) 
  ↓ (trigger auto par pays - pas de sélection UI)
Propriétés → assignation automatique organisation_id par pays
  ↕ (quotités N-à-N via propriete_proprietaires)
Propriétaires (entités INDÉPENDANTES)
  ↓ (si moraux)
Associés (quotités = 100% par propriétaire moral)
```

### **Règles Business Essentielles**
- **JAMAIS** de lien direct propriétaire → organisation
- **Attribution automatique** organisation par pays (trigger, invisible UI)
- **Quotités = 100%** dans propriete_proprietaires ET associes
- **Irréversibilité** principal ↔ multi-unités après création
- **Super_admin** : tout faire (créer organisations + propriétaires + propriétés)
- **Admin** : tout sauf créer organisations (créer propriétaires + propriétés)
- **Propriétaire V1** : aucun rôle applicatif

---

## ✅ **FONCTIONNALITÉS RÉCEMMENT COMPLÉTÉES** 

### **🏦 SYSTÈME BANCAIRE COMPLET** ✅ *(Septembre 2025)*
- [x] **Ajout colonnes bancaires** - IBAN, account_holder_name, bank_name, swift_bic
- [x] **Contraintes SEPA 2025** - Validation IBAN format + obligatoire titulaire 
- [x] **Interface bancaire** - Section dédiée avec badges SEPA/International
- [x] **Tests Playwright** - Validation automatisée système bancaire complet
- [x] **Sécurité données** - Message confidentialité + formatage IBAN

### **🌍 FORMES JURIDIQUES INTERNATIONALES** ✅ *(Septembre 2025)*  
- [x] **Support Portugal** - LDA, SARL, autres formes juridiques européennes
- [x] **Migration database** - Enum étendu formes juridiques internationales
- [x] **Interface utilisateur** - Labels descriptifs "Forme juridique" + "N° identification"
- [x] **Section titrée** - "Informations juridiques" cohérente avec Contact/Adresse
- [x] **Validation** - Formulaires personnes morales internationales fonctionnels

### **🧪 TESTS & VALIDATION COMPLÈTE** ✅ *(Septembre 2025)*
- [x] **Tests Playwright** - Coverage banking + international forms + UI consistency  
- [x] **Validation manuelle** - Propriétaires existants (JARDIM PRÓSPERO) mis à jour
- [x] **Interface cohérente** - Toutes sections avec titres et icônes harmonisées
- [x] **Performance** - Pas d'impact négatif, système stable

### **🎨 AMÉLIORATION UX/UI** ✅ *(Septembre 2025)*
- [x] **Design System** - Respect couleurs Want It Now (#D4841A copper, #2D5A27 green)
- [x] **Hiérarchie visuelle** - Sections titrées avec icônes Lucide coherentes
- [x] **Accessibilité** - Labels descriptifs, structure sémantique H3/H4
- [x] **Responsive** - Mobile-first maintenu, pas de régression

---

## 🗂️ **PHASES RECONSTRUCTION** *(Architecture Cible)*

### **PHASE 1: NETTOYAGE COMPLET** 🧹
- [x] Test application actuelle - systèmes fonctionnels identifiés
- [x] Création /tasks/ folder avec todo.md Anthropic best practices
- [ ] **Suppression complète app/proprietaires/** (toutes pages/routes)
- [ ] **Suppression complète app/proprietes/** (toutes pages/routes)
- [ ] **Suppression components/proprietaires/** (tous composants)
- [ ] **Suppression components/proprietes/** (tous composants)
- [ ] **Suppression actions proprietaires/proprietes** (server actions)
- [ ] **Suppression validations proprietaires/proprietes** (schemas)
- [ ] **Suppression migrations 061-067** (toutes versions incorrectes)
- [ ] **Nettoyage navigation** - retirer liens obsolètes sidebar
- [ ] **Audit complet** - aucun fichier obsolète restant

### **PHASE 2: DATABASE ARCHITECTURE CORRECTE** 🗄️
- [ ] **Migration proprietaires** - Entités indépendantes (pas FK organisations)
- [ ] **Migration associes** - Pour propriétaires moraux (quotités = 100%)
- [ ] **Migration property_kinds** - Table référence types (extensible vs ENUM)
- [ ] **Migration proprietes** - Liées organisations via trigger pays
- [ ] **Migration unites** - Sous-logements optionnels 
- [ ] **Migration propriete_proprietaires** - Table quotités N-à-N (somme = 100%)
- [ ] **Triggers adaptation** - Réutiliser logique organisations existante :
  - [ ] Auto-assignment organisation par pays
  - [ ] Validation quotités = 100% (propriete_proprietaires + associes)
  - [ ] Blocage conversion principal ↔ multi-unités

### **PHASE 3: BACKEND SELON MODÈLE FONCTIONNEL** ⚙️
- [ ] **actions/proprietaires.ts** - CRUD indépendant organisations
  - [ ] Gestion physique/morale + associés
  - [ ] Validation quotités associés = 100%
  - [ ] Quick-create pour formulaires propriétés
- [ ] **actions/proprietes.ts** - Wizard 4 étapes + assignment auto
  - [ ] Étape 1: Principal vs multi-unités + pays/adresse
  - [ ] Étape 2: Caractéristiques OU éditeur unités inline
  - [ ] Étape 3: Amenities/Safety par unité  
  - [ ] Étape 4: Review + prix/valeurs
  - [ ] Assignment automatique organisation par pays
- [ ] **actions/quotites.ts** - Gestion propriete_proprietaires
  - [ ] Validation temps réel somme = 100%
  - [ ] Interface assignment propriétaires → propriétés
- [ ] **Validations Zod complètes** - Schemas conformes modèle fonctionnel
- [ ] **Types TypeScript** - Interfaces toutes entités

### **PHASE 4: FRONTEND SELON CODE GUIDE VISUEL** 🎨
- [ ] **Pages propriétaires** - Liste, création, édition (physique/morale)
  - [ ] Manager associés avec quotités = 100%
  - [ ] Recherche/filtres appropriés
  - [ ] Quick-create modal pour propriétés
- [ ] **Wizard propriétés** - 4 étapes selon spécifications
  - [ ] Pas de sélection organisation (auto par pays)
  - [ ] Gestion principal/multi-unités irréversible
  - [ ] Interface amenities/safety par unité
- [ ] **Gestion quotités** - Interface propriete_proprietaires
  - [ ] Validation temps réel = 100%
  - [ ] Recherche propriétaires pour assignment
- [ ] **Tables de données** - Listes avec filtres/actions CRUD
- [ ] **Design System cohérent** - Want It Now branding préservé
  - [ ] Couleurs : #D4841A (copper), #2D5A27 (green)  
  - [ ] Components shadcn/ui avec branding existant
  - [ ] Inputs bg-white obligatoire

### **PHASE 5: INTEGRATION & RLS** 🔗
- [ ] **RLS Policies** - Multi-tenant par organisation_id
  - [ ] super_admin : accès global
  - [ ] admin : filtré organisations assignées
  - [ ] Adaptation logique organisations existante
- [ ] **Navigation mise à jour** - Sidebar nouveaux systèmes
- [ ] **Quick Create intégration** - Propriétaires depuis propriétés
- [ ] **Recherche proprietaires** - Pour assignation quotités
- [ ] **Business logic validation** - Contraintes métier

### **PHASE 6: DOCUMENTATION & FINALISATION** 📚
- [ ] **Documentation design system** - Docs/design-system/ complet
- [ ] **Guide business logic** - Docs/business-logic/ modèle fonctionnel
- [ ] **API documentation** - Actions et endpoints
- [ ] **Testing end-to-end** - Workflow complet validé
- [ ] **Build verification** - npm run build sans erreurs

---

## 🔧 **DÉTAILS TECHNIQUES CRITIQUES**

### **Types de Biens : Table Référence Recommandée**
```sql
CREATE TABLE property_kinds (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,     -- 'maison', 'appartement'
  libelle VARCHAR(100),        -- 'Maison individuelle' 
  groupe property_group,       -- 'principal' | 'multi_unites'
  actif BOOLEAN DEFAULT true,
  ordre INT
);
```
**Avantages** : Extensible sans migration, activable/désactivable, traduisible

### **Contraintes Database Obligatoires**
```sql
-- Quotités = 100%
CONSTRAINT check_quotites_propriete 
  CHECK ((SELECT SUM(quotite) FROM propriete_proprietaires WHERE propriete_id = proprietes.id) = 100)

CONSTRAINT check_quotites_associes  
  CHECK ((SELECT SUM(quotite) FROM associes WHERE proprietaire_id = proprietaires.id) = 100)

-- Assignment auto organisation 
BEFORE INSERT TRIGGER proprietes_set_organisation_by_pays()

-- Blocage conversion structure
BEFORE UPDATE TRIGGER prevent_structure_change()
```

### **Rôles & Permissions V1**
- **Super_admin** : Créer organisations + propriétaires + propriétés (accès global)
- **Admin** : Créer propriétaires + propriétés (filtré par organisations)
- **Propriétaire** : Aucun rôle V1 (prévu V2)

---

## 🚨 **CHECKLIST QUALITÉ OBLIGATOIRE**

### **Architecture Validation** ✅
- [ ] Propriétaires indépendants des organisations  
- [ ] Quotités via propriete_proprietaires (N-à-N)
- [ ] Assignment automatique organisation par pays
- [ ] Triggers adaptés logique organisations existante
- [ ] RLS multi-tenant fonctionnel

### **Code Quality Standards** ✅
- [ ] TypeScript strict mode
- [ ] Zod validation schemas complets
- [ ] Error handling approprié
- [ ] Loading states + success/error toasts
- [ ] Responsive design mobile-first
- [ ] Performance optimisée (Promise.all)

### **Want It Now Design System** ✅
- [ ] Couleurs cohérentes (#D4841A copper, #2D5A27 green)
- [ ] Components shadcn/ui avec branding
- [ ] Inputs bg-white obligatoire
- [ ] Gradients et effets selon guide visuel
- [ ] Icons cohérents (Lucide)

### **Database Integrity** ✅
- [ ] Foreign keys définies
- [ ] RLS policies testées
- [ ] Triggers fonctionnels  
- [ ] Contraintes quotités validées
- [ ] Migrations idempotentes

---

## ⏰ **TIMELINE LIVRAISON CE SOIR**

### **Milestones & Horaires**
- **19h00-19h45** : Phase 1 - Nettoyage complet *(45min)*
- **19h45-21h15** : Phase 2 - Database architecture correcte *(90min)*
- **21h15-23h15** : Phase 3 - Backend modèle fonctionnel *(120min)*
- **23h15-01h45** : Phase 4 - Frontend CODE GUIDE VISUEL *(150min)*
- **01h45-02h45** : Phase 5 - Integration & RLS *(60min)*
- **02h45-03h30** : Phase 6 - Documentation & finalisation *(45min)*

### **Deliverables Finaux**
- ✅ Application 100% fonctionnelle architecture correcte
- ✅ Repository clean (zéro fichier obsolète)
- ✅ Documentation complète Docs/
- ✅ Build sans erreurs
- ✅ Design cohérent preserved
- ✅ Tests end-to-end validés

---

## 📞 **RÉFÉRENCES & SUPPORT**

### **Documents Référence**
- `@PERSONNEL/presentation.md` - Business model Want It Now
- `@PERSONNEL/schema_updated.md` - ERD architecture correcte  
- `@PERSONNEL/roadmap_updated.md` - Phases développement
- `@CLAUDE.md` - Discipline framework + protected files

### **Architecture Cible**
- Next.js 15 + App Router + SSR auth
- Supabase + RLS multi-tenant
- shadcn/ui + Want It Now branding
- TypeScript strict + Zod validation

### **Protocole Discipline**
- STOP-READ-ASK-LOCATE-CONFIRM-ACT obligatoire
- Zéro supposition, questions si ambiguïté
- Code quality 100% non négociable
- Préservation systèmes fonctionnels

---

**🏆 OBJECTIF** : Want It Now V1 avec architecture correcte (propriétaires indépendants ↔ propriétés via quotités) livré ce soir avec qualité expert niveau.