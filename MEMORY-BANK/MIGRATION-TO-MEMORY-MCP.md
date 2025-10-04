# 🧠 Migration MEMORY-BANK → Memory MCP

**Date Migration** : 3 octobre 2025
**Objectif** : Remplacer système manuel (61 fichiers) par Knowledge Graph automatisé

---

## 📊 État Avant Migration

### Documentation Actuelle
- **MEMORY-BANK** : 61 fichiers markdown
- **Type** : Fichiers manuels dispersés
- **Maintenance** : Manuelle, chronophage
- **Recherche** : Difficile (grep sur 61 fichiers)

### Problèmes Identifiés
1. **Duplication** : Informations répétées dans plusieurs fichiers
2. **Obsolescence** : Certains fichiers non mis à jour depuis des mois
3. **Surcharge** : Trop de fichiers rend difficile la navigation
4. **Pas de relations** : Liens entre concepts implicites

---

## 🎯 Architecture Memory MCP

### Knowledge Graph Structure

```typescript
// Entités Principales
const entities = {
  // Modules Vérone
  "Catalogue Module": {
    type: "Module",
    observations: [
      "MVP principal - Catalogue partageable",
      "241 produits importés",
      "Système packages (single/pack/bulk/custom)"
    ]
  },

  "Stock Module": {
    type: "Module",
    observations: [
      "Phase 2 - Backend ready, UI désactivée",
      "Soft/hard reservations",
      "Alertes rupture automatiques"
    ]
  },

  // Features Critiques
  "Feed Generation": {
    type: "Feature",
    observations: [
      "SLO: <10s pour 1000+ produits",
      "Facebook 29 fields, Google 33+ fields",
      "Templates officiels respectés"
    ]
  },

  // Technologies
  "Next.js 15": {
    type: "Technology",
    observations: [
      "App Router utilisé",
      "Server Components vs Client Components",
      "Performance: Dashboard <2s"
    ]
  },

  // Business Rules
  "Tarification B2B/B2C": {
    type: "BusinessRule",
    observations: [
      "Remises dégressives par quantité",
      "Prix B2B différents de B2C",
      "Minimum Order Quantity (MOQ)"
    ]
  }
}

// Relations Entre Entités
const relations = [
  {
    from: "Catalogue Module",
    to: "Stock Module",
    type: "depends_on"
  },
  {
    from: "Feed Generation",
    to: "Catalogue Module",
    type: "implemented_in"
  },
  {
    from: "Tarification B2B/B2C",
    to: "Catalogue Module",
    type: "business_rule_for"
  }
]
```

---

## 📋 Plan de Migration

### Phase 1 : Entités Core (30 min)
**Créer entités principales** :
- ✅ Modules : Catalogue, Stock, Orders, Billing, CRM
- ✅ Technologies : Next.js, Supabase, Playwright, Sentry
- ✅ Features MVP : Catalogue partageable, Feed generation, PDF export

### Phase 2 : Relations (20 min)
**Établir relations** :
- ✅ Module dependencies
- ✅ Feature → Module mapping
- ✅ Technology → Module usage

### Phase 3 : Business Rules (40 min)
**Migrer règles métier** :
- ✅ Tarification (B2B/B2C, remises, MOQ)
- ✅ Conditionnements (packages)
- ✅ Workflows (sourcing, orders)
- ✅ Intégrations externes (Brevo, Meta, Google)

### Phase 4 : Observations Techniques (30 min)
**Ajouter observations critiques** :
- ✅ Décisions architecture
- ✅ Learnings sessions importantes
- ✅ Performance SLOs
- ✅ Security policies

---

## 🗂️ Fichiers MEMORY-BANK à Conserver

### Fichiers Essentiels (5 fichiers)
```
MEMORY-BANK/
├── project-context.md          # Contexte business global
├── ai-context.md               # Règles IA spécifiques
├── best-practices-2025.md      # Standards actuels
├── MIGRATION-TO-MEMORY-MCP.md  # Ce fichier
└── sessions/                   # 5 dernières sessions uniquement
    ├── 2025-10-03-*.md
    ├── 2025-10-02-*.md
    ├── 2025-10-01-*.md
    ├── 2025-09-30-*.md
    └── 2025-09-29-*.md
```

### Fichiers à Archiver (56 fichiers)
```
MEMORY-BANK/archive/           # Tout le reste
├── sessions/                  # Sessions >5 dernières
├── process-archive/           # Anciens process
└── *.md (obsolètes)          # Fichiers non essentiels
```

---

## 🔄 Workflow Utilisation Memory MCP

### Avant (Manuel)
```bash
# Recherche information
grep -r "tarification" MEMORY-BANK/
# → 12 fichiers trouvés, lecture manuelle

# Mise à jour
vim MEMORY-BANK/business-decisions.md
# → Édition manuelle, risque oubli autres fichiers
```

### Après (Memory MCP)
```typescript
// Recherche automatique
const pricing = await memory.searchMemory("tarification B2B")
// → Knowledge graph retourne entité + relations

// Mise à jour automatique
await memory.addObservation(
  "Tarification B2B/B2C",
  "Nouvelle règle: remise max 40% validée"
)
// → Graph mis à jour, relations préservées
```

---

## ✅ Critères de Succès Migration

### Fonctionnalité
- [ ] Toutes entités critiques créées (Modules, Features, Technologies)
- [ ] Relations établies entre entités
- [ ] Observations clés migrées
- [ ] Recherche Memory MCP fonctionnelle

### Qualité
- [ ] 0 perte d'information critique
- [ ] Temps recherche divisé par 10 (vs grep manuel)
- [ ] Maintenance automatisée
- [ ] Documentation légère (<10 fichiers md actifs)

### Adoption
- [ ] Commandes custom créées (/memory-sync)
- [ ] Workflow intégré à CLAUDE.md
- [ ] Formation équipe si nécessaire

---

## 📈 Métriques Amélioration

### Avant Migration
- ❌ 61 fichiers markdown à maintenir
- ❌ Recherche manuelle (grep)
- ❌ Duplication d'information
- ❌ Mise à jour manuelle chronophage

### Après Migration
- ✅ 1 fichier JSON (knowledge graph)
- ✅ Recherche sémantique automatique
- ✅ Relations explicites
- ✅ Mise à jour ciblée et rapide

**Gain estimé** : -90% temps maintenance, +10x vitesse recherche

---

*Migration automatisée via Memory MCP - Best Practices Anthropic 2025*
