# Audit Workflow : Commandes, Devis, Factures Proforma

Date : 2026-04-11
Auteur : Claude Opus 4.6

## 1. Etat actuel du workflow Verone

```
COMMANDE (source de verite)
  |
  |-- "Devis" --> Devis Qonto (brouillon → finalise → accepte)
  |
  |-- "Facture" --> Facture Qonto (brouillon/proforma → finalisee)
```

- La commande est la SOURCE UNIQUE de verite
- Depuis une commande (non-brouillon), on peut creer un devis ET/OU une facture
- Les devis vivent exclusivement dans Qonto (pas de stockage local)
- Les factures brouillon (proforma) vivent dans Qonto (pas de stockage local)
- Seules les factures finalisees sont stockees localement (pour rapprochement bancaire)

## 2. Ce que fait Odoo (reference industrie)

Source : Documentation Odoo 18/19

### Principe fondamental

> "La facture proforma reflete EXACTEMENT ce qui est dans la commande. S'il y a un changement dans la commande apres emission de la proforma, il faut mettre a jour la commande et REGENERER la proforma."

### Workflow Odoo

1. Devis (Quotation) = proposition commerciale
2. Le client accepte → le devis devient Commande (Sales Order)
3. Depuis la Commande → on genere la facture proforma
4. Depuis la Commande → on genere la facture definitive
5. Si la commande change → la proforma est regeneree automatiquement

### Difference cle avec Verone

Chez Odoo, le devis SE TRANSFORME en commande (meme document qui change de statut).
Chez Verone, le devis et la commande sont des documents SEPARES lies par une reference.

## 3. Ce que fait Qonto (notre API de facturation)

### Capacites confirmees

- Un devis peut etre converti en facture brouillon (1 clic)
- Le champ `purchase_order_number` permet de lier un N° de commande a un devis/facture
- Plusieurs devis possibles pour un meme client (pas de limitation)
- Pas de lien natif "commande → devis" dans Qonto (c'est nous qui gerons ce lien)
- Devis et factures sont des objets independants dans Qonto

### Limitations Qonto

- Qonto ne connait PAS nos commandes (sales_orders) — c'est un outil de facturation, pas un ERP
- Pas de synchronisation automatique entre devis et commande
- Si on convertit un devis en facture, Qonto ne verifie PAS la coherence avec la commande

## 4. Problematiques identifiees

### Probleme 1 : Commande brouillon modifiee apres emission de documents

**Scenario** : On cree une commande brouillon → on genere un devis → on modifie la commande → le devis est desormais incoherent.

**Risque** : Le client recoit un devis avec des montants/articles differents de ce qu'on va reellement lui livrer.

### Probleme 2 : Facture proforma desynchronisee

**Scenario** : On cree une facture proforma depuis la commande → on modifie la commande → la proforma affiche les anciens montants.

**Risque** : Incoherence entre le document envoye au client et la commande reelle.

### Probleme 3 : Conversion devis → facture sans commande

**Scenario** : Un devis standalone (cree sans commande) est converti en facture.

**Risque** : Pas de commande = pas de stock previsionnel, pas de suivi logistique, pas de lien avec le workflow operationnel.

**Statut** : Ce risque est DEJA elimine — on a supprime le code mort qui auto-creait des commandes, et les devis standalone ne sont plus stockes localement.

## 5. Recommandations

### Regle 1 : Deux types de documents — Commande et Service

Il existe **deux flux** de creation de devis/factures :

**A. Facture/Devis "Commande"** — lie a une sales_order

- Cree depuis le detail commande ou depuis /factures/nouvelle en selectionnant une commande
- Articles pre-remplis depuis `sales_order_items`
- `sales_order_id` renseigne dans `financial_documents`
- Le bouton "Devis" et "Facture" dans PaymentSection (detail commande) utilisent ce flux

**B. Facture/Devis "Service" (IBD/libelle)** — standalone

- Cree depuis /factures/nouvelle sans commande (option "Facture de service")
- Articles saisis librement (libelle, quantite, prix)
- `sales_order_id = NULL` dans `financial_documents`
- Comptabilise dans le CA comme facture de service

**Distinction** : `sales_order_id IS NOT NULL` = Commande, `NULL` = Service.

**Email** : L'email client est FACULTATIF pour les deux types. Qonto accepte la creation de client sans email. On ne genere JAMAIS de placeholder email.

**Statut actuel** : Les deux flux sont en place et fonctionnels.

### Regle 2 : Plusieurs devis possibles pour une commande

- Chaque nouveau devis genere un nouveau document Qonto
- L'ancien devis n'est PAS supprime (historique conserve)
- Le dernier devis est considere comme "actif"
- Qonto supporte cela nativement (pas de limite)

**Statut actuel** : Deja en place. Le code gere `supersededQuoteIds` pour marquer les anciens comme "remplaces".

### Regle 3 : Quand la commande brouillon est modifiee

**Option A (recommandee — alignee sur Odoo)** :
Quand l'utilisateur modifie une commande qui a des documents lies :

1. Afficher un modal d'avertissement : "Cette commande a un devis (D-2026-039) et/ou une facture proforma. Ces documents ne seront plus alignes avec la commande."
2. Proposer 2 actions :
   - "Modifier quand meme" → la commande est modifiee, les documents restent (avec un badge "desynchronise")
   - "Modifier et regenerer" → la commande est modifiee, un nouveau devis/proforma est auto-genere

**Option B (plus stricte)** :
Bloquer la modification de la commande tant qu'il y a des documents lies non-annules. Obliger l'utilisateur a annuler d'abord les documents, puis modifier la commande.

**Recommandation** : Option A. C'est ce que fait Odoo (mettre a jour + regenerer). L'option B est trop rigide pour le quotidien.

### Regle 4 : Commande validee = immutable

- Une commande validee NE PEUT PAS etre modifiee (deja en place)
- Les documents lies a une commande validee sont fiables par definition
- Pour modifier, il faut annuler la commande et en creer une nouvelle

**Statut actuel** : Deja en place. Le formulaire d'edition est bloque pour les commandes validees.

### Regle 5 : Conversion devis → facture

- Actuellement possible dans Qonto (bouton "Convertir en facture" sur devis accepte)
- La conversion cree une facture BROUILLON (proforma), pas une facture finale
- On a supprime le code qui auto-creait une commande lors de cette conversion

**Recommandation** : Garder cette fonctionnalite MAIS ajouter un garde-fou :

- La conversion n'est autorisee QUE si le devis est lie a une commande
- Si le devis est standalone (pas de `purchase_order_number`), bloquer la conversion et afficher "Ce devis doit etre lie a une commande avant de pouvoir etre converti en facture"

### Regle 6 : Facture proforma → facture finale

- C'est le workflow normal : proforma → finalisee
- La finalisation dans Qonto est IRREVERSIBLE (numero officiel attribue)
- Avant finalisation, verifier que la proforma est toujours alignee avec la commande

**Recommandation** : Avant de finaliser, afficher un avertissement si le montant de la proforma differe du total de la commande.

## 6. Plan d'implementation (par priorite)

### Phase 1 — Garde-fous (rapide, 1-2 jours)

1. Modal d'avertissement quand on modifie une commande avec documents lies
2. Bloquer la conversion devis → facture si le devis n'est pas lie a une commande
3. Avertissement avant finalisation si montants divergent

### Phase 2 — Synchronisation (moyen, 3-5 jours)

4. Quand une commande brouillon est modifiee, proposer de regenerer la proforma
5. Badge "desynchronise" sur les documents dont la commande a change

### Phase 3 — Ameliorations UX (plus tard)

6. Afficher l'historique des devis d'une commande (timeline)
7. Comparaison visuelle commande vs devis/proforma

## 7. Ce qu'il ne faut PAS faire

- Ne PAS creer de commande depuis un devis ou une facture (workflow inverse = chaos)
- Ne PAS stocker les devis ou proforma localement (Qonto = source unique)
- Ne PAS permettre de modifier les articles d'une facture/devis de COMMANDE independamment de la commande
- Ne PAS auto-supprimer les devis quand la commande change (garder l'historique)
- Ne PAS generer de placeholder email (noreply@...) — l'email est facultatif dans Qonto
- Ne PAS bloquer la creation d'un devis/facture de service sous pretexte qu'il n'y a pas de commande

## Sources

- Odoo 18/19 Documentation : https://www.odoo.com/documentation/19.0/applications/sales/sales/invoicing/proforma.html
- Odoo Forum — Difference proforma/invoice/quotation : https://www.odoo.com/forum/sales-4/difference-between-pro-forma-invoice-invoice-and-quotation-223394
- Qonto API — Create Invoice : https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/client-invoices/create-a-client-invoice
- Qonto API — Quotes : https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/quotes/create-a-quote
- Qonto — Gestion devis et factures : https://qonto.com/en/invoicing/quotes
- DealHub — Quote-to-Order : https://dealhub.io/glossary/quote-to-order/
- ERP Software Blog — Synchronisation documents D365 : https://erpsoftwareblog.com/2022/08/how-to-keep-quote-order-and-invoice-numbers-synchronized-in-d365-business-central-with-advanced-document-numbering-adn/
