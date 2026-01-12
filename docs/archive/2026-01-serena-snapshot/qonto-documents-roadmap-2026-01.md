# Roadmap Documents Qonto (Janvier 2026)

## Contexte

Suite aux demandes utilisateur du 7 janvier 2026, voici les fonctionnalites a implementer pour les documents Qonto.

## Documents a implementer via API Qonto

### 1. Factures (FAIT - Partiel)

- [x] Creation de facture depuis commande validee
- [x] Modal InvoiceCreateFromOrderModal
- [x] Selection commande via OrderSelectModal
- [ ] Liste des factures existantes sur Qonto
- [ ] Annulation de facture (cancel)
- [ ] Finalisation de facture (finalize)

### 2. Devis (A FAIRE)

- [ ] Creation de devis depuis commande
- [ ] Conversion devis -> facture
- [ ] Liste des devis
- [ ] Annulation de devis

### 3. Avoirs / Credit Notes (A FAIRE)

- [ ] Creation d'avoir depuis facture existante
- [ ] Motifs d'avoir (retour, erreur, remise)
- [ ] Liste des avoirs
- [ ] Association avoir <-> facture originale

## Regles metier importantes

1. **Seules les commandes VALIDEES peuvent avoir une facture**
   - Commandes draft/cancelled/shipped ne peuvent pas etre facturees
2. **Une commande expediee ne peut plus avoir sa facture modifiee**
   - Il faut obligatoirement creer un avoir en cas de probleme
3. **Les factures finalisees sont IRREVERSIBLES**
   - Numero sequentiel brule
   - Voir memoire `qonto-invoices-never-finalize-2026-01-07`

## Bons de livraison / Reception (Hors scope Qonto)

Ces documents ne passent PAS par l'API Qonto mais sont generes localement:

- [ ] Bon de livraison (delivery note) - PDF a telecharger
- [ ] Bon de reception (receipt note) - PDF a telecharger
- [ ] Recap commande pour expedition

A implementer separement, probablement via generation PDF locale (react-pdf ou puppeteer).

## Priorites

1. HIGH: Avoirs (pour gerer les erreurs de facturation)
2. MEDIUM: Devis (pour cycle commercial complet)
3. LOW: Bons de livraison (confort utilisateur)

---

Date: 2026-01-07
