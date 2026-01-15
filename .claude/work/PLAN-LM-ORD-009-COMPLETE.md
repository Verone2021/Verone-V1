# Plan LM-ORD-009 — Refonte Complète Workflow OrderFormUnified

**Date**: 2026-01-15
**Statut**: 🔵 À Implémenter
**Remplace**: LM-ORD-008 (étape 4 livraison seule)
**Objectif**: Refonte complète du workflow pour unifier restaurant existant/nouveau en 6 étapes

---

## 📋 Contexte & Objectifs

### Problèmes Actuels

1. **Workflow incomplet** : Restaurant existant → validation directe (pas de contact responsable)
2. **Ownership type mal placé** : Demandé à l'étape 3 au lieu de l'étape 2
3. **Pas de gestion contacts existants** : Impossibilité de sélectionner un contact déjà en base
4. **Facturation non flexible** : Pas d'option organisation mère pour restaurants propres
5. **UI/UX rudimentaire** : Dropdown basique pour sélection restaurant (pas de recherche, pas de fiche complète)
6. **Désalignement** : Workflow différent entre sélection publique et page /commandes
7. **Terminologie incorrecte** : Utilise "propriétaire" au lieu de "responsable"

### Objectifs

✅ Workflow unifié en **6 étapes** pour restaurant existant ET nouveau
✅ Terminologie correcte : **toujours "responsable"**, jamais "propriétaire"
✅ Sélection de **contacts existants** depuis la table `contacts`
✅ **Organisation mère** automatique pour facturation (restaurants propres)
✅ **UI/UX améliorée** : recherche + cartes visuelles pour sélection restaurant
✅ **Alignement** avec page /commandes (étape 1 auto-remplie)
✅ **Ownership type** déplacé à l'étape 2 (restaurant)

---

## 🔄 Workflow Complet — 6 Étapes

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SÉLECTION PUBLIQUE POKAWA                        │
│                  http://localhost:3002/s/[slug]                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Ajouter produits       │
                    │   au panier              │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  Cliquer "Commander"     │
                    └──────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────┐
              │  Ouverture de restaurant ?          │
              │  ○ Oui (Nouveau)  ○ Non (Existant)  │
              └─────────────────────────────────────┘
                     │                        │
            ┌────────┴────────┐      ┌────────┴────────┐
            │ NOUVEAU         │      │ EXISTANT        │
            │ RESTAURANT      │      │ RESTAURANT      │
            └─────────────────┘      └─────────────────┘
                     │                        │
                     ▼                        ▼
     ┌───────────────────────────────────────────────────────┐
     │              ÉTAPE 1 : DEMANDEUR                      │
     │  Personne qui passe la commande                       │
     │  - Nom complet *                                      │
     │  - Email *                                            │
     │  - Téléphone *                                        │
     │  - Rôle/Fonction                                      │
     │  - Notes (ex: "Architecte pour le projet...")         │
     └───────────────────────────────────────────────────────┘
                     │                        │
                     ▼                        ▼
     ┌───────────────────────────┐  ┌───────────────────────────┐
     │  ÉTAPE 2 : RESTAURANT     │  │  ÉTAPE 2 : RESTAURANT     │
     │  (NOUVEAU)                │  │  (EXISTANT)               │
     │                           │  │                           │
     │  1. Type de restaurant *  │  │  - Recherche par nom      │
     │     ○ Propre              │  │  - Cartes visuelles       │
     │     ○ Franchisé           │  │  - Fiche complète         │
     │                           │  │  - Sélection visuelle     │
     │  2. Nom commercial *      │  │                           │
     │                           │  └───────────────────────────┘
     │  3. Adresse *             │                  │
     │     (autocomplete)        │                  │
     │                           │                  ▼
     │  4. Contact responsable   │       ┌──────────────────────┐
     │     (optionnel)           │       │ Contacts existants ? │
     │     - Nom/Prénom          │       └──────────────────────┘
     │     (crée contact auto)   │              │
     └───────────────────────────┘              ▼
                     │                  ┌───────┴────────┐
                     │                  │ Oui            │ Non
                     ▼                  ▼                ▼
     ┌───────────────────────────────────────────────────────┐
     │              ÉTAPE 3 : RESPONSABLE                    │
     │                                                       │
     │  ┌─────────────────────────────────────────────────┐ │
     │  │ Si contacts existants :                         │ │
     │  │ - Afficher liste contacts (radio buttons)       │ │
     │  │ - Option "+ Nouveau contact"                    │ │
     │  │                                                  │ │
     │  │ Si pas de contacts :                            │ │
     │  │ - Formulaire nouveau contact direct             │ │
     │  └─────────────────────────────────────────────────┘ │
     │                                                       │
     │  Champs contact :                                     │
     │  - Nom complet *                                      │
     │  - Email *                                            │
     │  - Téléphone *                                        │
     │                                                       │
     │  ┌─────────────────────────────────────────────────┐ │
     │  │ Si FRANCHISÉ uniquement :                       │ │
     │  │ Informations société :                          │ │
     │  │ - Raison sociale *                              │ │
     │  │ - Nom commercial                                │ │
     │  │ - SIRET *                                       │ │
     │  │ - KBis (PDF optionnel)                          │ │
     │  └─────────────────────────────────────────────────┘ │
     └───────────────────────────────────────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────────────────────────┐
     │              ÉTAPE 4 : FACTURATION                    │
     │                                                       │
     │  ┌─────────────────────────────────────────────────┐ │
     │  │ Si PROPRE uniquement :                          │ │
     │  │                                                  │ │
     │  │ ☐ Utiliser l'organisation mère de l'enseigne    │ │
     │  │   → Pokawa Siège - Paris                        │ │
     │  │   (pré-cochée par défaut)                       │ │
     │  │                                                  │ │
     │  │ Si cochée : passe étape suivante                │ │
     │  │ Si décochée : formulaire ci-dessous             │ │
     │  └─────────────────────────────────────────────────┘ │
     │                                                       │
     │  Contact facturation :                                │
     │  ○ Même que le responsable                            │
     │  ○ Autre contact                                      │
     │                                                       │
     │  Si "Autre contact" :                                 │
     │  - Nom complet *                                      │
     │  - Email *                                            │
     │  - Téléphone (optionnel)                              │
     │                                                       │
     │  Adresse facturation :                                │
     │  - Raison sociale *                                   │
     │  - Adresse complète * (autocomplete)                  │
     │  - SIRET *                                            │
     └───────────────────────────────────────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────────────────────────┐
     │              ÉTAPE 5 : LIVRAISON                      │
     │                                                       │
     │  Contact livraison :                                  │
     │  ☐ Le contact de livraison est le responsable        │
     │                                                       │
     │  Si coché :                                           │
     │  - Reprend données responsable (étape 3)              │
     │  - Met à jour rôle contact en base                    │
     │                                                       │
     │  Si décoché :                                         │
     │  - Nom complet *                                      │
     │  - Email *                                            │
     │  - Téléphone *                                        │
     │                                                       │
     │  Adresse livraison * (autocomplete)                   │
     │  Date de livraison souhaitée *                        │
     │                                                       │
     │  Livraison dans un centre commercial ?                │
     │  ○ Oui  ○ Non                                         │
     │                                                       │
     │  Si Oui :                                             │
     │  - Email centre commercial *                          │
     │  - Formulaire d'accès requis ?                        │
     │    ○ Oui  ○ Non                                       │
     │  - Si Oui : Upload PDF/Image                          │
     │                                                       │
     │  Accessible semi-remorque ?                           │
     │  ○ Oui (défaut)  ○ Non                                │
     │                                                       │
     │  Notes livraison (optionnel)                          │
     └───────────────────────────────────────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────────────────────────┐
     │              ÉTAPE 6 : VALIDATION                     │
     │                                                       │
     │  Récapitulatif complet :                              │
     │  ──────────────────────────────────────               │
     │  1. Demandeur                                         │
     │     Jean Dupont - jean.dupont@pokawa.fr               │
     │     Directeur régional                                │
     │                                                       │
     │  2. Restaurant                                        │
     │     Pokawa Paris Rivoli (Propre)                      │
     │     123 Rue de Rivoli, 75001 Paris                    │
     │                                                       │
     │  3. Responsable                                       │
     │     Sophie Martin - sophie.martin@restaurant.fr       │
     │     06 12 34 56 78                                    │
     │                                                       │
     │  4. Facturation                                       │
     │     Pokawa Siège - Paris                              │
     │     (OU adresse custom si non cochée)                 │
     │                                                       │
     │  5. Livraison                                         │
     │     Contact : Sophie Martin (responsable)             │
     │     Adresse : [même que restaurant]                   │
     │     Date : 2026-02-15                                 │
     │     Centre commercial : Non                           │
     │     Semi-remorque : Oui                               │
     │                                                       │
     │  6. Panier (3 produits - 279,74 € TTC)                │
     │     - Plateau bois 20x30 cm × 1                       │
     │     - Coussin beige × 1                               │
     │     - Suspension raphia 5 × 1                         │
     │                                                       │
     │  ☐ J'accepte les modalités de commande               │
     │                                                       │
     │  [Retour] [Valider le panier]                         │
     └───────────────────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │ Modal            │
              │ Confirmation     │
              │                  │
              │ ☐ Je confirme    │
              │                  │
              │ [Confirmer]      │
              └──────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │ RPC              │
              │ create_public_   │
              │ linkme_order     │
              │                  │
              │ 8 paramètres     │
              └──────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │ ✅ Commande      │
              │    créée         │
              │                  │
              │ - Toast succès   │
              │ - Panier vidé    │
              │ - Redirection    │
              └──────────────────┘
```

---

## 📐 Règles Globales

### Terminologie

**❌ INTERDIT** : "Propriétaire", "Owner"
**✅ OBLIGATOIRE** : "Responsable", "Manager"

Chaque restaurant peut avoir **plusieurs responsables** (propre ou franchisé).

### Contacts

**Toujours requis** :
- ✅ Email (tous les contacts)
- ✅ Téléphone (sauf contact facturation)

**Optionnel** :
- Téléphone pour contact facturation uniquement

### Alignement avec Page /commandes

**Page /commandes** (`apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`) :
- Étape 1 (Demandeur) est **auto-remplie** depuis le profil utilisateur connecté
- Le reste du workflow doit être **identique** à la sélection publique

**Sélection publique** (`/s/[slug]`) :
- Étape 1 (Demandeur) est un **formulaire manuel**
- Étapes 2-6 identiques à la page /commandes

---

## 🗄️ Modifications Base de Données

### Migration 1 : Organisation Mère de l'Enseigne

**Fichier** : `supabase/migrations/20260115_001_add_parent_organisation_enseignes.sql`

```sql
-- Ajouter colonne parent_organisation_id sur enseignes
ALTER TABLE enseignes
ADD COLUMN parent_organisation_id UUID REFERENCES organisations(id);

COMMENT ON COLUMN enseignes.parent_organisation_id IS
  'Organisation mère du groupe (ex: Pokawa Siège pour facturation par défaut)';

-- Index pour performance
CREATE INDEX idx_enseignes_parent_organisation
ON enseignes(parent_organisation_id)
WHERE parent_organisation_id IS NOT NULL;

-- Exemple : Définir Pokawa Siège comme organisation mère
-- À exécuter manuellement après création migration
/*
UPDATE enseignes
SET parent_organisation_id = (
  SELECT id
  FROM organisations
  WHERE legal_name ILIKE '%Pokawa%Siège%'
    OR legal_name ILIKE '%Pokawa%France%'
    AND city = 'Paris'
  LIMIT 1
)
WHERE name = 'Pokawa';
*/
```

### Migration 2 : Champs Livraison

**Fichier** : `supabase/migrations/20260115_002_add_delivery_fields_linkme.sql`

```sql
-- Ajouter colonnes livraison à sales_order_linkme_details
ALTER TABLE sales_order_linkme_details
ADD COLUMN delivery_contact_name TEXT,
ADD COLUMN delivery_contact_email TEXT,
ADD COLUMN delivery_contact_phone TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_postal_code TEXT,
ADD COLUMN delivery_city TEXT,
ADD COLUMN delivery_latitude NUMERIC(10,8),
ADD COLUMN delivery_longitude NUMERIC(11,8),
ADD COLUMN delivery_date DATE,
ADD COLUMN is_mall_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN mall_email TEXT,
ADD COLUMN access_form_required BOOLEAN DEFAULT FALSE,
ADD COLUMN access_form_url TEXT,
ADD COLUMN semi_trailer_accessible BOOLEAN DEFAULT TRUE,
ADD COLUMN delivery_notes TEXT;

-- Commentaires
COMMENT ON COLUMN sales_order_linkme_details.delivery_contact_name IS
  'Nom complet du contact livraison (peut être = responsable)';
COMMENT ON COLUMN sales_order_linkme_details.is_mall_delivery IS
  'Livraison dans un centre commercial';
COMMENT ON COLUMN sales_order_linkme_details.access_form_url IS
  'URL Supabase Storage du formulaire d''accès (si centre commercial)';
COMMENT ON COLUMN sales_order_linkme_details.semi_trailer_accessible IS
  'Accessible par semi-remorque (TRUE par défaut)';

-- Bucket Supabase Storage pour formulaires d'accès
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'linkme-delivery-forms',
  'linkme-delivery-forms',
  TRUE,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'linkme-delivery-forms');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'linkme-delivery-forms' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'linkme-delivery-forms' AND auth.role() = 'authenticated');
```

### Migration 3 : Modifier RPC create_public_linkme_order

**Fichier** : `supabase/migrations/20260115_003_update_rpc_linkme_order.sql`

```sql
CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,
  p_requester JSONB,          -- {name, email, phone, position, notes}
  p_organisation JSONB,        -- {existing_id} OU {is_new, trade_name, address, ..., ownership_type}
  p_responsable JSONB,         -- {contact_id} OU {is_new, name, email, phone, company_legal_name?, siret?}
  p_billing JSONB,             -- {use_parent, contact_source, ...}
  p_delivery JSONB             -- {contact_name, address, delivery_date, is_mall_delivery, ...}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_responsable_contact_id UUID;
  v_billing_contact_id UUID;
  v_parent_org_id UUID;
  v_order_number TEXT;
  v_ownership_type organisation_ownership_type;
BEGIN
  -- ========================================
  -- 1. VALIDATIONS
  -- ========================================
  IF (p_requester->>'name') IS NULL OR (p_requester->>'email') IS NULL THEN
    RAISE EXCEPTION 'Demandeur requis (name, email)';
  END IF;

  IF (p_organisation->>'existing_id') IS NULL AND (p_organisation->>'trade_name') IS NULL THEN
    RAISE EXCEPTION 'Organisation requise (existing_id ou trade_name)';
  END IF;

  -- ========================================
  -- 2. ORGANISATION
  -- ========================================
  IF (p_organisation->>'existing_id') IS NOT NULL THEN
    -- Restaurant existant
    v_customer_id := (p_organisation->>'existing_id')::UUID;

    -- Récupérer ownership_type de l'organisation existante
    SELECT ownership_type INTO v_ownership_type
    FROM organisations
    WHERE id = v_customer_id;

  ELSE
    -- Nouveau restaurant
    v_ownership_type := (p_organisation->>'ownership_type')::organisation_ownership_type;

    INSERT INTO organisations (
      trade_name,
      legal_name,
      address_line1,
      postal_code,
      city,
      latitude,
      longitude,
      email,
      enseigne_id,
      type,
      ownership_type,
      approval_status,
      created_at
    ) VALUES (
      p_organisation->>'trade_name',
      COALESCE(p_organisation->>'legal_name', p_organisation->>'trade_name'),
      p_organisation->>'address',
      p_organisation->>'postal_code',
      p_organisation->>'city',
      (p_organisation->>'latitude')::NUMERIC,
      (p_organisation->>'longitude')::NUMERIC,
      p_requester->>'email',
      (SELECT enseigne_id FROM linkme_affiliates WHERE id = p_affiliate_id),
      'customer',
      v_ownership_type,
      'pending_validation',
      NOW()
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- ========================================
  -- 3. CONTACT RESPONSABLE
  -- ========================================
  IF (p_responsable->>'contact_id') IS NOT NULL THEN
    -- Utiliser contact existant
    v_responsable_contact_id := (p_responsable->>'contact_id')::UUID;

  ELSIF (p_responsable->>'is_new')::BOOLEAN = TRUE OR (p_organisation->>'is_new')::BOOLEAN = TRUE THEN
    -- Créer nouveau contact
    INSERT INTO contacts (
      organisation_id,
      first_name,
      last_name,
      email,
      phone,
      is_primary_contact,
      is_active,
      created_at
    ) VALUES (
      v_customer_id,
      SPLIT_PART(p_responsable->>'name', ' ', 1),
      SPLIT_PART(p_responsable->>'name', ' ', 2),
      p_responsable->>'email',
      p_responsable->>'phone',
      TRUE,
      TRUE,
      NOW()
    )
    RETURNING id INTO v_responsable_contact_id;
  END IF;

  -- ========================================
  -- 4. FACTURATION
  -- ========================================
  IF (p_billing->>'use_parent')::BOOLEAN = TRUE THEN
    -- Récupérer organisation mère de l'enseigne
    SELECT parent_organisation_id INTO v_parent_org_id
    FROM enseignes
    WHERE id = (SELECT enseigne_id FROM linkme_affiliates WHERE id = p_affiliate_id);

    -- Si pas d'org mère définie, lever exception
    IF v_parent_org_id IS NULL THEN
      RAISE EXCEPTION 'Organisation mère non définie pour cette enseigne';
    END IF;

    -- Note : L'adresse de facturation sera celle de l'org mère
    -- Le contact facturation sera créé ou récupéré depuis l'org mère

  ELSE
    -- Contact facturation custom
    IF (p_billing->>'contact_source') = 'custom' THEN
      INSERT INTO contacts (
        organisation_id,
        first_name,
        last_name,
        email,
        phone,
        is_billing_contact,
        is_active,
        created_at
      ) VALUES (
        v_customer_id,
        SPLIT_PART(p_billing->>'name', ' ', 1),
        SPLIT_PART(p_billing->>'name', ' ', 2),
        p_billing->>'email',
        p_billing->>'phone', -- Peut être NULL (optionnel)
        TRUE,
        TRUE,
        NOW()
      )
      RETURNING id INTO v_billing_contact_id;

    ELSIF (p_billing->>'contact_source') = 'responsable' THEN
      -- Utiliser le même contact que le responsable
      v_billing_contact_id := v_responsable_contact_id;
    END IF;
  END IF;

  -- ========================================
  -- 5. CRÉER COMMANDE
  -- ========================================
  v_order_number := 'LNK-' || UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    channel_id,
    status,
    currency,
    expected_delivery_date,
    linkme_selection_id,
    pending_admin_validation,
    created_by,
    created_at
  ) VALUES (
    v_order_number,
    v_customer_id,
    'organization',
    (SELECT id FROM sales_channels WHERE code = 'linkme'),
    'draft',
    'EUR',
    (p_delivery->>'delivery_date')::DATE,
    p_selection_id,
    TRUE,
    NULL, -- Commande publique = pas de created_by
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- ========================================
  -- 6. DÉTAILS LINKME
  -- ========================================
  INSERT INTO sales_order_linkme_details (
    sales_order_id,
    -- Demandeur
    requester_type,
    requester_name,
    requester_email,
    requester_phone,
    requester_position,
    -- Responsable
    owner_type,
    owner_contact_id,
    -- Facturation
    billing_contact_source,
    billing_contact_id,
    billing_parent_organisation_id,
    -- Livraison
    delivery_contact_name,
    delivery_contact_email,
    delivery_contact_phone,
    delivery_address,
    delivery_postal_code,
    delivery_city,
    delivery_latitude,
    delivery_longitude,
    delivery_date,
    is_mall_delivery,
    mall_email,
    access_form_required,
    access_form_url,
    semi_trailer_accessible,
    delivery_notes
  ) VALUES (
    v_order_id,
    -- Demandeur
    'requester',
    p_requester->>'name',
    p_requester->>'email',
    p_requester->>'phone',
    p_requester->>'position',
    -- Responsable
    CASE
      WHEN v_ownership_type = 'succursale' THEN 'responsable'
      WHEN v_ownership_type = 'franchise' THEN 'responsable'
      ELSE 'responsable'
    END,
    v_responsable_contact_id,
    -- Facturation
    COALESCE(p_billing->>'contact_source', 'responsable'),
    v_billing_contact_id,
    v_parent_org_id,
    -- Livraison
    p_delivery->>'contact_name',
    p_delivery->>'contact_email',
    p_delivery->>'contact_phone',
    p_delivery->>'address',
    p_delivery->>'postal_code',
    p_delivery->>'city',
    (p_delivery->>'latitude')::NUMERIC,
    (p_delivery->>'longitude')::NUMERIC,
    (p_delivery->>'delivery_date')::DATE,
    COALESCE((p_delivery->>'is_mall_delivery')::BOOLEAN, FALSE),
    p_delivery->>'mall_email',
    COALESCE((p_delivery->>'access_form_required')::BOOLEAN, FALSE),
    p_delivery->>'access_form_url',
    COALESCE((p_delivery->>'semi_trailer_accessible')::BOOLEAN, TRUE),
    p_delivery->>'notes'
  );

  -- ========================================
  -- 7. ITEMS
  -- ========================================
  INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    unit_price_ttc,
    vat_rate,
    total_ht,
    total_ttc,
    product_name,
    product_reference,
    product_type
  )
  SELECT
    v_order_id,
    (item->>'product_id')::UUID,
    (item->>'quantity')::INTEGER,
    (item->>'unit_price_ht')::NUMERIC,
    (item->>'unit_price_ttc')::NUMERIC,
    (item->>'vat_rate')::NUMERIC,
    (item->>'total_ht')::NUMERIC,
    (item->>'total_ttc')::NUMERIC,
    item->>'product_name',
    item->>'product_reference',
    (item->>'product_type')::product_type
  FROM jsonb_array_elements(p_cart) AS item;

  -- ========================================
  -- 8. CALCULER TOTAUX COMMANDE
  -- ========================================
  UPDATE sales_orders
  SET
    total_ht = (SELECT SUM(total_ht) FROM sales_order_items WHERE sales_order_id = v_order_id),
    total_ttc = (SELECT SUM(total_ttc) FROM sales_order_items WHERE sales_order_id = v_order_id),
    updated_at = NOW()
  WHERE id = v_order_id;

  -- ========================================
  -- 9. RETOUR
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'responsable_contact_id', v_responsable_contact_id,
    'billing_contact_id', v_billing_contact_id,
    'parent_organisation_id', v_parent_org_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Lever l'exception pour que le front-end reçoive l'erreur
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_public_linkme_order IS
  'Créer une commande publique LinkMe avec 6 étapes (demandeur, restaurant, responsable, facturation, livraison, validation)';
```

---

## 🔧 Modifications Front-End

### Interface TypeScript

**Fichier** : `apps/linkme/src/components/OrderFormUnified.tsx`

**Remplacer lignes 58-107** par :

```typescript
interface OrderFormUnifiedData {
  // ========================================
  // ÉTAPE 1 : DEMANDEUR
  // ========================================
  requester: {
    name: string;
    email: string;
    phone: string;
    position: string;          // Rôle/Fonction
    notes: string;             // Notes optionnelles
  };

  // ========================================
  // ÉTAPE 2 : RESTAURANT
  // ========================================
  isNewRestaurant: boolean | null;  // null = pas encore choisi

  // Si restaurant existant
  existingOrganisationId: string | null;

  // Si nouveau restaurant
  newRestaurant: {
    ownershipType: 'succursale' | 'franchise' | null;  // DÉPLACÉ ICI (était en étape 3)
    tradeName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;

    // Contact responsable optionnel (créé automatiquement)
    optionalContactName: string;
    optionalContactFirstName: string;
    optionalContactLastName: string;
  };

  // ========================================
  // ÉTAPE 3 : RESPONSABLE
  // ========================================
  existingContact: {
    selectedContactId: string | null;  // ID du contact sélectionné OU 'new'
    isNewContact: boolean;             // true si on crée un nouveau contact
  };

  responsable: {
    name: string;
    email: string;
    phone: string;

    // Si franchisé uniquement
    companyLegalName: string;    // Raison sociale
    companyTradeName: string;    // Nom commercial
    siret: string;
    kbisFile: File | null;       // Upload KBis
  };

  // ========================================
  // ÉTAPE 4 : FACTURATION
  // ========================================
  billing: {
    useParentOrganisation: boolean;  // Uniquement si propre
    contactSource: 'responsable' | 'custom';

    // Si custom
    name: string;
    email: string;
    phone: string;  // OPTIONNEL

    // Adresse facturation
    companyLegalName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    siret: string;
  };

  // ========================================
  // ÉTAPE 5 : LIVRAISON
  // ========================================
  delivery: {
    useResponsableContact: boolean;  // Contact livraison = responsable

    // Si non coché
    contactName: string;
    contactEmail: string;
    contactPhone: string;

    // Adresse
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    deliveryDate: string;  // Format ISO

    // Centre commercial
    isMallDelivery: boolean;
    mallEmail: string;
    accessFormRequired: boolean;
    accessFormUrl: string | null;  // URL Supabase Storage

    // Semi-remorque
    semiTrailerAccessible: boolean;

    // Notes
    notes: string;
  };

  // ========================================
  // ÉTAPE 6 : VALIDATION
  // ========================================
  deliveryTermsAccepted: boolean;
  finalNotes: string;
}
```

### Données Initiales

**Remplacer lignes 149-186** par :

```typescript
const INITIAL_DATA: OrderFormUnifiedData = {
  // Étape 1
  requester: {
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: '',
  },

  // Étape 2
  isNewRestaurant: null,
  existingOrganisationId: null,
  newRestaurant: {
    ownershipType: null,
    tradeName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    optionalContactName: '',
    optionalContactFirstName: '',
    optionalContactLastName: '',
  },

  // Étape 3
  existingContact: {
    selectedContactId: null,
    isNewContact: false,
  },
  responsable: {
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    companyTradeName: '',
    siret: '',
    kbisFile: null,
  },

  // Étape 4
  billing: {
    useParentOrganisation: true,  // Pré-coché par défaut si propre
    contactSource: 'responsable',
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    siret: '',
  },

  // Étape 5
  delivery: {
    useResponsableContact: true,  // Pré-coché par défaut
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    deliveryDate: '',
    isMallDelivery: false,
    mallEmail: '',
    accessFormRequired: false,
    accessFormUrl: null,
    semiTrailerAccessible: true,
    notes: '',
  },

  // Étape 6
  deliveryTermsAccepted: false,
  finalNotes: '',
};
```

### Configuration des Étapes

**Modifier OPENING_STEPS** :

```typescript
const OPENING_STEPS = [
  {
    id: 1,
    title: 'Demandeur',
    description: 'Personne qui passe la commande',
    icon: User,
  },
  {
    id: 2,
    title: 'Restaurant',
    description: 'Sélection ou création du restaurant',
    icon: Store,
  },
  {
    id: 3,
    title: 'Responsable',
    description: 'Contact responsable du restaurant',
    icon: UserCircle,
  },
  {
    id: 4,
    title: 'Facturation',
    description: 'Adresse et contact de facturation',
    icon: FileText,
  },
  {
    id: 5,
    title: 'Livraison',
    description: 'Adresse et modalités de livraison',
    icon: Truck,
  },
  {
    id: 6,
    title: 'Validation',
    description: 'Récapitulatif et confirmation',
    icon: ShoppingCart,
  },
];
```

---

## 🧩 Composants Détaillés

### OpeningStep1Requester (NOUVEAU)

```typescript
function OpeningStep1Requester() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Personne qui passe la commande</h3>
        <p className="text-sm text-gray-500 mt-1">
          Vos coordonnées en tant que demandeur
        </p>
      </div>

      <div>
        <Label htmlFor="requesterName">Nom complet *</Label>
        <Input
          id="requesterName"
          value={data.requester.name}
          onChange={e => updateData({
            requester: { ...data.requester, name: e.target.value }
          })}
          placeholder="Jean Dupont"
        />
        {errors['requester.name'] && (
          <p className="text-sm text-red-600 mt-1">{errors['requester.name']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="requesterEmail">Email *</Label>
        <Input
          id="requesterEmail"
          type="email"
          value={data.requester.email}
          onChange={e => updateData({
            requester: { ...data.requester, email: e.target.value }
          })}
          placeholder="jean.dupont@pokawa.fr"
        />
        {errors['requester.email'] && (
          <p className="text-sm text-red-600 mt-1">{errors['requester.email']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="requesterPhone">Téléphone *</Label>
        <Input
          id="requesterPhone"
          type="tel"
          value={data.requester.phone}
          onChange={e => updateData({
            requester: { ...data.requester, phone: e.target.value }
          })}
          placeholder="06 12 34 56 78"
        />
        {errors['requester.phone'] && (
          <p className="text-sm text-red-600 mt-1">{errors['requester.phone']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="requesterPosition">Rôle/Fonction</Label>
        <Input
          id="requesterPosition"
          value={data.requester.position}
          onChange={e => updateData({
            requester: { ...data.requester, position: e.target.value }
          })}
          placeholder="Directeur régional"
        />
      </div>

      <div>
        <Label htmlFor="requesterNotes">Notes (optionnel)</Label>
        <Textarea
          id="requesterNotes"
          value={data.requester.notes}
          onChange={e => updateData({
            requester: { ...data.requester, notes: e.target.value }
          })}
          placeholder="Ex: Architecte pour le projet de rénovation..."
          rows={3}
          className="text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Informations complémentaires pertinentes
        </p>
      </div>
    </div>
  );
}
```

### OpeningStep2Restaurant (MODIFIÉ)

```typescript
function OpeningStep2Restaurant() {
  const { data: organisations } = useEnseigneOrganisations(enseigneId);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer organisations par recherche
  const filteredOrgs = organisations?.filter(org =>
    org.trade_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (data.isNewRestaurant === false) {
    // ========================================
    // RESTAURANT EXISTANT : Recherche + Cartes
    // ========================================
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Sélection du restaurant</h3>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez et sélectionnez le restaurant concerné
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher par nom, ville..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste cartes restaurants */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredOrgs?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun restaurant trouvé</p>
            </div>
          ) : (
            filteredOrgs?.map(org => (
              <Card
                key={org.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  data.existingOrganisationId === org.id && "ring-2 ring-blue-500 bg-blue-50"
                )}
                onClick={() => updateData({ existingOrganisationId: org.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {org.trade_name || org.legal_name}
                        </h4>
                        {org.ownership_type && (
                          <Badge variant={org.ownership_type === 'succursale' ? 'default' : 'secondary'}>
                            {org.ownership_type === 'succursale' ? 'Propre' : 'Franchisé'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {org.address_line1}
                      </p>
                      <p className="text-sm text-gray-500">
                        {org.postal_code} {org.city}
                      </p>
                      {org.email && (
                        <p className="text-xs text-gray-400 mt-2">
                          {org.email}
                        </p>
                      )}
                    </div>
                    {data.existingOrganisationId === org.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {errors['existingOrganisationId'] && (
          <p className="text-sm text-red-600">{errors['existingOrganisationId']}</p>
        )}
      </div>
    );
  }

  // ========================================
  // NOUVEAU RESTAURANT : Formulaire complet
  // ========================================
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informations du restaurant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Création d'un nouveau restaurant
        </p>
      </div>

      {/* Type de restaurant - DÉPLACÉ ICI (étape 2 au lieu de 3) */}
      <div>
        <Label>Type de restaurant *</Label>
        <RadioGroup
          value={data.newRestaurant.ownershipType || ''}
          onValueChange={(value: 'succursale' | 'franchise') => updateData({
            newRestaurant: { ...data.newRestaurant, ownershipType: value }
          })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="succursale" id="type-propre" />
            <Label htmlFor="type-propre" className="cursor-pointer font-normal">
              Restaurant propre (succursale)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="franchise" id="type-franchise" />
            <Label htmlFor="type-franchise" className="cursor-pointer font-normal">
              Restaurant franchisé
            </Label>
          </div>
        </RadioGroup>
        {errors['newRestaurant.ownershipType'] && (
          <p className="text-sm text-red-600 mt-1">{errors['newRestaurant.ownershipType']}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Cette information détermine les champs requis aux étapes suivantes
        </p>
      </div>

      <Separator />

      {/* Nom commercial */}
      <div>
        <Label htmlFor="tradeName">Nom commercial *</Label>
        <Input
          id="tradeName"
          value={data.newRestaurant.tradeName}
          onChange={e => updateData({
            newRestaurant: { ...data.newRestaurant, tradeName: e.target.value }
          })}
          placeholder="Pokawa Paris Rivoli"
        />
        {errors['newRestaurant.tradeName'] && (
          <p className="text-sm text-red-600 mt-1">{errors['newRestaurant.tradeName']}</p>
        )}
      </div>

      {/* Adresse autocomplete */}
      <div>
        <Label>Adresse du restaurant *</Label>
        <AddressAutocomplete
          value={data.newRestaurant.address ?
            `${data.newRestaurant.address}, ${data.newRestaurant.postalCode} ${data.newRestaurant.city}`
            : ''
          }
          onSelect={address => updateData({
            newRestaurant: {
              ...data.newRestaurant,
              address: address.streetAddress,
              postalCode: address.postalCode,
              city: address.city,
              latitude: address.latitude,
              longitude: address.longitude,
            }
          })}
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['newRestaurant.address'] && (
          <p className="text-sm text-red-600 mt-1">{errors['newRestaurant.address']}</p>
        )}
      </div>

      <Separator />

      {/* Contact responsable optionnel */}
      <div>
        <h4 className="font-medium text-sm mb-3">Contact responsable (optionnel)</h4>
        <p className="text-xs text-gray-500 mb-4">
          Vous pouvez ajouter dès maintenant un contact responsable.
          Sinon, vous pourrez le faire à l'étape suivante.
        </p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="optionalContactName">Nom complet</Label>
            <Input
              id="optionalContactName"
              value={data.newRestaurant.optionalContactName}
              onChange={e => updateData({
                newRestaurant: { ...data.newRestaurant, optionalContactName: e.target.value }
              })}
              placeholder="Sophie Martin"
            />
          </div>

          <p className="text-xs text-gray-400">
            Ce contact sera automatiquement créé et associé au restaurant
          </p>
        </div>
      </div>
    </div>
  );
}
```

### OpeningStep3Responsable (MODIFIÉ)

```typescript
function OpeningStep3Responsable() {
  const { data: contacts } = useOrganisationContacts(
    data.existingOrganisationId
  );

  const isExisting = data.isNewRestaurant === false;
  const isFranchise = data.newRestaurant.ownershipType === 'franchise';

  // Titre conditionnel
  const stepTitle = isFranchise ? 'Responsable du restaurant' : 'Responsable du restaurant';

  // ========================================
  // RESTAURANT EXISTANT : Sélection contact OU nouveau
  // ========================================
  if (isExisting) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{stepTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez un contact existant ou créez-en un nouveau
          </p>
        </div>

        {contacts?.allContacts && contacts.allContacts.length > 0 ? (
          <>
            <RadioGroup
              value={data.existingContact.selectedContactId || ''}
              onValueChange={value => updateData({
                existingContact: {
                  ...data.existingContact,
                  selectedContactId: value,
                  isNewContact: value === 'new',
                }
              })}
            >
              {/* Contacts existants */}
              {contacts.allContacts.map(contact => (
                <Card
                  key={contact.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    data.existingContact.selectedContactId === contact.id && "ring-2 ring-blue-500 bg-blue-50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={contact.id} id={`contact-${contact.id}`} />
                      <Label htmlFor={`contact-${contact.id}`} className="cursor-pointer flex-1">
                        <div>
                          <p className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{contact.email}</p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          )}
                          {contact.is_primary_contact && (
                            <Badge variant="outline" className="mt-2">Contact principal</Badge>
                          )}
                        </div>
                      </Label>
                      {data.existingContact.selectedContactId === contact.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Option : Nouveau contact */}
              <Card
                className={cn(
                  "cursor-pointer transition-all border-dashed",
                  data.existingContact.selectedContactId === 'new' && "ring-2 ring-blue-500 bg-blue-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="new" id="contact-new" />
                    <Label htmlFor="contact-new" className="cursor-pointer flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Ajouter un nouveau contact</span>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {/* Si "nouveau" sélectionné, afficher formulaire */}
            {data.existingContact.selectedContactId === 'new' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-4">
                <ResponsableContactForm />
              </div>
            )}
          </>
        ) : (
          <>
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun contact enregistré pour ce restaurant. Veuillez en ajouter un.
              </AlertDescription>
            </Alert>
            <ResponsableContactForm />
          </>
        )}

        {errors['existingContact.selectedContactId'] && (
          <p className="text-sm text-red-600">{errors['existingContact.selectedContactId']}</p>
        )}
      </div>
    );
  }

  // ========================================
  // RESTAURANT NOUVEAU : Formulaire direct
  // ========================================
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{stepTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Coordonnées du responsable du restaurant
        </p>
      </div>

      <ResponsableContactForm />

      {/* Si franchise : champs société */}
      {isFranchise && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-4">Informations de la société</h4>
            <CompanyFields />
          </div>
        </>
      )}
    </div>
  );
}

// ========================================
// Sous-composant : Formulaire contact
// ========================================
function ResponsableContactForm() {
  return (
    <>
      <div>
        <Label htmlFor="responsableName">Nom complet *</Label>
        <Input
          id="responsableName"
          value={data.responsable.name}
          onChange={e => updateData({
            responsable: { ...data.responsable, name: e.target.value }
          })}
          placeholder="Sophie Martin"
        />
        {errors['responsable.name'] && (
          <p className="text-sm text-red-600 mt-1">{errors['responsable.name']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="responsableEmail">Email *</Label>
        <Input
          id="responsableEmail"
          type="email"
          value={data.responsable.email}
          onChange={e => updateData({
            responsable: { ...data.responsable, email: e.target.value }
          })}
          placeholder="sophie.martin@restaurant.fr"
        />
        {errors['responsable.email'] && (
          <p className="text-sm text-red-600 mt-1">{errors['responsable.email']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="responsablePhone">Téléphone *</Label>
        <Input
          id="responsablePhone"
          type="tel"
          value={data.responsable.phone}
          onChange={e => updateData({
            responsable: { ...data.responsable, phone: e.target.value }
          })}
          placeholder="06 12 34 56 78"
        />
        {errors['responsable.phone'] && (
          <p className="text-sm text-red-600 mt-1">{errors['responsable.phone']}</p>
        )}
      </div>
    </>
  );
}

// ========================================
// Sous-composant : Champs société (franchise)
// ========================================
function CompanyFields() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="companyLegalName">Raison sociale *</Label>
        <Input
          id="companyLegalName"
          value={data.responsable.companyLegalName}
          onChange={e => updateData({
            responsable: { ...data.responsable, companyLegalName: e.target.value }
          })}
          placeholder="Pokawa Franchise SAS"
        />
        {errors['responsable.companyLegalName'] && (
          <p className="text-sm text-red-600 mt-1">{errors['responsable.companyLegalName']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="companyTradeName">Nom commercial</Label>
        <Input
          id="companyTradeName"
          value={data.responsable.companyTradeName}
          onChange={e => updateData({
            responsable: { ...data.responsable, companyTradeName: e.target.value }
          })}
          placeholder="Pokawa Paris"
        />
      </div>

      <div>
        <Label htmlFor="siret">SIRET *</Label>
        <Input
          id="siret"
          value={data.responsable.siret}
          onChange={e => updateData({
            responsable: { ...data.responsable, siret: e.target.value }
          })}
          placeholder="12345678901234"
          maxLength={14}
        />
        {errors['responsable.siret'] && (
          <p className="text-sm text-red-600 mt-1">{errors['responsable.siret']}</p>
        )}
      </div>

      <div>
        <Label htmlFor="kbis">KBis (optionnel)</Label>
        <Input
          id="kbis"
          type="file"
          accept=".pdf"
          onChange={handleKbisUpload}
        />
        <p className="text-xs text-gray-500 mt-1">Format PDF uniquement, max 5 MB</p>
      </div>
    </div>
  );
}
```

### OpeningStep4Billing (MODIFIÉ)

```typescript
function OpeningStep4Billing() {
  const enseigneId = useEnseigneId(); // Hook pour récupérer enseigne_id depuis context
  const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId);
  const isPropre = data.newRestaurant.ownershipType === 'succursale';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Facturation</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et contact de facturation
        </p>
      </div>

      {/* Option organisation mère (uniquement si propre) */}
      {isPropre && parentOrg && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="useParentOrg"
                checked={data.billing.useParentOrganisation}
                onCheckedChange={checked => updateData({
                  billing: {
                    ...data.billing,
                    useParentOrganisation: checked,
                  }
                })}
              />
              <div className="flex-1">
                <Label htmlFor="useParentOrg" className="cursor-pointer font-medium">
                  Utiliser l'organisation mère de l'enseigne
                </Label>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="font-medium">{parentOrg.trade_name || parentOrg.legal_name}</p>
                  <p className="text-gray-600">{parentOrg.address_line1}</p>
                  <p className="text-gray-600">{parentOrg.postal_code} {parentOrg.city}</p>
                  {parentOrg.siret && (
                    <p className="text-xs text-gray-500 mt-1">SIRET : {parentOrg.siret}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'adresse de facturation sera celle de l'organisation mère
                </p>
              </div>
              {data.billing.useParentOrganisation && (
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire custom (si case non cochée ou franchise) */}
      {(!data.billing.useParentOrganisation || !isPropre) && (
        <>
          {/* Contact facturation */}
          <div>
            <Label>Contact facturation</Label>
            <RadioGroup
              value={data.billing.contactSource}
              onValueChange={(value: 'responsable' | 'custom') => updateData({
                billing: { ...data.billing, contactSource: value }
              })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="responsable" id="billing-responsable" />
                <Label htmlFor="billing-responsable" className="cursor-pointer font-normal">
                  Même que le responsable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="billing-custom" />
                <Label htmlFor="billing-custom" className="cursor-pointer font-normal">
                  Autre contact
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.billing.contactSource === 'custom' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="billingName">Nom complet *</Label>
                <Input
                  id="billingName"
                  value={data.billing.name}
                  onChange={e => updateData({
                    billing: { ...data.billing, name: e.target.value }
                  })}
                  placeholder="Marie Dubois"
                />
                {errors['billing.name'] && (
                  <p className="text-sm text-red-600 mt-1">{errors['billing.name']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="billingEmail">Email *</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={data.billing.email}
                  onChange={e => updateData({
                    billing: { ...data.billing, email: e.target.value }
                  })}
                  placeholder="comptabilite@pokawa.fr"
                />
                {errors['billing.email'] && (
                  <p className="text-sm text-red-600 mt-1">{errors['billing.email']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="billingPhone">Téléphone (optionnel)</Label>
                <Input
                  id="billingPhone"
                  type="tel"
                  value={data.billing.phone}
                  onChange={e => updateData({
                    billing: { ...data.billing, phone: e.target.value }
                  })}
                  placeholder="01 23 45 67 89"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le téléphone n'est pas obligatoire pour le contact facturation
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Adresse facturation */}
          <div>
            <Label>Adresse de facturation *</Label>
            <AddressAutocomplete
              value={data.billing.address ?
                `${data.billing.address}, ${data.billing.postalCode} ${data.billing.city}`
                : ''
              }
              onSelect={address => updateData({
                billing: {
                  ...data.billing,
                  address: address.streetAddress,
                  postalCode: address.postalCode,
                  city: address.city,
                  latitude: address.latitude,
                  longitude: address.longitude,
                }
              })}
              placeholder="45 Avenue des Champs-Élysées, 75008 Paris"
            />
            {errors['billing.address'] && (
              <p className="text-sm text-red-600 mt-1">{errors['billing.address']}</p>
            )}
          </div>

          <div>
            <Label htmlFor="billingCompanyLegalName">Raison sociale *</Label>
            <Input
              id="billingCompanyLegalName"
              value={data.billing.companyLegalName}
              onChange={e => updateData({
                billing: { ...data.billing, companyLegalName: e.target.value }
              })}
              placeholder="Pokawa France SAS"
            />
            {errors['billing.companyLegalName'] && (
              <p className="text-sm text-red-600 mt-1">{errors['billing.companyLegalName']}</p>
            )}
          </div>

          <div>
            <Label htmlFor="billingSiret">SIRET *</Label>
            <Input
              id="billingSiret"
              value={data.billing.siret}
              onChange={e => updateData({
                billing: { ...data.billing, siret: e.target.value }
              })}
              placeholder="12345678901234"
              maxLength={14}
            />
            {errors['billing.siret'] && (
              <p className="text-sm text-red-600 mt-1">{errors['billing.siret']}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

### OpeningStep5Delivery (CRÉER - Identique au plan LM-ORD-008)

```typescript
function OpeningStep5Delivery() {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload vers Supabase Storage
    const supabase = createClient();
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('linkme-delivery-forms')
      .upload(fileName, file);

    if (error) {
      toast.error('Erreur lors de l\'upload du fichier');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('linkme-delivery-forms')
      .getPublicUrl(fileName);

    updateData({
      delivery: { ...data.delivery, accessFormUrl: publicUrl }
    });

    toast.success('Fichier uploadé avec succès');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Livraison</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et modalités de livraison
        </p>
      </div>

      {/* Contact livraison */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="useResponsableContact"
              checked={data.delivery.useResponsableContact}
              onCheckedChange={checked => updateData({
                delivery: {
                  ...data.delivery,
                  useResponsableContact: checked,
                }
              })}
            />
            <div className="flex-1">
              <Label htmlFor="useResponsableContact" className="cursor-pointer font-medium">
                Le contact de livraison est le responsable du restaurant
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Les coordonnées du responsable seront utilisées pour la livraison
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Si décoché : formulaire contact */}
      {!data.delivery.useResponsableContact && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="deliveryContactName">Nom complet *</Label>
            <Input
              id="deliveryContactName"
              value={data.delivery.contactName}
              onChange={e => updateData({
                delivery: { ...data.delivery, contactName: e.target.value }
              })}
              placeholder="Paul Leclerc"
            />
            {errors['delivery.contactName'] && (
              <p className="text-sm text-red-600 mt-1">{errors['delivery.contactName']}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactEmail">Email *</Label>
            <Input
              id="deliveryContactEmail"
              type="email"
              value={data.delivery.contactEmail}
              onChange={e => updateData({
                delivery: { ...data.delivery, contactEmail: e.target.value }
              })}
              placeholder="paul.leclerc@restaurant.fr"
            />
            {errors['delivery.contactEmail'] && (
              <p className="text-sm text-red-600 mt-1">{errors['delivery.contactEmail']}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactPhone">Téléphone *</Label>
            <Input
              id="deliveryContactPhone"
              type="tel"
              value={data.delivery.contactPhone}
              onChange={e => updateData({
                delivery: { ...data.delivery, contactPhone: e.target.value }
              })}
              placeholder="06 98 76 54 32"
            />
            {errors['delivery.contactPhone'] && (
              <p className="text-sm text-red-600 mt-1">{errors['delivery.contactPhone']}</p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Adresse livraison */}
      <div>
        <Label>Adresse de livraison *</Label>
        <AddressAutocomplete
          value={data.delivery.address ?
            `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
            : ''
          }
          onSelect={address => updateData({
            delivery: {
              ...data.delivery,
              address: address.streetAddress,
              postalCode: address.postalCode,
              city: address.city,
              latitude: address.latitude,
              longitude: address.longitude,
            }
          })}
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['delivery.address'] && (
          <p className="text-sm text-red-600 mt-1">{errors['delivery.address']}</p>
        )}
      </div>

      {/* Date livraison */}
      <div>
        <Label htmlFor="deliveryDate">Date de livraison souhaitée *</Label>
        <Input
          id="deliveryDate"
          type="date"
          value={data.delivery.deliveryDate}
          onChange={e => updateData({
            delivery: { ...data.delivery, deliveryDate: e.target.value }
          })}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors['delivery.deliveryDate'] && (
          <p className="text-sm text-red-600 mt-1">{errors['delivery.deliveryDate']}</p>
        )}
      </div>

      <Separator />

      {/* Centre commercial */}
      <div>
        <Label>Livraison dans un centre commercial ?</Label>
        <RadioGroup
          value={data.delivery.isMallDelivery ? 'yes' : 'no'}
          onValueChange={value => updateData({
            delivery: { ...data.delivery, isMallDelivery: value === 'yes' }
          })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="mall-yes" />
            <Label htmlFor="mall-yes" className="cursor-pointer font-normal">Oui</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="mall-no" />
            <Label htmlFor="mall-no" className="cursor-pointer font-normal">Non</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Si centre commercial */}
      {data.delivery.isMallDelivery && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="mallEmail">Email du centre commercial *</Label>
            <Input
              id="mallEmail"
              type="email"
              value={data.delivery.mallEmail}
              onChange={e => updateData({
                delivery: { ...data.delivery, mallEmail: e.target.value }
              })}
              placeholder="accueil@centrecommercial.fr"
            />
            {errors['delivery.mallEmail'] && (
              <p className="text-sm text-red-600 mt-1">{errors['delivery.mallEmail']}</p>
            )}
          </div>

          <div>
            <Label>Formulaire d'accès requis ?</Label>
            <RadioGroup
              value={data.delivery.accessFormRequired ? 'yes' : 'no'}
              onValueChange={value => updateData({
                delivery: { ...data.delivery, accessFormRequired: value === 'yes' }
              })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="form-yes" />
                <Label htmlFor="form-yes" className="cursor-pointer font-normal">Oui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="form-no" />
                <Label htmlFor="form-no" className="cursor-pointer font-normal">Non</Label>
              </div>
            </RadioGroup>
          </div>

          {data.delivery.accessFormRequired && (
            <div>
              <Label htmlFor="accessFormUpload">Télécharger le formulaire d'accès</Label>
              <Input
                id="accessFormUpload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés : PDF, PNG, JPG (max 5 MB)
              </p>
              {data.delivery.accessFormUrl && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Fichier uploadé avec succès</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Semi-remorque */}
      <div>
        <Label>Accessible par semi-remorque ?</Label>
        <RadioGroup
          value={data.delivery.semiTrailerAccessible ? 'yes' : 'no'}
          onValueChange={value => updateData({
            delivery: { ...data.delivery, semiTrailerAccessible: value === 'yes' }
          })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="semi-yes" />
            <Label htmlFor="semi-yes" className="cursor-pointer font-normal">
              Oui (par défaut)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="semi-no" />
            <Label htmlFor="semi-no" className="cursor-pointer font-normal">Non</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Notes livraison */}
      <div>
        <Label htmlFor="deliveryNotes">Notes livraison (optionnel)</Label>
        <Textarea
          id="deliveryNotes"
          value={data.delivery.notes}
          onChange={e => updateData({
            delivery: { ...data.delivery, notes: e.target.value }
          })}
          placeholder="Instructions spéciales pour la livraison..."
          rows={4}
        />
      </div>
    </div>
  );
}
```

### OpeningStep6Validation (RENOMMÉ - ex OpeningStep4)

```typescript
function OpeningStep6Validation() {
  // Récapitulatif complet + panier + modal confirmation
  // (Code existant à adapter pour inclure les nouvelles sections)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Récapitulatif</h3>
        <p className="text-sm text-gray-500 mt-1">
          Vérifiez les informations avant de valider
        </p>
      </div>

      {/* Section 1 : Demandeur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Demandeur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Nom :</strong> {data.requester.name}</p>
          <p><strong>Email :</strong> {data.requester.email}</p>
          <p><strong>Téléphone :</strong> {data.requester.phone}</p>
          {data.requester.position && (
            <p><strong>Fonction :</strong> {data.requester.position}</p>
          )}
          {data.requester.notes && (
            <p><strong>Notes :</strong> {data.requester.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Section 2 : Restaurant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" />
            Restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* ... afficher infos restaurant ... */}
        </CardContent>
      </Card>

      {/* Section 3 : Responsable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Responsable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* ... afficher infos responsable ... */}
        </CardContent>
      </Card>

      {/* Section 4 : Facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Facturation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* ... afficher infos facturation ... */}
        </CardContent>
      </Card>

      {/* Section 5 : Livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* ... afficher infos livraison ... */}
        </CardContent>
      </Card>

      {/* Section 6 : Panier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Panier ({cart.length} produits)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... liste produits + total ... */}
        </CardContent>
      </Card>

      {/* Checkbox conditions */}
      <div className="flex items-start gap-3 p-4 border rounded-lg">
        <Checkbox
          id="deliveryTerms"
          checked={data.deliveryTermsAccepted}
          onCheckedChange={checked => updateData({
            deliveryTermsAccepted: checked
          })}
        />
        <Label htmlFor="deliveryTerms" className="cursor-pointer text-sm">
          J'accepte les modalités de commande et de livraison
        </Label>
      </div>

      {/* Boutons */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={() => setStep(5)}>
          Retour
        </Button>
        <Button
          onClick={handleOpenConfirmationModal}
          disabled={!data.deliveryTermsAccepted}
        >
          Valider le panier
        </Button>
      </div>
    </div>
  );
}
```

---

## 🔗 Hooks

### useEnseigneParentOrganisation (NOUVEAU)

**Fichier** : `apps/linkme/src/lib/hooks/use-enseigne-parent-organisation.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useEnseigneParentOrganisation(enseigneId: string | null) {
  return useQuery({
    queryKey: ['enseigne-parent-org', enseigneId],
    queryFn: async () => {
      if (!enseigneId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('enseignes')
        .select(`
          parent_organisation_id,
          organisations!parent_organisation_id (
            id,
            legal_name,
            trade_name,
            address_line1,
            postal_code,
            city,
            siret
          )
        `)
        .eq('id', enseigneId)
        .single();

      if (error) throw error;
      return data?.organisations || null;
    },
    enabled: !!enseigneId,
  });
}
```

### useOrganisationContacts (MODIFIÉ)

**Fichier** : `apps/linkme/src/lib/hooks/use-organisation-contacts.ts`

```typescript
// Ajouter `allContacts` au retour

export function useOrganisationContacts(organisationId: string | null) {
  return useQuery({
    queryKey: ['organisation-contacts', organisationId],
    queryFn: async () => {
      if (!organisationId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .order('is_primary_contact', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        primaryContact: data.find(c => c.is_primary_contact) || null,
        billingContact: data.find(c => c.is_billing_contact) || null,
        allContacts: data,  // NOUVEAU : Tous les contacts pour sélection
      };
    },
    enabled: !!organisationId,
  });
}
```

### useEnseigneId (NOUVEAU)

**Fichier** : `apps/linkme/src/lib/hooks/use-enseigne-id.ts`

```typescript
import { useAuth } from '@/contexts/AuthContext';

export function useEnseigneId() {
  const { affiliate } = useAuth();
  return affiliate?.enseigne_id || null;
}
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Base de Données (30-45 min)

- [ ] **LM-ORD-009-1**: Créer migration `20260115_001_add_parent_organisation_enseignes.sql`
- [ ] **LM-ORD-009-2**: Créer migration `20260115_002_add_delivery_fields_linkme.sql`
- [ ] **LM-ORD-009-3**: Créer migration `20260115_003_update_rpc_linkme_order.sql`
- [ ] **LM-ORD-009-4**: Appliquer les 3 migrations
- [ ] **LM-ORD-009-5**: Définir organisation mère pour Pokawa (SQL UPDATE)
- [ ] **LM-ORD-009-6**: Vérifier bucket Storage `linkme-delivery-forms` créé
- [ ] **LM-ORD-009-7**: Tester RPC avec nouveaux paramètres (SQL direct)

### Phase 2 : Hooks (15-20 min)

- [ ] **LM-ORD-009-8**: Créer `useEnseigneParentOrganisation` hook
- [ ] **LM-ORD-009-9**: Modifier `useOrganisationContacts` pour retourner `allContacts`
- [ ] **LM-ORD-009-10**: Créer `useEnseigneId` hook

### Phase 3 : Interface TypeScript (30 min)

- [ ] **LM-ORD-009-11**: Remplacer interface `OrderFormUnifiedData` (nouveau schéma complet)
- [ ] **LM-ORD-009-12**: Mettre à jour `INITIAL_DATA`
- [ ] **LM-ORD-009-13**: Mettre à jour `OPENING_STEPS` (6 étapes avec icônes)

### Phase 4 : Composants Steps (3-4h)

- [ ] **LM-ORD-009-14**: Créer `OpeningStep1Requester` component
- [ ] **LM-ORD-009-15**: Modifier `OpeningStep2Restaurant` (recherche + cartes + ownership_type)
- [ ] **LM-ORD-009-16**: Modifier `OpeningStep3Responsable` (contacts existants + nouveau)
- [ ] **LM-ORD-009-17**: Créer sous-composant `ResponsableContactForm`
- [ ] **LM-ORD-009-18**: Créer sous-composant `CompanyFields` (franchise)
- [ ] **LM-ORD-009-19**: Modifier `OpeningStep4Billing` (option org mère)
- [ ] **LM-ORD-009-20**: Créer `OpeningStep5Delivery` component
- [ ] **LM-ORD-009-21**: Renommer `OpeningStep4` → `OpeningStep6Validation`
- [ ] **LM-ORD-009-22**: Mettre à jour `OpeningStep6Validation` (récap 6 sections)

### Phase 5 : Navigation & Validation (1h)

- [ ] **LM-ORD-009-23**: Créer `validateStep1Requester`
- [ ] **LM-ORD-009-24**: Créer `validateStep2Restaurant`
- [ ] **LM-ORD-009-25**: Modifier `validateStep3Responsable` (gérer contacts existants)
- [ ] **LM-ORD-009-26**: Créer `validateStep4Billing`
- [ ] **LM-ORD-009-27**: Créer `validateStep5Delivery`
- [ ] **LM-ORD-009-28**: Modifier `handleNext()` pour 6 étapes
- [ ] **LM-ORD-009-29**: Modifier condition `step < 6` (au lieu de `< 4`)

### Phase 6 : Modal Confirmation (30 min)

- [ ] **LM-ORD-009-30**: Ajouter section "Demandeur" dans modal
- [ ] **LM-ORD-009-31**: Modifier section "Restaurant" (afficher ownership_type)
- [ ] **LM-ORD-009-32**: Modifier section "Responsable"
- [ ] **LM-ORD-009-33**: Ajouter section "Livraison"
- [ ] **LM-ORD-009-34**: Vérifier ordre des sections dans modal

### Phase 7 : Soumission RPC (1h)

- [ ] **LM-ORD-009-35**: Préparer `p_requester` JSON
- [ ] **LM-ORD-009-36**: Modifier `p_organisation` (ajouter ownership_type)
- [ ] **LM-ORD-009-37**: Préparer `p_responsable` (gérer contact_id vs is_new)
- [ ] **LM-ORD-009-38**: Préparer `p_billing` (gérer use_parent)
- [ ] **LM-ORD-009-39**: Préparer `p_delivery` JSON
- [ ] **LM-ORD-009-40**: Appeler RPC avec 8 paramètres
- [ ] **LM-ORD-009-41**: Gérer réponse (success, order_id, contacts créés)
- [ ] **LM-ORD-009-42**: Afficher toast succès + vider panier + redirection

### Phase 8 : Alignement Page /commandes (30 min)

- [ ] **LM-ORD-009-43**: Modifier `CreateOrderModal.tsx` pour auto-remplir étape 1
- [ ] **LM-ORD-009-44**: S'assurer que les étapes 2-6 sont identiques

### Phase 9 : Tests (2-3h)

- [ ] **LM-ORD-009-45**: Test 1 - Restaurant existant + contact existant
- [ ] **LM-ORD-009-46**: Test 2 - Restaurant existant + nouveau contact
- [ ] **LM-ORD-009-47**: Test 3 - Nouveau restaurant propre + org mère facturation
- [ ] **LM-ORD-009-48**: Test 4 - Nouveau restaurant propre + facturation custom
- [ ] **LM-ORD-009-49**: Test 5 - Nouveau restaurant franchise + société
- [ ] **LM-ORD-009-50**: Test 6 - Livraison avec centre commercial + upload formulaire
- [ ] **LM-ORD-009-51**: Test 7 - Vérifier contacts créés en DB
- [ ] **LM-ORD-009-52**: Test 8 - Vérifier colonnes `delivery_*` remplies
- [ ] **LM-ORD-009-53**: Test 9 - `pnpm type-check` → 0 erreurs
- [ ] **LM-ORD-009-54**: Test 10 - `pnpm build` → Build succeeded
- [ ] **LM-ORD-009-55**: Test 11 - Console Zero (0 erreurs)

---

## 🚨 Points de Vigilance

### 1. Contacts Existants

- **Liste vide** : Afficher message d'alerte + formulaire nouveau contact obligatoire
- **Sélection** : Envoyer `contact_id` au RPC, pas les données du contact
- **Nouveau** : Envoyer `is_new: true` + données complètes

### 2. Organisation Mère

- **Vérifier existence** : `enseignes.parent_organisation_id` doit être défini
- **Fallback** : Si `NULL`, cacher l'option checkbox
- **RPC** : Si `use_parent = true`, récupérer adresse depuis table `organisations`

### 3. Ownership Type

- **Déplacement** : Actuellement à Step 3 (responsable), **déplacer à Step 2** (restaurant)
- **Validation** : Requis pour nouveau restaurant
- **Conditionnel** : Affecte labels Step 3 (Responsable) et champs Step 4 (org mère)

### 4. Email & Téléphone

- **Email TOUJOURS requis** pour tous les contacts
- **Téléphone requis** SAUF pour contact facturation (optionnel)
- **Format** : Valider email avec regex
- **Téléphone** : Accepter formats français (06, 07, +33)

### 5. RPC Compatibilité

- **Paramètres optionnels** : `p_responsable`, `p_delivery` peuvent être NULL
- **Restaurant existant** : Si `contact_id` fourni, ne pas créer de contact
- **Restaurant nouveau** : Toujours créer contacts (responsable + billing si custom)

### 6. Stepper Visual

- **6 étapes** au lieu de 4
- **Icônes** : User (demandeur), Store (restaurant), UserCircle (responsable), FileText (facturation), Truck (livraison), ShoppingCart (validation)
- **Ordre** : Demandeur → Restaurant → Responsable → Facturation → Livraison → Validation

### 7. Terminologie CRITIQUE

**❌ INTERDIT** : "Propriétaire", "Owner"
**✅ OBLIGATOIRE** : "Responsable", "Manager"

Chercher et remplacer dans tout le code :
- `owner` → `responsable`
- `Owner` → `Responsable`
- `propriétaire` → `responsable`
- `Propriétaire` → `Responsable`

**Exceptions** :
- Nom de colonne DB : `owner_type`, `owner_contact_id` (ne pas changer)
- Paramètre RPC : `p_responsable` (nouveau nom)

---

## 📏 Effort Estimé

| Phase | Temps | Complexité |
|-------|-------|------------|
| Phase 1 : Base de données | 30-45 min | Moyenne |
| Phase 2 : Hooks | 15-20 min | Faible |
| Phase 3 : Interface TS | 30 min | Faible |
| Phase 4 : Composants Steps | 3-4h | Élevée |
| Phase 5 : Navigation & Validation | 1h | Moyenne |
| Phase 6 : Modal Confirmation | 30 min | Faible |
| Phase 7 : Soumission RPC | 1h | Moyenne |
| Phase 8 : Alignement /commandes | 30 min | Faible |
| Phase 9 : Tests | 2-3h | Moyenne |
| **TOTAL** | **9-12h** | **Refonte majeure** |

---

## 📝 Commit Message

```
[LM-ORD-009] feat(linkme): complete order form workflow refactoring

BREAKING CHANGE: Complete redesign of order form workflow (4 → 6 steps)

Restaurant Existant (6 steps):
- Add Step 1: Requester (name, email, phone, position, notes)
- Add Step 2: Restaurant selection (search + visual cards + full details)
- Add Step 3: Responsable selection from existing contacts or new
- Add Step 4: Billing with parent organisation option (propre only)
- Add Step 5: Delivery (contact, address, mall, semi-trailer, form upload)
- Rename Step 4 → Step 6: Validation

Restaurant Nouveau (6 steps):
- Add Step 1: Requester (same as existant)
- Modify Step 2: Restaurant + ownership type (moved from step 3)
- Modify Step 3: Responsable based on ownership type (franchise = company fields)
- Add Step 4: Billing with parent organisation option
- Add Step 5: Delivery (same as existant)
- Rename Step 4 → Step 6: Validation

Database:
- Add parent_organisation_id to enseignes table
- Add 14 delivery columns to sales_order_linkme_details
- Create linkme-delivery-forms Storage bucket
- Modify create_public_linkme_order RPC (8 params)

Frontend:
- Create OpeningStep1Requester component
- Modify OpeningStep2Restaurant (search + cards + ownership_type)
- Modify OpeningStep3Responsable (contacts selection + new contact)
- Modify OpeningStep4Billing (parent org option)
- Create OpeningStep5Delivery component
- Rename OpeningStep4 → OpeningStep6Validation
- Create useEnseigneParentOrganisation hook
- Modify useOrganisationContacts (return allContacts)
- Create useEnseigneId hook

Terminology:
- Replace "propriétaire/owner" → "responsable" everywhere (UI only)
- Keep DB column names unchanged (owner_type, owner_contact_id)

Alignment:
- /commandes CreateOrderModal auto-fills Step 1 from user profile
- Steps 2-6 identical between public selection and /commandes

Migrations:
- 20260115_001_add_parent_organisation_enseignes.sql
- 20260115_002_add_delivery_fields_linkme.sql
- 20260115_003_update_rpc_linkme_order.sql

Fixes: LM-ORD-007 (order creation blocked by incomplete workflow)
```

---

**Plan créé le 2026-01-15 - Task ID: LM-ORD-009**
**Remplace le plan LM-ORD-008** (étape 4 livraison seule)
**Refonte complète du workflow** pour unifier restaurant existant/nouveau
**Auteur**: Agent groovy-cooking-peacock (session interrompue)
**Reconstitué par**: Claude Code WRITE
