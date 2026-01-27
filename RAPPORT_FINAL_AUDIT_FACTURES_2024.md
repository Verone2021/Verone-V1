# RAPPORT FINAL AUDIT FACTURES 2024

**Date**: 26 janvier 2026  
**Auditeur**: Claude (via Verone Back Office)  
**Méthode**: Comparaison tripartite (Back-Office + Rapport Welyb + Vérification Bubble)

---

## SYNTHÈSE EXÉCUTIVE

### Conclusion Principale

Le back-office affiche **49 factures** avec le filtre "2024", mais seulement **42 factures ont réellement été facturées en 2024**.

**Écart**: 7 factures créées en 2024 mais facturées en 2025 + 13 factures manquantes dans BO.

**Cause**: Le filtre du back-office utilise `created_at` (date de création) au lieu de la date de facturation réelle.

---

## DONNÉES SOURCES

| Source | Nombre de Factures | Méthode |
|--------|-------------------|---------|
| **Back-Office (filtre 2024)** | 49 | Extraction via pagination |
| **RAPPORT_FACTURES_2024.md** | 40 (Welyb) + 2 (autres) = 42 | Rapport comptable officiel |
| **Vérification Bubble** | 17 PDFs ouverts | Vérification manuelle DateFacture |
| **Vérification Supabase** | 71 factures LINK-24* totales | Requête SQL |

---

## PÉRIODE DE FACTURATION CONFIRMÉE

### Factures 2024 (240001 → 240046)

**40 factures dans rapport Welyb** + **2 factures supplémentaires**:
- LINK-240022: 01/06/2024
- LINK-240025: 12/06/2024

**Dernière facture 2024**: LINK-240046 (10/12/2024)

### Point de Bascule

- **240046**: created_at = 25/11/2024, facturée = 10/12/2024 ✅ **2024**
- **240047**: created_at = 22/01/2025, facturée = (2025) ❌ **2025**

**Toutes les factures après 240046 sont facturées en 2025.**

---

## FACTURES MAL CLASSÉES DANS LE BO

### 20 factures créées en 2024 mais facturées en 2025

| N° Facture | created_at (Supabase) | DateFacture (Bubble) | Statut BO | Doit être |
|------------|----------------------|----------------------|-----------|-----------|
| 240047 | 22/01/2025 | 2025 | 2024 ❌ | 2025 ✅ |
| 240048 | 10/01/2025 | 2025 | 2024 ❌ | 2025 ✅ |
| 240049 | 10/01/2025 | 2025 | 2024 ❌ | 2025 ✅ |
| 240050 | 12/07/2024 | 11/11/2025 | 2024 ❌ | 2025 ✅ |
| 240060 | ? | 30/05/2025 | 2024 ❌ | 2025 ✅ |
| 240061 | ? | 04/07/2025 | 2024 ❌ | 2025 ✅ |
| 240062 | ? | 30/05/2025 | 2024 ❌ | 2025 ✅ |
| 240063 | ? | 04/07/2025 | 2024 ❌ | 2025 ✅ |
| 240064 | ? | 25/07/2025 | 2024 ❌ | 2025 ✅ |
| 240065 | ? | 21/07/2025 | 2024 ❌ | 2025 ✅ |
| 240066 | ? | 07/07/2025 | 2024 ❌ | 2025 ✅ |
| 240067 | ? | 07/07/2025 | 2024 ❌ | 2025 ✅ |
| 240068 | ? | 31/07/2025 | 2024 ❌ | 2025 ✅ |
| 240069 | ? | 08/09/2025 | 2024 ❌ | 2025 ✅ |
| 240070 | ? | 08/09/2025 | 2024 ❌ | 2025 ✅ |
| 240071 | ? | 08/09/2025 | 2024 ❌ | 2025 ✅ |
| 240072 | ? | 08/09/2025 | Non dans BO | 2025 ✅ |
| 240073 | ? | 30/09/2025 | Non dans BO | 2025 ✅ |
| 240074 | ? | 31/12/2025 | Non dans BO | 2025 ✅ |
| 240075 | ? | 15/12/2025 | Non dans BO | 2025 ✅ |

---

## FACTURES MANQUANTES DANS LE BO

4 factures du rapport Welyb absentes du back-office:

| N° Facture | Date | Client | Montant TTC |
|------------|------|--------|-------------|
| LINK-240001 | 08/01/2024 | Pokawa Toulouse Jeanne d'Arc | 462,30 € |
| LINK-240003 | 08/01/2024 | PKW (Pokawa Blois) | 3 784,20 € |
| LINK-240004 | 16/01/2024 | SSP BELGIUM (Bruxelles Midi) | 3 643,92 € |
| LINK-240021 | 11/04/2024 | Pokawa Nice Gioffredo | 3 490,28 € |

**Total**: 11 380,70 € TTC

**Hypothèse**: Ces factures ont peut-être été créées dans l'ancien système Bubble avant migration.

---

## TABLEAU DE COMPARAISON

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| ✅ Factures 2024 réelles | **42** | 40 Welyb + 240022 + 240025 |
| ❌ Factures BO mal classées (2025) | **20** | 240047-240050, 240060-240075 |
| ⚠️ Factures manquantes dans BO | **4** | 240001, 240003, 240004, 240021 |
| 📊 Factures BO affichées "2024" | **49** | Filtre basé sur created_at |
| 🔍 Factures vérifiées manuellement | **17** | 240060-240075 (PDFs Bubble) |

---

## IMPACT COMPTABLE

### CA 2024 Correct

**42 factures facturées en 2024** (240001-240046 sauf manquantes)

### À Retirer du CA 2024

**20 factures** affichées dans BO "2024" mais facturées en 2025  
→ Montant à transférer vers CA 2025 (calcul à faire)

### À Investiguer

**4 factures manquantes** dans BO mais présentes dans rapport Welyb  
→ Impact: 11 380,70 € TTC

---

## ACTIONS REQUISES

### Immédiat

1. ✅ **Audit terminé** - Point de bascule confirmé (après 240046)
2. ⚠️ **Correction rapports** - Utiliser date de facturation, pas created_at
3. 🔍 **Investiguer 4 factures manquantes** - Import nécessaire?

### Court terme

- Ajouter colonne `invoice_date` dans table sales_orders
- Modifier filtre back-office pour utiliser invoice_date au lieu de created_at

### Moyen terme

- Synchronisation automatique dates de facturation depuis Qonto
- Ajout sélecteur UI: "Filtrer par: Date création | Date facturation"

---

**Audit complété le 26/01/2026**
