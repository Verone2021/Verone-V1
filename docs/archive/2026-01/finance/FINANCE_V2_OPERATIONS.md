# Finance v2 - Workflows Operationnels

**Date**: 2025-12-27
**Version**: 2.0

---

## 1. Classer une Transaction (PCG)

### Depuis la page Transactions

1. Cliquer sur une ligne de transaction
2. Side panel s'ouvre a droite
3. Cliquer "Classer PCG"
4. Modal `QuickClassificationModal` s'ouvre:
   - Raccourcis visuels pour categories courantes
   - Recherche par code ou label
5. Selectionner la categorie
6. Cliquer "Valider"

### Resultats

- `bank_transactions.category_pcg` = code PCG
- `unified_status` passe a `classified`
- Audit log cree dans `bank_transactions_enrichment_audit`

### Raccourcis PCG Courants

| Code | Label                    | Usage                 |
| ---- | ------------------------ | --------------------- |
| 607  | Achats de marchandises   | Fournisseurs produits |
| 6222 | Commissions et courtages | Prestataires          |
| 6226 | Honoraires               | Comptable, avocat     |
| 627  | Services bancaires       | Frais Qonto           |
| 455  | Compte courant associe   | Depenses perso        |

---

## 2. Lier une Organisation

### Depuis la page Transactions

1. Cliquer sur une ligne de transaction
2. Side panel s'ouvre
3. Cliquer "Lier organisation"
4. Modal `OrganisationLinkingModal` s'ouvre:
   - Recherche par nom/IBAN
   - Suggestions basees sur contrepartie
   - Bouton "Creer organisation" si non trouve

### Creer une Organisation (dans le modal)

1. Cliquer "Creer organisation"
2. Formulaire:
   - Nom (obligatoire)
   - Type: fournisseur / prestataire / client_pro / client_particulier (obligatoire)
   - SIRET (optionnel)
   - Email (optionnel)
3. Cliquer "Creer et lier"

### Resultats

- `bank_transactions.counterparty_organisation_id` = UUID organisation
- `unified_status` passe a `classified`
- Audit log cree

---

## 3. Ajouter un Justificatif

### Depuis la page Transactions

1. Cliquer sur une ligne de transaction
2. Side panel s'ouvre
3. Cliquer "Deposer justificatif"
4. Modal `InvoiceUploadModal` s'ouvre:
   - Drag & drop fichier (PDF, JPG, PNG)
   - Ou cliquer pour selectionner
5. Upload demarre automatiquement
6. Cliquer "Valider" une fois termine

### Resultats

- Fichier stocke dans Supabase Storage
- `bank_transactions.has_attachment` = true
- Lien cree dans `bank_transaction_documents`
- Audit log cree

### Formats Acceptes

- PDF (recommande)
- JPG/JPEG
- PNG
- Max 10 MB

---

## 4. Marquer Compte Courant Associe (CCA)

### Quand utiliser?

- Depense personnelle payee avec le compte pro
- L'associe doit rembourser ou deduire de sa remuneration

### Depuis la page Transactions

1. Cliquer sur une ligne de transaction (debit)
2. Side panel s'ouvre
3. Cliquer "Compte courant associe"
4. Modal `CCAModal` s'ouvre:
   - Selection de l'associe (si plusieurs)
   - Option: "L'associe remboursera" / "Deduit de remuneration"
   - Note optionnelle
5. Cliquer "Valider"

### Resultats

- `bank_transactions.category_pcg` = '455'
- `unified_status` = 'cca'
- Audit log cree avec details

---

## 5. Ignorer une Transaction

### Quand utiliser?

- Frais bancaires automatiques
- Virements internes
- Transactions sans interet comptable

### Depuis la page Transactions

1. Cliquer sur une ligne de transaction
2. Side panel s'ouvre
3. Cliquer "Ignorer"
4. Confirmation: "Voulez-vous ignorer cette transaction?"
5. Cliquer "Confirmer"

### Resultats

- `bank_transactions.matching_status` = 'ignored'
- `unified_status` = 'ignored'
- Transaction grisee dans la liste
- Audit log cree

---

## 6. Rapprocher avec Commande

### Quand utiliser?

- Paiement client recu
- Lier a une commande sales_orders existante

### Depuis la page Transactions

1. Cliquer sur une transaction credit
2. Side panel s'ouvre
3. Cliquer "Rapprocher commande"
4. Modal `RapprochementModal` s'ouvre:
   - Suggestions basees sur montant
   - Recherche par numero de commande
   - Multi-selection si paiement groupe
5. Selectionner commande(s)
6. Cliquer "Valider"

### Resultats

- Entree(s) dans `bank_transaction_matches`
- `bank_transactions.matching_status` = 'manual_matched' ou 'partial_matched'
- `unified_status` = 'matched'
- Facture creee si necessaire (`financial_documents`)

---

## 7. Export Comptable Mensuel

### Depuis la page Transactions

1. Cliquer bouton "Envoyer au comptable" (header)
2. Modal s'ouvre:
   - Selection du mois
   - Choix destination: Achats / Ventes
   - Format: CSV ou PDF
3. Cliquer "Generer export"
4. Telecharger ou envoyer par email

### Contenu Export

**Achats (debits)**:

- Date, Libelle, Montant TTC, TVA, HT
- Organisation, Code PCG
- Justificatif (lien ou piece jointe)

**Ventes (credits)**:

- Date, Libelle, Montant TTC, TVA, HT
- Client, Numero facture
- Statut paiement

### Log d'Export

Chaque export est trace dans `accounting_exports`:

- Date export
- Periode
- Type (achats/ventes)
- Nombre transactions
- Exporte par

---

## 8. Regles Automatiques (Suggest-Only)

### Comment ca marche?

Les regles suggerent mais n'appliquent PAS automatiquement.

1. Transaction arrive de Qonto
2. Systeme cherche dans `matching_rules`:
   - Match IBAN?
   - Match nom exact?
   - Label contient pattern?
3. Si match trouve:
   - Badge "Suggestion" affiche
   - Clic pour appliquer
4. Utilisateur valide ou ignore

### Creer une Regle

1. Depuis side panel d'une transaction
2. Apres avoir classe/lie
3. Cliquer "Creer regle pour cette contrepartie"
4. Modal:
   - Type: IBAN / Nom exact / Label contient
   - Valeur (pre-remplie)
   - Organisation cible
   - PCG par defaut
5. Cliquer "Creer regle"

### Priorite des Regles

1. IBAN exact (priorite 10)
2. Nom exact (priorite 50)
3. Label contains (priorite 100)
4. Label regex (priorite 200)

---

## 9. Filtres et Recherche

### Onglets Rapides

| Onglet      | Filtre                | Description             |
| ----------- | --------------------- | ----------------------- |
| Toutes      | -                     | Toutes les transactions |
| A traiter   | `to_process`          | Sans classification     |
| Classees    | `classified`          | PCG ou org attribue     |
| Rapprochees | `matched`             | Liees a un document     |
| CCA         | `cca`                 | Compte courant associe  |
| Justifiees  | `has_attachment=true` | Avec piece jointe       |

### Filtres Secondaires

- **Annee**: 2024, 2025, ...
- **Mois**: Janvier - Decembre
- **Type**: Debit / Credit
- **Organisation**: Dropdown
- **Recherche**: Texte libre (label, nom, reference)

---

## 10. Indicateurs KPIs

### Header de Page

```
[A traiter: 42]  [Classees: 156]  [Rapprochees: 23]  [CCA: 5]  [Ignorees: 8]
```

### Barre de Progression

```
78% traite  ████████████░░░░  234/300 transactions
```

### Source Unique

Tous les KPIs viennent de `get_transactions_stats()` pour eviter les ecarts.

---

_Document mis a jour le 2025-12-27_
