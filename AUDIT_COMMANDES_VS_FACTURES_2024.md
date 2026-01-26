# AUDIT COMMANDES 2024 ↔ FACTURES LINKME

**Date audit** : 26 janvier 2026
**Source commandes** : Back-office Verone (localhost:3000/commandes/clients)
**Source factures** : RAPPORT_FACTURES_2024.md

---

## RÉSUMÉ

- **Commandes 2024 dans BO** : **49 commandes**
- **Factures 2024 dans rapport** : **40 factures**
- **ÉCART** : **+9 commandes** (présentes dans BO mais absentes du rapport)

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

### ⚠️ Commandes EN PLUS dans le BO (non facturées ?)

| N° Commande | Présente dans rapport ? |
|-------------|------------------------|
| LINK-240022 | ❌ NON |
| LINK-240025 | ❌ NON |
| LINK-240050 | ❌ NON |
| LINK-240060 | ❌ NON |
| LINK-240061 | ❌ NON |
| LINK-240063 | ❌ NON |
| LINK-240064 | ❌ NON |
| LINK-240065 | ❌ NON |
| LINK-240066 | ❌ NON |
| LINK-240068 | ❌ NON |
| LINK-240069 | ❌ NON |
| LINK-240070 | ❌ NON |
| LINK-240071 | ❌ NON |

**Total : 13 commandes en plus dans le BO**

**Hypothèses** :
- Commandes créées après clôture comptable 2024 ?
- Commandes non facturées (brouillon, annulées, échantillons) ?
- Numéros de factures sautés (240020, 240022, 240025, 240026, 240041, 240042) ?

---

## ACTIONS RECOMMANDÉES

1. **Vérifier les 4 factures manquantes** (240001, 240003, 240004, 240021)
   - Pourquoi ne sont-elles pas dans le BO ?
   - Ont-elles été créées dans un autre système (Bubble legacy) ?

2. **Analyser les 13 commandes en trop**
   - Quel est leur statut (brouillon, validée, expédiée) ?
   - Ont-elles été facturées ailleurs ?
   - Doivent-elles être facturées ?

3. **Rapprochement comptable**
   - Totaliser les montants TTC des 49 commandes BO
   - Comparer avec le CA total du rapport (86 681,38 € TTC)

---

## CONCLUSION

Le back-office contient **49 commandes 2024** au lieu des **40 factures** attendues.

**Gap à expliquer** : +9 commandes (dont 4 factures manquantes et 13 commandes supplémentaires).

**Prochaine étape** : Extraire les montants TTC de chaque commande pour vérifier si le CA total correspond.
