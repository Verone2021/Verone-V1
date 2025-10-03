# Rôles et Permissions Back-Office V1

> **Version** : 1.0 - MVP Catalogue Partageable  
> **Statut** : En développement  
> **Scope** : 3 rôles critiques pour démarrage

## 🎯 Vue d'Ensemble

### **Philosophie RBAC V1**
- **Minimaliste** : 3 rôles essentiels pour MVP
- **Sécurisé** : Permissions granulaires avec scopes
- **Évolutif** : Base solide pour 6 rôles supplémentaires V2

### **Rôles V1 (Production)**
1. **Owner** - Supervision totale
2. **Admin** - Administration métier complète
3. **Catalog Manager** - Spécialiste catalogue et exports

### **Rôles V2 (Futurs)**
- Sales, Purchasing, Ops/Warehouse, Accountant, Marketing Ops, Support/CS, Viewer

## 👑 **Owner** — Supervision Totale

### **Responsabilités**
- Sécurité système et gestion des accès
- Configuration des intégrations critiques
- Supervision facturation et abonnements
- Actions irréversibles (suppressions définitives)

### **Permissions Core**
```yaml
owner:
  inherits: [admin]
  system: true
  permissions: ["*"]  # Accès complet à tout
  
  # Permissions exclusives Owner
  critical_actions:
    - "security:manage"      # Gestion RLS, tokens, clés API
    - "users:manage"         # Création/suppression utilisateurs
    - "billing:manage"       # Facturation, abonnements
    - "system:configure"     # Configuration serveur, intégrations
    - "data:delete_permanent" # Suppressions définitives
    - "backups:manage"       # Sauvegardes et restaurations
```

### **Scopes Critiques**
- `can_manage_rls` - Gestion Row Level Security
- `can_manage_integrations` - APIs externes (Supabase, Brevo, etc.)
- `can_delete_permanently` - Suppressions irréversibles
- `can_view_audit_logs` - Accès logs système complets

## 🔧 **Admin** — Administration Métier Complète

### **Responsabilités**
- Gestion complète du catalogue produits
- Administration clients et fournisseurs
- Supervision commandes et collections
- Configuration business (prix, taxes, workflows)

### **Permissions Core**
```yaml
admin:
  inherits: []
  permissions:
    # Catalogue
    - "catalog:rcud"         # Read, Create, Update, Delete
    - "variants:rcud"
    - "packs:rcud"
    - "images:rcud"
    - "categories:rcud"
    
    # Business
    - "suppliers:rcud"
    - "clients:rcud"
    - "orders:rcud"
    - "collections:rcud"
    
    # Exports & Intégrations
    - "feeds:export"
    - "feeds:schedule"
    - "brevo:sync"
    - "brevo:send"
    
    # Configuration
    - "settings:manage"
    - "prices:update"
    - "taxes:configure"
```

### **Scopes Métier**
- `can_edit_prices` - Modification tarifs
- `can_publish_feed` - Publication feeds Meta/Google
- `can_approve_orders` - Validation commandes importantes
- `can_manage_settings` - Configuration business rules

## 📊 **Catalog Manager** — Spécialiste Catalogue

### **Responsabilités**
- Gestion quotidienne du catalogue produits
- Création et maintenance des collections
- Exports feeds publicitaires
- Organisation catégories et familles

### **Permissions Core**
```yaml
catalog_manager:
  inherits: []
  permissions:
    # Catalogue complet
    - "catalog:rcud"
    - "variants:rcud"
    - "images:rcud"
    - "categories:rcud"
    - "collections:rcud"
    
    # Exports
    - "feeds:export"
    - "pdf:generate"
    
    # Lecture business
    - "clients:read"
    - "suppliers:read"
    - "stock:read"
    - "orders:read"
    
    # Intégration marketing
    - "brevo:sync"
```

### **Scopes Spécialisés**
- `can_publish_feed` - Publication feeds externes
- `can_edit_prices` - Ajustement prix catalogue
- `can_view_costs` - Visibilité coûts fournisseurs
- `can_manage_collections` - Gestion collections partageables

## 🔒 **Matrice de Permissions V1**

| Ressource | Owner | Admin | Catalog Manager |
|-----------|-------|-------|-----------------|
| **Catalogue** | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| **Variantes** | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| **Images** | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| **Collections** | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| **Clients** | ✅ CRUD | ✅ CRUD | 📖 Read |
| **Fournisseurs** | ✅ CRUD | ✅ CRUD | 📖 Read |
| **Commandes** | ✅ CRUD | ✅ CRUD | 📖 Read |
| **Feeds Export** | ✅ | ✅ | ✅ |
| **Prix/Tarifs** | ✅ | ✅ | ✅* |
| **Configuration** | ✅ | ✅ | ❌ |
| **Sécurité/RLS** | ✅ | ❌ | ❌ |
| **Utilisateurs** | ✅ | ❌ | ❌ |

*Avec scope `can_edit_prices`

## 🛡️ **Implémentation RLS (Row Level Security)**

### **Tables Principales**
```sql
-- Catalogue : accès selon rôle
CREATE POLICY "catalog_access_v1" ON product_groups
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager') OR
    (get_user_role() = 'sales' AND action = 'SELECT')
  );

-- Collections privées : créateur + admin
CREATE POLICY "collections_access_v1" ON collections
  FOR ALL USING (
    created_by = auth.uid() OR
    get_user_role() IN ('owner', 'admin') OR
    (is_public = true AND action = 'SELECT')
  );

-- Feeds : tokens + rôles autorisés
CREATE POLICY "feeds_access_v1" ON feed_logs
  FOR SELECT USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );
```

### **Helper Functions**
```sql
-- Fonction utilitaire : récupérer rôle utilisateur
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles 
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction utilitaire : vérifier scope
CREATE OR REPLACE FUNCTION has_scope(scope_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT scope_name = ANY(scopes) FROM user_profiles 
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;
```

## 📈 **Évolution V2**

### **Rôles Supplémentaires Prévus**
- **Sales** : Devis, commandes, clients (lecture catalogue)
- **Purchasing** : Fournisseurs, achats, réceptions
- **Ops/Warehouse** : Stock, inventaires, mouvements
- **Accountant** : Facturation, paiements, exports comptables
- **Marketing Ops** : Feeds, CRM, campagnes
- **Support/CS** : Clients, SAV, tickets
- **Viewer** : Lecture seule, reporting, audit

### **Scopes Avancés V2**
- `can_approve_large_orders` (>10k€)
- `can_issue_refunds`
- `can_adjust_stock_negative`
- `can_send_campaigns`
- `can_view_financial_data`

Cette structure RBAC V1 assure une sécurité robuste tout en permettant une extension naturelle vers les 6 rôles supplémentaires de la V2.