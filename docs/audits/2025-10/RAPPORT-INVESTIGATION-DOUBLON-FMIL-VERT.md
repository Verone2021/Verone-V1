# 🔍 RAPPORT D'INVESTIGATION - DOUBLON FAUTEUIL MILO VERT

**Date investigation** : 2025-11-01  
**Investigateur** : Claude Code (Phase 3.5.6)  
**Contexte** : Violation règle métier détectée lors tests Phase 3  
**Gravité** : ⚠️ CRITIQUE - Intégrité données catalogue compromise

---

## 🎯 RÉSUMÉ EXÉCUTIF

**VIOLATION CONFIRMÉE** : Il existe bien 2 produits "Fauteuil Milo - Vert" dans le catalogue, mais la situation est **DIFFÉRENTE** de celle anticipée.

**Découverte majeure** :
- ❌ **FMIL-VERT-22** : Produit "orphelin" SANS variant_group (créé pendant tests Phase 3)
- ✅ **FMIL-VERT-01** : Produit légitime dans le variant_group "Fauteuil Milo"
- ✅ **FMIL-VERTF-11** : 2ème produit "Vert" LÉGITIME dans le même variant_group

**Conclusion** : Il y a en réalité **3 produits Vert** :
1. FMIL-VERT-01 (variant_group légitime) - 5 unités
2. FMIL-VERTF-11 (variant_group légitime) - 3 unités  
3. FMIL-VERT-22 (ORPHELIN de test) - 1040 unités ← **PROBLÈME**

---

## 📊 DONNÉES COMPLÈTES

### 1. Diagnostic Produits FMIL-VERT-01 et FMIL-VERT-22

```json
{
  "FMIL-VERT-22": {
    "id": "4a9c6ee2-edf9-4a82-986b-ee52a36b16a1",
    "name": "Fauteuil Milo - Vert",
    "sku": "FMIL-VERT-22",
    "variant_group_id": null,           ← ORPHELIN !
    "variant_attributes": {},            ← PAS de couleur définie !
    "stock_real": 1040,
    "created_at": "2025-11-01T07:00:26.893445+00:00"  ← Créé AUJOURD'HUI (tests)
  },
  "FMIL-VERT-01": {
    "id": "3a267383-3c4d-48c1-b0d5-6f64cdb4df3e",
    "name": "Fauteuil Milo - Vert",
    "sku": "FMIL-VERT-01",
    "variant_group_id": "fff629d9-8d80-4357-b186-f9fd60e529d4",  ← Groupe légitime
    "variant_attributes": {
      "color": "Vert"                    ← Couleur correctement définie
    },
    "stock_real": 5,
    "created_at": "2025-10-07T03:50:34.164353+00:00"  ← Créé il y a 25 jours
  }
}
```

**Analyse temporelle** :
- **FMIL-VERT-01** : Créé le 7 octobre 2025 (produit légitime du catalogue)
- **FMIL-VERT-22** : Créé le 1er novembre 2025 à 07h00 (PENDANT tests Phase 3)

---

### 2. Tous Produits du Variant Group "Fauteuil Milo"

**Total** : 16 produits dans le variant_group `fff629d9-8d80-4357-b186-f9fd60e529d4`

| SKU | Couleur | Stock | Notes |
|-----|---------|-------|-------|
| FMIL-OCRE-02 | Ocre | 58 | ✅ |
| FMIL-KAKI-14 | Kaki | 8 | ✅ |
| FMIL-VIOLE-04 | Violet | 5 | ✅ |
| FMIL-MARRO-03 | Marron | 5 | ✅ |
| FMIL-ORANG-10 | Rouille | 5 | ✅ |
| FMIL-BLEU-15 | Bleu | 125 | ⚠️ Doublon Bleu (1/3) |
| **FMIL-VERT-01** | **Vert** | **5** | ⚠️ **Doublon Vert (1/2)** |
| FMIL-JAUNE-06 | Jaune | 3 | ✅ |
| FMIL-BLEUV-16 | Bleu + Vert (2nd) | 3 | ⚠️ Doublon Bleu (2/3) |
| **FMIL-VERTF-11** | **Vert** | **3** | ⚠️ **Doublon Vert (2/2)** |
| FMIL-BEIGE-05 | Beige | 250 | ✅ |
| FMIL-ROSE-08 | Rose | 5 | ✅ |
| FMIL-BLEUI-09 | Bleu | 5 | ⚠️ Doublon Bleu (3/3) |
| FMIL-BLANC-12 | Blanc | 3 | ✅ |
| FMIL-ORANG-13 | Orange | 3 | ✅ |
| FMIL-CARAME-07 | Caramel | 3 | ✅ |

**🚨 VIOLATIONS DÉTECTÉES** :
- **2 produits "Vert"** : FMIL-VERT-01 + FMIL-VERTF-11
- **3 produits "Bleu"** : FMIL-BLEU-15 + FMIL-BLEUV-16 + FMIL-BLEUI-09

**⚠️ RÈGLE MÉTIER VIOLÉE** :  
> Dans un variant_group, chaque couleur (variant_attributes->>'color') doit être UNIQUE.

---

### 3. Historique Complet Mouvements FMIL-VERT-22

**Total** : 10 mouvements de stock (TOUS créés pendant tests Phase 3)

| Date/Heure | Type | Qty | Stock Résultant | Notes |
|------------|------|-----|-----------------|-------|
| 2025-11-01 07:03:28 | ADJUST | +1000 | 1000 | "Stock initial massif - Test grandes quantités" |
| 2025-11-01 07:10:02 | ADJUST | -950 | 50 | "CORRECTION MASSIVE suite inventaire" |
| 2025-11-01 07:12:32 | ADJUST | +100 | 150 | "Série rapide test performance - Mouvement 4" |
| 2025-11-01 07:13:43 | ADJUST | -20 | 130 | "Casse transport - Mouvement 5" |
| 2025-11-01 07:17:05 | ADJUST | +200 | 330 | "Correction inventaire physique +200" |
| 2025-11-01 07:18:54 | ADJUST | +500 | 830 | "Trouvaille +500 - Mouvement 7" |
| 2025-11-01 07:21:49 | ADJUST | +195 | 1025 | "Correction finale à 1025 unités" |
| 2025-11-01 07:24:53 | ADJUST | +5 | 1030 | "TEST EDGE CASE NOTES ULTRA-LONGUES" |
| 2025-11-01 07:26:34 | ADJUST | +10 | 1040 | "TEST UTF-8 🚀 Émojis + Symboles" |

**Analyse** :
- ✅ **Tous mouvements = tests Phase 3.5.5 et 3.5.6**
- ✅ Aucun mouvement légitime business
- ✅ Produit créé À 07:00:26, premier mouvement À 07:03:28 (3 minutes après)
- ❌ Stock final aberrant : 1040 unités (vs 3-5 unités pour produits légitimes)

---

### 4. Contraintes Database

**Vérification manuelle nécessaire** : Exécuter dans Supabase Dashboard

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'products'::regclass 
AND conname LIKE '%variant%';
```

**Résultat attendu** : ❌ Aucune contrainte UNIQUE sur (variant_group_id, color)

---

## 🎯 RECOMMANDATIONS

### Action Immédiate (Phase 3.6 Cleanup)

1. **Supprimer FMIL-VERT-22 (produit orphelin de test)**
   ```sql
   DELETE FROM stock_movements WHERE product_id = '4a9c6ee2-edf9-4a82-986b-ee52a36b16a1';
   DELETE FROM products WHERE sku = 'FMIL-VERT-22';
   ```

2. **Résoudre doublons "Vert" légitimes**  
   Décision business : Garder FMIL-VERT-01 ou FMIL-VERTF-11 ?
   - Option A : Fusionner stocks (5+3=8 unités) vers FMIL-VERT-01, supprimer FMIL-VERTF-11
   - Option B : Distinguer avec color_secondary (ex: "Vert Foncé" vs "Vert Clair")

3. **Résoudre doublons "Bleu" légitimes**  
   FMIL-BLEU-15, FMIL-BLEUI-09, FMIL-BLEUV-16 :
   - Option A : Fusionner vers FMIL-BLEU-15 (stock le plus élevé : 125)
   - Option B : Utiliser color_secondary pour différencier nuances

### Protection Future (Phase 4 - Contraintes DB)

**Créer migration SQL** :

```sql
-- Migration: 20251102_001_variant_color_uniqueness.sql

-- Étape 1: Nettoyer doublons existants (manuellement d'abord)

-- Étape 2: Ajouter contrainte UNIQUE partielle
CREATE UNIQUE INDEX idx_products_variant_color_unique 
ON products (variant_group_id, (variant_attributes->>'color'))
WHERE variant_group_id IS NOT NULL;

-- Étape 3: Ajouter CHECK constraint
ALTER TABLE products 
ADD CONSTRAINT check_variant_has_color 
CHECK (
  variant_group_id IS NULL 
  OR (variant_attributes ? 'color' AND variant_attributes->>'color' IS NOT NULL)
);
```

**Tests de la contrainte** :

```sql
-- ✅ Devrait réussir
INSERT INTO products (sku, name, variant_group_id, variant_attributes) 
VALUES ('TEST-01', 'Test', 'group-id', '{"color": "Rouge"}');

-- ❌ Devrait échouer (doublon couleur)
INSERT INTO products (sku, name, variant_group_id, variant_attributes) 
VALUES ('TEST-02', 'Test', 'group-id', '{"color": "Rouge"}');

-- ❌ Devrait échouer (variant_group sans couleur)
INSERT INTO products (sku, name, variant_group_id, variant_attributes) 
VALUES ('TEST-03', 'Test', 'group-id', '{}');
```

---

## 📝 CONCLUSION

**Question initiale** : Les 2 produits "Fauteuil Milo - Vert" sont-ils dans le même variant_group ?

**Réponse** : **NON**, mais la situation est plus complexe :

1. ❌ **FMIL-VERT-22** : Orphelin de test (variant_group = NULL)  
   → **À SUPPRIMER** (données de test polluant production)

2. ⚠️ **FMIL-VERT-01 + FMIL-VERTF-11** : DANS le même variant_group  
   → **Violation règle métier confirmée** (2 couleurs "Vert" identiques)

3. ⚠️ **Bonus** : Également 3 doublons "Bleu" détectés  
   → **Problème systémique** de gestion variantes

**Impact business** :
- Confusion catalogue produits
- Risque erreur commande client (quel "Vert" choisir ?)
- Données analytics faussées (stock fragmenté)

**Responsabilité** :
- ✅ FMIL-VERT-22 créé par **mes tests Phase 3.5.5** (identifié, assumé)
- ❌ FMIL-VERT-01 + FMIL-VERTF-11 existaient **AVANT mes tests** (problème data historique)

**Prochaines étapes** :
1. Cleanup immédiat FMIL-VERT-22
2. Décision business doublons Vert/Bleu
3. Migration contrainte DB
4. Tests validation contrainte

---

**Rapport généré par** : Claude Code (Audit Phase 3.5.6)  
**Fichier scripts** : `/scripts/investigate-doublon.mjs`  
**Données brutes** : Disponibles dans réponses Supabase ci-dessus
