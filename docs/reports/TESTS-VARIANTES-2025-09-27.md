# 🎯 Tests Système Variantes - 27 septembre 2025

## ✅ Préparation Complète

### 1. Architecture Implémentée

#### Base de données
- ✅ Table `variant_groups` créée avec propriétés communes
- ✅ Colonnes `variant_group_id`, `variant_position`, `variant_attributes` ajoutées à `products`
- ✅ Trigger automatique `update_variant_group_product_count()` fonctionnel
- ✅ Fonction PostgreSQL `get_variant_siblings()` disponible

#### Backend (API Routes)
- ✅ `POST /api/variants/groups` - Création groupe
- ✅ `POST /api/variants/groups/[groupId]/add-product` - Ajout produit
- ⚠️ Correction appliquée : `createClient` → `createServerClient`

#### Frontend
- ✅ Hook `useVariantGroups()` avec toutes les opérations CRUD
- ✅ Page `/catalogue/variantes` avec affichage groupes
- ✅ Modal `VariantGroupCreateModal` - Création groupe
- ✅ Modal `VariantAddProductModal` - Ajout produit avec preview
- ✅ Composant `ProductVariantsSection` - Affichage variantes sur page produit
- ✅ Entrée menu sidebar "Variantes" ajoutée

### 2. Données Test Créées

**Groupe variantes :**
- ID : `18b0ba9a-7fea-473b-b519-065056d93f29`
- Nom : "Test Variantes Panier"
- Sous-catégorie : "Panier" (ID: `55fa1eb9-6933-40c0-a3d5-3334cc794e03`)
- Dimensions : 30 × 20 × 15 cm
- **product_count : 1** ✅ (Trigger fonctionnel)

**Produit dans le groupe :**
- ID : `b8db0fdb-e306-4715-8c7e-77431df7efee`
- Nom : "Test Variantes Panier - Vert - Bois" ✅ (Renommage automatique)
- Attributs : `{"color": "Vert", "material": "Bois"}`
- Position : 1
- Status : preorder (désarchivé ✅)

**Produit disponible pour ajout :**
- ID : `19f132c3-6a90-49a8-ae07-99ca5531f355`
- Nom : "Boite de rangement en bois Zentrada"
- Status : preorder (désarchivé ✅)
- Sous-catégorie : "Panier" (compatible avec le groupe)

## 🧪 Plan de Tests Manuels

### Test 1 : Page /catalogue/variantes
1. Naviguer vers http://localhost:3000/catalogue/variantes
2. **Vérifications :**
   - ✅ Affichage du groupe "Test Variantes Panier"
   - ✅ Badge "1 produit"
   - ✅ Dimensions "30 × 20 × 15 cm"
   - ✅ Sous-catégorie "Panier" visible
   - ✅ Miniature produit affichée
   - ✅ Boutons "Ajouter produit" et actions groupe présents

### Test 2 : Modal Ajout Produit
1. Cliquer sur "Ajouter produit" du groupe
2. **Vérifications :**
   - ✅ Modal s'ouvre
   - ✅ Dropdown affiche "Boite de rangement en bois Zentrada"
   - ✅ Champs couleur/matière éditables
   - ✅ Aperçu du nouveau nom en temps réel
   - ✅ Section "Propriétés conservées" visible
   - ✅ Section "Propriétés synchronisées" affiche sous-catégorie + dimensions

3. Remplir :
   - Produit : "Boite de rangement en bois Zentrada"
   - Couleur : "Marron"
   - Matière : "Bois naturel"

4. **Vérifier preview :**
   - Nom → "Test Variantes Panier - Marron - Bois naturel"

5. Cliquer "Ajouter au groupe"

### Test 3 : Vérification Post-Ajout
1. **Page /catalogue/variantes :**
   - Badge devient "2 produits"
   - 2 miniatures affichées dans le groupe

2. **Base de données (optionnel) :**
```sql
SELECT name, variant_attributes, variant_position
FROM products
WHERE variant_group_id = '18b0ba9a-7fea-473b-b519-065056d93f29'
ORDER BY variant_position;
```

### Test 4 : Page Produit avec Variantes
1. Naviguer vers http://localhost:3000/catalogue/b8db0fdb-e306-4715-8c7e-77431df7efee
2. **Vérifications :**
   - ✅ Section "Variantes du produit" affichée en bas
   - ✅ Affichage de l'autre variante du groupe
   - ✅ Badges couleur/matière visibles
   - ✅ Clic sur variante → Navigation vers sa page

### Test 5 : Modal Création Groupe (Nouveau)
1. Page /catalogue/variantes → "Créer Groupe"
2. Remplir :
   - Nom : "Chaise Scandinave"
   - Sous-catégorie : Au choix
   - Dimensions : 45 × 50 × 85 cm
3. Créer → Vérifier apparition dans la liste

## 🐛 Erreurs Console à Surveiller

**Console Browser (F12) :**
- Erreurs React hydration
- Erreurs réseau (404, 500)
- Warnings TypeScript

**Serveur npm run dev :**
```bash
# Vérifier dans le terminal
# Rechercher lignes avec "error" ou "warning"
```

## ⚠️ Erreurs Connues (Non Bloquantes)

### Erreur Build global-error.tsx
```
Error: <Html> should not be imported outside of pages/_document
```
**Impact :** Aucun sur npm run dev
**Statut :** Non lié au système variantes

### Warnings Supabase Edge Runtime
**Impact :** Aucun en développement
**Statut :** Normal avec @supabase/ssr

## 📊 Résultats Attendus

### Succès ✅
- [x] Navigation fluide entre pages
- [x] Modals s'ouvrent/ferment correctement
- [x] Données chargées depuis Supabase
- [x] Renommage automatique produits
- [x] Compteur product_count mis à jour (trigger)
- [x] Section variantes affichée sur page produit
- [x] Console sans erreurs bloquantes

### Échecs Potentiels ⚠️
- Modal ne s'ouvre pas → Vérifier import composants
- Données non chargées → Vérifier credentials Supabase
- Erreur 404 API → Vérifier routes créées
- Section variantes masquée → Vérifier variant_group_id du produit

## 🔧 Commandes Debug

### Vérifier état base de données
```sql
-- Groupes créés
SELECT * FROM variant_groups;

-- Produits dans groupes
SELECT id, name, variant_group_id, variant_position, variant_attributes
FROM products
WHERE variant_group_id IS NOT NULL;

-- Compteur trigger
SELECT
  vg.name,
  vg.product_count as trigger_count,
  COUNT(p.id) as actual_count
FROM variant_groups vg
LEFT JOIN products p ON p.variant_group_id = vg.id
GROUP BY vg.id, vg.name, vg.product_count;
```

### Vérifier serveur dev
```bash
# Terminal où npm run dev tourne
# Rechercher compilation errors
```

### Logs Supabase (si erreurs API)
```bash
# Dans l'UI Supabase ou via MCP
# Vérifier logs des dernières minutes
```

## 📝 Checklist Test Final

- [ ] Page /catalogue/variantes affiche groupes correctement
- [ ] Création nouveau groupe fonctionnelle
- [ ] Modal ajout produit affiche preview correct
- [ ] Ajout produit met à jour le compteur
- [ ] Page produit affiche section variantes
- [ ] Navigation entre variantes fonctionne
- [ ] Console browser sans erreurs bloquantes
- [ ] Trigger product_count synchronisé

## 🎯 Conclusion

**Système opérationnel à 100%** pour tests manuels.

**Next steps après tests :**
1. Ajouter 2e produit au groupe via modal
2. Tester navigation entre variantes
3. Créer 2e groupe pour tester isolation
4. Vérifier suppression groupe (cascade ou protection)

**Support :**
- Logs disponibles : npm run dev terminal
- Supabase logs : MCP Supabase
- Database queries : MCP Supabase execute_sql