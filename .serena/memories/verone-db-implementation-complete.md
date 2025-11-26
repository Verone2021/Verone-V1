# Vérone DB Foundation - Référence Architecture

## 🎯 Statut
**Implémentation complète** - Phase 1-3 terminées (voir archive pour détails historiques)

## 🏗️ Architecture Actuelle (78 tables)

### Tables Core
- **Auth** : organisations, user_profiles, user_organisation_assignments
- **Catalogue** : products, categories, product_groups, product_packages
- **Stock** : stock_movements, stock_alert_tracking, stock_reservations
- **Orders** : purchase_orders, sales_orders, *_items, *_receptions, *_shipments
- **Feeds** : feed_configs, feed_exports, feed_performance_metrics

### Helper Functions RLS (critiques)
```sql
get_user_role()                 -- RLS rôle utilisateur
get_user_organisation_id()      -- RLS organisation utilisateur
has_scope(text)                 -- Vérification permissions granulaires
update_updated_at()             -- Trigger timestamps automatiques
```

### Rôles & Permissions V1
- **Owner** : Accès complet + gestion sécurité/utilisateurs
- **Admin** : Métier complet (catalogue, clients, commandes, feeds)
- **Catalog Manager** : Catalogue + collections + exports

## 🔒 Patterns Sécurité

### Multi-tenant RLS
- Isolation complète par `organisation_id`
- Helper functions `SECURITY DEFINER`
- Policies testées pour tous rôles

### Convention Triggers
- Tous triggers stock : `SECURITY DEFINER` + `SET search_path`
- Évite boucles infinies entre triggers

## ⚡ Performance SLO
- Dashboard : <2s LCP
- Requêtes catalogue : <200ms
- Index JSONB sur variant_attributes
- Index partiels sur statuts actifs

## 📝 Notes
- Détails historiques Phase 1-3 : `.serena/memories/archive/verone-db-foundation-plan.md`
- Business rules : `docs/business-rules/`
- Schema complet : `docs/database/`
