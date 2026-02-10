# 🚀 Gestion Retours & Avoirs - Guide Démarrage Rapide

**Version** : 1.0.0
**Date** : 2026-02-10
**Durée totale** : 10-12 jours

---

## 📄 Fichiers du Plan

| Fichier                                 | Description                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| `returns-management-implementation.md`  | **Plan complet** (60 pages) : Architecture, workflow, phases, métriques, références |
| `returns-management-sql-schema.sql`     | **Schéma SQL complet** : Tables, indexes, triggers, RLS, examples                   |
| `returns-management-GETTING-STARTED.md` | **Ce fichier** : Guide démarrage rapide                                             |

---

## 🎯 Résumé Exécutif

### Problématique

Comment gérer les retours produits avec **traçabilité complète** :

- Stock (vendable vs rebut)
- Métriques (CA net, taux retour)
- Workflow validation (inspection qualité)
- Avoir financier (comptabilité)

### Solution Choisie : Option B (Professionnelle)

**Pattern ERP Standard** (Odoo, SAP, NetSuite) :

```
Client demande retour
   ↓
Validation staff (approve/reject)
   ↓
Réception physique produit
   ↓
Inspection qualité (resellable/damaged)
   ↓
Mouvement stock (selon état)
   ↓
Génération avoir financier
```

**3 Entités Séparées** :

1. **Return Order (RMA)** → Workflow physique
2. **Stock Movement** → Traçabilité stock
3. **Credit Note (Avoir)** → Impact comptable

---

## 📅 Planning par Phase

| Phase                  | Durée   | Tâches Clés          | Livrable                      |
| ---------------------- | ------- | -------------------- | ----------------------------- |
| **1. Base de Données** | 2 jours | 4 migrations SQL     | Tables créées, RLS activé     |
| **2. Backend API**     | 3 jours | 6 routes API         | `/api/returns/*` fonctionnels |
| **3. UI Back-Office**  | 4 jours | 4 pages + composants | `/retours` complet            |
| **4. Automatisations** | 2 jours | 3 triggers           | Workflow automatisé           |
| **5. Métriques**       | 1 jour  | Dashboard analytics  | `/retours/analytics`          |

**Total** : 12 jours (10 jours si optimisé)

---

## 🛠️ Nouvelles Tables Créées

### Table `returns` (RMA)

**Colonnes clés** :

- `return_number` : RET-2026-0001
- `sales_order_id` : Lien commande origine
- `status` : requested → approved → received → inspected → completed
- `return_reason` : defective, wrong_item, customer_regret, etc.
- `inspection_result` : resellable, damaged_scrap, damaged_repairable
- `credit_note_id` : Lien vers avoir créé

**Traçabilité** : `requested_by`, `approved_by`, `received_by`, `inspected_by` (+ timestamps)

### Table `return_items` (Lignes Retour)

**Colonnes clés** :

- `return_id` : Lien vers returns
- `sales_order_item_id` : Ligne commande origine
- `product_id` : Produit retourné
- `quantity_requested`, `quantity_approved`, `quantity_received`, `quantity_restocked`
- `condition_on_return` : new, good, damaged, unusable
- `stock_movement_id` : Lien vers mouvement stock créé

### Modifications Tables Existantes

**`financial_documents`** :

- `related_sales_order_id`, `related_return_id`, `is_credit_note`, `credit_note_reason`

**`stock_movements`** :

- `stock_status` : sellable, damaged, expired, lost, quarantine

**`sales_order_items`** :

- `returned_quantity`, `last_return_id`, `last_returned_at`

---

## 🔄 Workflow Détaillé

### Étape 1 : Demande Retour (Client ou Staff)

**UI** : `/commandes/[id]` → Bouton "Créer retour"

**Actions** :

- Sélection produits + quantités
- Motif retour (defective, wrong_item, etc.)
- Notes client

**Backend** : INSERT dans `returns` (status=requested) + `return_items`

---

### Étape 2 : Validation Staff

**UI** : `/retours/demandes` → Détail retour → Bouton "Approuver" / "Refuser"

**Actions** :

- Staff peut ajuster quantités approuvées (≤ demandées)
- Si refusé : saisir motif

**Backend** : UPDATE `returns` (status=approved) + `return_items.quantity_approved`

---

### Étape 3 : Réception Physique

**UI** : `/retours/receptions` → Scan étiquette → Saisir quantités reçues

**Actions** :

- Pour chaque produit : quantité reçue + état (new/good/damaged/unusable)

**Backend** : UPDATE `returns` (status=received) + `return_items.quantity_received`

---

### Étape 4 : Inspection Qualité

**UI** : `/retours/inspections` → Formulaire inspection

**Actions** :

- Décision par produit : Revendable / Réparable / Rebut
- Quantité à remettre en stock
- Notes inspection

**Backend** :

- UPDATE `returns` (status=inspected, inspection_result)
- INSERT `stock_movements` (movement_type=return, stock_status=sellable|damaged)
- UPDATE `return_items.quantity_restocked` + `sales_order_items.returned_quantity`

---

### Étape 5 : Génération Avoir

**UI** : `/retours/inspections/[id]` → Bouton "Générer avoir"

**Actions** :

- Prévisualisation montant (calculé depuis quantity_approved)
- Confirmation

**Backend** :

- INSERT `financial_documents` (document_type=credit_note, is_credit_note=true, related_return_id)
- UPDATE `returns` (status=completed, credit_note_id)
- Trigger auto : Link credit note ↔ return

---

## 📊 Métriques Clés

### Queries Analytiques Essentielles

```sql
-- 1. CA Net (après retours)
SELECT
  SUM(CASE WHEN is_credit_note = false THEN total_ttc ELSE 0 END) AS ca_brut,
  SUM(CASE WHEN is_credit_note = true THEN ABS(total_ttc) ELSE 0 END) AS montant_retours,
  SUM(CASE WHEN is_credit_note = false THEN total_ttc ELSE -total_ttc END) AS ca_net
FROM financial_documents
WHERE document_type IN ('invoice', 'credit_note');

-- 2. Taux retour par produit
SELECT
  p.sku,
  COUNT(DISTINCT ri.return_id) AS nb_retours,
  SUM(ri.quantity_returned) / NULLIF(SUM(soi.quantity), 0) * 100 AS taux_retour_pct
FROM return_items ri
JOIN products p ON p.id = ri.product_id
JOIN sales_order_items soi ON soi.id = ri.sales_order_item_id
GROUP BY p.id
ORDER BY nb_retours DESC;

-- 3. Délai moyen traitement
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - requested_at)) / 86400) AS avg_days
FROM returns
WHERE status = 'completed';
```

### KPIs Objectifs

| KPI                    | Objectif | Industrie           |
| ---------------------- | -------- | ------------------- |
| **Taux retour global** | <5%      | E-commerce standard |
| **Taux resellable**    | >70%     | Minimiser pertes    |
| **Délai traitement**   | <7 jours | Satisfaction client |
| **CA Net / CA Brut**   | >95%     | Impact limité       |

---

## 🔐 Sécurité (RLS Policies)

### Staff Back-Office

```sql
-- Staff voit tout
CREATE POLICY "staff_full_access_returns" ON returns
  FOR ALL TO authenticated
  USING (is_backoffice_user());
```

### Affiliés LinkMe

```sql
-- Affilié voit uniquement ses retours
CREATE POLICY "affiliate_own_returns" ON returns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.organisation_id = returns.customer_id
    )
  );
```

---

## ⚠️ Points d'Attention

### Avant de Démarrer

- [ ] Backup DB complète
- [ ] Tester migrations sur DB de dev
- [ ] Former équipe sur nouveau workflow (2h session)
- [ ] Créer templates emails (return requested, approved, credit note created)

### Pendant l'Implémentation

- [ ] Tester CHAQUE migration avant de passer à la suivante
- [ ] Vérifier RLS après chaque policy créée
- [ ] Tester tous workflows end-to-end après Phase 3
- [ ] Monitorer logs erreurs (Sentry)

### Après Déploiement

- [ ] Migrer 8 avoirs historiques (AV-25-001 à AV-25-008)
- [ ] Période pilote 1 semaine (retours limités)
- [ ] Feedback équipe + ajustements
- [ ] Documentation utilisateur (Wiki/Notion)

---

## 📚 Références Clés

### Best Practices ERP

- [Odoo Returns Documentation](https://www.odoo.com/documentation/19.0/applications/sales/sales/products_prices/returns.html)
- [NetSuite Returns Management](https://www.netsuite.com/portal/products/erp/order-management/returns-management.shtml)
- [ERPAG Credit Note Guide](https://www.erpag.com/news/understanding-erpag-credit-note-management-a-comprehensive-guide)

### Accounting & Inventory

- [Sales Returns Accounting](https://www.patriotsoftware.com/blog/accounting/purchase-returns-and-allowances/)
- [Stock Adjustments Best Practices](https://www.fastercapital.com/content/Stock-Adjustments--Adjusting-Your-Way-to-Accuracy--The-Importance-of-Stock-Adjustments-in-Accounting.html)

---

## 🚦 Prochaine Étape

### Décision à Prendre (Romeo)

1. **Validation finale** : Option B confirmée ?
2. **Approbation retours** : Automatique ou manuel ?
3. **Délai retour** : 14 jours, 30 jours, ou 60 jours après livraison ?
4. **Frais retour** : Client paie transport ou Verone ?
5. **Restocking fee** : Gratuit ou 10% du montant ?

### Commencer Phase 1 (Base de Données)

**Fichier à utiliser** : `returns-management-sql-schema.sql`

**Étapes** :

1. Créer branche : `git checkout -b feat/BO-RET-001-returns-management-db`
2. Lire schéma SQL complet
3. Créer migrations (4 fichiers séparés pour clarté)
4. Appliquer via MCP Supabase
5. Vérifier tables/indexes/RLS
6. Commit + Push

**Temps estimé Phase 1** : 2 jours

---

**Pour toute question sur le plan** : Lire `returns-management-implementation.md` (plan complet 60 pages)
