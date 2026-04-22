# Audit alignement — page détail LinkMe back-office vs 2 formulaires LinkMe

**Date** : 2026-04-22
**Objectif** : comprendre la logique existante avant de toucher contacts / options de livraison / step4 (tâches #18, #21, #22, #19)
**Sources** : `docs/current/linkme/formulaires-commande-comparaison.md` + schema DB + code réel (audit lecture seule)

---

## 1. Deux formulaires LinkMe — nomenclature officielle

| Formulaire                       | Contexte                           | Fichier                                              | Hook                          | RPC                          |
| -------------------------------- | ---------------------------------- | ---------------------------------------------------- | ----------------------------- | ---------------------------- |
| **UserOrderForm** (affilié auth) | `/commandes/nouvelle` dashboard    | `apps/linkme/src/components/orders/NewOrderForm.tsx` | `use-order-form.ts`           | `create_affiliate_order`     |
| **ClientOrderForm** (public)     | `/s/[id]/catalogue` (panier modal) | `apps/linkme/src/components/OrderFormUnified.tsx`    | `use-submit-unified-order.ts` | `create_public_linkme_order` |

**Status initial commande** :

- UserOrderForm → `DRAFT`
- ClientOrderForm → `PENDING_APPROVAL` (ou `DRAFT` si restaurant existant)

---

## 2. Table `sales_order_linkme_details` — champs clés

### Informations demandeur (requester)

`requester_type`, `requester_name/email/phone/position`, `is_new_restaurant`

### Responsable / Owner

`owner_type`, `owner_contact_same_as_requester`, `owner_name/email/phone`, `owner_company_legal_name/trade_name`, `owner_kbis_url`

### Facturation

`billing_contact_source`, **`billing_name/email/phone`** ← texte brut issus du formulaire
Note : la relation FK `sales_orders.billing_contact_id` (vers `contacts`) est utilisée en parallèle pour les commandes qui sélectionnent un contact existant.

### Livraison

**`delivery_contact_name/email/phone`** (texte brut formulaire)
**`reception_contact_name/email/phone`** — **OBSOLÈTE selon Romeo**, redondant avec `delivery_contact_*`
`delivery_address/postal_code/city/latitude/longitude`
`delivery_date`, `confirmed_delivery_date`, `desired_delivery_date`, `delivery_asap`
`delivery_notes`, `semi_trailer_accessible`, `is_mall_delivery`, `mall_email`, `access_form_required`

### Modalités livraison

`delivery_terms_accepted` (boolean) — cochée dans les 2 formulaires LinkMe obligatoirement avant soumission. **Déjà validée côté LinkMe → redondante à afficher/éditer côté back-office**.

### Step4 (flow email de confirmation client)

`step4_token`, `step4_token_expires_at`, `step4_completed_at`

---

## 3. Cas SO-2026-00158 — diagnostic terrain (vérifié en DB)

```
channel_id = LinkMe
created_by_affiliate_id = cdcb3238... (Thérèse Duport Pokawa)
linkme_selection_id = NULL  ← PAS créée depuis sélection publique
has_step4_token = false
step4_completed_at = null
delivery_date = NULL
delivery_contact_name = NULL
billing_name = NULL
reception_contact_name = NULL
delivery_terms_accepted = false
```

**→ Commande créée via UserOrderForm** (affilié dashboard), PAS via ClientOrderForm public.
**→ Tous les champs `sales_order_linkme_details.*` sont vides** alors que Romeo dit avoir rempli la date.

**Hypothèse** : les `EditDialogs` (EditDeliveryAddressDialog, EditDeliveryOptionsDialog, etc.) ne persistent pas dans `sales_order_linkme_details`. Ils écrivent peut-être sur `sales_orders` directement (`shipping_address` JSONB) OU `contacts` (via FK) mais pas sur `linkme_details`. À vérifier dans `use-linkme-order-actions.ts` / `updateLinkmeDetails`.

---

## 4. Logique `isStep4Complete` — cause du badge « Incomplet »

`apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/hooks.ts:518`

```ts
isStep4Complete: !!order?.linkmeDetails?.step4_completed_at;
```

**C'est UNIQUEMENT basé sur `step4_completed_at`** (timestamp set quand le client clique sur le lien email). Aucune vérification des champs delivery_date / contact / adresse.

**Conséquence** : tant que le client n'a pas cliqué sur le lien email step4, le badge reste « Incomplet », même si staff remplit manuellement toutes les infos côté back-office.

---

## 5. « Post-approbation — En attente de confirmation via le lien email »

Source : `DeliveryCard.tsx:282-343` (bloc `details.step4_token && ...`)

Flow step4 :

1. Commande LinkMe créée en `pending_approval`
2. Staff approuve → génère `step4_token` + envoie email au client (restaurant)
3. Client clique sur le lien dans l'email → page publique step4 pré-remplie avec les données → confirme
4. `step4_completed_at = now()` → badge passe à « Complet »

**Pourquoi Romeo dit « totalement faux » ?** Hypothèse : ce flow n'est pas le workflow métier actuel. L'email de confirmation step4 n'est peut-être plus envoyé / plus pertinent / obsolète. À confirmer avec Romeo.

---

## 6. Pour les PRs à venir — stratégie alignée

### PR `BO-LM-CONTACTS-001` — Contact Facturation dans DeliveryCard

**Pattern cible** : symétrique au bloc « Contact livraison » existant `DeliveryCard.tsx:57-79`.

```tsx
// Contact facturation — only show if NOT already in fused cards (billing role)
{
  !fusedContacts.some(g => g.roles.includes('billing')) && (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Contact facturation
        </p>
        {!locked && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenContactDialog('billing')}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Changer
          </Button>
        )}
      </div>
      {details.billing_name ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">{details.billing_name}</span>
          {details.billing_email && (
            <a href={`mailto:${details.billing_email}`}>...</a>
          )}
          {details.billing_phone && <span>{details.billing_phone}</span>}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">Aucun contact renseigné</p>
      )}
    </div>
  );
}
```

**Même pattern pour responsable** si absent de `fusedContacts`.

**Vérifier** : `ContactSelectionDialog` gère déjà `role: 'billing'` + `updateLinkmeDetails` persiste bien dans `sales_order_linkme_details.billing_name/email/phone`.

### PR `BO-LM-DELIVERY-CLEANUP-001` — Retirer champs obsolètes

1. **Retirer** de `EditDeliveryOptionsDialog` :
   - `delivery_terms_accepted` (toggle « Modalités de livraison acceptées »)
   - `reception_contact_name/email/phone` (contact réception redondant)
2. **Garder en lecture seule** l'affichage `delivery_terms_accepted` **UNIQUEMENT** si commande créée depuis LinkMe public (pour audit). Masquer totalement si commande back-office.
3. **Fix `isStep4Complete`** :
   ```ts
   // Nouveau pattern
   const isLinkMeApproval =
     order?.status === 'pending_approval' && !!details.step4_token;
   const manualFieldsComplete =
     !!details.delivery_date &&
     !!details.delivery_contact_name &&
     !!details.delivery_address;
   const isStep4Complete = isLinkMeApproval
     ? !!details.step4_completed_at
     : manualFieldsComplete;
   ```
4. **Masquer la section « Post-approbation »** si `!isLinkMeApproval`.

### Audit `BO-LM-STEP4-AUDIT-001` (tâche #19)

Rapporter à Romeo :

- D'où vient le flow step4 (qui a codé, pour quoi, toujours actif ?)
- Est-ce que l'email step4 est toujours envoyé ? Si oui, par qui ?
- Décision : garder / supprimer / désactiver ?

**Ne rien modifier tant que Romeo n'a pas tranché.** Logs à checker : table `sales_order_events`, route API qui génère `step4_token`.

---

## 7. Règle d'alignement absolue

**Les 2 formulaires LinkMe sont la SOURCE DE VÉRITÉ.** Tout champ qu'ils remplissent → doit être visible/éditable en back-office. Tout champ qu'ils ne remplissent pas → ne doit PAS figurer en édition back-office (risque désynchro).

Checklist à faire avant toute modif DeliveryCard / contacts :

- [ ] Confirmer que `updateLinkmeDetails` persiste bien les 3 contacts (responsable / billing / delivery)
- [ ] Valider que `ContactSelectionDialog` gère les 3 rôles
- [ ] Tester que remplir la date livraison dans back-office la sauvegarde bien en `sales_order_linkme_details.delivery_date`
