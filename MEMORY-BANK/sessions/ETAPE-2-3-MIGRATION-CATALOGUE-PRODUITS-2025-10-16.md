# PHASE 2 - Étape 2.3 : Migration /catalogue → /produits/catalogue

**Date** : 16 octobre 2025
**Branche** : `refonte-design-system-2025`
**Commit** : `3e63cc5`
**Durée** : 20min (estimé 25min)
**Status** : ✅ **VALIDÉE**

---

## 🎯 Objectif

Migrer la structure `/catalogue` vers `/produits/catalogue` avec redirections 301 pour préserver bookmarks utilisateurs et SEO.

---

## 📋 Actions Réalisées

### 1. Migration Physique (10min → 5min)
```bash
mkdir -p src/app/produits/catalogue
git mv src/app/catalogue/* src/app/produits/catalogue/
rmdir src/app/catalogue
```

**Résultat** : 17 fichiers migrés automatiquement détectés par Git (rename)

### 2. Mise à Jour Sidebar (3min → 2min)

**Fichier** : `/src/components/layout/app-sidebar.tsx`

**Modifications** :
```typescript
// AVANT
{ title: "Catalogue", href: "/catalogue" }
{ title: "Catégories", href: "/catalogue/categories" }
{ title: "Variantes", href: "/catalogue/variantes" }

// APRÈS
{ title: "Catalogue", href: "/produits/catalogue" }
{ title: "Catégories", href: "/produits/catalogue/categories" }
{ title: "Variantes", href: "/produits/catalogue/variantes" }
```

### 3. Redirections 301 (5min → 3min)

**Fichier** : `/next.config.js`

```javascript
async redirects() {
  return [
    {
      source: '/catalogue',
      destination: '/produits/catalogue',
      permanent: true, // 301 redirect
    },
    {
      source: '/catalogue/:path*',
      destination: '/produits/catalogue/:path*',
      permanent: true, // 301 redirect
    },
  ];
}
```

**Impact** :
- ✅ `/catalogue` → `/produits/catalogue` (301)
- ✅ `/catalogue/categories` → `/produits/catalogue/categories` (301)
- ✅ Tous sous-chemins couverts par wildcard `:path*`

### 4. Correction Imports Relatifs (8min)

**Problème détecté** : Migration augmente profondeur chemin de 1 niveau
- **Ancien** : `src/app/catalogue/page.tsx` → `../../components` ✅
- **Nouveau** : `src/app/produits/catalogue/page.tsx` → `../../components` ❌ (pointe vers `src/app/components`)

**Solution** : Conversion automatique imports relatifs → imports absolus `@/`

```bash
# Étape 1: Tentative conversion ../../ → @/
find src/app/produits/catalogue -name "*.tsx" -exec sed -i '' 's|from "\.\./\.\./|from "@/|g' {} \;

# Étape 2: Correction erreurs @/../ → @/
find src/app/produits/catalogue -name "*.tsx" -exec sed -i '' 's|from "@/\.\./|from "@/|g' {} \;

# Étape 3: Imports 3 niveaux ../../../ → @/
find src/app/produits/catalogue -name "*.tsx" -exec sed -i '' 's|from "\.\./\.\./\.\./|from "@/|g' {} \;
```

**Résultat** : 37 imports relatifs → 37 imports absolus ✅

### 5. Mise à Jour Liens Internes (3min → 2min)

**Fichiers modifiés** :
1. **archived/page.tsx** : 2 liens `/catalogue` → `/produits/catalogue`
2. **commandes/page.tsx** : 1 lien `/catalogue/stocks` → `/produits/catalogue/stocks`
3. **stocks/page.tsx** : 1 lien `/catalogue` → `/produits/catalogue`

**Total** : 4 fichiers, 4 liens mis à jour

### 6. Tests Playwright (5min → 3min)

```bash
# Redémarrage serveur Next.js (nouvelles redirections)
lsof -ti:3000 | xargs kill -9
npm run dev &
```

**Tests validés** :
1. ✅ Route `/produits/catalogue` → 200 OK
2. ✅ Redirection `/catalogue` → `/produits/catalogue` (301)
3. ✅ Redirection `/catalogue/categories` → `/produits/catalogue/categories` (301)
4. ✅ Console zéro erreur
5. ✅ Page hiérarchie catalogue fonctionnelle

**Screenshot** : `.playwright-mcp/etape-2.3-migration-catalogue-success.png`

### 7. Git Commit (2min)

```bash
git add -A
git commit -m "PHASE 2 - Étape 2.3: Migration /catalogue → /produits/catalogue + redirections 301"
```

**Commit** : `3e63cc5`

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| Fichiers migrés | 17 |
| Imports convertis | 37 |
| Liens internes mis à jour | 4 |
| Redirections 301 ajoutées | 2 |
| Erreurs console | 0 ✅ |
| Temps estimé | 25min |
| Temps réel | 20min |
| Gain temps | +5min (+20%) |

---

## 🔍 Problèmes Rencontrés

### Problème 1 : Imports relatifs cassés après migration

**Symptôme** :
```
Module not found: Can't resolve '../../components/ui/button'
```

**Cause** : Profondeur chemin augmentée de 1 niveau
- Ancien : `src/app/catalogue` (2 niveaux depuis `src/`)
- Nouveau : `src/app/produits/catalogue` (3 niveaux depuis `src/`)

**Solution** : Conversion automatique imports relatifs → absolus `@/`

**Apprentissage** : **Toujours utiliser imports absolus `@/` dans projets Next.js** pour éviter ce problème lors restructurations.

### Problème 2 : Script sed mal formé (`@/../` au lieu de `@/`)

**Symptôme** :
```
Module not found: Can't resolve '@/../components/ui/button'
```

**Cause** : Regex sed a converti `../../` en `@/../` au lieu de `@/`

**Solution** : Deuxième passe `sed` pour corriger `@/../` → `@/`

```bash
find src/app/produits/catalogue -name "*.tsx" -exec sed -i '' 's|from "@/\.\./|from "@/|g' {} \;
```

**Apprentissage** : **Toujours vérifier résultats `sed` avec `grep`** avant validation.

---

## ✅ Checklist Validation

- [x] Fichiers déplacés vers `/src/app/produits/catalogue/`
- [x] Sidebar links mis à jour
- [x] Redirections 301 configurées dans `next.config.js`
- [x] Imports relatifs → imports absolus `@/`
- [x] Liens internes mis à jour (4 fichiers)
- [x] Tests Playwright : routes 200 OK + redirections 301
- [x] Console ZÉRO erreur
- [x] Git commit effectué (`3e63cc5`)
- [x] Screenshot preuve fonctionnelle
- [x] Documentation session créée

---

## 🎯 Prochaine Étape

**Étape 2.4** : Migration `/sourcing` → `/produits/sourcing` + redirections 301

**Estimation** : 15min (moins de fichiers que catalogue)

**Prérequis** : Étape 2.3 validée ✅

**Même stratégie** :
1. `git mv` pour migration physique
2. Imports absolus `@/` systématiques
3. Redirections 301 wildcard
4. Tests Playwright console propre

---

## 📈 Impact Business

### UX Utilisateurs
- ✅ **Aucune rupture navigation** : Redirections 301 préservent bookmarks
- ✅ **Cohérence URLs** : Structure `/produits/*` logique
- ✅ **Performance** : Aucun ralentissement (redirections côté serveur)

### SEO
- ✅ **301 Permanent** : Moteurs recherche suivent redirections
- ✅ **Pas de 404** : Ancien URLs restent valides

### Développement
- ✅ **Imports absolus** : Plus de problèmes profondeur chemin
- ✅ **Structure claire** : `/produits/catalogue` explicite
- ✅ **Maintenance facilitée** : Moins d'imports relatifs fragiles

---

## 🧠 Process Learnings

### Ce qui a bien fonctionné
1. **`git mv`** : Détection automatique renommages
2. **Redirections wildcard** : Couvre tous sous-chemins en 1 règle
3. **Imports absolus `@/`** : Solution robuste vs profondeur variable
4. **Playwright MCP** : Tests navigation + console en 3min

### Ce qui peut être amélioré
1. **Script `sed` plus robuste** : Éviter conversion `@/../`
2. **Vérification systématique imports** : `grep` avant validation
3. **Documentation imports absolus** : Ajouter au guide développeur

### Outils MCP Utilisés
- ✅ **Bash** : `git mv`, `sed`, `grep`, `find`
- ✅ **Read/Edit** : Modifications fichiers ciblées
- ✅ **Playwright Browser** : Tests navigation + console
- ✅ **Playwright Screenshot** : Preuve visuelle

---

## 📚 Références

- **Business Rule** : Aucune (refactoring technique)
- **PRD** : Aucune (refactoring technique)
- **Architecture** : Structure modulaire `/produits/*`
- **Commit précédent** : `b74db75` (Étape 2.2 - Sidebar refactorée)
- **Commit actuel** : `3e63cc5` (Étape 2.3 - Migration catalogue)

---

**Orchestrator** : Claude Code (Vérone System Orchestrator)
**Session terminée** : 16 octobre 2025 - 10:45
