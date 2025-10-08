# 🎯 Contexte Projet Vérone Back Office - Unified

## 📋 Vision Globale

**Vérone Back Office** est un CRM/ERP modulaire spécialisé dans la décoration et le mobilier d'intérieur haut de gamme.

### 🎯 Mission Business
Transformer la gestion commerciale de Vérone avec un **MVP Catalogue Partageable** :
- **Admin** → Lien client sécurisé + PDF branded + Feeds Meta/Google
- **Impact attendu** : -70% temps création catalogues clients
- **ROI cible** : 15% conversion catalogue → devis, 99% uptime, <10s génération feeds

### **Positionnement Marché**
Solution complète remplaçant les outils fragmentés (Excel, emails, logiciels obsolètes) par un système unifié professionnel.

### **Valeur Ajoutée Unique**
- **Catalogue Partageable** : PDF/Web professionnel pour clients prospects
- **Omnicanal Intégré** : Amazon, eBay, site web, réseaux sociaux synchronisés
- **CRM Haut de Gamme** : Relation client premium avec historique unifié
- **Workflows Automatisés** : Processus métier optimisés sans erreur humaine
- **Performance Enterprise** : <2s Dashboard, <3s Catalogue, 99.9% uptime

## 🏢 Stakeholders Clés

### **👥 Équipe Vérone**
- **Dirigeants** : Validation stratégie, ROI, roadmap
- **Équipe Commerciale** : Utilisateurs quotidiens interface, feedback UX
- **Responsable Marketing** : Intégrations Brevo, feeds publicitaires
- **Gestion Stock** : Synchronisation inventaires, conditionnements

### **🛠️ Équipe Technique**
- **Product Owner** : Priorisation features, acceptance criteria
- **Développeur Full-Stack** : Architecture, implémentation MVP
- **UI/UX Designer** : Design system, expérience utilisateur
- **DevOps** : Déploiement Vercel, monitoring performance

## 🎯 Objectifs Mesurables 2025

### **📊 Business KPIs**
- **Adoption** : 100% équipe commerciale <30 jours
- **Productivité** : -70% temps création catalogues vs méthode actuelle
- **Conversion** : 15% catalogues partagés → demandes devis
- **Satisfaction** : >8/10 score utilisabilité équipe interne

### **⚡ Technical KPIs**
- **Performance** : Dashboard <2s, Feeds <10s, PDF <5s
- **Fiabilité** : >99% uptime liens partagés
- **Qualité** : >90% test coverage, 0 régression critique
- **Security** : RLS 100% coverage, 0 vulnérabilité critique

## 🏗️ Architecture Technique

### **📱 Applications**
- **back-office/** : Interface administration (MVP actuel)
- **website-public/** : Site vitrine particuliers (futur)
- **website-pro/** : Site B2B professionnels (futur)

### **🧩 Modules Core**
- **Catalogue** : Produits, variantes, conditionnements, images
- **Stock** : Inventaires temps réel, statuts disponibilité
- **Commandes** : Workflow commercial, devis, facturation
- **CRM** : Clients, historique, segmentation
- **Intégrations** : Brevo, Meta/Google, partenaires

### **🔧 Stack Technique**
```typescript
// Frontend: Next.js 15 + React 18
"next": "^15.0.0"
"react": "^18.0.0"
"typescript": "^5.0.0"

// Backend: Supabase Full Stack
"@supabase/supabase-js": "latest"
"@supabase/auth-helpers-nextjs": "latest"

// UI/UX: shadcn/ui + Design System Vérone
"@radix-ui/react-*": "latest"
"tailwindcss": "^3.0.0"
"lucide-react": "latest"
```

### **Base de Données Architecture**
```sql
-- Modules Core Tables
products (catalogue) → stock_movements (stocks) → orders (commandes)
contacts (CRM) → interactions (devis) → orders (conversion)
suppliers (sourcing) → purchase_orders (approvisionnement)
users (équipe) → user_profiles (roles/permissions)

-- Support Tables
categories, collections, variants, channels, settings
```

## 🎨 Brand Identity Vérone

### **🎨 Couleurs Signature**
```css
--verone-primary: #000000    /* Noir signature */
--verone-secondary: #FFFFFF  /* Blanc pur */
--verone-accent: #666666     /* Gris élégant */
```

### **🚨 Interdiction Absolue**
- **AUCUNE couleur jaune/dorée** dans le système
- Violations = échec immédiat des PR
- Design minimaliste noir/blanc/gris uniquement

## 📊 Philosophie Quality Assurance

```typescript
// Règle fondamentale Vérone
const VERONE_QUALITY_PRINCIPLE = {
  console_errors: 0,           // Zéro tolérance absolue
  performance_sla: 'strict',   // <2s Dashboard, <3s Catalogue
  business_integrity: '99.8%', // Données cohérentes cross-module
  user_experience: '4.5+/5',   // Excellence UX obligatoire
  security_compliance: '100%'  // RGPD + audit sécurité
}
```

## 🔐 Sécurité et Conformité

### **Row Level Security (RLS) Supabase**
```sql
-- Exemple politique sécurité produits
CREATE POLICY "products_access" ON products FOR ALL TO authenticated USING (
  CASE
    WHEN auth.jwt() ->> 'role' = 'owner' THEN true
    WHEN auth.jwt() ->> 'role' = 'manager' THEN true
    WHEN auth.jwt() ->> 'role' = 'seller' AND status = 'active' THEN true
    WHEN auth.jwt() ->> 'role' = 'viewer' THEN false
    ELSE false
  END
);
```

### **RGPD Compliance Intégré**
- **Consentements** : Tracking granulaire opt-in/opt-out
- **Droit oubli** : Suppression données + logs audit
- **Portabilité** : Export format standard JSON/CSV
- **Limitation** : Gel traitement selon demandes
- **Audit trail** : Logs accès et modifications horodatés

## 🛠 **MCP Tools Configuration**

### **Outils MCP Disponibles**
```yaml
serena: # Analyse code, édition intelligente
  - get_symbols_overview
  - find_symbol
  - replace_symbol_body
  - search_for_pattern

supabase: # Database, RLS validation
  - execute_sql
  - get_logs
  - get_advisors
  - list_tables

sentry: # Error monitoring & auto-correction
  - get_recent_issues
  - create_issue
  - resolve_issue

playwright: # Tests browser automation
  - browser_navigate
  - browser_snapshot
  - browser_console_messages
  - browser_click

context7: # Documentation frameworks officielles
  - resolve-library-id
  - get-library-docs
```

## 🚀 Phase Actuelle : MVP Catalogue

### **✅ Réalisé**
- Infrastructure Supabase complète
- Interface administration fonctionnelle
- Gestion familles/catégories/sous-catégories
- Upload images produits
- Authentification et RLS
- 241 produits avec images affichés

### **🔥 En Cours**
- Système de conditionnements flexibles
- Export PDF catalogues branded
- Feeds CSV Meta/Google
- Optimisation MCP Sentry pour auto-correction

### **📋 Prochaines Étapes**
- Collections produits partageables
- Liens publics sécurisés
- Intégration webhooks Brevo
- Interface mobile optimisée

---

## 🎯 **Roadmap et Évolutions**

### **Phase Actuelle : Foundation (Q4 2024-Q1 2025)**
- [x] Architecture technique complète
- [x] 11 modules core implémentés
- [x] Intégration MCP Tools (Serena, Supabase, Sentry, Playwright, Context7)
- [ ] Système error reporting optimisé
- [ ] Performance optimization continue

### **Phase 2 : Scale (Q2 2025)**
- [ ] Multi-tenant architecture
- [ ] API publique clients/partenaires
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics/BI

### **Phase 3 : Ecosystem (Q3 2025)**
- [ ] Marketplace plugins tiers
- [ ] Intégrations comptables (Sage, Cegid)
- [ ] EDI avec fournisseurs/clients
- [ ] White-label solutions partenaires

---

*Dernière mise à jour : 26 janvier 2025*
*Version : MVP Catalogue v1.1 - MCP Optimized*