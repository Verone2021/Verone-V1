# Templates Import Produits

**Objectif** : Faciliter l'import de produits sans oublier aucun champ critique.

---

## 📚 Fichiers Disponibles

### 1. [product-import-checklist.md](./product-import-checklist.md) 📖

**Version complète et documentée**

- Tous les 66 champs de la table `products` expliqués
- Distinction Obligatoires / Critiques / Recommandés / Optionnels
- Exemples concrets basés sur produits Opjet
- Formats JSONB détaillés
- Valeurs ENUM de référence
- Workflow d'import recommandé (5 étapes)

**Utilisation** : Référence complète à lire avant le premier import.

---

### 2. [product-import-quick-reference.md](./product-import-quick-reference.md) ⚡

**Version condensée pour usage quotidien**

- Checklist des 15 champs essentiels
- Template SQL minimal (copier-coller)
- Calculs rapides (poids unitaire, SKU)
- Pièces adaptées par type de produit
- UUIDs fournisseurs fréquents
- Requêtes SQL utiles

**Utilisation** : À avoir sous les yeux pendant un import.

---

### 3. [product-import-script-example.sql](./product-import-script-example.sql) 💻

**Script SQL réutilisable**

- Template avec placeholders à remplacer
- Exemple complet (Facture Opjet 20145539)
- Transaction BEGIN/COMMIT
- Requêtes de vérification post-import
- Aide-mémoire intégré (calcul poids, pièces adaptées)

**Utilisation** : Copier-coller et adapter pour chaque nouvelle facture.

---

## 🚀 Workflow Recommandé

### Pour un Nouvel Import

1. **Préparer les données** (5-10 min)
   - Ouvrir la facture fournisseur
   - Ouvrir [product-import-quick-reference.md](./product-import-quick-reference.md)
   - Collecter : noms, références, prix, poids, quantités

2. **Copier le template** (2 min)
   - Copier [product-import-script-example.sql](./product-import-script-example.sql)
   - Remplacer les placeholders `<...>`
   - Calculer poids unitaires (poids net / quantité)

3. **Compléter les métadonnées** (5-10 min)
   - Chercher dimensions (site fournisseur ou mesure)
   - Définir couleur + matière (visuel)
   - Choisir style (`contemporain`, `scandinave`, etc.)
   - Définir pièces adaptées (selon type produit)

4. **Exécuter l'import** (1 min)
   - Exécuter le script SQL dans Supabase
   - Vérifier les résultats avec requête de vérification

5. **Valider** (2 min)
   - Vérifier `completion_percentage` > 80%
   - Vérifier poids présents
   - Vérifier style présents
   - Vérifier pièces cohérentes

**Temps total estimé** : 15-25 minutes pour 5-10 produits

---

## 🎯 Champs à Ne JAMAIS Oublier

Ces 10 champs causent les problèmes les plus graves s'ils manquent :

| Rang | Champ                | Impact si manquant                                |
| ---- | -------------------- | ------------------------------------------------- |
| 1    | `weight`             | ❌ **Bloquant** : Calcul frais de port impossible |
| 2    | `style`              | ❌ **Majeur** : Filtre front cassé                |
| 3    | `suitable_rooms`     | ❌ **Majeur** : Filtre "pièce" cassé              |
| 4    | `supplier_reference` | ⚠️ Impossible de repasser commande                |
| 5    | `cost_price`         | ⚠️ Calcul marge impossible                        |
| 6    | `variant_attributes` | ⚠️ Pas de filtre couleur/matière                  |
| 7    | `dimensions`         | ⚠️ Client ne peut pas vérifier encombrement       |
| 8    | `supplier_id`        | ⚠️ Impossible de tracer la provenance             |
| 9    | `subcategory_id`     | ⚠️ Produit non classé dans catalogue              |
| 10   | `brand`              | ⚠️ Pas de filtre par marque                       |

---

## 📊 Statistiques Complétude Actuelle

Produits Opjet (40 produits analysés le 2026-02-08) :

| Champ                | Taux de complétude |
| -------------------- | ------------------ |
| `weight`             | ✅ 100% (40/40)    |
| `style`              | ✅ 100% (40/40)    |
| `suitable_rooms`     | ✅ 100% (40/40)    |
| `variant_attributes` | ✅ 100% (40/40)    |
| `dimensions`         | ✅ 100% (40/40)    |
| `supplier_reference` | ✅ 100% (40/40)    |
| `cost_price`         | ✅ 100% (40/40)    |

**Objectif maintenu** : 100% de complétude sur les champs critiques pour tous les futurs imports.

---

## 🆔 Données de Référence

### Fournisseurs Fréquents

| Nom           | UUID                                   | MOQ Typique |
| ------------- | -------------------------------------- | ----------- |
| **Opjet**     | `9078f112-6944-4732-b926-f64dcef66034` | 4 unités    |
| (Ajouter ici) |                                        |             |

### Sous-Catégories Fréquentes

| Nom           | UUID                                   | Catégorie Parent |
| ------------- | -------------------------------------- | ---------------- |
| **Vases**     | `4a915a10-0099-439f-a512-09adf0088736` | Décoration       |
| (Ajouter ici) |                                        |                  |

**Comment ajouter** :

```sql
-- Obtenir UUID fournisseur
SELECT id, name FROM suppliers ORDER BY name;

-- Obtenir UUID sous-catégorie
SELECT id, name FROM subcategories ORDER BY name;
```

---

## 🔄 Historique des Versions

| Version | Date       | Changements                                                         |
| ------- | ---------- | ------------------------------------------------------------------- |
| 1.0.0   | 2026-02-08 | Création initiale suite corrections produits Opjet facture 20145539 |

---

## 📞 Support

Pour toute question ou amélioration :

1. Vérifier [product-import-checklist.md](./product-import-checklist.md) (documentation complète)
2. Consulter `.claude/rules/database/supabase.md` (règles DB)
3. Demander à Claude Code

---

**Maintenu par** : Romeo & Claude Code
**Dernière révision** : 2026-02-08
