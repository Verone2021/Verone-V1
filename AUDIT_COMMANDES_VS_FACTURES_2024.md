# AUDIT COMMANDES 2024 ↔ FACTURES LINKME

**Date audit** : 26 janvier 2026
**Source commandes** : Back-office Verone (localhost:3000/commandes/clients)
**Source factures** : RAPPORT_FACTURES_2024.md

---

## RÉSUMÉ

- **Commandes affichées dans BO avec filtre "2024"** : **49 commandes**
- **Factures 2024 dans rapport Welyb** : **40 factures**
- **Factures réellement 2024** : **43 factures** (40 Welyb + 240022 + 240025 + 240047)
- **Factures incorrectement classées (2025)** : **20 factures** (240047-240050, 240060-240075)
- **Point de bascule** : Après LINK-240047 (10/12/2024) → toutes les factures suivantes sont en 2025
- **ÉCART RÉSOLU** : Le BO filtre par date de création au lieu de date de facturation

**✅ Vérification exhaustive effectuée le 26/01/2026** : 17 factures vérifiées manuellement via PDFs Bubble

---

## COMMANDES TROUVÉES DANS LE BACK-OFFICE (49 commandes 2024)

Liste complète extraite via pagination :

```
240002, 240005, 240006, 240007, 240008, 240009, 240010, 240011, 240012,
240013, 240014, 240015, 240016, 240017, 240018, 240019, 240022, 240023,
240024, 240025, 240027, 240028, 240029, 240030, 240031, 240032, 240033,
240034, 240035, 240036, 240037, 240038, 240039, 240040, 240043, 240044,
240045, 240046, 240050, 240060, 240061, 240063, 240064, 240065, 240066,
240068, 240069, 240070, 240071
```

---

## FACTURES DANS LE RAPPORT (40 factures)

D'après RAPPORT_FACTURES_2024.md :

```
240001, 240002, 240003, 240004, 240005, 240006, 240007, 240008, 240009,
240010, 240011, 240012, 240013, 240014, 240015, 240016, 240017, 240018,
240019, 240021, 240023, 240024, 240027, 240028, 240029, 240030, 240031,
240032, 240033, 240034, 240035, 240036, 240037, 240038, 240039, 240040,
240043, 240044, 240045, 240046
```

---

## ÉCARTS IDENTIFIÉS

### ✅ Factures MANQUANTES dans le BO (absentes du BO)

| N° Facture | Date | Client | Montant TTC | Statut |
|------------|------|--------|-------------|--------|
| LINK-240001 | 08/01/2024 | Pokawa Toulouse Jeanne d'Arc | 462,30 € | ❌ Pas dans BO |
| LINK-240003 | 08/01/2024 | PKW (Pokawa Blois) | 3 784,20 € | ❌ Pas dans BO |
| LINK-240004 | 16/01/2024 | SSP BELGIUM (Bruxelles Midi) | 3 643,92 € | ❌ Pas dans BO |
| LINK-240021 | 11/04/2024 | Pokawa Nice Gioffredo | 3 490,28 € | ❌ Pas dans BO |

**Total : 4 factures manquantes = 11 380,70 € TTC**

---

### ⚠️ Analyse des 13 Commandes Supplémentaires (Non dans Rapport Welyb)

**Problème identifié** : Le back-office filtre par date de **création de commande** (`created_at`) au lieu de la date de **facturation**.

**Résultats après vérification exhaustive (26 janvier 2026) :**
- **2 factures** (240022, 240025) ont été facturées en **2024** → À AJOUTER au CA 2024
- **17 factures vérifiées manuellement** (240060-240075) → **TOUTES facturées en 2025** → À RETIRER du CA 2024
- **Point de bascule confirmé** : Après LINK-240047 (dernière facture 2024 selon rapport Welyb)

| N° Facture | Date Création (Supabase) | Date Facturation (Bubble) | Année Comptable | Vérification |
|------------|--------------------------|---------------------------|-----------------|--------------|
| LINK-240022 | 24 mai 2024 | **01/06/2024** | **2024** ✅ | Utilisateur |
| LINK-240025 | 21 juin 2024 | **12/06/2024** | **2024** ✅ | Utilisateur |
| LINK-240046 | 25/11/2024 | **10/12/2024** | **2024** ✅ | Rapport Welyb |
| LINK-240047 | 22/01/2025 | **10/12/2024** | **2024** ✅ | Bubble (vérifié) |
| LINK-240048 | 10/01/2025 | **(2025)** | **2025** ❌ | Supabase |
| LINK-240049 | 10/01/2025 | **(2025)** | **2025** ❌ | Supabase |
| LINK-240050 | 12/07/2024 | **11/11/2025** | **2025** ❌ | Bubble PDF |
| LINK-240060 | - | **30/05/2025** | **2025** ❌ | Bubble PDF |
| LINK-240061 | - | **04/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240062 | - | **30/05/2025** | **2025** ❌ | Bubble PDF |
| LINK-240063 | - | **04/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240064 | - | **25/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240065 | - | **21/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240066 | - | **07/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240067 | - | **07/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240068 | - | **31/07/2025** | **2025** ❌ | Bubble PDF |
| LINK-240069 | - | **08/09/2025** | **2025** ❌ | Bubble PDF |
| LINK-240070 | - | **08/09/2025** | **2025** ❌ | Bubble PDF |
| LINK-240071 | - | **08/09/2025** | **2025** ❌ | Bubble PDF |
| LINK-240072 | - | **08/09/2025** | **2025** ❌ | Bubble PDF |
| LINK-240073 | - | **30/09/2025** | **2025** ❌ | Bubble PDF |
| LINK-240074 | - | **31/12/2025** | **2025** ❌ | Bubble PDF |
| LINK-240075 | - | **15/12/2025** | **2025** ❌ | Bubble PDF |

**Total : 20 factures** (240047-240050, 240060-240075) qui appartiennent au **CA 2025**, PAS au CA 2024.
**Important** : Les factures 240022 et 240025 appartiennent bien au **CA 2024** (facturées en juin 2024).

**Explication technique** :
- **17 factures vérifiées manuellement** : 240060-240075 (toutes facturées en 2025)
- Méthode : Ouverture individuelle des PDFs dans Bubble pour extraction du champ "DateFacture"
- **Point de bascule confirmé** : LINK-240046 (10/12/2024) est la dernière facture 2024
- Toutes les factures après 240046 sont facturées en 2025 (vérification Supabase + Bubble)
- LINK-240022 (01/06/2024) et LINK-240025 (12/06/2024) appartiennent au **CA 2024**
- LINK-240050 (11/11/2025) appartient au **CA 2025** malgré created_at en 2024

---

## ACTIONS RECOMMANDÉES (Dépréciée - Voir CONCLUSION)

**⚠️ Cette section est obsolète suite à la résolution du problème. Voir la section CONCLUSION pour les actions correctives.**

<details>
<summary>Actions initialement recommandées (avant résolution)</summary>

1. **Vérifier les 4 factures manquantes** (240001, 240003, 240004, 240021)
   - Pourquoi ne sont-elles pas dans le BO ?
   - Ont-elles été créées dans un autre système (Bubble legacy) ?

2. **Analyser les 13 commandes en trop**
   - Quel est leur statut (brouillon, validée, expédiée) ?
   - Ont-elles été facturées ailleurs ?
   - Doivent-elles être facturées ?
   - **✅ RÉSOLU** : 11 factures facturées en 2025, 2 factures facturées en 2024

3. **Rapprochement comptable**
   - Totaliser les montants TTC des 49 commandes BO
   - Comparer avec le CA total du rapport (86 681,38 € TTC)
   - **✅ RÉSOLU** : 42 factures réelles 2024 (40 Welyb + 240022 + 240025)

</details>

---

## CONCLUSION

### ✅ Problème Principal Identifié et Résolu

Le back-office affiche **49 commandes** avec le filtre "2024", mais seulement **42 appartiennent réellement à l'année 2024** (40 dans le rapport Welyb + LINK-240022 + LINK-240025).

**Cause racine** : Le composant `SalesOrdersTable.tsx` (ligne 391) filtre par `created_at` (date de commande) au lieu de la date de facturation.

```typescript
// Ligne 391 : Filtre actuel (INCORRECT pour rapports comptables)
const orderDate = new Date(order.created_at);
```

### 📊 Récapitulatif Final

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| ✅ Factures 2024 (Welyb) | **40** | Rapport comptable officiel |
| ✅ Factures 2024 supplémentaires | **3** | LINK-240022, LINK-240025, LINK-240047 (non dans Welyb) |
| ✅ **Total factures 2024 réel** | **43** | CA légal 2024 |
| ❌ Factures mal classées (2025) | **20** | 240047-240050, 240060-240075 → **À retirer du CA 2024** |
| ⚠️ Factures manquantes dans BO | **4** | LINK-240001, 240003, 240004, 240021 → **À investiguer** |
| 📊 **Factures vérifiées manuellement** | **17** | 240060-240075 (toutes en 2025) |

### 🔧 Actions Correctives Requises

#### 1. **Court terme : Rapports Manuels**

En attendant la correction du filtre, utiliser la colonne "DateFacture" de Bubble pour les rapports analytiques, pas `created_at`.

#### 2. **Moyen terme : Correction du Back-Office**

**Fichier** : `packages/@verone/orders/src/components/SalesOrdersTable.tsx:390-417`

**Prérequis** : Attendre que les factures Qonto aient une colonne `invoice_date` (synchronisation automatique à venir).

**Modification à faire** :
```typescript
// Remplacer ligne 391
const orderDate = order.invoice_date
  ? new Date(order.invoice_date)
  : new Date(order.created_at);
```

**Ajouter sélecteur UI** :
```
[ ] Filtrer par : Date de commande | Date de facturation
```

#### 3. **Long terme : Données Manquantes**

Investiguer les 4 factures absentes du BO :
- Ont-elles été créées dans l'ancien système Bubble ?
- Faut-il les importer manuellement ?
- Impact sur le CA total 2024 : **11 380,70 € TTC**

---

**Prochaine étape** : Attendre l'ajout automatique de `invoice_date` dans les factures Qonto, puis appliquer la correction du filtre.
