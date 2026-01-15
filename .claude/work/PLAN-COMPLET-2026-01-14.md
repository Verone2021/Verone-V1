# Plan Complet - Tâches Restantes (2026-01-14)

## ✅ Terminé

### BO-FORM-001 : Système formulaires de contact - COMPLET
- ✅ Phase 1 : Infrastructure DB (8 migrations)
- ✅ Phase 2 : API Routes (submit, confirmation, notification)
- ✅ Phase 3 : MVP LinkMe (ContactForm.tsx)
- ✅ Phase 4 : Back-Office UI (liste + détail)
- ✅ Phase 5 : Conversions (8 server actions)
- ✅ Phase 6 : Page paramètres notifications (cc9f6930)
- ✅ Fix : Mode dégradé sans email (4d8d64a6)
- ✅ Docs : Guide Resend (c1f00f4a)

**Commits** : 84b9216b, 0a18fcba, d9d4c604, 655cf546, a5be00fe, 4d8d64a6, c1f00f4a, cc9f6930

---

## 🔄 En cours (selon user)

### LM-ADDR-001 : Intégrer AddressAutocomplete partout
**Statut** : User dit "je suis en train de bosser dessus actuellement"

**Objectif** : Remplacer tous les inputs d'adresse manuels par le composant intelligent `AddressAutocomplete` qui utilise :
- **BAN** (Base Adresse Nationale) pour la France
- **Geoapify** pour l'international
- Géocodage automatique (latitude/longitude)

---

## 📋 Plan détaillé LM-ADDR-001 (17 tâches)

### Phase 1 : Configuration (2 tâches)
- [ ] **LM-ADDR-001-1** : Vérifier `NEXT_PUBLIC_GEOAPIFY_API_KEY` dans .env
- [ ] **LM-ADDR-001-2** : Vérifier que `AddressAutocomplete` existe dans `@verone/ui`

**Priorité** : CRITIQUE - Sans config, l'autocomplete international ne marche pas

---

### Phase 2 : CreateOrderModal (3 tâches) - PRIORITÉ HAUTE

**Fichier** : `apps/linkme/src/components/orders/CreateOrderModal.tsx`

**Problème actuel** :
- Inputs manuels basiques (rue, ville, CP, pays)
- Pas d'autocomplete, pas de géolocalisation
- Erreurs de frappe fréquentes

**Tâches** :
- [ ] **LM-ADDR-001-3** : Remplacer adresse livraison (Step 1)
  ```tsx
  // Avant
  <input name="delivery_street" ... />
  <input name="delivery_city" ... />

  // Après
  <AddressAutocomplete
    value={deliveryAddress}
    onChange={(addr) => setDeliveryAddress(addr)}
    countryFilter="FR"
  />
  ```

- [ ] **LM-ADDR-001-4** : Remplacer adresse facturation (Step 3)
  - Même pattern que livraison
  - Ajouter toggle "Identique à livraison"

- [ ] **LM-ADDR-001-5** : Adapter `use-create-order.ts`
  - Récupérer `latitude`, `longitude` depuis AddressAutocomplete
  - Passer au RPC

---

### Phase 3 : OrderFormUnified (3 tâches) - PRIORITÉ HAUTE

**Fichier** : `apps/linkme/src/app/(public)/s/[id]/OrderFormUnified.tsx`

**Contexte** : Formulaire public pour commandes depuis sélections

**Tâches** :
- [ ] **LM-ADDR-001-6** : Remplacer adresse restaurant (Step 1)
  - Utiliser AddressAutocomplete
  - Ajouter choix "France / Hors France"

- [ ] **LM-ADDR-001-7** : Remplacer adresse facturation (Step 3)
  - Même pattern

- [ ] **LM-ADDR-001-8** : Adapter `use-submit-unified-order.ts`
  - Gérer latitude/longitude
  - Mapper vers RPC `create_public_linkme_order`

---

### Phase 4 : Migrations DB (3 tâches) - SI NÉCESSAIRE

**Vérifications préalables** :
- [ ] **LM-ADDR-001-9** : Vérifier colonnes `organisations`
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'organisations'
    AND column_name IN ('latitude', 'longitude');
  ```
  - Si absentes → Créer migration

- [ ] **LM-ADDR-001-10** : Vérifier `sales_order_linkme_details`
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'sales_order_linkme_details'
    AND column_name IN ('restaurant_latitude', 'restaurant_longitude', 'billing_latitude', 'billing_longitude');
  ```

- [ ] **LM-ADDR-001-11** : Adapter RPC `create_public_linkme_order`
  - Ajouter paramètres géoloc si migrations faites
  - Stocker latitude/longitude

---

### Phase 5 : Autres formulaires (2 tâches) - PRIORITÉ MOYENNE

- [ ] **LM-ADDR-001-12** : Auditer `CustomerFormModal.tsx` (@verone/customers)
  - Vérifier si adresses présentes
  - Remplacer par AddressAutocomplete si besoin

- [ ] **LM-ADDR-001-13** : Auditer `EnseigneStepper.tsx`
  - Vérifier si encore utilisé
  - Migrer si actif

---

### Phase 6 : Tests (4 tâches) - VALIDATION

- [ ] **LM-ADDR-001-14** : Tester CreateOrderModal
  - Autocomplete France (BAN)
  - Autocomplete International (Geoapify)
  - Latitude/longitude enregistrée

- [ ] **LM-ADDR-001-15** : Tester OrderFormUnified (public)
  - Choix France/Hors France
  - Soumission valide

- [ ] **LM-ADDR-001-16** : Tester affichage carte
  - Organisations avec géoloc s'affichent bien
  - Coordonnées correctes

- [ ] **LM-ADDR-001-17** : Vérifier console (0 erreurs)
  - Pas de warnings Geoapify
  - Pas d'erreurs API

---

## 📋 Plan détaillé LM-ORD-005 : Audit flux commandes

**Contexte** : Comprendre le flux complet de création de commande publique LinkMe

**Problème identifié** :
- ❌ Pas de création automatique de contacts pour les restaurants
- ❌ Données de facturation custom non stockées (si différent du propriétaire)
- ❌ Pas de table `organisation_contacts` (ou mal documentée)

**Tâches** :

### Investigation DB
- [ ] **LM-ORD-005-1** : Vérifier si `organisation_contacts` existe
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_name = 'organisation_contacts';
  ```

- [ ] **LM-ORD-005-2** : Documenter structure exacte
  - Colonnes : id, organisation_id, first_name, last_name, email, phone, role, etc.
  - Contraintes : UNIQUE, FK, etc.
  - Identifier si contacts gérés autrement

### Solution technique

- [ ] **LM-ORD-005-3** : Choix architecture contacts

  **Option A** : Enrichir `sales_order_linkme_details`
  ```sql
  ALTER TABLE sales_order_linkme_details
  ADD COLUMN billing_contact_name TEXT,
  ADD COLUMN billing_contact_email TEXT,
  ADD COLUMN billing_contact_phone TEXT;
  ```
  - ✅ Simple, pas de trigger
  - ❌ Pas de centralisation contacts

  **Option B** : Créer trigger auto-création contacts
  ```sql
  CREATE FUNCTION auto_create_contacts_from_order()
  -- Logic: Si email n'existe pas dans organisation_contacts → INSERT
  ```
  - ✅ Centralisation CRM
  - ✅ Évite doublons
  - ❌ Plus complexe

- [ ] **LM-ORD-005-4** : Implémenter solution choisie

- [ ] **LM-ORD-005-5** : Tester avec commande test

---

## 🎯 Priorités recommandées

### Urgent (cette semaine)
1. **LM-ADDR-001 Phases 1-3** (config + 2 formulaires principaux)
   - Impact : UX commandes beaucoup meilleure
   - Risque : Erreurs d'adresse actuelles

### Important (semaine prochaine)
2. **LM-ADDR-001 Phase 4** (migrations DB si nécessaire)
3. **LM-ORD-005** (audit contacts)

### Moyen terme
4. **LM-ADDR-001 Phases 5-6** (autres formulaires + tests)

---

## 📊 Statistiques

| Catégorie | Total | Fait | Reste |
|-----------|-------|------|-------|
| BO-FORM-001 | 6 phases | 6 ✅ | 0 |
| LM-ADDR-001 | 17 tâches | 0 | 17 ⏳ |
| LM-ORD-005 | 5 tâches | 0 | 5 📋 |
| **TOTAL** | **28 tâches** | **6** | **22** |

---

## 🚀 Prochaines actions recommandées

### Si vous voulez que je commence LM-ADDR-001 :

**Étape 1** : Vérifier config
```bash
# Vous : Donnez-moi accès à vos .env.local
grep GEOAPIFY apps/linkme/.env.local
grep GEOAPIFY apps/back-office/.env.local
```

**Étape 2** : Je commence Phase 1 (vérifications)
- Check Geoapify API key
- Vérifier AddressAutocomplete dans @verone/ui
- Documenter l'API actuelle du composant

**Étape 3** : Je continue Phase 2 (CreateOrderModal)
- Remplacer inputs adresse
- Tests

### Si vous préférez LM-ORD-005 d'abord :

**Étape 1** : Investigation DB
```bash
# Je lance une requête Supabase pour vérifier organisation_contacts
```

**Étape 2** : Analyse du flux actuel
- Tracer le code de soumission
- Identifier où les contacts devraient être créés

**Étape 3** : Proposition d'architecture

---

## ❓ Questions avant de continuer

1. **LM-ADDR-001** : Vous dites "je suis en train de bosser dessus"
   - Qu'avez-vous déjà fait ?
   - Sur quelle phase êtes-vous ?
   - Voulez-vous que je prenne le relais ou que je continue où vous en êtes ?

2. **Priorité** : Que voulez-vous que je fasse EN PREMIER ?
   - Option A : Continuer LM-ADDR-001 (si vous bloquez quelque part)
   - Option B : Commencer LM-ORD-005 (audit contacts)
   - Option C : Autre chose ?

3. **Configuration Geoapify** :
   - Avez-vous déjà une clé API Geoapify ?
   - Sinon, voulez-vous que je vous guide pour la créer ?

---

**Prêt à continuer quand vous voulez ! 🚀**
