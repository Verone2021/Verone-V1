# 📋 Business Rules - Vérone Back Office

**Organisation complète des règles métier par module applicatif**

---

## 🎯 Philosophie d'Organisation

Cette structure reflète l'architecture modulaire de Vérone Back Office avec **19 modules applicatifs** + **aspects transverses**. Chaque dossier correspond à une section de l'application (`src/app/`).

### Principes

- ✅ **Module-Based** : Organisation par feature/module (01-17)
- ✅ **Numérotation** : Ordre logique workflow business
- ✅ **Transverse** : Aspects cross-module (98-99)
- ✅ **Évolutif** : Dossiers pré-créés avec .gitkeep

---

## 📚 INDEX COMPLET DES MODULES

### 🔐 01. Authentification

**Path**: `01-authentification/`
**App route**: `/login`, `/profile`
**Contenu**: Rôles, permissions, stratégies auth, sécurité session

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 📊 02. Dashboard

**Path**: `02-dashboard/`
**App route**: `/dashboard`
**Contenu**: Métriques KPI, calculs dashboard, widgets, optimisation performance

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 🏢 03. Organisations & Contacts

**Path**: `03-organisations-contacts/`
**App route**: `/contacts-organisations`

#### Sous-modules :

- **organisations/** : Types organisations, gestion multi-organisation
- **contacts/** : Relations contacts, rôles
- **customers/** : Clients B2B/B2C, segmentation
- **suppliers/** : Fournisseurs, conditions commerciales
- **partners/** : Partenaires commerciaux

**Fichiers** :

- _(Aucun fichier pour le moment - dossiers pré-créés)_

---

### 📦 04. Produits

**Path**: `04-produits/`
**App route**: `/produits`

#### 04.1 Catalogue (`catalogue/`)

**Route**: `/produits/catalogue`

- **categories/** : Hiérarchie catégories (5 fichiers attendus)
- **families/** : Familles produits (4 fichiers attendus)
- **collections/** : Collections saisonnières (6 fichiers attendus)
- **products/** : Règles produits (3 fichiers attendus)
- **variants/** : `product-variants-rules.md` ✅
- **packages/** : `conditionnements-packages.md` ✅
- **images/** : `product-images-query-pattern.md` ✅
- **catalogue.md** ✅ (règles générales catalogue)

#### 04.2 Sourcing (`sourcing/`)

**Route**: `/produits/sourcing`

- `sourcing-validation-workflow.md` ✅
- `supplier-vs-internal-data.md` ✅

**Total fichiers** : 4/16 attendus (25% complété)

---

### 💰 05. Pricing & Tarification

**Path**: `05-pricing-tarification/`
**App route**: `/produits/pricing` (intégré dans produits)
**Contenu**: Prix multi-canaux, règles tarification B2B/B2C, remises, marges

**Fichiers** :

- `pricing-multi-canaux-clients.md` ✅
- `tarification.md` ✅

**Total** : 2 fichiers

---

### 📦 06. Stocks

**Path**: `06-stocks/`
**App route**: `/stocks`

#### Sous-modules :

- **movements/** : `stock-traceability-rules.md` ✅
- **inventaire/** : Comptages, ajustements
- **alertes/** : Seuils, notifications rupture
- **receptions/** : Réceptions fournisseurs
- **expeditions/** : Expéditions clients
- **entrees/** : Entrées stock manuelles
- **sorties/** : Sorties stock
- **backorders/** : `BACKORDERS-POLICY.md` ✅

**Total fichiers** : 2/8 sous-modules documentés (25%)

---

### 🛒 07. Commandes

**Path**: `07-commandes/`
**App route**: `/commandes`

#### Sous-modules :

- **clients/** :
  - `address-autofill-orders.md` ✅
  - `sales-order-cancellation-workflow.md` ✅
- **fournisseurs/** : Commandes fournisseurs, réceptions
- **expeditions/** : `COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md` ✅

**Total fichiers** : 3 fichiers

---

### 💼 08. Consultations

**Path**: `08-consultations/`
**App route**: `/consultations`
**Contenu**: Workflow consultations clients, devis, suivi projets

**Fichiers** :

- `consultations-clients.md` ✅

**Total** : 1 fichier

---

### 💳 09. Ventes

**Path**: `09-ventes/`
**App route**: `/ventes`
**Contenu**: Processus vente, conversion devis, facturation

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 💼 10. Finance

**Path**: `10-finance/`
**App route**: `/finance`

#### Sous-modules :

- **depenses/** : Gestion dépenses, catégorisation
- **rapprochement/** : Rapprochement bancaire
- **accounting/** : Écritures comptables, exports

**Fichiers** :

- _(Aucun fichier pour le moment - dossiers pré-créés)_

---

### 🧾 11. Factures

**Path**: `11-factures/`
**App route**: `/factures`
**Contenu**: Génération factures, mentions légales, templates, exports

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 💰 12. Trésorerie

**Path**: `12-tresorerie/`
**App route**: `/tresorerie`
**Contenu**: Prévisions trésorerie, encaissements, décaissements

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 🌐 13. Canaux de Vente

**Path**: `13-canaux-vente/`
**App route**: `/canaux-vente`

#### Sous-modules :

- **google-merchant/** : Feeds Google Merchant Center, optimisation
- **prix-clients/** : Grilles tarifaires par canal
- **integrations/** : Connexions marketplaces, APIs externes

**Fichiers** :

- _(Aucun fichier pour le moment - dossiers pré-créés)_

---

### 👥 14. Administration

**Path**: `14-admin/`
**App route**: `/admin`

#### Sous-modules :

- **users/** : Gestion utilisateurs, rôles, permissions
- **activite-utilisateurs/** : Logs activité, audit trails

**Fichiers** :

- _(Aucun fichier pour le moment - dossiers pré-créés)_

---

### 🔔 15. Notifications

**Path**: `15-notifications/`
**App route**: `/notifications`
**Contenu**: Système notifications temps réel, préférences, templates

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### ⚙️ 16. Paramètres

**Path**: `16-parametres/`
**App route**: `/parametres`
**Contenu**: Configuration application, préférences utilisateur

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

### 🏢 17. Organisation

**Path**: `17-organisation/`
**App route**: `/organisation`
**Contenu**: Configuration organisation courante, profil entreprise

**Fichiers** :

- _(Aucun fichier pour le moment - dossier pré-créé)_

---

## 🎨 ASPECTS TRANSVERSES

### 98. UX/UI

**Path**: `98-ux-ui/`
**Contenu**: Design System V2, patterns UI/UX, composants réutilisables, accessibilité

**Fichiers** :

- `SIDEBAR-UX-RULES-2025.md` ✅

**Total** : 1 fichier

---

### 99. Transverses

**Path**: `99-transverses/`
**Contenu**: Aspects cross-module, patterns globaux

#### Sous-modules :

- **workflows/** : Workflows métier multi-modules
- **integrations/** : `integrations-externes.md` ✅
- **data-quality/** : Règles qualité données, validations
- **compliance/** : RGPD, réglementations, audit trails

**Total fichiers** : 1/4 sous-modules documentés

---

## 📊 STATISTIQUES

```
Total modules applicatifs : 19
Total sous-modules : 93
Fichiers documentés : 16
Coverage : ~17% (16/93 sous-modules)
```

### Répartition par module :

- ✅ **Produits** : 4 fichiers (catalogue, sourcing)
- ✅ **Commandes** : 3 fichiers (clients, expéditions)
- ✅ **Pricing** : 2 fichiers
- ✅ **Stocks** : 2 fichiers
- ✅ **Autres** : 5 fichiers (consultations, UX, intégrations)

---

## 🔄 CLASSIFICATION AUTOMATIQUE

**Pour ajouter un nouveau fichier business rule** :

### Règle générale

1. Identifier le **module applicatif** concerné (route dans `src/app/`)
2. Placer dans le dossier numéroté correspondant (01-17)
3. Si multi-module → `99-transverses/workflows/`
4. Si UX/Design → `98-ux-ui/`

### Exemples

```bash
# Règle sur les remises → Pricing
docs/business-rules/05-pricing-tarification/discount-rules.md

# Workflow commande → expédition → Transverse
docs/business-rules/99-transverses/workflows/order-to-shipment.md

# Pattern UI modal → UX
docs/business-rules/98-ux-ui/modal-pattern.md
```

### Naming Convention

- **kebab-case** pour tous les fichiers
- **Langue** : Français (sauf termes techniques anglais)
- **Format** : Markdown (.md)
- **Préfixe** : Aucun (ordre alphabétique naturel)

---

## 🤖 INTÉGRATION CLAUDE CODE

Ce système de classification est **automatiquement compris par Claude Code** via :

1. **CLAUDE.md** : Règles de classification automatique
2. **Serena Memories** : Patterns d'organisation documentés
3. **MCP Tools** : `mcp__serena__write_memory` pour nouveaux patterns

**Workflow automatique** :

```typescript
// Claude identifie automatiquement la destination
User: "Créer règle business pour calcul TVA factures"
Claude: → docs/business-rules/11-factures/tva-calculation-rules.md

User: "Documenter workflow annulation commande client"
Claude: → docs/business-rules/07-commandes/clients/cancellation-workflow.md
```

---

## 📚 RESSOURCES COMPLÉMENTAIRES

- **CLAUDE.md** : Instructions complètes Claude Code
- **docs/workflows/** : Workflows techniques (vs business rules)
- **docs/database/** : Schéma DB, triggers, fonctions
- **docs/metrics/** : KPI, calculs métriques
- **.serena/memories/** : Contexte projet, patterns récurrents

---

## 🚀 CONTRIBUER

### Ajouter une nouvelle règle

1. Identifier le module concerné
2. Créer le fichier dans le bon sous-dossier
3. Suivre le template Markdown standard
4. Mettre à jour ce README si nouveau pattern

### Nettoyer .gitkeep

Quand un dossier reçoit son premier fichier, **supprimer le .gitkeep** :

```bash
rm docs/business-rules/XX-module/.gitkeep
```

---

**Version** : 1.0.0 (2025-10-26)
**Mainteneur** : Romeo Dos Santos
**Dernière mise à jour** : 2025-10-26 (Création structure complète)
