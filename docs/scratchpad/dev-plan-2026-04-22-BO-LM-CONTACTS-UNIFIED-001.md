# Dev plan — BO-LM-CONTACTS-UNIFIED-001

**Branche** : `fix/BO-LM-CONTACTS-UNIFIED-001` (base `staging`)
**Scope** : Option 1 conservateur (validé par Romeo)
**Effort** : ~2h30

---

## Contexte

Sur la page détail LinkMe `/canaux-vente/linkme/commandes/[id]/details`, l'utilisateur **ne peut plus** assigner un contact de facturation après avoir assigné un contact responsable. Seul le contact livraison reste éditable (via DeliveryCard).

Audit confirmé :

- `DeliveryCard.tsx:57-79` expose uniquement **Contact livraison** avec bouton « Changer » → `onOpenContactDialog('delivery')`
- **Aucune** section équivalente pour billing / responsable
- `ContactSelectionDialog` gère pourtant les 3 rôles (titles + prop `contactDialogFor`)
- La prop `onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void` est techniquement prête

Régression née du split BO-MAXLINES-053 (2025-12) où les sections billing/responsable n'ont pas été restaurées dans `DeliveryCard` après extraction.

## Décision UX validée

Section **Contacts unifiée** (pattern Odoo res.partner) :

- 1 bloc unique « Contacts » en haut de la colonne droite
- Affiche chaque contact dédupliqué avec badges cumulables (Resp./Fact./Livr.)
- Pour chaque **rôle manquant**, 2 boutons :
  - [Assigner] → ouvre `ContactSelectionDialog` existant avec le rôle
  - [Demander] → ouvre nouveau modal qui appelle `POST /api/emails/linkme-info-request`

Supprime les 3 cards `fusedContacts.map(...)` scatter + la section "Contact livraison" de `DeliveryCard.tsx:57-79`.

**Hors scope** (PR suivantes) :

- Post-approbation retirée → PR 2 `BO-LM-DELIVERY-CLEANUP-001`
- `delivery_terms_accepted` + `reception_contact_*` retirés → PR 2
- Fix `isStep4Complete` → PR 2
- Extension bouton « Demander compléments » sur validated/partially_shipped → PR 3

---

## Fichiers à créer / modifier

### 1. NOUVEAU `ContactsUnified.tsx` (~200 L max)

**Path** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/ContactsUnified.tsx`

**Props** :

```ts
interface ContactsUnifiedProps {
  order: OrderWithDetails;
  fusedContacts: FusedContactGroup[]; // déjà calculé dans hooks.ts
  locked: boolean; // si status locké, pas de boutons édition
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
  onOpenRequestModal: (role: 'responsable' | 'billing' | 'delivery') => void;
}
```

**Rendu** :

```
┌─ Card "Contacts" ──────────────────────────────┐
│ 📧 CONTACTS                     [+ Nouveau contact] │ (header)
│ ──────                                              │
│ ┌─ Contact 1 ────────────────────────────────┐    │
│ │ 👤 Lucie Vandecapelle  [Resp.] [Fact.]     │    │
│ │ ✉ lucie@pokawa.fr   📞 06.XX.XX.XX.XX     │    │
│ │ Poste : Directrice                         │    │
│ └────────────────────────────────────────────┘    │
│                                                    │
│ ... (autres contacts dédupliqués) ...              │
│                                                    │
│ ⚠ Rôles manquants :                               │
│  💳 Facturation  [Assigner] [Demander]            │
│  🚚 Livraison    [Assigner] [Demander]            │
└────────────────────────────────────────────────────┘
```

**Logique** :

- Calcul rôles manquants : `missingRoles = ['responsable','billing','delivery'].filter(r => !fusedContacts.some(g => g.roles.includes(r)))`
- Rendu conditionnel section "Rôles manquants" seulement si `missingRoles.length > 0 && !locked`
- Bouton "+ Nouveau contact" global : ouvre `ContactSelectionDialog` sans rôle pré-sélectionné (ou rôle par défaut = premier manquant)

**Responsive** :

- Touch 44px mobile (`h-11 md:h-9`) sur [Assigner], [Demander]
- Cards empilées verticalement (pas grid), déjà mobile-first

**Pattern visuel** : réutilise le rendu actuel des fusedContacts.map (RightColumn.tsx:181-279) — badges `Resp./Fact./Livr.` avec `roleBadgeColors`, texte contact, email mailto, phone.

### 2. NOUVEAU `RequestMissingFieldModal.tsx` (~150 L max)

**Path** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/RequestMissingFieldModal.tsx`

**Props** :

```ts
interface RequestMissingFieldModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  role: 'responsable' | 'billing' | 'delivery' | null;
  onSuccess?: () => void;
}
```

**Rendu** :

- Dialog `h-screen md:h-auto md:max-w-lg`
- Titre dynamique : "Demander le contact {role}"
- Préselection destinataire : `requester_email` (depuis linkmeDetails) ou `organisation.email` ou `individual.email`
- Input email éditable si manual
- Textarea message pré-rempli par défaut : "Bonjour, pour finaliser votre commande {order_number}, pouvez-vous nous transmettre le {role}..."
- Boutons : Annuler (outline w-full md:w-auto) + Envoyer (primary, disabled si pas d'email, w-full md:w-auto)
- Touch 44px mobile

**Handler `handleSend`** :

```ts
const res = await fetch('/api/emails/linkme-info-request', {
  method: 'POST',
  body: JSON.stringify({
    salesOrderId: order.id,
    orderNumber: order.order_number,
    recipientEmail: email,
    recipientName: name,
    recipientType: 'manual',
    organisationName: order.organisation?.trade_name ?? null,
    totalTtc: order.total_ttc,
    requestedFields: [
      {
        key: `contact_${role}`,
        label: `Contact ${role === 'responsable' ? 'responsable' : role === 'billing' ? 'facturation' : 'livraison'}`,
        category: role,
        inputType: 'contact',
      },
    ],
    customMessage: message || null,
  }),
});
```

### 3. MODIFIÉ `RightColumn.tsx`

**Avant** (lignes 181-279) : `{fusedContacts.map(group => ...)}` avec 3 cards scatter

**Après** :

```tsx
<ContactsUnified
  order={order}
  fusedContacts={fusedContacts}
  locked={locked}
  onOpenContactDialog={onOpenContactDialog}
  onOpenRequestModal={(role) => setRequestModalRole(role)}
/>
<RequestMissingFieldModal
  open={!!requestModalRole}
  onClose={() => setRequestModalRole(null)}
  order={order}
  role={requestModalRole}
  onSuccess={() => { refetchOrder(); setRequestModalRole(null); }}
/>
```

### 4. MODIFIÉ `DeliveryCard.tsx`

**Retirer** lignes 57-79 (section "Contact livraison" — redondante avec ContactsUnified) :

```diff
- {!fusedContacts.some(g => g.roles.includes('delivery')) && (
-   <div className="space-y-2">
-     <div className="flex items-center justify-between">
-       <p>Contact livraison</p>
-       <Button onClick={() => onOpenContactDialog('delivery')}>Changer</Button>
-     </div>
-     ... affichage details.delivery_contact_* ...
-   </div>
- )}
```

**NE PAS** toucher aux autres sections (adresse, options, post-approbation — PR 2 s'en occupe).

### 5. MODIFIÉ `hooks.ts` (éventuel)

Vérifier que `fusedContacts` est bien exposé + le handler state pour RequestModal :

```ts
const [requestModalRole, setRequestModalRole] = useState<
  'responsable' | 'billing' | 'delivery' | null
>(null);
```

---

## Contraintes règles Verone

- ✅ Zéro `any`, zéro `eslint-disable`
- ✅ Tous fichiers < 400 L (cible : ContactsUnified ~200, RequestMissingFieldModal ~150)
- ✅ Touch 44px mobile (`h-11 md:h-9`)
- ✅ Modal responsive `h-screen md:h-auto md:max-w-lg`
- ✅ Footer `flex-col md:flex-row`
- ✅ Aucune modif DB (réutilise `linkme_info_requests` + endpoint existant)
- ✅ Aucune modif webhook
- ✅ 5 EditDialogs existants intacts (aucune régression d'éditabilité)
- ✅ Les formulaires LinkMe `apps/linkme/*` sont **INTOUCHÉS**

---

## Validation obligatoire

1. `pnpm --filter @verone/back-office type-check` → PASS
2. `pnpm --filter @verone/back-office lint` → PASS (0 warning)
3. `wc -l ContactsUnified.tsx RequestMissingFieldModal.tsx` → tous < 400
4. `RightColumn.tsx` ne dépasse pas 500 L après modif

---

## Gaps détectés hors scope (à signaler Romeo pour PR future)

Audit des 5 EditDialogs révèle :

- `EditResponsableDialog` édite `requester_*` (demandeur) PAS `responsable_contact_id` FK
- `EditBillingDialog` édite `billing_*` texte, PAS le FK `billing_contact_id` ni l'organisation facturation
- Gap : `franchiseInfo.companyLegalName/siret`, `owner_kbis_url`, `billingOrg.customOrganisation.*` non éditables
- Gap : édition Restaurant/Organisation depuis page détail non disponible

À traiter dans PR future `BO-LM-DIALOGS-GAP-001` si Romeo valide (scope beaucoup plus large).
