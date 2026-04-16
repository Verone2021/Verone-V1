# Workflows Critiques - Back Office Verone

**Derniere mise a jour** : 2026-04-16
**Total workflows** : 5 critiques + 3 secondaires
**Raison d'etre** : Source de verite unique pour les parcours utilisateur qui doivent etre testes E2E en priorite.

Ce document liste les workflows metier critiques du back-office. Chaque workflow est un enchainement de pages / actions qui represente un usage reel quotidien. Les tests E2E Playwright doivent couvrir ces parcours en priorite.

**Voir aussi** :

- [INDEX-PAGES-BACK-OFFICE.md](./INDEX-PAGES-BACK-OFFICE.md) - liste des 139 pages
- [WORKFLOW-VENTES.md](./WORKFLOW-VENTES.md) - detail chaine commerciale
- [modules/orders-workflow-reference.md](./modules/orders-workflow-reference.md) - statuts SO/PO
- [modules/stock-module-reference.md](./modules/stock-module-reference.md) - module stock
- [finance/finance-reference.md](./finance/finance-reference.md) - comptabilite

---

## Classification

| Niveau       | Impact si casse                     | Priorite test E2E |
| ------------ | ----------------------------------- | ----------------- |
| **Critique** | Perte financiere directe ou blocage | P0 - Urgent       |
| **Eleve**    | Dysfonctionnement majeur            | P1 - Eleve        |
| **Moyen**    | Inconfort utilisateur               | P2 - Moyen        |

---

## Workflow 1 - Expedition commande (CRITIQUE)

**Niveau** : Critique
**Frequence** : Plusieurs fois par jour
**Derniere regression** : Bug silencieux non detecte (bouton Expedier ne declenchait pas le modal)

### Parcours

```
/stocks -> /stocks/expeditions -> Modal ShipmentWizard (7 etapes) -> Validation
```

### Etapes detaillees

| Etape | Action                                     | Page / Composant      | Point critique                              |
| ----- | ------------------------------------------ | --------------------- | ------------------------------------------- |
| 1     | Acces dashboard stock                      | `/stocks`             | KPI affiches                                |
| 2     | Liste expeditions                          | `/stocks/expeditions` | Commandes validees visibles                 |
| 3     | Clic bouton "Expedier"                     | Bouton ligne tableau  | **Modal doit s'ouvrir**                     |
| 4     | Step 1 wizard : Stock                      | `ShipmentWizard`      | Produits + quantites corrects               |
| 5     | Step 2 wizard : Mode livraison             | `ShipmentWizard`      | 4 options (retrait, main, manuel, packlink) |
| 6     | Step 3-6 : Selection, emballage, etiquette | `ShipmentWizard`      | Champs interactifs                          |
| 7     | Step 7 wizard : Validation                 | Bouton "Valider"      | Statut commande -> `expediee`               |

### Criteres de validation

- Le modal s'ouvre au clic sur "Expedier" (0 bug silencieux)
- Les 7 etapes du wizard sont accessibles sans blocage
- Aucune erreur console JS
- Fermeture Escape ne laisse pas d'effet de bord

### Test E2E

`apps/back-office/e2e/workflow-stock-expeditions.spec.ts`

---

## Workflow 2 - Chaine commerciale complete (CRITIQUE)

**Niveau** : Critique
**Frequence** : Quotidienne
**Voir** : [WORKFLOW-VENTES.md](./WORKFLOW-VENTES.md) (detail complet)

### Parcours

```
Consultation -> Commande -> Devis -> Facture -> Paiement -> Rapprochement
                   |          |         |
                Devis <-> Commande   Facture -> Avoir
```

### Pages touchees

| Domaine      | Pages principales                                                          |
| ------------ | -------------------------------------------------------------------------- |
| Consultation | `/consultations`, `/consultations/create`, `/consultations/[id]`           |
| Commande     | `/commandes/clients`                                                       |
| Devis        | `/devis`, `/devis/nouveau`, `/factures/devis/[id]`                         |
| Facture      | `/factures`, `/factures/nouvelle`, `/factures/[id]`, `/factures/[id]/edit` |
| Qonto        | `/factures/qonto`                                                          |

### Points critiques

- Creation facture : choix "depuis commande" OU "service" (modal `InvoiceCreateFromOrderModal`)
- Finalisation proforma -> facture (num PROFORMA-xxx -> F-2026-xxx)
- Conversion devis -> facture (cree `sales_order` automatiquement)
- Source de verite Qonto : devis + factures + avoirs (via API)
- Source de verite Supabase : commandes + consultations

### Test E2E

`apps/back-office/e2e/workflow-finance.spec.ts`

---

## Workflow 3 - Gestion produits (ELEVE)

**Niveau** : Eleve
**Frequence** : Hebdomadaire (ajout catalogue)

### Parcours

```
/produits/sourcing -> Creation sourcing -> Validation -> /produits/catalogue/nouveau -> Publication
                          |
                  /produits/sourcing/echantillons
```

### Etapes

| Etape | Action                              | Page                                               |
| ----- | ----------------------------------- | -------------------------------------------------- |
| 1     | Parcourir sourcing                  | `/produits/sourcing` (3 vues : liste/kanban/carte) |
| 2     | Creer produit sourcing              | `/produits/sourcing/produits/create`               |
| 3     | Voir detail + simulateur marges     | `/produits/sourcing/produits/[id]`                 |
| 4     | Basculer en catalogue               | `/produits/catalogue/nouveau` (wizard)             |
| 5     | Organiser (categories, collections) | `/produits/catalogue/categories`, `/collections`   |
| 6     | Gerer variantes                     | `/produits/catalogue/variantes/[groupId]`          |

### Points critiques

- Wizard creation catalogue : multi-etapes avec validation
- Simulateur marges : calcul prix achat + transport + marge + TVA
- Edition inline prix achat, transport, echantillon par ligne
- Gestion variantes (groupes et combinaisons)

### Test E2E

`apps/back-office/e2e/workflow-produits.spec.ts`

---

## Workflow 4 - LinkMe affiliation (ELEVE)

**Niveau** : Eleve
**Frequence** : Quotidienne
**Specificite** : 31 pages, le plus gros module

### Parcours

```
/canaux-vente/linkme -> Catalogue -> Selections -> Commandes -> Commissions -> Demandes paiement
                           |
                    Analytics / Performance
```

### Pages critiques (impact financier)

| Page                                             | Risque                              |
| ------------------------------------------------ | ----------------------------------- |
| `/canaux-vente/linkme/commissions`               | Montants commissions = euros reels  |
| `/canaux-vente/linkme/demandes-paiement`         | Demandes paiement affilies          |
| `/canaux-vente/linkme/configuration/commissions` | Taux commissions (parametre global) |
| `/canaux-vente/linkme/commandes/[id]`            | Detail commande affilie             |

### Points critiques

- Calcul commissions : 2 types produits (voir [linkme/commission-reference.md](./linkme/commission-reference.md))
- Workflow approbations : `/canaux-vente/linkme/approbations`
- Performance affilie : drilldown 2 niveaux (`/performance/[affiliateId]/[selectionId]`)

### Test E2E

`apps/back-office/e2e/workflow-linkme.spec.ts`

---

## Workflow 5 - Stock multi-mouvements (ELEVE)

**Niveau** : Eleve
**Frequence** : Plusieurs fois par jour

### Parcours

```
/stocks -> /stocks/inventaire -> /stocks/receptions (entree)
                             -> /stocks/expeditions (sortie)
                             -> /stocks/ajustements/create
                             -> /stocks/alertes
                             -> /stocks/previsionnel
```

### Points critiques

- **Triggers stock** : immuables (voir `.claude/rules/stock-triggers-protected.md`)
- Alertes 3 couleurs : rupture (rouge) / critique (orange) / faible (jaune)
- PMP (Prix Moyen Pondere) : recalcul a chaque reception
- Ajustements : trace dans `stock_movements` + motif obligatoire

### Test E2E

Couvert partiellement par `workflow-stock-expeditions.spec.ts`. Test dedie a creer si besoin.

---

## Workflows secondaires (P2)

### Workflow 6 - Clients et organisations

**Parcours** :

```
/contacts-organisations -> /customers|/suppliers|/partners|/enseignes -> Detail
```

**Vigilance** : Sprint BO-ORG recent a modifie les formulaires. Re-tester `SupplierFormModal`, `PartnerFormModal`, `CustomerOrganisationFormModal`.

### Workflow 7 - Finance administration

**Parcours** :

```
/finance -> /finance/depenses -> /finance/transactions -> /finance/rapprochement
         -> /finance/tresorerie -> /finance/tva
         -> /finance/documents -> /finance/admin/cloture (owner only)
```

**Points critiques** : Cloture exercice et reset sont reserves au role `owner`. A tester avec et sans permission.

### Workflow 8 - Consultations avec simulateur

**Parcours** :

```
/consultations -> /consultations/create (wizard 3 etapes) -> /consultations/[id] (simulateur marges + PDF)
```

**Points critiques** : Simulateur marges, generation PDF client (avec TVA) et rapport marges interne.

---

## Synthese pour agents tests

| Workflow                    | Test E2E                                | Priorite   |
| --------------------------- | --------------------------------------- | ---------- |
| 1. Expedition commande      | `workflow-stock-expeditions.spec.ts`    | P0         |
| 2. Chaine commerciale       | `workflow-finance.spec.ts`              | P0         |
| 3. Gestion produits         | `workflow-produits.spec.ts`             | P1         |
| 4. LinkMe affiliation       | `workflow-linkme.spec.ts`               | P1         |
| 5. Stock multi-mouvements   | Couvert par `workflow-stock-*.spec.ts`  | P1         |
| 6. Clients et organisations | A creer                                 | P2         |
| 7. Finance administration   | Partiel dans `workflow-finance.spec.ts` | P2         |
| 8. Consultations            | A creer                                 | P2         |
| Smoke test 139 pages        | `smoke-test-toutes-pages.spec.ts`       | Regression |

---

## Regles de mise a jour

1. **Tout sprint** touchant a un workflow critique doit mettre a jour ce document
2. **Tout nouveau bug en production** sur un workflow critique doit etre documente en section "Derniere regression"
3. **Tout test E2E ajoute/modifie** doit pointer ici via le tableau de synthese
4. Ce document est genere manuellement, pas automatiquement. A verifier apres chaque sprint major.

---

**Dernier audit** : 2026-04-16 par Claude (creation initiale suite a mission Playwright)
