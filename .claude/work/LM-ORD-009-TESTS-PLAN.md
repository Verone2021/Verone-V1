# LM-ORD-009 - Plan de Tests Phase 9

**Date** : 2026-01-15
**Branche** : fix/multi-bugs-2026-01
**Objectif** : Tester le workflow OrderFormUnified à 6 étapes

---

## 🎯 Objectifs des tests

1. **Fonctionnalité** : Vérifier que le workflow 6 étapes fonctionne correctement
2. **Validation** : Vérifier que les validations empêchent les soumissions invalides
3. **Base de données** : Vérifier que les colonnes `delivery_*` sont correctement remplies
4. **RPC** : Vérifier que les 8 paramètres sont correctement envoyés
5. **UI/UX** : Vérifier que la navigation entre étapes est fluide

---

## ✅ Tests unitaires (Type-check + Build)

### Test 1 : Type-check
```bash
pnpm -w type-check --filter ./apps/linkme
```
**Résultat attendu** : ✅ 0 erreurs TypeScript

### Test 2 : Build
```bash
pnpm -w build --filter ./apps/linkme
```
**Résultat attendu** : ✅ Build succeeded

**Statut** : ✅ PASSÉ (vérifié durant Phase 7-8)

---

## 🧪 Tests E2E Playwright

### Prérequis

1. **Lancer le dev server** (terminal séparé) :
```bash
pnpm dev:linkme
```

2. **Lancer les tests E2E** :
```bash
pnpm test:e2e --filter ./apps/linkme
```

3. **Mode UI (debug)** :
```bash
pnpm playwright test --ui
```

---

## 📋 Scénarios de tests

### Test 3 : Restaurant existant + Contact existant

**Fichier** : `apps/linkme/e2e/order-form-unified.spec.ts`

**Scénario** :
1. Ouvrir la sélection publique
2. Ajouter des produits au panier
3. Cliquer sur "Valider la commande"
4. **Step 1 - Demandeur** : Remplir nom, email, téléphone
5. **Step 2 - Restaurant** : Sélectionner "Restaurant existant" → choisir dans la liste
6. **Step 3 - Responsable** : Sélectionner un contact existant
7. **Step 4 - Facturation** : Choisir "Même que le responsable"
8. **Step 5 - Livraison** :
   - Cocher "Contact = responsable"
   - Remplir adresse de livraison
   - Choisir date
   - Semi-remorque = Oui
9. **Step 6 - Validation** : Vérifier récap + cliquer "Valider"
10. Accepter les conditions
11. Soumettre la commande

**Vérifications** :
- ✅ Modal de confirmation affiche les 5 sections correctement
- ✅ RPC `create_public_linkme_order` appelé avec 8 paramètres
- ✅ Toast de succès affiché
- ✅ Redirection vers page de confirmation
- ✅ Commande créée en DB avec `pending_admin_validation = true`

**SQL Check** :
```sql
SELECT
  id, order_number,
  requester_name, requester_email,
  delivery_contact_name, delivery_address, delivery_date,
  is_mall_delivery, semi_trailer_accessible
FROM sales_order_linkme_details
WHERE order_number = '[ORDER_NUMBER]';
```

---

### Test 4 : Restaurant existant + Nouveau contact

**Scénario** :
1-4. Identique au Test 3
5. **Step 3 - Responsable** :
   - Cliquer sur "Ajouter un nouveau contact"
   - Remplir nom, email, téléphone
6-11. Identique au Test 3

**Vérifications** :
- ✅ Nouveau contact créé dans `organisation_contacts`
- ✅ `owner_contact_id` pointe vers le nouveau contact
- ✅ `is_primary_contact = false` (sauf si premier contact)

**SQL Check** :
```sql
SELECT id, first_name, last_name, email, phone, is_primary_contact
FROM organisation_contacts
WHERE organisation_id = '[ORG_ID]'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 5 : Nouveau restaurant propre + Org mère facturation

**Scénario** :
1-4. Identique au Test 3
5. **Step 2 - Restaurant** :
   - Choisir "Nouveau restaurant"
   - Remplir nom commercial, adresse, ville
   - Choisir "Restaurant propre" (ownership_type = 'succursale')
6. **Step 3 - Responsable** :
   - Remplir nom, email, téléphone du responsable
7. **Step 4 - Facturation** :
   - ✅ Checkbox "Utiliser l'organisation mère de l'enseigne" VISIBLE
   - Cocher la checkbox
   - Vérifier que les détails de l'org mère s'affichent
8-11. Identique au Test 3

**Vérifications** :
- ✅ Nouvelle organisation créée avec `ownership_type = 'succursale'`
- ✅ `p_billing.use_parent = true` envoyé au RPC
- ✅ Adresse de facturation = adresse org mère (vérifier en DB)
- ✅ `billing_contact_id` pointe vers contact de l'org mère

**SQL Check** :
```sql
-- Vérifier la nouvelle organisation
SELECT id, legal_name, trade_name, city, is_enseigne_parent
FROM organisations
WHERE trade_name = '[NOM_SAISI]';

-- Vérifier que l'adresse de facturation = org mère
SELECT
  o.trade_name,
  sod.billing_address,
  parent.address_line1 as parent_address
FROM sales_order_linkme_details sod
JOIN organisations o ON o.id = sod.organisation_id
JOIN organisations parent ON parent.id = (
  SELECT id FROM organisations
  WHERE enseigne_id = o.enseigne_id AND is_enseigne_parent = TRUE
)
WHERE sod.order_number = '[ORDER_NUMBER]';
```

---

### Test 6 : Nouveau restaurant propre + Facturation custom

**Scénario** :
1-6. Identique au Test 5
7. **Step 4 - Facturation** :
   - Ne PAS cocher "Utiliser l'organisation mère"
   - Choisir "Autre contact"
   - Remplir nom, email du contact facturation
   - Remplir adresse de facturation (différente du restaurant)
8-11. Identique au Test 3

**Vérifications** :
- ✅ `p_billing.use_parent = false`
- ✅ `p_billing.contact_source = 'custom'`
- ✅ Adresse de facturation différente de l'adresse du restaurant
- ✅ Contact facturation créé dans `organisation_contacts` avec flag `is_billing_contact = true`

---

### Test 7 : Nouveau restaurant franchise + Société

**Scénario** :
1-5. Identique au Test 5
5. **Step 2 - Restaurant** :
   - Choisir "Nouveau restaurant"
   - Remplir nom commercial, adresse
   - Choisir "Franchise" (ownership_type = 'franchise')
6. **Step 3 - Responsable** :
   - Remplir nom, email, téléphone
   - ✅ Section "Informations de la société" VISIBLE
   - Remplir raison sociale (ex: "SARL Restaurant Martin")
   - Remplir SIRET (14 chiffres)
   - (Optionnel) Upload K-BIS
7-11. Identique au Test 3

**Vérifications** :
- ✅ `ownership_type = 'franchise'` dans `organisations`
- ✅ `legal_name = raison sociale saisie` (pas trade_name)
- ✅ Champs société remplis dans `organisation_contacts` ou `sales_order_linkme_details`
- ✅ SIRET validé (14 chiffres exactement)

**SQL Check** :
```sql
SELECT
  o.trade_name, o.legal_name, o.ownership_type,
  sod.owner_company_legal_name, sod.owner_siret
FROM organisations o
JOIN sales_order_linkme_details sod ON sod.organisation_id = o.id
WHERE sod.order_number = '[ORDER_NUMBER]';
```

---

### Test 8 : Livraison centre commercial + Upload formulaire

**Scénario** :
1-7. Identique au Test 3
8. **Step 5 - Livraison** :
   - Remplir contact, adresse, date
   - Choisir "Livraison dans un centre commercial" = **Oui**
   - ✅ Section centre commercial VISIBLE
   - Remplir email du centre commercial
   - Choisir "Formulaire d'accès requis" = **Oui**
   - ✅ Input file VISIBLE
   - Upload un fichier PDF (formulaire d'accès)
   - ✅ Message "Fichier uploadé avec succès" affiché
   - Choisir "Semi-remorque accessible" = **Non**
   - Remplir notes livraison (optionnel)
9-11. Identique au Test 3

**Vérifications** :
- ✅ `is_mall_delivery = true`
- ✅ `mall_email` rempli
- ✅ `access_form_required = true`
- ✅ `access_form_url` contient URL Supabase Storage
- ✅ Fichier présent dans bucket `linkme-delivery-forms`
- ✅ `semi_trailer_accessible = false`
- ✅ `delivery_notes` rempli

**SQL Check** :
```sql
SELECT
  delivery_address, delivery_date,
  is_mall_delivery, mall_email,
  access_form_required, access_form_url,
  semi_trailer_accessible, delivery_notes
FROM sales_order_linkme_details
WHERE order_number = '[ORDER_NUMBER]';
```

**Supabase Storage Check** :
```sql
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'linkme-delivery-forms'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 9 : Vérifier colonnes `delivery_*` en DB

**SQL Check complet** :
```sql
-- Vérifier que TOUTES les colonnes delivery sont présentes
SELECT
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_order_linkme_details'
  AND column_name LIKE 'delivery_%'
ORDER BY column_name;
```

**Colonnes attendues** (14 colonnes) :
- `delivery_contact_name` (TEXT)
- `delivery_contact_email` (TEXT)
- `delivery_contact_phone` (TEXT)
- `delivery_address` (TEXT)
- `delivery_postal_code` (TEXT)
- `delivery_city` (TEXT)
- `delivery_latitude` (NUMERIC)
- `delivery_longitude` (NUMERIC)
- `delivery_date` (DATE)
- `is_mall_delivery` (BOOLEAN)
- `mall_email` (TEXT)
- `access_form_required` (BOOLEAN)
- `access_form_url` (TEXT)
- `semi_trailer_accessible` (BOOLEAN)
- `delivery_notes` (TEXT)

---

### Test 10 : Console Zero (0 erreurs)

**Procédure** :
1. Ouvrir DevTools (F12)
2. Onglet Console
3. Vider la console (Clear)
4. Exécuter un workflow complet (Test 3)
5. Vérifier la console

**Accepté (pas bloquant)** :
- `console.log`, `console.warn`
- Deprecation warnings de librairies tierces

**INTERDIT (bloquant)** :
- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**Résultat attendu** : ✅ 0 erreur bloquante

---

## 📊 Résumé des tests

| Test | Type | Durée estimée | Priorité |
|------|------|---------------|----------|
| 1. Type-check | Unit | 5s | P0 |
| 2. Build | Unit | 1m20s | P0 |
| 3. Restaurant existant + Contact existant | E2E | 2-3 min | P0 |
| 4. Restaurant existant + Nouveau contact | E2E | 2-3 min | P1 |
| 5. Nouveau restaurant propre + Org mère | E2E | 3-4 min | P0 |
| 6. Nouveau restaurant propre + Facturation custom | E2E | 3-4 min | P1 |
| 7. Nouveau restaurant franchise + Société | E2E | 3-4 min | P0 |
| 8. Livraison centre commercial + Upload | E2E | 4-5 min | P1 |
| 9. Vérifier colonnes delivery_* | SQL | 30s | P0 |
| 10. Console Zero | Manual | 3 min | P0 |

**Durée totale estimée** : ~30-40 minutes

---

## 🚀 Commandes de test

### Lancer tous les tests E2E
```bash
# Terminal 1 : Dev server
pnpm dev:linkme

# Terminal 2 : Tests E2E
pnpm test:e2e --filter ./apps/linkme
```

### Lancer un test spécifique
```bash
pnpm playwright test order-form-unified --grep "Test 3"
```

### Mode debug (UI)
```bash
pnpm playwright test --ui
```

### Vérifier les colonnes DB
```bash
source .mcp.env
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_order_linkme_details' AND column_name LIKE 'delivery_%';"
```

---

## ✅ Critères de succès

**Phase 9 réussie SI** :
- ✅ Type-check : 0 erreurs
- ✅ Build : succeeded
- ✅ Tests E2E P0 : 100% passés (Tests 3, 5, 7, 9, 10)
- ✅ Tests E2E P1 : ≥80% passés (Tests 4, 6, 8)
- ✅ 14 colonnes `delivery_*` présentes en DB
- ✅ Console Zero : 0 erreur bloquante
- ✅ RPC 8 paramètres correctement envoyés

---

## 📝 Notes

- **Données de test** : Utiliser l'enseigne Pokawa (ID connu en DB)
- **Supabase** : Connexion via `.mcp.env` (DATABASE_URL)
- **Playwright** : Headless mode pour CI/CD, headed mode pour debug
- **Screenshots** : Playwright prend automatiquement des screenshots en cas d'échec

---

**Auteur** : Claude Sonnet 4.5
**Date** : 2026-01-15
**Version** : 1.0
