# Audit — `ownership_type` : succursale vs franchise vs "propre"

**Date** : 2026-04-21
**Déclencheur** : Roméo demande pourquoi Pokawa Annemasse n'a pas les contacts de l'enseigne.
**Portée** : audit en profondeur de la colonne `organisations.ownership_type`, de l'enum DB, du code front, de la terminologie UI, des règles métier, et de la doc existante.

---

## 1. Réponse directe (question initiale Roméo)

**Pokawa Annemasse** est `ownership_type = 'franchise'` (défini en DB).
Elle est **franchisée**, donc elle n'hérite **pas** des contacts facturation de l'enseigne Pokawa. C'est le comportement attendu.

---

## 2. Vérité DB (source unique)

### 2.1. Enum `organisation_ownership_type`

Valeurs **définitives** en production (requêté sur `pg_enum`) :

```
succursale
franchise
```

**Aucune valeur `propre`** dans l'enum. Un INSERT avec `ownership_type = 'propre'` échoue avec `invalid input value for enum`.

### 2.2. Colonne

- `organisations.ownership_type` : `enum organisation_ownership_type`, nullable
- Documenté ligne 353 de `docs/current/database/schema/01-organisations.md`

### 2.3. Distribution en prod (2026-04-21)

| `ownership_type` | Total | Avec enseigne | Maisons mères  | Customers | Suppliers |
| ---------------- | ----- | ------------- | -------------- | --------- | --------- |
| `franchise`      | 102   | 102           | 0              | 102       | 0         |
| `succursale`     | 40    | 40            | 1 (Pokawa SAS) | 40        | 0         |
| `NULL`           | 71    | 26            | 0              | 28        | 18        |

**Observation** : 71 organisations ont `ownership_type = NULL`. C'est normal pour :

- Fournisseurs (18)
- Organisations sans enseigne (45 sur 71 = 71 - 26)
- Customers sans enseigne rattachée (28 customers dont ~23 sans enseigne + quelques cas non qualifiés)

---

## 3. Historique technique (git + migrations)

### 3.1. Chronologie

| Date       | Migration                                                              | Effet                                                                                                                   |
| ---------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 2026-01-10 | `20260110_010_add_ownership_type.sql`                                  | Création de l'enum + colonne `ownership_type` sur `organisations`. Enum fixé à `succursale                              | franchise` dès le départ. |
| 2026-01-11 | `20260111_001_fix_ownership_type_mapping.sql`                          | Mapping explicite `'propre'` (UI legacy) → `'succursale'` (DB) dans la RPC `create_public_linkme_order`. Backfill fait. |
| 2026-01-11 | `20260111_002_simplify_ownership_type_rpc.sql`                         | Simplification RPC.                                                                                                     |
| 2026-01-24 | `20260124_003_seed_franchise_test_data.sql`                            | Seed de données test franchise.                                                                                         |
| 2026-02-15 | `20260215100000_update_rpc_create_customer_org_enseigne_ownership.sql` | Mise à jour RPC pour rattachement auto à l'enseigne.                                                                    |

### 3.2. Commentaire autoritaire dans la RPC

```sql
-- Depuis 2026-01-11
-- owner_type = 'propre'    -> ownership_type = 'succursale'
-- owner_type = 'franchise' -> ownership_type = 'franchise'
```

Prouvé dans `supabase/migrations/20260111_001_fix_ownership_type_mapping.sql:79-85` + `COMMENT ON FUNCTION ... 'MAPPING ownership_type (depuis 2026-01-11)'`.

**Conclusion** : `'propre'` est **un alias UX legacy**, **jamais** une valeur DB. Depuis 2026-01-11, le mapping est centralisé dans la RPC serveur.

---

## 4. Incohérence code ↔ DB : CONFIRMÉE

### 4.1. Code qui ajoute `'propre'` comme 3e valeur TS

`grep '\''propre\''` dans le code TypeScript a trouvé **30+ fichiers** qui déclarent `'propre' | 'franchise' | 'succursale'` :

#### Types et validations (source du problème)

- `packages/@verone/organisations/src/components/forms/unified-organisation-form/types.ts:74` — **Zod enum `['succursale', 'franchise', 'propre']`**
- `packages/@verone/organisations/src/hooks/use-enseigne-map-data.ts:17` — type TS
- `packages/@verone/organisations/src/components/maps/MapLibreMapView.tsx:46`
- `packages/@verone/organisations/src/components/maps/MapPopupCard.tsx:16`

#### Composants front (affichage)

- `packages/@verone/organisations/src/components/modals/OrgBrowseModal.tsx:165,283`
- `packages/@verone/organisations/src/components/sections/EnseigneMapComponents.tsx:135`
- `packages/@verone/organisations/src/components/sections/EnseigneMapSection.tsx:274`
- `packages/@verone/organisations/src/components/forms/CustomerOrganisationFormModal.tsx:105,172`
- `packages/@verone/organisations/src/components/forms/unified-organisation-form/EnseigneSection.tsx:131`

#### apps/linkme (héritage LinkMe)

- `apps/linkme/src/lib/hooks/use-organisation-contacts-mutations.ts:150`
- `apps/linkme/src/lib/hooks/use-enseigne-organisations.ts:19`
- `apps/linkme/src/lib/hooks/use-organisation-detail.ts:27`
- `apps/linkme/src/lib/hooks/use-organisation-contacts.ts:106`
- `apps/linkme/src/components/order-form/RestaurantStep.tsx:100-102`
- `apps/linkme/src/components/organisations/OrganisationDetailSheet.tsx:82,84,171,173`
- `apps/linkme/src/components/organisations/organisation-detail/InfosTab.tsx:152,174,191`
- `apps/linkme/src/components/organisations/QuickEditOwnershipTypeModal.tsx:74,114,127`
- `apps/linkme/src/components/organisations/OrganisationCard.tsx:163`
- `apps/linkme/src/app/(main)/commandes/[id]/modifier/EditOrderPage.tsx:66,106`
- `apps/linkme/src/components/orders/steps/RestaurantStep/components/NewRestaurantForm.tsx:64`
- `apps/linkme/src/components/orders/steps/ResponsableStep.tsx:57,79,171`
- `apps/linkme/src/components/orders/steps/ValidationStep.tsx:72`
- `apps/linkme/src/components/order-form/BillingStep.tsx:39`
- `apps/linkme/src/components/order-form/constants.ts:83`
- `apps/linkme/src/components/order-form/types.ts:84`

#### apps/back-office (héritage linkme legacy)

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/ContactEditDialog.tsx:49`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/hooks/use-order-page-data.ts:50`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/hooks.ts:68`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/components/RestaurantSection.tsx:200`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/utils/order-missing-fields.ts:116`

### 4.2. Preuve formelle que `'propre'` est obsolète

Dans `apps/linkme/src/components/organisations/OrganisationDetailSheet.tsx:171` :

```ts
// Mapper 'propre' vers 'succursale' (propre est obsolète)
const mappedType =
  org.ownership_type === 'propre' ? 'succursale' : org.ownership_type;
```

Le code lui-même documente que `'propre'` est **obsolète** mais garde la compatibilité. Héritage non nettoyé.

### 4.3. Risque concret

Le formulaire `CustomerOrganisationFormModal.tsx:105` et son Zod schema `types.ts:74` acceptent `'propre'`. Si l'utilisateur sélectionne cette valeur dans un nouveau chemin de création non couvert par une RPC mappeuse, un `INSERT` direct échouera avec l'erreur Postgres :

```
ERROR: invalid input value for enum organisation_ownership_type: "propre"
```

J'ai vérifié `packages/@verone/organisations/src/hooks/use-organisations-crud.ts` : il utilise `supabase.from('organisations').insert(...)` typé sur `Database` — TypeScript strict **devrait** bloquer `'propre'`, **sauf** si le flux passe par le Zod (qui n'est pas typé sur Supabase). À vérifier.

---

## 5. Règles métier métier découvertes (DB + code)

### 5.1. Trigger DB `sync_owner_type_payment_terms`

Existant sur `organisations` (BEFORE UPDATE). Logique :

```
Si ownership_type change ET enseigne_id IS NOT NULL :
  Si ownership_type = 'franchise' :
    prepayment_required := true
    payment_terms := '0'
    payment_terms_type := 'IMMEDIATE'
  Sinon (succursale) :
    Hériter payment_delay_days de l'enseigne
    prepayment_required := false
    payment_terms_type := NET_X selon délai enseigne
```

**Règle métier 1** : Franchise = paiement immédiat obligatoire.
**Règle métier 2** : Succursale = hérite des conditions de paiement de l'enseigne.

### 5.2. Héritage des contacts / paramètres commerciaux

Dans `packages/@verone/organisations/src/components/sections/CommercialEditSection.tsx:60-66` :

```ts
// Clients professionnels succursales (restaurant propre)
if (
  organisationType === 'customer' &&
  organisation.ownership_type === 'succursale'
) {
  return false; // ❌ Read-only : hérite de l'enseigne
}
```

**Règle métier 3** : Paramètres commerciaux d'une succursale customer = read-only. Ils héritent de l'enseigne.

### 5.3. Héritage des contacts billing (commande LinkMe)

Dans `apps/linkme/src/app/(main)/commandes/[id]/modifier/EditOrderPage.tsx:106` :

```ts
// Billing contacts: franchise → org contacts only, succursale/propre → enseigne contacts
```

**Règle métier 4** : Contacts billing d'une commande LinkMe :

- `franchise` → contacts de l'org (propres au franchisé)
- `succursale` → contacts de l'enseigne (partagés)

### 5.4. Synthèse des règles

| Règle                  | Succursale                   | Franchise                   |
| ---------------------- | ---------------------------- | --------------------------- |
| Paiement               | Hérite enseigne (NET_30/60…) | Immédiat obligatoire        |
| Paramètres commerciaux | Read-only (hérités)          | Éditables                   |
| Contacts billing       | Partagés avec enseigne       | Propres à l'org             |
| Contacts opérationnels | Partagés avec enseigne       | Propres à l'org             |
| Adresses livraison     | Propres à chaque restaurant  | Propres à chaque restaurant |

---

## 6. Terminologie UI (≠ enum DB)

La terminologie orientée utilisateur diffère de l'enum technique :

| Terme UI              | Enum DB      | Où affiché                   |
| --------------------- | ------------ | ---------------------------- |
| « Restaurant propre » | `succursale` | Radio, badges, labels LinkMe |
| « Succursale »        | `succursale` | Back-office                  |
| « Franchise »         | `franchise`  | Partout                      |

Confirmé dans :

- `apps/linkme/src/components/order-form/RestaurantStep.tsx:100-102` — label « Restaurant propre (succursale) » avec `value="succursale"`
- `apps/linkme/src/components/organisations/OrganisationCard.tsx:163`
- `apps/linkme/src/components/organisations/QuickEditOwnershipTypeModal.tsx:127`
- `apps/linkme/src/components/organisations/organisation-detail/InfosTab.tsx:174,191`

**Cette double terminologie est normale** (UX > vocabulaire technique). Le problème est que certains fichiers utilisent `'propre'` comme **valeur enum** et non juste comme label.

---

## 7. État de la documentation existante

### 7.1. Ce qui existe

- `docs/current/database/schema/01-organisations.md:353` — mentionne la colonne, pas la règle métier
- `docs/current/database/schema/00-SUMMARY.md` — mentionne la colonne
- `docs/scratchpad/audit-maison-mere-schema-2026-04-19.md` — couvre `is_enseigne_parent`, pas `ownership_type`
- `docs/current/linkme/GUIDE-COMPLET-LINKME.md` — mentions non structurées
- `docs/current/INDEX-LINKME-COMPLET.md` — idem
- `docs/current/back-office-entities-index.md` — idem

### 7.2. Ce qui manque

Aucune documentation ne couvre :

- L'enum complet et ses valeurs autorisées
- Le mapping `'propre'` (UX) → `'succursale'` (DB) et le fait que `'propre'` est obsolète
- Les 4 règles métier découvertes (paiement, paramètres commerciaux, contacts, adresses)
- Le trigger DB `sync_owner_type_payment_terms` et son impact

### 7.3. Anciens commits

Git history remonté jusqu'au 2026-01-01 (antérieur à la création de l'enum). Aucun commit ne révèle qu'une doc spécifique aurait été supprimée. La doc n'a jamais été écrite formellement.

---

## 8. Conclusions

### 8.1. Statut de l'incohérence

- **DB** : source de vérité propre, enum = `succursale | franchise`. Aucun problème.
- **Code TS** : **dette technique confirmée**. 30+ fichiers référencent `'propre'` comme s'il s'agissait d'une valeur valide alors que c'est un alias legacy qui aurait dû être nettoyé après la migration `20260111_001`.
- **Risque actuel** : faible à moyen. La plupart des flux passent par la RPC mapper ou par le mapping manuel dans `OrganisationDetailSheet`. Mais un nouveau chemin de création qui passerait le Zod `['succursale', 'franchise', 'propre']` directement à un `INSERT` planterait.
- **Terminologie UI** : « Restaurant propre » comme label UX est **correcte** (design intentionnel), à ne pas confondre avec la valeur enum `'propre'` (dette).

### 8.2. Réponse à Pokawa Annemasse

- Type en DB : `franchise` ✅
- Chip « owner type » affiché : devrait montrer « Franchise » correctement
- Pas de contacts enseigne visibles : **comportement attendu** (règle métier 4)
- Si tu voulais qu'elle partage les contacts Pokawa, elle devrait être `succursale` (à changer via `/contacts-organisations/[id]` ou via l'API)

---

## 9. Plan d'action proposé

### 9.1. Documentation à écrire (FEU VERT)

**Emplacement 1** : `docs/current/database/schema/01-organisations.md`

- Ajouter une section « Règles métier `ownership_type` » sous la description de la colonne
- Lister les 4 règles métier
- Expliquer le trigger `sync_owner_type_payment_terms`
- Préciser que l'enum DB n'a que 2 valeurs

**Emplacement 2** : nouveau fichier `docs/current/REGLES-OWNERSHIP-TYPE.md`

- Doc centrale accessible aux agents et humains
- Référencée depuis `01-organisations.md`, `WORKFLOWS-CRITIQUES.md`, et `CLAUDE.md`

**Emplacement 3** : mise à jour `docs/current/WORKFLOWS-CRITIQUES.md`

- Ajouter une ligne « Héritage succursale ↔ enseigne (contacts, adresses, paiement) — voir REGLES-OWNERSHIP-TYPE.md »

### 9.2. Règle agent à créer (FEU ROUGE — j'attends ton ok)

**Emplacement** : `.claude/rules/organisations.md` (nouveau)

- Règle stricte pour les agents : « Ne jamais utiliser `'propre'` comme valeur enum. Utiliser `'succursale'` en DB et « Restaurant propre » en UX. »
- Référence à la doc `REGLES-OWNERSHIP-TYPE.md`
- Mentionner le trigger de paiement qui se déclenche automatiquement

### 9.3. Ticket de nettoyage (sprint séparé)

**Ticket** : `[BO-ORG-CLEANUP-001] refactor: remove legacy 'propre' enum value from 30+ files`

Objectif :

- Réduire le type Zod de `unified-organisation-form/types.ts:74` à `['succursale', 'franchise']`
- Retirer `'propre'` de tous les types TS explicites
- Supprimer les branches de code conditionnel qui gèrent `'propre'` (après s'être assuré que le mapping legacy est fait en amont)
- Garder « Restaurant propre » comme **label UX** uniquement (string d'affichage, pas valeur enum)
- Migration DB pour convertir toute ligne ayant `ownership_type IS NULL` mais avec `linkme_details.owner_type = 'propre'` (backfill si besoin)
- Scope : 30+ fichiers, touche `@verone/organisations`, `apps/linkme`, `apps/back-office`

Estimation : 1 bloc de 4-5 sprints.

---

## 10. Questions pour Roméo (avant d'écrire la doc)

1. **OK pour que j'écrive la doc dans `docs/current/database/schema/01-organisations.md` + le nouveau `docs/current/REGLES-OWNERSHIP-TYPE.md`** ?
2. **OK pour que je crée `.claude/rules/organisations.md`** (FEU ROUGE) ?
3. **OK pour que je crée le ticket `[BO-ORG-CLEANUP-001]` dans `.claude/work/ACTIVE.md`** pour le sprint de nettoyage futur ?
4. Pour Pokawa Annemasse : tu veux qu'on la passe en `succursale` maintenant ou elle reste `franchise` volontairement ?

---

## 11. Référence rapide (à coller dans la future doc)

### Enum DB

```sql
-- organisation_ownership_type
succursale  -- Restaurant propre (appartient à l'enseigne directement)
franchise   -- Franchisé (entreprise indépendante sous contrat)
```

### Mapping UX → DB

| Label UX          | Valeur enum DB |
| ----------------- | -------------- |
| Restaurant propre | `succursale`   |
| Succursale        | `succursale`   |
| Franchise         | `franchise`    |

### Règles métier

1. **Paiement** : `succursale` hérite délai enseigne, `franchise` = immédiat.
2. **Params commerciaux** : `succursale` = read-only hérité, `franchise` = éditable.
3. **Contacts billing** : `succursale` = partagés enseigne, `franchise` = propres.
4. **Contacts opérationnels** : `succursale` = partagés enseigne, `franchise` = propres.

### Trigger

- `trg_sync_ownership_type_payment` (BEFORE UPDATE on `organisations`) : synchronise automatiquement `prepayment_required`, `payment_terms`, `payment_terms_type` selon `ownership_type` et `enseigne.payment_delay_days`.
