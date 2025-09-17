# 🎯 Contexte Projet Vérone Back Office

## 📋 Vision Globale

**Vérone Back Office** est un CRM/ERP modulaire spécialisé dans la décoration et le mobilier d'intérieur haut de gamme.

### 🎯 Mission Business
Transformer la gestion commerciale de Vérone avec un **MVP Catalogue Partageable** :
- **Admin** → Lien client sécurisé + PDF branded + Feeds Meta/Google
- **Impact attendu** : -70% temps création catalogues clients
- **ROI cible** : 15% conversion catalogue → devis, 99% uptime, <10s génération feeds

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
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Frontend** : Next.js 15 App Router + React 18 + TypeScript
- **UI** : shadcn/ui + Tailwind CSS + Design System Vérone
- **Déploiement** : Vercel + CI/CD automatique
- **Testing** : Playwright E2E + Jest unit tests

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

## 🚀 Phase Actuelle : MVP Catalogue

### **✅ Réalisé**
- Infrastructure Supabase complète
- Interface administration fonctionnelle
- Gestion familles/catégories/sous-catégories
- Upload images produits
- Authentification et RLS

### **🔥 En Cours**
- Affichage 241 produits avec images
- Système de conditionnements flexibles
- Export PDF catalogues branded
- Feeds CSV Meta/Google

### **📋 Prochaines Étapes**
- Collections produits partageables
- Liens publics sécurisés
- Intégration webhooks Brevo
- Interface mobile optimisée

---

*Dernière mise à jour : 15 septembre 2025*
*Version : MVP Catalogue v1.0*