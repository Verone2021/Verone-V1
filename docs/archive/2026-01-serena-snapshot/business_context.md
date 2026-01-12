# Contexte Business Vérone

## 🎯 Mission & Objectifs

**Vérone** : Entreprise spécialisée décoration et mobilier d'intérieur haut de gamme

### MVP Prioritaire : Catalogue Partageable

- **Problème** : Création catalogues clients manuelle et chronophage
- **Solution** : Interface admin → liens partageables + PDF branded + feeds auto
- **Impact Business** : -70% temps création catalogues (objectif critique)
- **ROI Attendu** : 15% conversion catalogue → devis, 99% uptime

## 📊 SLOs Business Critiques

```typescript
const VERONE_SLOS = {
  // MVP Catalogue Partageable
  dashboard_load: 2000, // 2s max - Interface quotidienne
  feeds_generation: 10000, // 10s max - Feeds Meta/Google
  pdf_export: 5000, // 5s max - Catalogues clients
  search_response: 1000, // 1s max - Recherche produits

  // Business Workflows
  collection_creation: 180000, // 3min max - Workflow commercial
  webhook_processing: 2000, // 2s max - Brevo integration
  image_upload: 5000, // 5s max - Photos produits

  // Availability
  uptime: 99.5, // 99.5% minimum
  error_rate: 1, // <1% erreurs
};
```

## 🏗️ Architecture Modulaire Prévue

1. **Catalogue** (MVP Phase 1) → Gestion produits, conditionnements, exports
2. **Stock** → Disponibilités, approvisionnements
3. **Commandes** → Workflow commercial, devis, facturation
4. **Facturation** → Billing, comptabilité
5. **CRM** → Clients, prospects, segmentation
6. **Intégrations** → Brevo, Meta/Google, partenaires

## 🎨 Spécificités UX Vérone

- **Mobile-First** : >40% consultations catalogues sur mobile
- **Premium Feel** : Design haut de gamme, attention détails
- **Performance** : Fluidité critique pour adoption équipe
- **Branding** : Cohérence couleurs/logo Vérone sur tous exports

## 🔗 Intégrations Externes Critiques

- **Brevo** : Marketing automation, webhooks événements
- **Meta/Google Feeds** : Publicités automatisées CSV export
- **PDF Branded** : Templates Vérone pour catalogues clients
- **Supabase** : Database + Auth + Storage + Edge Functions

## 📱 Multi-Frontend Vision

- **back-office** : Interface administration équipe Vérone (MVP)
- **website-public** : Site vitrine particuliers
- **website-pro** : Plateforme B2B professionnels
- **partner-clients** : Front-ends partenaires affiliés (future)
