#!/bin/bash

# ================================================================================
# SCRIPT DE RÉCUPÉRATION - CreateProductInGroupModal (Version Finale)
# ================================================================================
#
# Ce script permet de récupérer la version la plus récente du modal
# CreateProductInGroupModal supprimé lors de la migration monorepo.
#
# Date extraction : 2025-11-07
# Commit cible    : 4e796e639a7903cb09c181c6663cb2f093d95f9a
# Date commit     : 1er novembre 2025, 22h06
#
# ================================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================================================"
echo -e "${BLUE}RÉCUPÉRATION CreateProductInGroupModal - Version Finale${NC}"
echo "================================================================================"
echo ""

# ================================================================================
# 1. EXTRAIRE VERSION FINALE (252 lignes)
# ================================================================================

echo -e "${GREEN}[1/5] Extraction version finale (1er Nov 2025)...${NC}"

git show 4e796e639a7903cb09c181c6663cb2f093d95f9a:src/components/forms/create-product-in-group-modal.tsx \
  > create-product-in-group-modal-FINAL.tsx

LINES_FINAL=$(wc -l < create-product-in-group-modal-FINAL.tsx | tr -d ' ')
echo "      ✅ Fichier extrait : create-product-in-group-modal-FINAL.tsx ($LINES_FINAL lignes)"

# ================================================================================
# 2. EXTRAIRE VERSION AVANT AMÉLIORATIONS (204 lignes)
# ================================================================================

echo -e "${GREEN}[2/5] Extraction version avant améliorations (30 Oct 2025)...${NC}"

git show 4e796e639a7903cb09c181c6663cb2f093d95f9a^:src/components/forms/CreateProductInGroupModal.tsx \
  > CreateProductInGroupModal-v1.1.tsx

LINES_BEFORE=$(wc -l < CreateProductInGroupModal-v1.1.tsx | tr -d ' ')
echo "      ✅ Fichier extrait : CreateProductInGroupModal-v1.1.tsx ($LINES_BEFORE lignes)"

# ================================================================================
# 3. GÉNÉRER DIFF ENTRE LES DEUX VERSIONS
# ================================================================================

echo -e "${GREEN}[3/5] Génération diff entre versions...${NC}"

diff -u CreateProductInGroupModal-v1.1.tsx create-product-in-group-modal-FINAL.tsx \
  > diff-modal-versions.patch || true

DIFF_LINES=$(wc -l < diff-modal-versions.patch | tr -d ' ')
echo "      ✅ Diff généré : diff-modal-versions.patch ($DIFF_LINES lignes)"

# ================================================================================
# 4. EXTRAIRE DÉPENDANCES
# ================================================================================

echo -e "${GREEN}[4/5] Extraction dépendances...${NC}"

# DynamicColorSelector
git show 4e796e639a7903cb09c181c6663cb2f093d95f9a:src/components/business/DynamicColorSelector.tsx \
  > DynamicColorSelector.tsx 2>/dev/null || echo "      ⚠️  DynamicColorSelector.tsx non trouvé à ce commit"

# use-product-colors hook
git show 4e796e639a7903cb09c181c6663cb2f093d95f9a:src/hooks/use-product-colors.ts \
  > use-product-colors.ts 2>/dev/null || echo "      ⚠️  use-product-colors.ts non trouvé à ce commit"

echo "      ✅ Dépendances extraites (si disponibles)"

# ================================================================================
# 5. GÉNÉRER RAPPORT RÉCAPITULATIF
# ================================================================================

echo -e "${GREEN}[5/5] Génération rapport récapitulatif...${NC}"

cat > RAPPORT-RECUPERATION.md << 'EOFMD'
# 📦 RAPPORT DE RÉCUPÉRATION - CreateProductInGroupModal

**Date** : $(date +"%Y-%m-%d %H:%M")  
**Commit source** : 4e796e639a7903cb09c181c6663cb2f093d95f9a  
**Date commit** : 1er novembre 2025, 22h06

---

## 📁 FICHIERS EXTRAITS

### 1. Version Finale (252 lignes)
**Fichier** : `create-product-in-group-modal-FINAL.tsx`  
**Commit** : 4e796e63  
**Date** : 1er Nov 2025, 22h06  
**Features** :
- ✅ Validation anti-doublon complète
- ✅ Gestion erreurs avec toast
- ✅ Icon AlertCircle
- ✅ Messages contextuels (color vs material)
- ✅ Renommage kebab-case

### 2. Version Avant Améliorations (204 lignes)
**Fichier** : `CreateProductInGroupModal-v1.1.tsx`  
**Commit** : 6d4b33c8 (parent de 4e796e63)  
**Date** : 30 Oct 2025  
**Features** :
- Modal création produit de base
- DynamicColorSelector
- Prévisualisation nom
- Pas de validation anti-doublon

### 3. Diff Versions
**Fichier** : `diff-modal-versions.patch`  
**Contenu** : Différences ligne par ligne entre v1.1 et v2.0

### 4. Dépendances (si disponibles)
- `DynamicColorSelector.tsx` : Sélecteur couleurs dynamique
- `use-product-colors.ts` : Hook gestion couleurs

---

## 🔧 COMMANDES UTILISÉES

```bash
# Extraction version finale
git show 4e796e63:src/components/forms/create-product-in-group-modal.tsx > create-product-in-group-modal-FINAL.tsx

# Extraction version avant
git show 4e796e63^:src/components/forms/CreateProductInGroupModal.tsx > CreateProductInGroupModal-v1.1.tsx

# Génération diff
diff -u CreateProductInGroupModal-v1.1.tsx create-product-in-group-modal-FINAL.tsx > diff-modal-versions.patch

# Extraction dépendances
git show 4e796e63:src/components/business/DynamicColorSelector.tsx > DynamicColorSelector.tsx
git show 4e796e63:src/hooks/use-product-colors.ts > use-product-colors.ts
```

---

## 📊 STATISTIQUES

| Métrique | Version v1.1 | Version FINALE | Delta |
|----------|--------------|----------------|-------|
| Lignes code | 204 | 252 | +48 (+23.5%) |
| Imports | 9 | 11 | +2 |
| State hooks | 2 | 4 | +2 |
| Validation | ❌ | ✅ | Ajoutée |
| Error handling | Basique | Complet | Amélioré |

---

## ✅ PROCHAINES ÉTAPES

1. **Copier version finale** dans votre projet :
   ```bash
   cp create-product-in-group-modal-FINAL.tsx src/components/forms/create-product-in-group-modal.tsx
   ```

2. **Copier dépendances** (si nécessaires) :
   ```bash
   cp DynamicColorSelector.tsx src/components/business/
   cp use-product-colors.ts src/hooks/
   ```

3. **Installer dépendances shadcn/ui** :
   ```bash
   npx shadcn-ui@latest add dialog button input label badge toast
   ```

4. **Vérifier imports** :
   - Vérifier que `@/types/variant-groups` existe
   - Vérifier que `@/hooks/use-toast` est disponible
   - Vérifier que `lucide-react` est installé

5. **Tester** :
   ```bash
   npm run build
   npm run dev
   ```

---

**Généré automatiquement par** : `COMMANDES-RECUPERATION-MODAL.sh`
EOFMD

echo "      ✅ Rapport : RAPPORT-RECUPERATION.md"

# ================================================================================
# RÉSUMÉ FINAL
# ================================================================================

echo ""
echo "================================================================================"
echo -e "${BLUE}RÉCUPÉRATION TERMINÉE AVEC SUCCÈS${NC}"
echo "================================================================================"
echo ""
echo -e "${YELLOW}FICHIERS GÉNÉRÉS :${NC}"
echo "  1. create-product-in-group-modal-FINAL.tsx     ($LINES_FINAL lignes)"
echo "  2. CreateProductInGroupModal-v1.1.tsx          ($LINES_BEFORE lignes)"
echo "  3. diff-modal-versions.patch                   ($DIFF_LINES lignes)"
echo "  4. DynamicColorSelector.tsx                    (si disponible)"
echo "  5. use-product-colors.ts                       (si disponible)"
echo "  6. RAPPORT-RECUPERATION.md                     (rapport complet)"
echo ""
echo -e "${GREEN}✅ Version finale extraite avec succès !${NC}"
echo ""
echo -e "${YELLOW}COMMIT SOURCE :${NC}"
echo "  Hash   : 4e796e639a7903cb09c181c6663cb2f093d95f9a"
echo "  Date   : 1er novembre 2025, 22h06"
echo "  Message: fix(variantes): Corrections anti-doublon + input libre couleur"
echo ""
echo -e "${YELLOW}PROCHAINES ÉTAPES :${NC}"
echo "  1. Consulter RAPPORT-RECUPERATION.md pour instructions détaillées"
echo "  2. Copier create-product-in-group-modal-FINAL.tsx dans votre projet"
echo "  3. Copier dépendances (DynamicColorSelector, use-product-colors)"
echo "  4. Installer shadcn/ui components (dialog, button, input, label, badge, toast)"
echo "  5. Tester avec npm run build && npm run dev"
echo ""
echo "================================================================================"
echo -e "${BLUE}Pour plus d'informations, consulter :${NC}"
echo "  - LIVRABLE-CREATE-PRODUCT-IN-GROUP-MODAL-2025-11-07.md (1300+ lignes)"
echo "  - RESUME-CREATE-PRODUCT-MODAL-2025-11-07.md (résumé 1 page)"
echo "  - HISTORIQUE-GIT-CREATE-PRODUCT-MODAL.txt (timeline complète)"
echo "================================================================================"
