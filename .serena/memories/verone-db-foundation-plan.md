# Plan d'Exécution - Foundation DB Catalogue Vérone

## 🎯 Objectif
Créer la structure de base de données complète pour le catalogue Vérone selon les business rules V1 avec rôles Owner, Admin, Catalog Manager.

## 📋 Business Rules Analysées
- **Rôles V1** : Owner (supervision totale), Admin (métier complet), Catalog Manager (spécialiste catalogue)
- **Catalogue** : Produits avec variantes, conditionnements flexibles, prix multi-niveaux
- **Sécurité** : RLS (Row Level Security) obligatoire sur toutes tables sensibles
- **Performance** : SLO <2s dashboard, optimisation exports feeds

## 🏗️ Architecture DB (basée sur ERD-CATALOGUE-V1.md)

### Tables Prioritaires
1. **Auth** : user_profiles, user_organisation_assignments
2. **Catalogue Core** : product_groups, products, categories, product_packages
3. **Support** : product_translations, collections, collection_products
4. **Feeds** : feed_configs, feed_exports
5. **RLS Policies** : Protection par rôles selon business rules

## 📅 Séquence Migrations Optimisée

### Phase 1 - Foundation (Migrations 001-003)
- **001_organisations** : Table organisations (prérequis multi-tenant)
- **002_user_profiles** : Profils utilisateurs + assignments organisations
- **003_helper_functions** : get_user_role(), update_updated_at()

### Phase 2 - Catalogue Core (Migrations 004-007)
- **004_categories** : Hiérarchie 3 niveaux (Famille > Catégorie > Sous-catégorie)
- **005_product_groups** : Groupes produits avec classification
- **006_products** : Produits individuels avec variantes et prix
- **007_product_packages** : Conditionnements flexibles (single, pack, bulk)

### Phase 3 - Sécurité & Performance (Migrations 008-010)
- **008_rls_auth** : RLS policies tables authentification
- **009_rls_catalogue** : RLS policies tables catalogue
- **010_performance_indexes** : Index optimisés pour SLO <2s

## 🔒 Points Critiques Sécurité

### RLS Policies Essentielles
```sql
-- Produits : accès selon rôle
CREATE POLICY "products_access" ON products
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager') OR
    (get_user_role() = 'sales' AND status IN ('in_stock', 'preorder'))
  );

-- Collections : créateur + admins + public
CREATE POLICY "collections_access" ON collections
  FOR ALL USING (
    created_by = auth.uid() OR
    get_user_role() IN ('owner', 'admin') OR
    (is_public = true AND auth.role() IS NOT NULL)
  );
```

## ⚡ Performance SLO <2s

### Index Critiques
- Composés pour requêtes catalogue fréquentes
- JSONB sur variant_attributes pour filtres
- Partiels sur statuts actifs uniquement
- Full-text search préparé (trigram)

### Optimisations
- Vues matérialisées pour exports feeds (V2)
- Query plans monitoring avec EXPLAIN ANALYZE
- Refresh automatique données critiques

## 🎯 Coordination Agents

### 1. Sequential Thinking ✅ TERMINÉ
- Architecture détaillée analysée
- Séquence migrations optimisée
- Dépendances critiques identifiées
- Points de blocage anticipés

### 2. Supabase MCP (À DÉMARRER)
- **Tâches** : Exécuter migrations 001-010 selon séquence
- **Validation** : Contraintes, performances, types TypeScript
- **Deliverables** : DB structure complète + RLS fonctionnel

### 3. Serena MCP (VALIDATION)
- **Tâches** : Code review SQL vs business rules
- **Validation** : Conformité ERD-CATALOGUE-V1.md
- **Quality Gates** : Détection incohérences architecture

### 4. Tests & Validation (FINAL)
- **Tâches** : Tests RLS par rôle, performance SLO
- **Business** : Création utilisateur owner veronebyromeo@gmail.com
- **End-to-end** : Workflows catalogue complets

## 🚨 Risques & Mitigation

### Dépendances Critiques
- organisations → user_profiles → get_user_role() → RLS policies
- categories → product_groups → products → product_packages

### Rollback Strategy
- Migrations atomiques avec transactions
- Schema backup avant chaque migration
- Scripts rollback testés
- Validation data integrity post-migration

## ✅ Success Criteria
- [x] Architecture planifiée selon business rules V1
- [ ] Migrations exécutées sans erreur
- [ ] RLS policies fonctionnelles par rôle
- [ ] Performance <2s sur requêtes catalogue
- [ ] Utilisateur owner créé et opérationnel
- [ ] Conformité complète manifests business rules

Cette foundation assure base solide pour MVP catalogue partageable Vérone.