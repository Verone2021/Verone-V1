# 📖 Comment Utiliser le Template de Tests

Ce guide explique comment utiliser `TEMPLATE-PLAN-TESTS-MODULE.md` pour générer automatiquement des plans de test complets pour n'importe quel module de Vérone.

---

## 🚀 Utilisation Rapide (5 minutes)

### Étape 1 : Copier le Template

Ouvrir le fichier `docs/guides/TEMPLATE-PLAN-TESTS-MODULE.md` et copier **tout son contenu**.

### Étape 2 : Remplacer les Placeholders

Dans le template copié, remplacer :

| Placeholder | Exemple Catalogue | Exemple Finance |
|-------------|-------------------|-----------------|
| `[MODULE]` | Catalogue Produits | Finance & Facturation |
| `[DATE]` | 2025-10-11 | 2025-10-12 |
| `[LISTE_PAGES]` | /catalogue, /catalogue/[id], /catalogue/categories | /factures, /factures/[id], /tresorerie |
| `[SLO]` | 3000 (3 secondes) | 2000 (2 secondes) |

### Étape 3 : Adapter Sections Spécifiques

**Phase 3 : Business Logic** - Remplacer exemples génériques par vos règles métier spécifiques :

```markdown
#### Exemple Catalogue : Validation Packages
- Tester qu'un produit peut avoir plusieurs packages (Unitaire, Carton, Palette)
- Vérifier calculs prix unitaire vs. prix package
- Valider contraintes quantité minimale/maximale

#### Exemple Finance : Rapprochement Bancaire
- Tester matching automatique facture ↔ transaction bancaire
- Vérifier gestion écarts de montant
- Valider workflow approbation rapprochement manuel
```

### Étape 4 : Coller dans Claude

Ouvrir une **nouvelle conversation Claude Code** et coller :

```
Exécute le plan de tests complet pour le module [NOM_MODULE] en suivant
exactement le template fourni ci-dessous. Utilise MCP Playwright Browser
pour tous les tests, respecte la règle sacrée Console 0 erreur, et génère
tous les livrables documentés.

[TEMPLATE ADAPTÉ COLLÉ ICI]
```

### Étape 5 : Claude Génère le Plan Automatiquement

Claude va :
1. ✅ Lire le template adapté
2. ✅ Créer un plan de tests détaillé en 4 phases
3. ✅ Exécuter les tests avec MCP Playwright Browser
4. ✅ Vérifier console 0 erreur (règle sacrée)
5. ✅ Générer rapport session + screenshots preuves

---

## 📋 Exemples Concrets

### Exemple 1 : Module Catalogue

**Pages à tester** :
- `/catalogue` - Liste produits
- `/catalogue/[id]` - Détail produit
- `/catalogue/categories` - Gestion catégories

**Business Logic spécifique** :
- Système packages (Unitaire, Carton, Palette)
- Gestion variantes (couleurs, tailles)
- Prix fournisseur vs. prix vente
- Calcul marge automatique

**CRUD Operations** :
- CREATE : Nouveau produit avec variantes
- READ : Consultation fiche produit complète
- UPDATE : Modification prix et stock
- DELETE : Archivage produit (soft delete)

---

### Exemple 2 : Module Finance

**Pages à tester** :
- `/factures` - Liste factures
- `/factures/[id]` - Détail facture
- `/tresorerie` - Comptes Qonto
- `/finance/rapprochement` - Matching bancaire

**Business Logic spécifique** :
- Génération PDF facture (SLO <5s)
- Calcul taxes (TVA 20%)
- Workflow approbation facture
- Rapprochement automatique transactions

**CRUD Operations** :
- CREATE : Nouvelle facture depuis commande
- READ : Consultation facture + PDF download
- UPDATE : Modification montants (si brouillon uniquement)
- DELETE : Annulation facture (pas suppression, annulation légale)

---

### Exemple 3 : Module Organisation

**Pages à tester** :
- `/organisation` - Liste contacts
- `/organisation/fournisseurs` - Fournisseurs
- `/organisation/clients` - Clients

**Business Logic spécifique** :
- Recherche unifiée contacts
- Import CSV contacts (bulk)
- Export fiche contact PDF
- Historique interactions

**CRUD Operations** :
- CREATE : Nouveau contact (client/fournisseur/partner)
- READ : Consultation fiche + historique
- UPDATE : Modification coordonnées
- DELETE : Archivage contact (soft delete avec raison)

---

## 🎯 Modules Vérone Disponibles

Voici la liste complète des modules à tester (remplacer `[MODULE]` par un de ces noms) :

| Module | Pages Principales | Priorité |
|--------|-------------------|----------|
| **Dashboard** | `/dashboard` | 🔴 HAUTE |
| **Catalogue** | `/catalogue`, `/catalogue/categories`, `/catalogue/variantes` | 🔴 HAUTE |
| **Stocks** | `/stocks/inventaire`, `/stocks/mouvements`, `/stocks/alertes` | 🟠 MOYENNE |
| **Sourcing** | `/sourcing` | 🟡 FAIBLE |
| **Consultations** | `/consultations` | 🟠 MOYENNE |
| **Commandes Clients** | `/commandes/clients` | 🔴 HAUTE |
| **Commandes Fournisseurs** | `/commandes/fournisseurs` | 🟠 MOYENNE |
| **Finance** | `/factures`, `/tresorerie`, `/finance/rapprochement` | 🔴 HAUTE |
| **Organisation** | `/organisation` | 🟡 FAIBLE |
| **Admin Users** | `/admin/users` | ✅ **DÉJÀ TESTÉ** |

**Note** : Admin Users déjà validé complet (voir `MEMORY-BANK/sessions/2025-10-10-RAPPORT-FINAL-SESSION-COMPLETE.md`)

---

## ✅ Checklist Avant Lancement Tests

Avant de coller le template dans Claude, vérifier :

- [ ] **Serveur dev actif** : `npm run dev` tourne (http://localhost:3000)
- [ ] **BDD accessible** : psql fonctionne (test connexion Supabase)
- [ ] **User admin connecté** : Session owner/admin active
- [ ] **Git status clean** : Pas de modifications non commitées
- [ ] **Placeholders remplacés** : Tous les `[MODULE]`, `[PAGES]`, etc. remplis
- [ ] **Business logic adaptée** : Phase 3 contient vraies règles métier du module
- [ ] **SLOs définis** : Temps chargement cible précisé

---

## 🔄 Workflow Complet

```
1. Copier template
   ↓
2. Remplacer placeholders
   ↓
3. Adapter business logic (Phase 3)
   ↓
4. Vérifier checklist pré-tests
   ↓
5. Coller dans Claude Code
   ↓
6. Claude génère plan détaillé
   ↓
7. Claude exécute tests MCP Browser
   ↓
8. Rapport session + screenshots générés
   ↓
9. Review résultats
   ↓
10. Archiver documentation
```

---

## 📊 Livrables Attendus (par Module)

Après exécution tests, vous aurez :

### 1. Rapport Session
**Fichier** : `MEMORY-BANK/sessions/[DATE]-TESTS-[MODULE]-COMPLET.md`

**Contenu** :
- Synthèse problèmes identifiés
- Solutions implémentées
- Métriques finales (console 0 erreur, CRUD validé, performance)
- Recommandations

### 2. Screenshots Preuves
**Dossier** : `.playwright-mcp/`

**Exemples** :
- `catalogue-page-principale.png`
- `catalogue-crud-create-success.png`
- `catalogue-edge-case-empty-list.png`

### 3. Scripts CRUD (si applicable)
**Dossier** : `scripts/`

**Exemples** :
- `setup-test-catalogue.ts` (création produits test)
- `cleanup-test-catalogue.ts` (suppression après tests)

---

## 🎓 Conseils Pro

### 1. Adapter, Pas Suivre Aveuglément

Le template est un **guide**, pas une bible. Si votre module n'a pas de CRUD (ex: Dashboard read-only), **skipper la Phase 2** et focus sur :
- Navigation & console check (Phase 1)
- Business logic spécifique (Phase 3)
- Performance metrics (Phase 4)

### 2. Commencer Simple, Itérer

**1ère fois** : Tester juste Phase 1 (navigation + console)
**2ème passe** : Ajouter Phase 2 (CRUD si applicable)
**3ème passe** : Compléter Phase 3+4 (business logic + performance)

### 3. Documenter Edge Cases Découverts

Quand vous trouvez un edge case en testant (ex: "liste vide crash la page"), **documenter dans le template adapté** :

```markdown
#### Edge Case Découvert : Liste Vide
- Bug trouvé : Si aucun produit, affiche erreur "Cannot read property 'map' of undefined"
- Fix appliqué : Ajouter condition `{products?.length > 0 ? ... : <EmptyState />}`
- Validation : Re-test avec liste vide → ✅ EmptyState affiché correctement
```

### 4. Réutiliser Screenshots Entre Modules

Si plusieurs modules partagent mêmes components (ex: table de liste) :
- Créer dossier `.playwright-mcp/shared-components/`
- Référencer screenshots existants au lieu de re-capturer

---

## ❓ FAQ

### Q: Le template est très long (15 pages), c'est normal ?

**R:** Oui ! C'est un template **complet et exhaustif**. Vous ne devez pas tout utiliser systématiquement. Adaptez selon complexité du module :
- Module simple (Dashboard read-only) : ~5 pages template adapté
- Module complexe (Finance CRUD) : ~15 pages template complet

### Q: Que faire si mon module n'a pas de CRUD ?

**R:** Supprimer toute la Phase 2 du template. Focus sur :
- Phase 1 : Navigation + console check
- Phase 3 : Business logic (calculs, filtres, recherche)
- Phase 4 : Performance + edge cases

### Q: Combien de temps prend un plan de tests complet ?

**R:** Dépend du module :
- Simple (ex: Organisation) : 1-2 heures (phases 1+3+4)
- Moyen (ex: Catalogue) : 3-4 heures (phases 1+2+3+4)
- Complexe (ex: Finance) : 4-6 heures (phases 1+2+3+4 + edge cases multiples)

### Q: Puis-je réutiliser scripts CRUD entre modules ?

**R:** Partiellement. La structure est réutilisable, mais données spécifiques changent :
- `setup-test-catalogue.ts` → crée produits
- `setup-test-finance.ts` → crée factures
- Pattern identique, données différentes

---

## 🔗 Fichiers Liés

- **Template complet** : `docs/guides/TEMPLATE-PLAN-TESTS-MODULE.md`
- **Guide protection code** : `docs/security/CODE-PROTECTION-STRATEGIES.md`
- **Configuration exemple** : `.claude/settings.example.json`
- **Session référence** : `MEMORY-BANK/sessions/2025-10-10-RAPPORT-FINAL-SESSION-COMPLETE.md` (Admin Users)

---

**Guide créé** : 2025-10-10
**Version** : 1.0
**Auteur** : Claude Code + Workflow 2025

*Vérone Back Office - Efficient AI-Assisted Testing Excellence*
