# Guide Utilisateur - Configuration Seuils Stock Minimum

**Audience** : Gestionnaires stock, Admins
**Niveau** : Débutant
**Durée lecture** : 10 minutes
**Dernière mise à jour** : 2025-11-10

---

## 🎯 Objectif

Apprendre à configurer les seuils minimum de stock (min_stock) pour recevoir automatiquement des alertes avant rupture et optimiser la gestion des réapprovisionnements.

---

## 📚 Concepts de Base

### Qu'est-ce qu'un Seuil Minimum ?

Le **seuil minimum (min_stock)** est la quantité en dessous de laquelle vous souhaitez être alerté pour réapprovisionner un produit.

**Exemple** :

- Produit : Canapé Stockholm
- Stock actuel : 15 unités
- Seuil minimum : 10 unités
- ✅ Pas d'alerte (15 >= 10)

Si le stock descend à 8 unités :

- ⚠️ **Alerte automatique** : "Stock Faible - Canapé Stockholm: 8 unités (seuil: 10)"
- Notification envoyée à tous les gestionnaires
- Ligne apparaît dans `/stocks/alertes`

### Pourquoi Configurer un Seuil ?

**Sans seuil configuré (min_stock = 0)** :

- ❌ Aucune alerte automatique
- ❌ Risque de rupture stock non détectée
- ❌ Commandes urgentes en dernière minute
- ❌ Clients mécontents (produit indisponible)

**Avec seuil bien configuré (min_stock > 0)** :

- ✅ Alertes préventives avant rupture
- ✅ Temps pour passer commande fournisseur sereinement
- ✅ Optimisation trésorerie (commandes anticipées)
- ✅ Satisfaction client (disponibilité produit)

---

## 🧮 Méthodes de Calcul Seuil Optimal

### Méthode 1 : Délai Réapprovisionnement (Recommandée)

**Formule** :

```
min_stock = Ventes Moyennes Journalières × (Délai Fournisseur + Marge Sécurité)
```

**Exemple Canapé Stockholm** :

- Ventes moyennes : 2 unités/jour
- Délai fournisseur : 10 jours
- Marge sécurité : 5 jours (imprévus)
- **min_stock = 2 × (10 + 5) = 30 unités**

**Interprétation** : Avec seuil à 30, vous commandez quand il reste 15 jours de stock → Réception avant rupture.

### Méthode 2 : Jours de Couverture

**Formule** :

```
min_stock = Ventes Moyennes Journalières × Jours Couverture Souhaités
```

**Exemples** :

| Produit                       | Ventes/Jour | Couverture | Min Stock |
| ----------------------------- | ----------- | ---------- | --------- |
| Best-seller (rotation rapide) | 5           | 15 jours   | 75        |
| Produit standard              | 2           | 21 jours   | 42        |
| Rotation lente                | 0.5         | 30 jours   | 15        |
| Saisonnier (été uniquement)   | 1           | 60 jours   | 60        |

### Méthode 3 : Analyse ABC (Avancé)

**Catégorie A (20% produits = 80% chiffre d'affaires)** :

- Seuils élevés (30-60 jours couverture)
- Priorité maximale (jamais en rupture)
- Exemple : Canapés haut de gamme

**Catégorie B (30% produits = 15% CA)** :

- Seuils moyens (15-30 jours)
- Exemple : Fauteuils standards

**Catégorie C (50% produits = 5% CA)** :

- Seuils bas (7-15 jours) ou 0 (pas de seuil)
- Exemple : Accessoires déco peu vendus

---

## 🛠️ Configuration Pratique

### Option 1 : Via Interface /produits (Recommandé)

**Étapes** :

1. **Ouvrir page produits**
   - Naviguer vers `/produits`
   - Liste complète catalogue

2. **Sélectionner produit**
   - Cliquer sur ligne produit
   - Modal détails s'ouvre

3. **Modifier seuil minimum**
   - Onglet "Stock & Logistique"
   - Champ "Seuil Minimum" : Saisir valeur (ex: 30)
   - Bouton "Enregistrer"

4. **Vérifier alerte automatique**
   - Si stock actuel < nouveau seuil → Alerte créée immédiatement
   - Notification dans dropdown (icône cloche)
   - Ligne dans `/stocks/alertes`

**Screenshot recommandé** :

```
┌─────────────────────────────────────────────────────────────┐
│  Modal Édition Produit - Canapé Stockholm                   │
├─────────────────────────────────────────────────────────────┤
│  Onglets : [Général] [Stock & Logistique] [Pricing] [...]   │
│                                                              │
│  📦 Stock & Logistique                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Stock Actuel            : [    8    ] unités        │  │
│  │ Seuil Minimum           : [   30    ] unités        │  │
│  │ Stock Prévisionnel      : [    5    ] unités        │  │
│  │ Emplacement Entrepôt    : [Allée C3]                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ⚠️ Alerte : Stock actuel (8) inférieur au seuil (30)       │
│                                                              │
│  [Annuler]                              [Enregistrer] ✅     │
└─────────────────────────────────────────────────────────────┘
```

### Option 2 : Modification en Masse (Admin)

**Cas d'usage** : Définir seuils pour 100+ produits simultanément

**Étapes** :

1. **Exporter catalogue**
   - Page `/produits`
   - Bouton "Exporter CSV"
   - Fichier `produits_export_2025-11-10.csv`

2. **Éditer fichier Excel/Sheets**
   - Colonne `min_stock` : Saisir valeurs
   - Formules Excel : `=B2*30` (ventes × 30 jours)

3. **Importer mise à jour**
   - Page `/produits`
   - Bouton "Importer CSV"
   - Upload fichier modifié
   - Validation + Aperçu changements
   - Confirmer import

4. **Vérifier alertes créées**
   - Page `/stocks/alertes`
   - Voir produits nouvellement sous seuil

### Option 3 : SQL Direct (Développeurs)

**Cas d'usage** : Scripts automatisés, migration données

```sql
-- Définir seuil pour UN produit
UPDATE products
SET min_stock = 30
WHERE sku = 'CANAPE-STOCKHOLM-001';

-- Définir seuils pour catégorie entière
UPDATE products
SET min_stock = CASE
  WHEN average_sales_per_day >= 5 THEN 75   -- Rotation rapide
  WHEN average_sales_per_day >= 2 THEN 42   -- Standard
  ELSE 15                                    -- Rotation lente
END
WHERE category_id = '{uuid-canapes}';

-- Définir seuils basés sur délai fournisseur
UPDATE products p
SET min_stock = (
  (p.average_sales_per_day * (s.lead_time_days + 5))::INTEGER
)
FROM suppliers s
WHERE p.primary_supplier_id = s.id
  AND p.average_sales_per_day IS NOT NULL;
```

---

## 📊 Stratégies par Type de Produit

### Produits à Rotation Rapide (Best-Sellers)

**Caractéristiques** :

- Ventes >5 unités/jour
- Forte demande constante
- Risque rupture élevé

**Stratégie seuils** :

```
min_stock = Ventes/jour × 15 jours minimum
```

**Exemple Canapé Best-Seller** :

- Ventes : 8/jour
- Délai fournisseur : 10 jours
- **min_stock = 8 × (10 + 7) = 136 unités**
- Couverture : 17 jours

### Produits Saisonniers

**Caractéristiques** :

- Ventes concentrées sur période (été, Noël, etc.)
- Hors saison : ventes quasi nulles

**Stratégie seuils** :

**Haute saison (Mai-Septembre)** :

```sql
UPDATE products
SET min_stock = average_sales_per_day * 45  -- 45 jours couverture
WHERE category = 'mobilier-jardin'
  AND EXTRACT(MONTH FROM now()) BETWEEN 5 AND 9;
```

**Basse saison (Octobre-Avril)** :

```sql
UPDATE products
SET min_stock = 0  -- Désactiver alertes hors saison
WHERE category = 'mobilier-jardin'
  AND EXTRACT(MONTH FROM now()) NOT BETWEEN 5 AND 9;
```

### Produits Sur Commande (Made-to-Order)

**Caractéristiques** :

- Fabriqués à la demande
- Pas de stock physique
- Délai fabrication + livraison

**Stratégie** :

- **min_stock = 0** (pas d'alerte stock)
- Suivre délais fabrication via commandes fournisseurs

### Produits Haute Valeur

**Caractéristiques** :

- Prix unitaire >5000€
- Impact trésorerie important
- Rotation lente mais marges élevées

**Stratégie** :

```
min_stock = 1 ou 2 unités maximum
```

**Rationale** : Optimiser trésorerie, commander à la demande

---

## 🔄 Ajustements Dynamiques

### Quand Réviser les Seuils ?

**Fréquence recommandée** :

| Situation              | Fréquence Révision             |
| ---------------------- | ------------------------------ |
| Produits best-sellers  | Mensuelle                      |
| Catalogue standard     | Trimestrielle                  |
| Nouveaux produits      | Après 3 mois historique ventes |
| Changement fournisseur | Immédiate                      |
| Saisonnalité           | Avant/après haute saison       |

### Indicateurs de Seuil Mal Configuré

**Seuil TROP BAS** :

- ❌ Ruptures stock fréquentes
- ❌ Commandes urgentes (coûts élevés)
- ❌ Notifications trop tardives

**Action** : Augmenter min_stock de +30%

**Seuil TROP HAUT** :

- ❌ Stock dormant élevé
- ❌ Trésorerie immobilisée
- ❌ Risque obsolescence

**Action** : Réduire min_stock de -20%

### Script Analyse Seuils

```sql
-- Produits avec alertes fréquentes (seuil trop bas)
SELECT
  p.name,
  p.sku,
  p.min_stock,
  COUNT(*) as alert_count_30j
FROM stock_alert_tracking sa
JOIN products p ON sa.product_id = p.id
WHERE sa.created_at > now() - interval '30 days'
GROUP BY p.id, p.name, p.sku, p.min_stock
HAVING COUNT(*) > 5  -- >5 alertes en 30j = problème
ORDER BY alert_count_30j DESC;

-- Recommandation : Augmenter min_stock de +50%
```

---

## 📋 Checklist Configuration Initiale

### ✅ Étape 1 : Analyse Historique Ventes

- [ ] Exporter historique ventes 6 derniers mois
- [ ] Calculer ventes moyennes journalières par produit
- [ ] Identifier top 20% produits (best-sellers)
- [ ] Segmenter par catégorie ABC

### ✅ Étape 2 : Recueillir Infos Fournisseurs

- [ ] Lister tous fournisseurs actifs
- [ ] Documenter délais livraison (lead time)
- [ ] Noter quantités minimum commande (MOQ)
- [ ] Identifier fournisseurs fiables vs risqués

### ✅ Étape 3 : Définir Seuils Initiaux

- [ ] **Catégorie A** : Seuils = 30-45 jours couverture
- [ ] **Catégorie B** : Seuils = 15-30 jours
- [ ] **Catégorie C** : Seuils = 0-15 jours (ou 0)
- [ ] **Sur commande** : min_stock = 0

### ✅ Étape 4 : Importer Seuils

- [ ] Créer fichier CSV avec colonnes `sku, min_stock`
- [ ] Importer via `/produits > Importer CSV`
- [ ] Valider aperçu changements
- [ ] Confirmer import

### ✅ Étape 5 : Vérifier Alertes

- [ ] Page `/stocks/alertes` : Vérifier alertes créées
- [ ] Dropdown notifications : Vérifier notifications
- [ ] Tester redirection modal produit
- [ ] Ajuster seuils si trop d'alertes

### ✅ Étape 6 : Monitoring Continu

- [ ] Configurer dashboard métriques stock
- [ ] Planifier révision trimestrielle
- [ ] Former équipe sur workflow alertes
- [ ] Documenter procédures réapprovisionnement

---

## ❓ FAQ

### Q1 : Que se passe-t-il si je mets min_stock = 0 ?

**R** : Aucune alerte automatique. Adapté pour :

- Produits sur commande (made-to-order)
- Accessoires faible valeur
- Produits fin de vie

### Q2 : Puis-je avoir un seuil différent par entrepôt ?

**R** : Actuellement, le seuil est global par produit. Si vous avez plusieurs entrepôts :

- **Option 1** : Seuil basé sur stock total
- **Option 2** : Créer variantes produit par entrepôt (avancé)

### Q3 : Comment tester mes seuils sans impacter production ?

**R** : Utiliser transaction SQL avec ROLLBACK :

```sql
BEGIN;

-- Tester seuil
UPDATE products SET min_stock = 50 WHERE sku = 'TEST-001';

-- Vérifier alertes créées
SELECT * FROM stock_alert_tracking WHERE product_id = '{id}';

-- Annuler changements (ne pas appliquer)
ROLLBACK;
```

### Q4 : Les seuils sont-ils ajustés automatiquement ?

**R** : Non, les seuils sont statiques. Vous devez les réviser manuellement.

**Roadmap futur** : Seuils dynamiques basés ML (analyse ventes historiques).

### Q5 : Puis-je désactiver alertes temporairement ?

**R** : Oui, mettre `min_stock = 0` désactive alertes. Réactiver en remettant seuil > 0.

---

## 📞 Support

**Questions configuration** : team@verone.com
**Bugs alertes** : GitHub Issues
**Formation équipe** : Demander démo personnalisée

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-11-10
**Auteur** : Claude Code + Romeo Dos Santos
