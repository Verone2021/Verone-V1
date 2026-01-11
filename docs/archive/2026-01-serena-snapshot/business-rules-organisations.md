# Règles Métier - Système Organisations & Clients

## 📊 Architecture Base de Données

### 2 Tables Distinctes

#### 1. **`organisations`** - Entités Professionnelles UNIQUEMENT

**Types autorisés** (enum `organisation_type`) :

- `supplier` : Fournisseurs
- `customer` : Clients B2B (professionnels)
- `partner` : Partenaires
- `internal` : Structure interne Vérone

**Champ `customer_type`** (pour type='customer') :

- `'professional'` : Client B2B professionnel (NORMAL)
- `'individual'` : Client particulier (ANOMALIE - ne devrait PAS être dans organisations)

**Contrainte** : `CHECK (customer_type = ANY (ARRAY['professional', 'individual']))`

#### 2. **`individual_customers`** - Clients Particuliers B2C

Table séparée pour les clients individuels (B2C).
**PAS de relation** avec `organisations`.

---

## 🚨 Anomalies Détectées

### 2 Lignes "individual" dans `organisations` (2025-09-16)

```sql
SELECT id, name, type, customer_type, email, created_at
FROM organisations
WHERE type = 'customer' AND customer_type = 'individual';
```

**Résultats** :
| ID | Nom | Type | customer_type | Email | Créé le |
|---|---|---|---|---|---|
| 1861ddcf-d20d-4b5f-945b-4ed37024b89a | Marie Dupont | customer | individual | marie.dupont@gmail.com | 2025-09-16 18:44:14 |
| d33f38d1-f0c9-4a91-be0a-2a00a439ce25 | Jean Martin | customer | individual | jmartin@outlook.com | 2025-09-16 18:44:15 |

**Action recommandée** :

- Migrer ces 2 lignes vers `individual_customers`
- Ou supprimer si données de test

---

## 📈 Distribution Actuelle (2025-10-08)

```sql
SELECT type, customer_type, COUNT(*)
FROM organisations
GROUP BY type, customer_type;
```

| Type     | customer_type | Count             |
| -------- | ------------- | ----------------- |
| internal | NULL          | 1                 |
| supplier | NULL          | 7                 |
| customer | individual    | **2** ← Anomalies |
| customer | professional  | 150               |

**Total organisations valides** : 158 (1 internal + 7 suppliers + 150 customers B2B + 0 partners)
**Anomalies** : 2 (customers individual)

---

## 🎯 Règle de Filtrage Dashboard

### Code Correct pour `totalOrganisations`

```typescript
// ✅ CORRECT - Exclure les 2 anomalies "individual"
const organisationsOnly = organisations.filter(
  o =>
    o.type !== 'customer' ||
    (o.type === 'customer' && o.customer_type !== 'individual')
);

const organisationsStats = {
  totalOrganisations: organisationsOnly.length, // 158 organisations valides
  suppliers: organisations.filter(o => o.type === 'supplier').length, // 7
  customersB2B: organisations.filter(
    o =>
      o.type === 'customer' &&
      (!o.customer_type || o.customer_type === 'professional')
  ).length, // 150
  partners: organisations.filter(o => o.type === 'partner').length, // 0
};
```

**Logique du filtre** :

1. Si `type !== 'customer'` → **GARDE** (suppliers, partners, internal)
2. Si `type === 'customer'` → Garde SEULEMENT si `customer_type !== 'individual'`
3. Résultat : Toutes les organisations SAUF les 2 anomalies "individual"

### ❌ Version Simplifiée (Mathématiquement Équivalente mais MOINS CLAIRE)

```typescript
// ⚠️ Équivalent mais moins explicite sur l'intention métier
const organisationsOnly = organisations.filter(
  o => !(o.type === 'customer' && o.customer_type === 'individual')
);
```

**Note** : Cette version fonctionne mais masque la logique métier (exclure SEULEMENT les customers individual, garder TOUS les autres types).

---

## 📚 Relations Clés

### Foreign Keys sur `organisations.id`

- `contacts.organisation_id` → Contacts liés aux organisations
- `products.supplier_id` → Produits et leur fournisseur
- `products.assigned_client_id` → Produits assignés à un client
- `variant_groups.supplier_id` → Groupes variantes et fournisseur commun
- `purchase_orders.supplier_id` → Bons de commande fournisseurs

### Séparation B2B / B2C

- **B2B** : `organisations` (type='customer', customer_type='professional')
- **B2C** : `individual_customers` (table séparée)

---

## ✅ Validation des Règles

1. ✅ Les organisations = professionnels uniquement (normalement)
2. ✅ Les particuliers = table `individual_customers` dédiée
3. ⚠️ 2 anomalies "individual" dans `organisations` à traiter
4. ✅ Le filtre dashboard exclut correctement ces anomalies

---

**Dernière mise à jour** : 2025-10-08
**Source** : Analyse schéma Supabase + audit données production
