# 🔒 Fix RLS Policies - Erreurs "organisation_id does not exist"

**Date** : 22 septembre 2025  
**Status** : ✅ RÉSOLU COMPLÈTEMENT

## 🚨 Problème Identifié

**Erreurs Console** :
- `column "organisation_id" does not exist` dans use-order-metrics.ts
- `column "organisation_id" does not exist` dans use-revenue-metrics.ts

## 🔍 Diagnostic Approfondi

### **Investigation Systématique**
1. ✅ **Hooks Métriques** - Codes corrects, utilisent bonnes relations
2. ✅ **Schéma Database** - Tables existent avec bonnes colonnes
3. 🚨 **Policies RLS** - PROBLÈME IDENTIFIÉ ici

### **Cause Racine**
Les policies RLS sur `sales_orders` et `purchase_orders` utilisaient `user_has_access_to_organisation(get_user_organisation_id())` mais ne vérifiaient PAS les bonnes relations :

- ❌ **Ancien**: Policy cherchait colonne `organisation_id` inexistante  
- ✅ **Correct**: Tables utilisent `customer_id` et `supplier_id` → `organisations.id`

## 🛠 Solution Implémentée

### **1. Correction Sales Orders RLS**
```sql
-- Ancienne policy défaillante supprimée
DROP POLICY "Utilisateurs peuvent voir leurs commandes clients" ON sales_orders;

-- Nouvelle policy avec bonne relation
CREATE POLICY "Utilisateurs peuvent voir leurs commandes clients" ON sales_orders
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM organisations 
    WHERE user_has_access_to_organisation(id)
  )
);
```

### **2. Correction Purchase Orders RLS**  
```sql
-- Ancienne policy défaillante supprimée
DROP POLICY "Utilisateurs peuvent voir leurs commandes fournisseurs" ON purchase_orders;

-- Nouvelle policy avec bonne relation
CREATE POLICY "Utilisateurs peuvent voir leurs commandes fournisseurs" ON purchase_orders
FOR SELECT 
USING (
  supplier_id IN (
    SELECT id FROM organisations 
    WHERE user_has_access_to_organisation(id)
  )
);
```

## ✅ Résultats

### **Avant Fix**
- 🚨 **4 erreurs console** visibles
- ❌ **Métriques commandes** : 0 (erreur SQL)
- ❌ **Métriques revenus** : 0 (erreur SQL)
- 🐌 **Performance** : Dashboard bloqué par erreurs

### **Après Fix**
- ✅ **0 erreur console** 
- ✅ **Métriques commandes** : 1 commande affichée
- ✅ **Métriques revenus** : Fonctionnelles
- ⚡ **Performance** : Dashboard 362ms (excellent)
- 🎯 **Données réelles** : SO-TEST-1758224192.487663 - Jean Martin - 50.00€

## 🔧 Migrations Appliquées

1. **fix_sales_orders_rls_policies** - Correction relations customer_id
2. **fix_purchase_orders_rls_policies** - Correction relations supplier_id

## 📚 Leçons Apprises

### **Architecture Database**
- ✅ Tables commandes utilisent foreign keys spécifiques (`customer_id`, `supplier_id`)
- ✅ Pas de colonne `organisation_id` directe dans orders tables
- ✅ Relations via `organisations.id` pour isolation multi-tenant

### **RLS Debugging Process**
1. **Console Errors** → Identifier erreurs SQL exactes
2. **Database Schema** → Vérifier colonnes réelles vs attendues  
3. **RLS Policies** → Audit relations dans policies
4. **Testing** → Validation 0 erreur + données fonctionnelles

## 🎯 Impact Business

✅ **Métriques Dashboard** : Restaurées et fonctionnelles  
✅ **Performance** : SLO <2s respecté (362ms)  
✅ **Sécurité** : RLS multi-tenant maintenue et corrigée  
✅ **Fiabilité** : Plus d'erreurs console, système stable