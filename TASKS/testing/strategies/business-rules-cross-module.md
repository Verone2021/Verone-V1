# 🔄 Règles Métier Cross-Module - Vérone Back Office

**Document** : Business Rules Intégrité Cross-Module
**Version** : 1.0 - Comprehensive Integration Rules
**Date** : 2025-09-24
**Scope** : Cohérence données et workflows inter-modules

---

## 🚨 **Principe Fondamental : Intégrité Système Global**

**RÈGLE ABSOLUE** : Aucune modification dans un module ne peut créer d'incohérence dans les modules liés. L'intégrité référentielle et business doit être maintenue en temps réel.

---

## 📊 **Matrice Intégration Modules**

### **Dashboard ↔ Autres Modules**
```typescript
// Dashboard DOIT refléter en temps réel
Dashboard.metrics.ca === sum(Commandes.total_amounts) // Exact
Dashboard.stock_critique === count(Catalogue.products WHERE stock < seuil) // Temps réel
Dashboard.commandes_cours === count(Commandes WHERE status IN ['confirmée', 'préparation'])
```

#### **Règles Business Dashboard**
- **BR-D001** : Métriques CA calculées depuis Commandes.total uniquement
- **BR-D002** : Stock critique = produits Catalogue.stock < seuil défini Paramètres
- **BR-D003** : Graphiques actualisés max 5min après modification source
- **BR-D004** : Alertes temps réel si incohérence détectée > 1%

---

## 🛒 **Catalogue → Stocks → Commandes (Flux Principal)**

### **Création Produit Cascade**
```sql
-- Workflow automatique création produit
INSERT INTO catalogue.products →
  INSERT INTO stocks.product_stock (initial_quantity = 0) →
  UPDATE dashboard.metrics_cache →
  NOTIFY canaux.sync_external_feeds
```

#### **Règles Business Catalogue-Stocks**
- **BR-CS001** : Nouveau produit = stock initial 0 automatique
- **BR-CS002** : Suppression produit impossible si stock > 0
- **BR-CS003** : Modification prix catalogue = recalcul marge temps réel
- **BR-CS004** : Activation/désactivation produit sync tous canaux

### **Réservation Stock Commande**
```typescript
// Validation commande DOIT vérifier stock disponible
const stockDisponible = stock_physique - stock_réservé
if (quantité_commandée > stockDisponible) {
  throw new Error('Stock insuffisant - proposer alternative ou délai')
}

// Réservation automatique validation commande
stock_réservé += quantité_commandée
stock_disponible = stock_physique - stock_réservé // Temps réel
```

#### **Règles Business Stocks-Commandes**
- **BR-SC001** : Réservation automatique dès validation commande
- **BR-SC002** : Libération stock si annulation < 24h
- **BR-SC003** : Stock négatif physique strictement impossible
- **BR-SC004** : Alerte automatique si réservé > 80% stock physique

---

## 💬 **CRM Interactions ↔ Commandes ↔ Contacts**

### **Cycle Relation Client Complet**
```typescript
// Workflow Lead → Client → Commande → Fidélisation
Contact.status = 'prospect' →
Interaction.devis_envoyé →
Commande.création →
Contact.status = 'client' →
Interaction.suivi_satisfaction
```

#### **Règles Business CRM-Commercial**
- **BR-CRM001** : Nouveau contact = interaction initiale obligatoire
- **BR-CRM002** : Devis validé = commande auto-proposée client
- **BR-CRM003** : Commande livrée = enquête satisfaction automatique J+7
- **BR-CRM004** : Client inactif >12 mois = campagne réactivation

### **Historique Client Unifié**
```sql
-- Vue 360° client intégrée
SELECT
  c.nom, c.email, c.statut,
  COUNT(i.id) as nb_interactions,
  SUM(o.total_amount) as ca_total,
  MAX(o.created_at) as derniere_commande,
  AVG(s.note_satisfaction) as satisfaction_moyenne
FROM contacts c
LEFT JOIN interactions i ON i.contact_id = c.id
LEFT JOIN commandes o ON o.contact_id = c.id
LEFT JOIN satisfaction s ON s.commande_id = o.id
```

#### **Règles Business Historique**
- **BR-HIST001** : Suppression contact = anonymisation données (RGPD)
- **BR-HIST002** : Fusion contacts = consolidation historiques
- **BR-HIST003** : Export données = format standard portable
- **BR-HIST004** : Accès historique selon permissions granulaires

---

## 🏭 **Sourcing ↔ Stocks ↔ Catalogue**

### **Approvisionnement Intelligent**
```typescript
// Déclenchement automatique réapprovisionnement
if (stock_disponible <= seuil_réappro) {
  const fournisseur = getBestSupplier(product, criteria: ['prix', 'délai', 'qualité'])
  const quantité = calculQuantitéOptimale(historique_ventes, délai_livraison)

  créerCommandeFournisseur({
    produit, quantité, fournisseur,
    validation_requise: quantité > seuil_validation
  })
}
```

#### **Règles Business Sourcing-Stocks**
- **BR-SS001** : Réappro auto si stock < seuil ET délai livraison > stock restant
- **BR-SS002** : Validation manager si commande > 10k€
- **BR-SS003** : Multi-fournisseurs si quantité > capacity fournisseur principal
- **BR-SS004** : Prix achat = mise à jour marge catalogue automatique

---

## 🌐 **Canaux Multi-Canal Synchronisation**

### **Cohérence Prix et Stock Tous Canaux**
```typescript
// Modification catalogue = propagation automatique
export const updateProductAllChannels = async (productId, changes) => {
  // 1. Mise à jour base centrale
  await updateProduct(productId, changes)

  // 2. Propagation synchrone canaux critiques
  await Promise.all([
    syncWebsite(productId, changes),
    syncGoogleMerchant(productId, changes),
    syncAmazon(productId, changes)
  ])

  // 3. Propagation asynchrone autres canaux
  queueChannelSync(productId, changes, ['ebay', 'facebook', 'instagram'])
}
```

#### **Règles Business Multi-Canal**
- **BR-MC001** : Modification prix = propagation <5min canaux critiques
- **BR-MC002** : Rupture stock = désactivation automatique tous canaux
- **BR-MC003** : Nouveau produit = activation sélective selon règles canal
- **BR-MC004** : Incohérence détectée = alerte admin + correction auto

---

## ⚙️ **Paramètres ↔ Tous Modules**

### **Configuration Centralisée Impact Global**
```typescript
// Modification paramètre = cascade tous modules concernés
const updateGlobalParameter = (parameter, newValue) => {
  switch (parameter) {
    case 'taux_tva':
      recalculateAllPricesTTC()
      regenerateAllInvoices()
      break

    case 'seuil_stock_critique':
      updateAllProductAlerts()
      refreshDashboardMetrics()
      break

    case 'devise_principale':
      convertAllPrices(newValue)
      updateChannelFeeds()
      break
  }
}
```

#### **Règles Business Configuration**
- **BR-CONFIG001** : Modification critique = validation double admin
- **BR-CONFIG002** : Impact global = prévisualisation avant application
- **BR-CONFIG003** : Historique configuration = traçabilité complète
- **BR-CONFIG004** : Rollback configuration = procédure urgence

---

## 🔒 **Sécurité Cross-Module**

### **Permissions Granulaires Cohérentes**
```sql
-- RLS Policy exemple cohérence cross-module
CREATE POLICY catalogue_rls ON products FOR ALL TO authenticated USING (
  -- Visualiseur : lecture seule
  (auth.jwt() ->> 'role' = 'viewer' AND false) OR
  -- Vendeur : lecture + modification prix dans limites
  (auth.jwt() ->> 'role' = 'seller' AND price_change_authorized(auth.uid())) OR
  -- Manager : lecture + modification complète
  (auth.jwt() ->> 'role' IN ('manager', 'owner'))
);
```

#### **Règles Business Sécurité**
- **BR-SEC001** : Permissions cohérentes tous modules même rôle
- **BR-SEC002** : Audit trail modifications données sensibles
- **BR-SEC003** : Session timeout uniforme 30min inactivité
- **BR-SEC004** : 2FA obligatoire rôles admin/manager

---

## 📊 **Workflows End-to-End Critiques**

### **Workflow 1 : Prospect → Client → Commande → Livraison**
```mermaid
graph LR
    A[Prospect Interactions] → B[Devis Catalogue]
    B → C[Commande Validation]
    C → D[Réservation Stocks]
    D → E[Commande Sourcing si rupture]
    E → F[Préparation Livraison]
    F → G[Facturation Comptabilité]
    G → H[Satisfaction CRM]
```

#### **Points Contrôle End-to-End**
- **E2E-001** : Lead CRM → Conversion commande <15 jours moyenne
- **E2E-002** : Commande → Stock réservé <1min automatique
- **E2E-003** : Rupture détectée → Réappro déclenché <24h
- **E2E-004** : Livraison → Facturation <24h automatique

### **Workflow 2 : Nouveau Produit → Multi-Canal → Vente**
```mermaid
graph LR
    A[Création Catalogue] → B[Stock Initial 0]
    B → C[Configuration Canaux]
    C → D[Feeds External Sync]
    D → E[Première Commande]
    E → F[Réapprovisionnement Auto]
```

#### **Validation Cross-Module**
- **CROSS-001** : Nouveau produit visible tous modules <5min
- **CROSS-002** : Modification répercutée tous canaux <15min
- **CROSS-003** : Métriques dashboard actualisées <5min
- **CROSS-004** : Intégrité données cross-check quotidien automatique

---

## ✅ **Tests Validation Cross-Module**

### **Suite Tests Intégration**
```typescript
describe('Cross-Module Integration Tests', () => {
  test('Product Creation Cascade', async () => {
    // 1. Créer produit catalogue
    const product = await createProduct({name: 'Test', price: 100})

    // 2. Vérifier stock automatique créé
    const stock = await getStock(product.id)
    expect(stock.quantity).toBe(0)

    // 3. Vérifier dashboard mis à jour
    const metrics = await getDashboardMetrics()
    expect(metrics.total_products).toBe(previousCount + 1)

    // 4. Vérifier canaux synchronisés
    const channelStatus = await checkChannelSync(product.id)
    expect(channelStatus.synced_count).toBeGreaterThan(0)
  })
})
```

### **Checklist Validation Quotidienne**
- [ ] **Cohérence CA** : Dashboard.CA === SUM(Commandes) ±0.01€
- [ ] **Stock temps réel** : Catalogue.stock === Stocks.disponible exact
- [ ] **Réservations** : Commandes.réservé === Stocks.réservé exact
- [ ] **Canaux sync** : Modifications <24h propagées 100%
- [ ] **Permissions** : Accès cohérent tous modules selon rôle
- [ ] **Performance** : Navigation cross-module <3s moyenne

---

**Validation** : Tests cross-module obligatoires avant release
**Monitoring** : Alertes temps réel incohérences >1%
**Recovery** : Procédures automatiques correction données