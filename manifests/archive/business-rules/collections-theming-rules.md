# 🎨 Règles Business - Collections Thématiques

**Module:** Catalogue - Collections
**Version:** 1.0.0
**Date:** 2025-09-27
**Statut:** ✅ Validé et Implémenté

---

## 📋 Vue d'Ensemble

Le système de collections thématiques permet d'organiser les produits selon des critères de **style décoratif** et de **destination/pièce**, avec des tags personnalisés pour une organisation flexible.

---

## 🎯 Règles Métier

### 1. Styles Décoratifs (8 options)

**Liste exhaustive des styles autorisés:**

1. **Minimaliste** - Épuré et fonctionnel
2. **Contemporain** - Moderne et actuel
3. **Moderne** - Design avant-gardiste
4. **Scandinave** - Chaleureux et lumineux
5. **Industriel** - Brut et authentique
6. **Classique** - Intemporel et élégant
7. **Bohème** - Libre et éclectique
8. **Art Déco** - Raffiné et géométrique

**Contraintes:**
- ❌ Une collection peut avoir **0 ou 1 style** (pas de multi-style)
- ✅ Le style est **optionnel** (peut être NULL)
- ✅ Les valeurs doivent être **exactement** celles de la liste (CHECK constraint)
- ✅ Le filtrage par style doit être **performant** (index créé)

### 2. Catégories de Pièce (10 options)

**Liste exhaustive des pièces/destinations:**

1. **Chambre** 🛏️
2. **WC / Salle de bain** 🚿
3. **Salon** 🛋️
4. **Cuisine** 🍽️
5. **Bureau** 💼
6. **Salle à manger** 🍷
7. **Entrée** 🚪
8. **Plusieurs pièces** 🏠 (multi-usage)
9. **Extérieur - Balcon** 🌿
10. **Extérieur - Jardin** 🌳

**Contraintes:**
- ❌ Une collection peut avoir **0 ou 1 pièce** (pas de multi-pièce)
- ✅ La pièce est **optionnelle** (peut être NULL)
- ✅ Les valeurs doivent être **exactement** celles de la liste (CHECK constraint)
- ✅ Le filtrage par pièce doit être **performant** (index créé)
- ℹ️ **Exception:** "Plusieurs pièces" indique un usage multi-pièce

### 3. Tags Personnalisés (illimité)

**Règles:**
- ✅ Une collection peut avoir **0 à N tags**
- ✅ Les tags sont **libres** (aucune liste prédéfinie)
- ✅ Les tags permettent des caractéristiques additionnelles:
  - "Eco-responsable"
  - "Petit espace"
  - "Budget limité"
  - "Design italien"
  - "Mobilier modulable"
  - etc.
- ✅ La recherche dans les tags doit être **optimisée** (index GIN sur array)
- ✅ Les doublons sont **interdits** dans les tags d'une même collection

**Opérations:**
```sql
-- Ajout tag
UPDATE collections SET theme_tags = array_append(theme_tags, 'nouveau_tag') WHERE id = ?

-- Suppression tag
UPDATE collections SET theme_tags = array_remove(theme_tags, 'ancien_tag') WHERE id = ?

-- Recherche collections par tags (overlap)
SELECT * FROM collections WHERE theme_tags && ARRAY['tag1', 'tag2']
```

---

## 🔍 Cas d'Usage Business

### Exemple 1: Collection Scandinave Salon
```json
{
  "name": "Collection Scandinave Salon 2025",
  "style": "scandinave",
  "room_category": "salon",
  "theme_tags": ["Bois naturel", "Tons clairs", "Cocooning"],
  "visibility": "public"
}
```

**Produits typiques:** Canapés en tissu beige, tables basses en bois clair, luminaires design

### Exemple 2: Collection Extérieur Balcon
```json
{
  "name": "Mobilier Balcon Urbain",
  "style": "moderne",
  "room_category": "exterieur_balcon",
  "theme_tags": ["Petit espace", "Weather-resistant", "Pliable"],
  "visibility": "public"
}
```

**Produits typiques:** Tables pliantes, chaises empilables, jardinières compactes

### Exemple 3: Collection Multi-Usage
```json
{
  "name": "Collection Minimaliste Complète",
  "style": "minimaliste",
  "room_category": "plusieurs_pieces",
  "theme_tags": ["Eco-responsable", "Budget maîtrisé"],
  "visibility": "private"
}
```

**Produits typiques:** Mobilier multi-usage (lit avec rangement, table extensible, etc.)

---

## 🚨 Règles d'Intégrité

### Base de Données

```sql
-- Contraintes CHECK obligatoires
ALTER TABLE collections
  ADD CONSTRAINT style_valid CHECK (
    style IN ('minimaliste', 'contemporain', 'moderne', 'scandinave',
              'industriel', 'classique', 'boheme', 'art_deco')
  ),
  ADD CONSTRAINT room_category_valid CHECK (
    room_category IN ('chambre', 'wc_salle_bain', 'salon', 'cuisine',
                     'bureau', 'salle_a_manger', 'entree', 'plusieurs_pieces',
                     'exterieur_balcon', 'exterieur_jardin')
  );

-- Index pour performance
CREATE INDEX idx_collections_style ON collections(style) WHERE style IS NOT NULL;
CREATE INDEX idx_collections_room_category ON collections(room_category) WHERE room_category IS NOT NULL;
CREATE INDEX idx_collections_theme_tags ON collections USING GIN(theme_tags);
```

### Application (TypeScript)

```typescript
// Types stricts obligatoires
export type CollectionStyle =
  | 'minimaliste' | 'contemporain' | 'moderne' | 'scandinave'
  | 'industriel' | 'classique' | 'boheme' | 'art_deco'

export type RoomCategory =
  | 'chambre' | 'wc_salle_bain' | 'salon' | 'cuisine'
  | 'bureau' | 'salle_a_manger' | 'entree' | 'plusieurs_pieces'
  | 'exterieur_balcon' | 'exterieur_jardin'

// Validation côté client
if (style && !COLLECTION_STYLES.includes(style)) {
  throw new Error('Style invalide')
}
if (roomCategory && !ROOM_CATEGORIES.includes(roomCategory)) {
  throw new Error('Catégorie de pièce invalide')
}
```

---

## 🎨 Expérience Utilisateur

### Interface de Sélection

**Style:**
- ✅ Boutons visuels avec labels et descriptions
- ✅ Sélection unique (un seul style à la fois)
- ✅ Désélection possible (clic sur style actif)
- ✅ Feedback visuel noir/blanc selon design system

**Pièce:**
- ✅ Boutons avec emojis pour identification rapide
- ✅ Sélection unique (une seule pièce à la fois)
- ✅ Désélection possible
- ✅ Layout responsive (2 colonnes mobile, 5 colonnes desktop)

**Tags:**
- ✅ Input libre + bouton ajout
- ✅ Validation des doublons côté client
- ✅ Badges avec bouton suppression (X)
- ✅ Enter pour ajouter rapidement

### Filtres

**Page Collections:**
- Dropdown "Style" avec 8 options + "Tous"
- Dropdown "Pièce" avec 10 options + "Tous"
- Combinaison de filtres possible
- Requêtes Supabase optimisées avec index

---

## 📊 Métriques de Performance

**Contraintes SLO:**
- Liste collections filtrées: < 500ms
- Création collection: < 200ms
- Recherche par tags: < 300ms (grâce index GIN)
- Affichage modal: < 100ms

**Optimisations:**
- Index partiels sur style/room_category (WHERE NOT NULL)
- Index GIN sur array tags
- Eager loading des produits preview (LIMIT 4)

---

## 🔄 Évolutions Futures

**Phase 2 - Produits dans Collections:**
- Drag & drop pour ajouter produits
- Réorganisation ordre produits (position)
- Prévisualisation galerie

**Phase 3 - Partage Client:**
- Lien public avec token
- PDF export de collection
- Tracking des partages

**Phase 4 - Analyse:**
- Collections les plus populaires
- Styles tendances
- Recommandations automatiques

---

## ✅ Validation

**Tests Business:**
- ✅ Création collection avec style valide
- ✅ Création collection avec pièce valide
- ✅ Ajout/suppression tags
- ✅ Filtrage par style
- ✅ Filtrage par pièce
- ✅ Combinaison filtres
- ✅ Respect contraintes CHECK
- ✅ Performance requêtes < SLO

**Non-régression:**
- ✅ Collections existantes non affectées
- ✅ Compteurs produits fonctionnels
- ✅ Partage existant préservé
- ✅ RLS policies respectées

---

**Règles validées et déployées** ✅
**Implémentation conforme specs** ✅
**Performance SLO respectée** ✅