# Workflows Comptabilité - Source de Vérité

> Document de référence pour les workflows comptables du Back-Office Verone.
> Date: 2025-12-30 | Version: 2.0

---

## 1. Source de Vérité : Catégories PCG

### Principe

**Une transaction bancaire = UNE catégorie comptable (PCG)**

Pas de double catégorisation. Le code PCG est l'unique référence.

### Fichiers clés

- `packages/@verone/finance/src/utils/pcg-categories.ts` - Définitions des catégories
- `bank_transactions.category_pcg` - Champ en DB

### Catégories principales

| Code    | Label                  | Description          |
| ------- | ---------------------- | -------------------- |
| 401     | Fournisseurs           | Achats de biens      |
| 411     | Clients                | Ventes               |
| 455     | Compte courant associé | Apports/retraits     |
| 512     | Banque                 | Opérations bancaires |
| 601-606 | Achats                 | Par nature           |
| 701-707 | Ventes                 | Par nature           |

---

## 2. Moteur de Règles V2

### Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│  bank_transactions│◄────│   matching_rules    │────►│ Catégorie PCG auto │
│                  │     │                     │     │                    │
│  label           │     │  match_value        │     │  Organisation liée │
│  applied_rule_id │     │  default_category   │     │                    │
└──────────────────┘     │  organisation_id    │     └────────────────────┘
                         └─────────────────────┘
```

### Table `matching_rules`

- `match_type`: 'label_contains' | 'label_exact' | 'iban'
- `match_value`: Libellé à matcher (normalisé)
- `default_category`: Code PCG (optionnel)
- `organisation_id`: Organisation liée (optionnel)
- `enabled`: Règle active ou non

### Normalisation des libellés

Fonction `normalize_label()` en SQL:

1. LOWER() en premier (critique!)
2. Suppression accents via translate()
3. Ponctuation → espaces
4. Espaces multiples → 1 espace
5. Trim

```sql
-- Exemple
normalize_label('GOCARDLESS SAS') → 'gocardless sas'
normalize_label('URSSAF D''ILE DE FRANCE') → 'urssaf d ile de france'
```

### Workflow Preview/Confirm (Garde-fous)

**IMPORTANT: Aucune modification de masse sans confirmation explicite.**

#### Étape 1: Preview (lecture seule)

```sql
SELECT * FROM preview_apply_matching_rule(p_rule_id);
```

Retourne:

- `normalized_label_group` - Label normalisé
- `sample_labels` - Exemples de libellés
- `transaction_count` - Nombre de transactions
- `confidence` - 'HIGH' | 'MEDIUM' | 'LOW'
- `confidence_score` - Score de confiance (0-100)

#### Étape 2: Confirmation

```sql
SELECT * FROM apply_matching_rule_confirm(
  p_rule_id,
  p_selected_normalized_labels  -- Labels choisis par l'utilisateur
);
```

### Trigger Anti-Contournement

Le trigger `trg_check_rule_lock` empêche les modifications manuelles:

- Si `applied_rule_id` est défini ET règle définit `default_category` → category_pcg verrouillé
- Si `applied_rule_id` est défini ET règle définit `organisation_id` → organisation verrouillée

Exception: Les RPCs de règles utilisent `set_config('app.apply_rule_context', 'true', true)`.

---

## 3. Verrouillage UI

### Principe

**Si `applied_rule_id` est défini → Modifications manuelles bloquées**

L'utilisateur doit modifier la règle pour changer la catégorie ou l'organisation.

### Comportement par page

#### Page Dépenses (`/finance/depenses`)

- Bouton "Classer" → remplacé par "Voir la règle"
- Badge "Auto" affiché
- Clic ouvre le RuleModal

#### Page Transactions (`/finance/transactions`)

- Panneau latéral : boutons "Classer PCG" et "Lier organisation" masqués
- Message "Verrouillé par règle" affiché
- Bouton "Voir / Modifier la règle"

#### Modals

- `OrganisationLinkingModal`: Bouton Enregistrer désactivé si règle définit l'organisation
- `QuickClassificationModal`: Section organisation masquée en mode modification

---

## 4. Rapprochement Multi-Docs

### Principe

**Une transaction peut être liée à N documents/commandes**

La somme des montants alloués doit correspondre au montant de la transaction.

### Table `transaction_document_links`

```sql
transaction_id    UUID    -- FK vers bank_transactions
document_id       UUID    -- FK vers financial_documents (optionnel)
sales_order_id    UUID    -- FK vers sales_orders (optionnel)
purchase_order_id UUID    -- FK vers purchase_orders (optionnel)
link_type         VARCHAR -- 'document' | 'sales_order' | 'purchase_order' | 'partial'
allocated_amount  DECIMAL -- Montant alloué pour ce lien
```

### RPCs

- `link_transaction_to_document(...)` - Créer un lien
- `unlink_transaction_document(p_link_id)` - Supprimer un lien
- `get_transaction_links(p_transaction_id)` - Lister les liens

### Scoring CDRU

Facteurs de scoring pour suggestions automatiques:

| Facteur         | Points | Condition                       |
| --------------- | ------ | ------------------------------- |
| Montant exact   | +70    | Différence = 0                  |
| Montant proche  | +50    | Différence ≤ 10€                |
| Nom client      | +30    | 10 premiers caractères matchent |
| Date proche     | +20    | ≤ 7 jours                       |
| Date proche     | +10    | ≤ 14 jours                      |
| Commande livrée | +15    | Status = shipped/delivered      |
| Non payée       | +10    | payment_status = unpaid         |

Seuil minimum: 40 points pour afficher une suggestion.

---

## 5. Invariants Non Négociables

1. **UNE seule catégorie PCG** par transaction
2. **UNE seule source de vérité** : `pcg-categories.ts` + champs PCG en DB
3. **Création de règle** uniquement via `RuleModal`
4. **Modification transaction verrouillée** = modifier la règle
5. **Pas d'apply large** sans confirmation explicite (wizard)
6. **normalize_label** ne retourne jamais '' pour un input non-vide valide

---

## 6. Composants Principaux

| Composant                  | Rôle                      | Emplacement                  |
| -------------------------- | ------------------------- | ---------------------------- |
| `RuleModal`                | Création/édition de règle | `@verone/finance/components` |
| `ApplyExistingWizard`      | Wizard preview/confirm    | `@verone/finance/components` |
| `QuickClassificationModal` | Classification PCG        | `@verone/finance/components` |
| `OrganisationLinkingModal` | Liaison organisation      | `@verone/finance/components` |
| `RapprochementModal`       | Rapprochement multi-docs  | `@verone/finance/components` |

---

## 7. Migrations Supabase

Les migrations sont appliquées via `psql "$DATABASE_URL"`.

Migrations clés:

- `20251230_rules_workflow_v2_gardefous.sql` - normalize_label corrigé + preview/confirm RPCs + trigger lock
- `20251230_add_applied_rule_id.sql` - Verrouillage UI
- `20251230_transaction_document_links.sql` - Rapprochement multi-docs

---

_Document mis à jour le 2025-12-30 - Version 2.0_
