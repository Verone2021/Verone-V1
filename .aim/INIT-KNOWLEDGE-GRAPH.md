# 🧠 Initialisation Knowledge Graph Vérone

**Fichier Memory MCP** : `.aim/verone-knowledge-graph.json`
**Date Création** : 3 octobre 2025

---

## 📊 Structure Knowledge Graph

### Entités Principales à Créer

```json
{
  "entities": [
    {
      "name": "Vérone Back Office",
      "entityType": "Project",
      "observations": [
        "CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme",
        "Stack: Next.js 15 + Supabase + shadcn/ui + Playwright",
        "MVP: Catalogue partageable (Phase 1 déployée)",
        "Production URL: https://verone-backoffice-7f270yhir-verone2021s-projects.vercel.app",
        "Repository: Verone2021/Verone-backoffice"
      ]
    },
    {
      "name": "Catalogue Module",
      "entityType": "Module",
      "observations": [
        "Module principal MVP - Catalogue partageable",
        "Gestion 241 produits avec variantes",
        "Système packages: single/pack/bulk/custom",
        "SLO: Affichage catalogue <3s",
        "Features: Collections, Recherche, Export PDF, Feeds Meta/Google"
      ]
    },
    {
      "name": "Stock Module",
      "entityType": "Module",
      "observations": [
        "Phase 2 - Backend ready, UI désactivée",
        "Soft/hard reservations produits",
        "Alertes rupture stock automatiques",
        "Intégration avec Orders Module",
        "Traçabilité mouvements stock complète"
      ]
    },
    {
      "name": "Orders Module",
      "entityType": "Module",
      "observations": [
        "Phase 3 - En développement",
        "Workflow: Devis → Commande → Facturation",
        "Intégration Stock (réservations)",
        "Intégration Billing (facturation)",
        "Notifications clients automatiques"
      ]
    },
    {
      "name": "Billing Module",
      "entityType": "Module",
      "observations": [
        "Phase 3 - Planifié",
        "Génération factures automatiques",
        "Export comptable",
        "Paiements en ligne intégration future",
        "Compliance fiscale française"
      ]
    },
    {
      "name": "CRM Module",
      "entityType": "Module",
      "observations": [
        "Gestion clients B2B et B2C",
        "Organisations multi-utilisateurs",
        "Historique interactions clients",
        "Segmentation clients",
        "Intégration Brevo (email marketing)"
      ]
    },
    {
      "name": "Feed Generation",
      "entityType": "Feature",
      "observations": [
        "SLO critique: <10s pour 1000+ produits",
        "Facebook Catalog Feed: 29 champs obligatoires",
        "Google Merchant Feed: 33+ champs",
        "Templates officiels Meta/Google respectés",
        "Génération automatique via API"
      ]
    },
    {
      "name": "PDF Export Catalogue",
      "entityType": "Feature",
      "observations": [
        "SLO: <5s génération PDF",
        "Design Vérone branded (noir/blanc)",
        "Multi-produits avec images",
        "Tarification B2B/B2C adaptative",
        "Envoi email automatique optionnel"
      ]
    },
    {
      "name": "Tarification B2B/B2C",
      "entityType": "BusinessRule",
      "observations": [
        "Prix différenciés B2B vs B2C",
        "Remises dégressives par quantité (10/50/100 unités)",
        "Remise maximale: 40% pour B2B",
        "Minimum Order Quantity (MOQ) configurable",
        "Calcul automatique selon profil client"
      ]
    },
    {
      "name": "Conditionnements Packages",
      "entityType": "BusinessRule",
      "observations": [
        "Types: single (unité), pack (lot), bulk (palette), custom (sur-mesure)",
        "Tarification adaptée par type conditionnement",
        "Stock géré par conditionnement",
        "Affichage conditionné selon profil client"
      ]
    },
    {
      "name": "Next.js 15",
      "entityType": "Technology",
      "observations": [
        "Framework frontend principal",
        "App Router (nouvelle architecture)",
        "Server Components prioritaires",
        "Performance: Dashboard <2s, Catalogue <3s",
        "Deployed sur Vercel"
      ]
    },
    {
      "name": "Supabase",
      "entityType": "Technology",
      "observations": [
        "Database Postgres + Backend as a Service",
        "RLS (Row Level Security) sur toutes tables",
        "Auth providers: Email/Password",
        "Real-time subscriptions pour updates",
        "Project: aorroydfjsrygmosnzrl"
      ]
    },
    {
      "name": "Playwright MCP",
      "entityType": "Technology",
      "observations": [
        "Testing E2E avec browser visible",
        "Console error checking obligatoire",
        "Zero tolerance policy (0 erreur console)",
        "Screenshots automatiques proof",
        "Workflow révolutionnaire 2025"
      ]
    },
    {
      "name": "Sentry",
      "entityType": "Technology",
      "observations": [
        "Monitoring erreurs production",
        "Stack traces détaillées",
        "Performance monitoring",
        "Alertes temps réel",
        "Intégration Supabase logs"
      ]
    },
    {
      "name": "Design System Vérone",
      "entityType": "Standard",
      "observations": [
        "Couleurs UNIQUEMENT: Noir (#000000) et Blanc (#FFFFFF)",
        "INTERDIT ABSOLU: Jaune, doré, ambre",
        "Typographies: Balgin Light, Monarch Regular, Fieldwork 10 Geo",
        "shadcn/ui components customisés",
        "Mobile-first responsive design"
      ]
    },
    {
      "name": "Performance SLOs",
      "entityType": "Standard",
      "observations": [
        "Dashboard: <2s load time",
        "Catalogue: <3s pour 241 produits",
        "Feed generation: <10s pour 1000+ produits",
        "PDF export: <5s",
        "API response: <1s",
        "Search: <1s"
      ]
    }
  ],
  "relations": [
    {
      "from": "Catalogue Module",
      "to": "Vérone Back Office",
      "relationType": "part_of"
    },
    {
      "from": "Stock Module",
      "to": "Vérone Back Office",
      "relationType": "part_of"
    },
    {
      "from": "Orders Module",
      "to": "Vérone Back Office",
      "relationType": "part_of"
    },
    {
      "from": "Billing Module",
      "to": "Vérone Back Office",
      "relationType": "part_of"
    },
    {
      "from": "CRM Module",
      "to": "Vérone Back Office",
      "relationType": "part_of"
    },
    {
      "from": "Catalogue Module",
      "to": "Stock Module",
      "relationType": "depends_on"
    },
    {
      "from": "Orders Module",
      "to": "Stock Module",
      "relationType": "integrates_with"
    },
    {
      "from": "Orders Module",
      "to": "Billing Module",
      "relationType": "integrates_with"
    },
    {
      "from": "Feed Generation",
      "to": "Catalogue Module",
      "relationType": "feature_of"
    },
    {
      "from": "PDF Export Catalogue",
      "to": "Catalogue Module",
      "relationType": "feature_of"
    },
    {
      "from": "Tarification B2B/B2C",
      "to": "Catalogue Module",
      "relationType": "business_rule_for"
    },
    {
      "from": "Conditionnements Packages",
      "to": "Catalogue Module",
      "relationType": "business_rule_for"
    },
    {
      "from": "Next.js 15",
      "to": "Vérone Back Office",
      "relationType": "technology_used_in"
    },
    {
      "from": "Supabase",
      "to": "Vérone Back Office",
      "relationType": "technology_used_in"
    },
    {
      "from": "Playwright MCP",
      "to": "Vérone Back Office",
      "relationType": "technology_used_in"
    },
    {
      "from": "Sentry",
      "to": "Vérone Back Office",
      "relationType": "technology_used_in"
    },
    {
      "from": "Design System Vérone",
      "to": "Vérone Back Office",
      "relationType": "standard_for"
    },
    {
      "from": "Performance SLOs",
      "to": "Vérone Back Office",
      "relationType": "standard_for"
    }
  ]
}
```

---

## 🔄 Commandes Memory MCP

### Création Entités
```typescript
// Sera automatiquement créé au premier usage du Memory MCP
// Le fichier .aim/verone-knowledge-graph.json sera généré
```

### Recherche
```typescript
// Exemple: Rechercher information sur tarification
memory.searchMemory("tarification B2B")
// → Retourne entité + relations + observations

// Exemple: Trouver modules dépendants de Stock
memory.searchMemory("Stock Module dependencies")
// → Retourne Orders + Catalogue
```

### Ajout Observation
```typescript
// Exemple: Ajouter décision technique
memory.addObservation(
  "Catalogue Module",
  "Migration vers Server Components completée - Performance +40%"
)
```

---

## ✅ Prochaines Étapes

1. **Première utilisation Memory MCP** générera automatiquement le graph
2. **Commandes custom** `/memory-sync` pour synchronisation
3. **Workflow intégré** dans CLAUDE.md
4. **Formation équipe** si nécessaire

---

*Knowledge Graph initialisé - Ready for Memory MCP*
