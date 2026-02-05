# LinkMe - Stockage m³ et Facturation

Documentation du systeme de calcul et facturation du stockage pour les affilies LinkMe.

## Overview

Les affilies peuvent stocker leurs produits dans les entrepots Verone. La facturation est basee sur le volume en metres cubes (m³) occupe mensuellement.

## Formule de Calcul

### Volume unitaire

```typescript
// Volume en m³ = L × l × h (en metres)
volume_m3 = (length_cm / 100) × (width_cm / 100) × (height_cm / 100)
```

### Priorite des dimensions

1. **Dimensions emballage** (si disponibles) → prioritaires
2. **Dimensions produit** (sinon) → fallback

### Source des donnees

- Table: `products`
- Colonnes: `length`, `width`, `height` (en cm)
- Colonnes emballage: `packaging_length`, `packaging_width`, `packaging_height` (si existantes)

### Exemple concret

```
Produit: Table basse design
Dimensions: 120 × 60 × 45 cm

Volume = (120/100) × (60/100) × (45/100)
       = 1.2 × 0.6 × 0.45
       = 0.324 m³
```

## Conditions de Facturation

### Produits facturables

| Type                     | Facturable | Condition             |
| ------------------------ | ---------- | --------------------- |
| Produit affilie en stock | OUI        | `is_in_stock = true`  |
| Produit catalogue Verone | NON        | Toujours gratuit      |
| Produit sans flag stock  | NON        | Par defaut non stocke |

### Pas de minimum

- Meme les petits volumes (0.01 m³) sont factures
- Pas de seuil minimum de facturation

## Tarification

### Structure

| Parametre          | Description             | Emplacement              |
| ------------------ | ----------------------- | ------------------------ |
| Prix au m³/mois    | Configurable            | Parametres back-office   |
| Paliers degressifs | Reductions selon volume | Parametres back-office   |
| TVA                | Selon pays organisation | API adresses → taux auto |

### Paliers degressifs (exemple)

| Volume total | Prix/m³/mois |
| ------------ | ------------ |
| 0 - 10 m³    | 50€          |
| 10 - 50 m³   | 45€          |
| 50 - 100 m³  | 40€          |
| > 100 m³     | Sur devis    |

_Les paliers exacts sont configurables dans le back-office._

## Workflow Facturation

### Declenchement

```
1. Jour configurable par client (ex: le 8 de chaque mois)
   ↓
2. Calcul du volume total stocke
   ↓
3. Application des paliers degressifs
   ↓
4. Prorata si debut en milieu de mois
   ↓
5. Generation facture via API Qonto
   ↓
6. Facture creee en statut BROUILLON
   ↓
7. Notification dashboard + email
```

### Prorata temporis

Si un affilie commence le stockage le 20 du mois:

```
Prorata = (jours restants / jours du mois) × montant mensuel

Exemple (mois de 30 jours, debut le 20):
Prorata = (10 / 30) × montant = 33.33% du tarif mensuel
```

### Statut facture

| Statut    | Description                           |
| --------- | ------------------------------------- |
| BROUILLON | Creee, en attente validation manuelle |
| VALIDEE   | Approuvee, envoyee au client          |
| PAYEE     | Reglement recu                        |

**Important**: Les factures sont TOUJOURS creees en brouillon, jamais auto-validees.

## Notifications

### Dashboard back-office

- Alerte nouvelle facture a valider
- Resume volume mensuel par affilie

### Dashboard LinkMe (affilie)

- Section `/stockage` (a developper)
- Liste des produits en stock
- Volume total et estimation mensuelle
- Historique des factures

### Email

- Facture PDF en piece jointe
- Resume des produits stockes
- Montant et echeance

## Reglement

| Mode        | Description            |
| ----------- | ---------------------- |
| Virement    | Mode principal         |
| Prelevement | Option si mandate SEPA |

## Payeur

### Organisation proprietaire

- Le payeur est toujours l'**organisation proprietaire du produit**
- Pas l'utilisateur individuel qui a cree le produit

### Cas d'usage

| Scenario                    | Payeur                         |
| --------------------------- | ------------------------------ |
| Enseigne multi-utilisateurs | L'enseigne (organisation mere) |
| Independant                 | La societe de l'independant    |
| Particulier (futur)         | Reglementation a definir       |

## Tables concernees

| Table           | Colonnes                    | Description         |
| --------------- | --------------------------- | ------------------- |
| `products`      | `length`, `width`, `height` | Dimensions produit  |
| `products`      | `is_in_stock`               | Flag stockage actif |
| `organizations` | `id`, `billing_*`           | Donnees facturation |
| `invoices`      | `*`                         | Factures generees   |

## UI Affilie

### Page `/stockage` (a developper)

```
+------------------------------------------+
|  Mon stockage                            |
|                                          |
|  Volume total: 2.45 m³                   |
|  Estimation mensuelle: 122.50€ HT        |
+------------------------------------------+

+------------------------------------------+
|  Produits en stock                       |
|                                          |
|  - Table basse (0.324 m³)         [x]    |
|  - Chaise design (0.156 m³)       [x]    |
|  - Lampe bureau (0.02 m³)         [x]    |
+------------------------------------------+

+------------------------------------------+
|  Factures                                |
|                                          |
|  - Janvier 2026  |  115€  |  Payee [PDF] |
|  - Fevrier 2026  |  122€  |  En cours    |
+------------------------------------------+
```

### Composants a creer

| Fichier                     | Description                    |
| --------------------------- | ------------------------------ |
| `StorageProductList.tsx`    | Liste produits avec dimensions |
| `StorageEstimate.tsx`       | Calcul frais estimes           |
| `StorageInvoiceHistory.tsx` | Historique factures            |

## Exemple de test

### Produits Pokawa (a verifier)

1. Poubelle restaurant → Completer dimensions
2. Meuble resto → Completer dimensions
3. Verifier flag `is_in_stock`
4. Calculer volume total

## API

### Endpoint estimation (a creer)

```
GET /api/storage/estimate
Query: { affiliateId: string }
Response: {
  products: [...],
  totalVolume: number,
  monthlyEstimate: number,
  tierApplied: string
}
```

## Audit back-office

Points a verifier:

- [ ] Structure paliers existante
- [ ] Parametres de configuration actuels
- [ ] Integration API Qonto
- [ ] Templates email facture

---

**Derniere mise a jour**: 2026-01-21
**Specifications**: Confirmees par user (2026-01-21)
