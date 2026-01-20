# LinkMe - Plateforme Affiliation B2B2C

**Dernière mise à jour:** 2026-01-20

Plateforme d'affiliation permettant aux organisations (enseignes, indépendants) de créer des mini-boutiques et percevoir des commissions.

**Status:** Opérationnel à 85%

---

## Documentation Complète

La documentation LinkMe a été consolidée et organisée en 5 fichiers thématiques :

| Document | Description |
|----------|-------------|
| **[linkme/linkme.md](./linkme/linkme.md)** | 📘 Hub central - Vue d'ensemble, navigation, statut |
| [linkme/architecture.md](./linkme/architecture.md) | 📐 Architecture technique (tables, RLS, triggers) |
| [linkme/commissions.md](./linkme/commissions.md) | 💰 Modèle commission consolidé (formules, sources de vérité) |
| [linkme/workflows.md](./linkme/workflows.md) | 🔄 Workflows détaillés (5 workflows complets) |
| [linkme/presentation-figma.md](./linkme/presentation-figma.md) | 🎨 Designs Figma, maquettes UI |

**Principe:** Une seule source de vérité par sujet, pas de duplication.

---

## Vue Rapide

### Applications

- **App Affiliés** : `http://localhost:3002` - Interface front pour enseignes/organisations
- **CMS Back-Office** : `http://localhost:3000/canaux-vente/linkme` - Administration Vérone

### Workflows Critiques

1. **Connexion Affilié** : Login → Auth → user_app_roles → linkme_affiliates → Dashboard
2. **Création Sélection** : Nouvelle sélection → Ajout produits → Configuration marges → Publication
3. **Commande Client** : Page publique → Panier → Checkout → Validation → Virement → Commission
4. **Cycle Commissions** : pending → validated → Demande versement → Upload facture → paid

### Statuts Principaux

- **Sélection** : draft → active → archived
- **Commande** : draft → validated → shipped → delivered
- **Commission** : pending → validated → in_payment → paid

---

## Liens Rapides

- **Documentation complète** : Voir [linkme/linkme.md](./linkme/linkme.md)
- **Code source App** : `apps/linkme/src/`
- **Code source CMS** : `apps/back-office/src/app/canaux-vente/linkme/`
- **Migrations DB** : `supabase/migrations/2025120*_linkme*.sql`

---

**Consolidation 2026-01-20** : Documentation rationalisée, 8 fichiers → 5 fichiers
