# Audit — Mécanisme "maison mère" dans le schéma organisations

**Date** : 2026-04-19
**Déclencheur** : confusion de ma part, Romeo a exigé un audit propre.

---

## 1. Découverte clé (RTFM)

La colonne **`organisations.is_enseigne_parent`** (boolean NOT NULL, default false) **existe déjà** et modélise exactement la maison mère.

- `docs/current/database/schema/01-organisations.md` ligne 343
- Doc DB générée le 2026-04-19 16:00
- Trigger associé : `trigger_enseigne_member_count` (AFTER INSERT)

Je n'aurais jamais dû poser la question "comment identifier la maison mère". L'info était dans la doc que je suis censé lire systématiquement (checklist CLAUDE.md étape 1).

---

## 2. Structure réelle

```
enseignes (groupement commercial)
├── id
├── name ("Pokawa")
└── (pas de SIRET ici — normal, enseigne = groupe)

organisations (entité légale)
├── id
├── legal_name
├── siret          ← présent sur la maison mère, optionnel sur filiales
├── vat_number
├── enseigne_id    ← FK vers enseignes.id (partagé par toutes les orgs du groupe)
└── is_enseigne_parent  ← TRUE pour la maison mère, FALSE pour les filiales
```

**Cas Pokawa** :

- Enseigne : "Pokawa" (id `de1bcbd7-0086-4632-aedb-ece0a5b3d358`)
- Maison mère : 1 org Pokawa SAS avec `is_enseigne_parent = true` + SIRET + VAT
- Filiales : 157 autres orgs (ex: Pokawa Avignon) avec `is_enseigne_parent = false`, souvent sans SIRET

---

## 3. État des données (prod 2026-04-19)

| Type org                     | Total | Avec SIRET | Avec VAT | Lié à enseigne |
| ---------------------------- | ----- | ---------- | -------- | -------------- |
| `is_enseigne_parent = false` | 209   | 56         | 9        | 165            |
| `is_enseigne_parent = true`  | **1** | 1          | 1        | 1              |

**Le schéma existe, mais Romeo n'a pour l'instant désigné qu'UNE SEULE maison mère en base** (Pokawa). Pour toutes les autres enseignes qui poseraient le même problème, il faudra remplir `is_enseigne_parent = true` sur l'org correspondante.

### Enseignes actives sans parent désigné (auto-resolve échouerait)

| Enseigne             | Nb orgs | Nb parents | Nb parents avec SIRET |
| -------------------- | ------- | ---------- | --------------------- |
| Black & White Burger | 8       | 0          | 0                     |
| Pokawa               | 158     | 1          | 1                     |

Toutes les autres enseignes actives n'ont actuellement pas de parent défini.

---

## 4. Algorithme auto-resolve maison mère (BO-FIN-040)

### Entrée

`orderCustomerId` (uuid de l'org commande, potentiellement sans SIRET)

### Sortie

`billingOrg` suggéré : `{ id, legal_name, siret, vat_number } | null`

### Logique

```sql
-- Étape 1 : si l'org commande a elle-même un SIRET/VAT, pas besoin d'auto-resolve
SELECT id, siret, vat_number
FROM organisations
WHERE id = :order_customer_id AND archived_at IS NULL;

-- Étape 2 : sinon, chercher la maison mère de la même enseigne
SELECT parent.id, parent.legal_name, parent.trade_name, parent.siret, parent.vat_number, parent.email
FROM organisations child
JOIN organisations parent
  ON parent.enseigne_id = child.enseigne_id
  AND parent.is_enseigne_parent = true
  AND parent.archived_at IS NULL
WHERE child.id = :order_customer_id
  AND (child.siret IS NULL OR child.siret = '')
  AND (parent.siret IS NOT NULL OR parent.vat_number IS NOT NULL)
LIMIT 1;
```

### Comportement UI

- **Cas nominal** (maison mère trouvée) :
  1. Pré-sélectionner la maison mère comme `billingOrg` dans le modal devis/facture
  2. Toast : "Organisation « Pokawa Avignon » sans SIRET. Facturation dirigée vers la maison mère « Pokawa SAS » (SIRET: 12345678901234). Vous pouvez changer via le picker."
  3. L'utilisateur peut ouvrir le picker et choisir une autre org

- **Cas dégradé** (aucune maison mère avec SIRET) :
  1. Ne pas pré-sélectionner
  2. Message bloquant : "Aucune organisation avec SIRET disponible pour facturation. Désignez une maison mère via la fiche enseigne."
  3. HTTP 400 si l'utilisateur tente de créer le devis/facture sans SIRET (règle strict BO-FIN-039)

---

## 5. Implications pour BO-FIN-039 (en cours)

Le dev-plan BO-FIN-039 reste **inchangé** :

- `financial_documents.billing_org_id` = org facturée (suggérée par auto-resolve, ou choisie manuellement)
- `sales_orders.customer_id` = INCHANGÉ (reste l'org commande originale)
- Guard SIRET : HTTP 400 si `billing_org_id` ET `order.customer_id` n'ont pas de SIRET/VAT (devis ET facture)

---

## 6. Impact BO-FIN-040 (auto-resolve)

### Scope code

1. **Hook React** `packages/@verone/finance/src/hooks/useSuggestedBillingOrg.ts` (NOUVEAU)
   - Input : `orderCustomerId`
   - Output : `{ data: BillingOrgSuggestion | null, isLoading }` via Supabase query
2. **Intégration modals** :
   - `QuoteCreateFromOrderModal` : pré-sélectionner via useEffect sur ouverture si org commande sans SIRET
   - `InvoiceCreateFromOrderModal` : idem
3. **UI toast** (via `@verone/ui` sonner)

### Scope data

- **Aucun** migration requise (colonne `is_enseigne_parent` déjà là)
- **Romeo doit remplir** `is_enseigne_parent = true` sur les orgs maisons mères restantes (manuel via `/contacts-organisations/clients` ou SQL direct)

---

## 7. Ce que je corrige dans ma mémoire

Ajouter à `memory/feedback_*.md` :

- **Toujours lire les docs DB** (`docs/current/database/schema/*.md`) **AVANT** de poser des questions sur la structure
- Le mécanisme "maison mère" dans Verone = `organisations.is_enseigne_parent` + `organisations.enseigne_id`
- Pas de `parent_organisation_id`, pas d'auto-référence
- Les `enseignes` sont des groupements sans SIRET ni adresse légale

---

## 8. Fichiers à surveiller / références

- `docs/current/database/schema/01-organisations.md` (source de vérité schéma)
- `.claude/rules/finance.md` R5/R6/R7 (règles métier devis/factures)
- `docs/scratchpad/dev-plan-2026-04-19-BO-FIN-039.md` (en cours par dev-agent)
- `docs/scratchpad/audit-siret-devis-facture-2026-04-19.md` (audit source)
