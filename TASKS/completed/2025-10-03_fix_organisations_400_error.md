# Analyse Erreur #3 - Organisations 400

## 🔍 DIAGNOSTIC

### Colonnes ENVOYÉES par le Hook (49 colonnes)

**Fichier:** `src/hooks/use-organisations.ts` - Fonction `createOrganisation()` lignes 293-354

```typescript
1. name
2. type
3. email
4. country
5. is_active
6. phone ❌ N'EXISTE PAS
7. website ❌ N'EXISTE PAS
8. secondary_email ❌ N'EXISTE PAS
9. address_line1 ⚠️ DEPRECATED/INCERTAIN
10. address_line2 ⚠️ DEPRECATED/INCERTAIN
11. postal_code ⚠️ DEPRECATED/INCERTAIN
12. city ⚠️ DEPRECATED/INCERTAIN
13. region ⚠️ DEPRECATED/INCERTAIN
14. billing_address_line1 ✅
15. billing_address_line2 ✅
16. billing_postal_code ✅
17. billing_city ✅
18. billing_region ✅
19. billing_country ✅
20. shipping_address_line1 ✅
21. shipping_address_line2 ✅
22. shipping_postal_code ✅
23. shipping_city ✅
24. shipping_region ✅
25. shipping_country ✅
26. has_different_shipping_address ✅
27. siret ❌ N'EXISTE PAS
28. vat_number ❌ N'EXISTE PAS
29. legal_form ❌ N'EXISTE PAS
30. industry_sector ❌ N'EXISTE PAS
31. supplier_segment ❌ N'EXISTE PAS
32. supplier_category ❌ N'EXISTE PAS
33. payment_terms ❌ N'EXISTE PAS
34. delivery_time_days ❌ N'EXISTE PAS
35. minimum_order_amount ❌ N'EXISTE PAS
36. currency ❌ N'EXISTE PAS
37. prepayment_required ✅
38. customer_type ✅
39. first_name ✅
40. mobile_phone ✅
41. date_of_birth ✅
42. nationality ✅
43. preferred_language ✅
44. communication_preference ✅
45. marketing_consent ✅
46. rating ❌ N'EXISTE PAS
47. certification_labels ❌ N'EXISTE PAS
48. preferred_supplier ❌ N'EXISTE PAS
49. notes ❌ N'EXISTE PAS
```

### Colonnes RÉELLES en Base de Données (d'après migrations)

**Migration 20250113_002_create_auth_tables.sql** (BASE) :
```sql
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- ⚠️ REQUIS mais NON ENVOYÉ par hook !
  type organisation_type DEFAULT 'internal',
  email VARCHAR(255),
  country VARCHAR(2) DEFAULT 'FR',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Migration 20250916_010_add_customer_type_column.sql** :
- ✅ customer_type TEXT
- ✅ prepayment_required BOOLEAN

**Migration 20250916_012_add_billing_shipping_addresses.sql** :
- ✅ billing_address_line1, billing_address_line2, billing_postal_code, billing_city, billing_region, billing_country
- ✅ shipping_address_line1, shipping_address_line2, shipping_postal_code, shipping_city, shipping_region, shipping_country
- ✅ has_different_shipping_address

**Migration 20250916_013_add_individual_customer_fields.sql** :
- ✅ first_name, mobile_phone, date_of_birth, nationality, preferred_language
- ✅ communication_preference, marketing_consent

### Colonnes PROBLÉMATIQUES

**❌ COLONNES INEXISTANTES EN BD (22 colonnes)** :
```
phone, website, secondary_email,
siret, vat_number, legal_form,
industry_sector, supplier_segment, supplier_category,
payment_terms, delivery_time_days, minimum_order_amount, currency,
rating, certification_labels, preferred_supplier, notes,
address_line1, address_line2, postal_code, city, region
```

**⚠️ COLONNE MANQUANTE dans l'INSERT** :
```
slug - REQUIS en BD mais NON ENVOYÉ par le hook !
```

**📝 NOTE** : Les colonnes métier (phone, siret, payment_terms, rating, notes, etc.) existent dans la table `suppliers` (migration 20250114_006) mais PAS dans `organisations`. Il n'y a eu AUCUNE migration pour fusionner ces deux tables.

---

## ✅ FIX REQUIS

### Stratégie de correction

**Option 1 - MINIMAL (Recommandée pour fix immédiat)** :
- Retirer TOUTES les colonnes inexistantes
- Ajouter génération automatique du `slug`
- Garder UNIQUEMENT les colonnes validées en BD

**Option 2 - MIGRATION BD (Long terme)** :
- Créer migration pour ajouter colonnes métier à `organisations`
- Puis adapter le hook pour utiliser ces nouvelles colonnes

### Fix Immédiat - Option 1

**Fichier:** `src/hooks/use-organisations.ts`
**Fonction:** `createOrganisation` (lignes 289-369)

**Code AVANT (bugué)** :
```typescript
const createOrganisation = async (data: CreateOrganisationData): Promise<Organisation | null> => {
  try {
    const { data: newOrg, error } = await supabase
      .from('organisations')
      .insert([{
        name: data.name,
        type: data.type,
        email: data.email || null,
        country: data.country || 'FR',
        is_active: data.is_active ?? true,
        phone: data.phone || null,  // ❌ N'EXISTE PAS
        website: data.website || null,  // ❌ N'EXISTE PAS
        secondary_email: data.secondary_email || null,  // ❌ N'EXISTE PAS
        // ... + 40 autres colonnes dont 22 inexistantes
      }])
      .select()
      .single()
    // ...
  }
}
```

**Code APRÈS (corrigé)** :
```typescript
const createOrganisation = async (data: CreateOrganisationData): Promise<Organisation | null> => {
  try {
    // Générer slug automatiquement depuis le nom
    const slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer accents
      .replace(/[^a-z0-9]+/g, '-')     // Remplacer non-alphanumériques par -
      .replace(/^-+|-+$/g, '')         // Retirer - en début/fin
      .substring(0, 100)               // Limiter à 100 caractères

    const { data: newOrg, error } = await supabase
      .from('organisations')
      .insert([{
        // ✅ Colonnes de base (REQUIRED)
        name: data.name,
        slug: slug, // ✅ AJOUTÉ - Requis en BD
        type: data.type,
        email: data.email || null,
        country: data.country || 'FR',
        is_active: data.is_active ?? true,

        // ✅ Adresses de facturation (existantes)
        billing_address_line1: data.billing_address_line1 || null,
        billing_address_line2: data.billing_address_line2 || null,
        billing_postal_code: data.billing_postal_code || null,
        billing_city: data.billing_city || null,
        billing_region: data.billing_region || null,
        billing_country: data.billing_country || 'FR',

        // ✅ Adresses de livraison (existantes)
        shipping_address_line1: data.shipping_address_line1 || null,
        shipping_address_line2: data.shipping_address_line2 || null,
        shipping_postal_code: data.shipping_postal_code || null,
        shipping_city: data.shipping_city || null,
        shipping_region: data.shipping_region || null,
        shipping_country: data.shipping_country || 'FR',
        has_different_shipping_address: data.has_different_shipping_address ?? false,

        // ✅ Classification client (existantes)
        customer_type: data.customer_type || null,
        prepayment_required: data.prepayment_required ?? false,

        // ✅ Champs clients particuliers (existants)
        first_name: data.first_name || null,
        mobile_phone: data.mobile_phone || null,
        date_of_birth: data.date_of_birth || null,
        nationality: data.nationality || null,
        preferred_language: data.preferred_language || null,
        communication_preference: data.communication_preference || null,
        marketing_consent: data.marketing_consent ?? false,

        // ❌ RETIRÉES - Colonnes inexistantes en BD :
        // phone, website, secondary_email,
        // address_line1, address_line2, postal_code, city, region,
        // siret, vat_number, legal_form,
        // industry_sector, supplier_segment, supplier_category,
        // payment_terms, delivery_time_days, minimum_order_amount, currency,
        // rating, certification_labels, preferred_supplier, notes
      }])
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    await fetchOrganisations()
    return newOrg
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    return null
  }
}
```

### Colonnes RETIRÉES (22) :
```
phone, website, secondary_email,
address_line1, address_line2, postal_code, city, region,
siret, vat_number, legal_form,
industry_sector, supplier_segment, supplier_category,
payment_terms, delivery_time_days, minimum_order_amount, currency,
rating, certification_labels, preferred_supplier, notes
```

### Colonnes CONSERVÉES (27) :
```
name, slug (AJOUTÉ), type, email, country, is_active,
billing_address_line1, billing_address_line2, billing_postal_code, billing_city, billing_region, billing_country,
shipping_address_line1, shipping_address_line2, shipping_postal_code, shipping_city, shipping_region, shipping_country,
has_different_shipping_address,
customer_type, prepayment_required,
first_name, mobile_phone, date_of_birth, nationality, preferred_language,
communication_preference, marketing_consent
```

---

## 🧪 VALIDATION RECOMMANDÉE

1. ✅ Appliquer le fix dans `src/hooks/use-organisations.ts`
2. Démarrer serveur dev : `npm run dev`
3. Naviguer `/organisation` (ou URL correcte)
4. Créer fournisseur test : "TEST - Fournisseur Nordic Fix"
5. Vérifier succès (toast + apparition dans liste)
6. Console error check : 0 erreur 400
7. Vérifier en BD que `slug` est bien généré

---

## 📝 COMMIT SUGGÉRÉ

```bash
git add src/hooks/use-organisations.ts
git commit -m "🐛 FIX: Erreur 400 création organisations (colonnes invalides + slug manquant)

- Retrait de 22 colonnes inexistantes en BD
- Ajout génération automatique du slug (REQUIS)
- Colonnes métier (siret, phone, etc.) non migrées de table suppliers
- Fix similaire au bug Sourcing Rapide (session précédente)

Colonnes retirées: phone, website, siret, vat_number, legal_form,
industry_sector, payment_terms, rating, notes, etc.

Colonnes conservées: 27 colonnes validées en BD"
```

---

## 🔄 PROCHAINES ÉTAPES (Long terme)

Si les colonnes métier (phone, siret, payment_terms, etc.) sont vraiment nécessaires :

1. **Créer migration BD** :
   ```sql
   -- Migration: 20251003_001_add_business_fields_to_organisations.sql
   ALTER TABLE organisations
   ADD COLUMN IF NOT EXISTS phone VARCHAR,
   ADD COLUMN IF NOT EXISTS website TEXT,
   ADD COLUMN IF NOT EXISTS siret VARCHAR(14),
   ADD COLUMN IF NOT EXISTS vat_number VARCHAR(20),
   ADD COLUMN IF NOT EXISTS legal_form VARCHAR,
   ADD COLUMN IF NOT EXISTS industry_sector VARCHAR,
   ADD COLUMN IF NOT EXISTS supplier_segment VARCHAR,
   ADD COLUMN IF NOT EXISTS supplier_category VARCHAR,
   ADD COLUMN IF NOT EXISTS payment_terms VARCHAR,
   ADD COLUMN IF NOT EXISTS delivery_time_days INTEGER,
   ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2),
   ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR',
   ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
   ADD COLUMN IF NOT EXISTS certification_labels TEXT[],
   ADD COLUMN IF NOT EXISTS preferred_supplier BOOLEAN DEFAULT FALSE,
   ADD COLUMN IF NOT EXISTS notes TEXT,
   ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
   ```

2. **Puis réactiver ces colonnes dans le hook**

3. **Migrer données de `suppliers` → `organisations`** si nécessaire

---

## 📊 RÉSUMÉ

**Cause racine** : Le hook `use-organisations.ts` envoie 49 colonnes dont 22 n'existent PAS dans le schéma BD actuel. Ces colonnes métier existent dans la table `suppliers` séparée mais n'ont jamais été migrées vers `organisations`.

**Solution immédiate** : Retirer toutes les colonnes inexistantes + ajouter génération du `slug` manquant.

**Impact** : Formulaire organisations fonctionnera avec les 27 colonnes validées uniquement. Les champs métier avancés (siret, phone, etc.) seront temporairement désactivés jusqu'à migration BD.

**Tests requis** : MCP Playwright Browser pour vérifier console 100% clean après fix.
