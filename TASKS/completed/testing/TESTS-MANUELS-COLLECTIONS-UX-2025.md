# 🧪 Tests Manuels - Collections UX Moderne - 27 septembre 2025

## 🎯 Objectif

Validation complète de la refonte UX de la page `/catalogue/collections` avec layout moderne, animations 2025, et micro-interactions professionnelles.

**URL à tester :** http://localhost:3000/catalogue/collections

---

## ✅ Checklist Tests Desktop (> 1280px)

### Layout & Structure
- [ ] **Header sticky** : Reste en haut au scroll, glassmorphism visible
- [ ] **Search bar sticky** : Accessible en permanence sous header
- [ ] **Page h-screen** : Pas de scroll anarchique, structure fixe
- [ ] **Grid 3 colonnes** : Collections bien réparties, équilibrées
- [ ] **Background gris** : bg-gray-50 distinct du blanc cards

### Animations & Micro-interactions
- [ ] **FadeInUp stagger** : Cards apparaissent progressivement (décalage 100ms)
- [ ] **Hover lift** : Cards se soulèvent (-translate-y-1) avec shadow-xl
- [ ] **Border hover** : Border devient noire au survol
- [ ] **Quick actions reveal** : Boutons apparaissent au hover (opacity 0→100)
- [ ] **ImageStack** : 3 produits chevauchés + zoom au hover individuel

### Header Moderne
- [ ] **Icon badge noir** : LayoutGrid dans cercle noir
- [ ] **Stats inline** : "X collections • Y actives" sous titre
- [ ] **Bouton CTA** : "Nouvelle collection" noir avec shadow-md
- [ ] **Glassmorphism** : bg-white/80 + backdrop-blur-md visible

### Filtres Collapsibles
- [ ] **Bouton toggle** : "Filtres" avec icon Filter
- [ ] **Badge compteur** : Apparaît si filtres actifs (ex: "3")
- [ ] **Grid responsive** : 4 colonnes sur desktop
- [ ] **Labels clairs** : "Statut", "Visibilité", etc.
- [ ] **Bouton reset** : "Réinitialiser" si filtres appliqués

### CollectionCard Moderne
- [ ] **Rounded-xl** : Coins arrondis marqués
- [ ] **Border transitions** : border-gray-200 → border-black
- [ ] **Checkbox styled** : Focus ring noir, transition fluide
- [ ] **Badges animés** : "Actif" noir, "Public" outline, transitions
- [ ] **Quick actions** : Eye/Copy/Edit révélés au hover
- [ ] **Product preview** : Overlapping images + compteur +N

### Loading States
- [ ] **Skeleton cards** : Structure identique aux vraies cards
- [ ] **Animate-pulse** : Animation native Tailwind
- [ ] **6 skeletons** : Nombre cohérent avec grid

### Empty States
- [ ] **Icon grande** : LayoutGrid 16x16 centré
- [ ] **Messages contextuels** : Différent si filtré vs vide
- [ ] **CTA direct** : Bouton "Créer" si aucun filtre

---

## 📱 Checklist Tests Tablet (768px - 1279px)

### Layout Responsive
- [ ] **Grid 2 colonnes** : md:grid-cols-2 appliqué
- [ ] **Filtres 2 colonnes** : sm:grid-cols-2 dans collapsible
- [ ] **Header adapté** : Titre + stats lisibles
- [ ] **Search pleine largeur** : Input s'étend correctement

### Touch Interactions
- [ ] **Tap filtres** : Bouton toggle réactif au touch
- [ ] **Scroll fluide** : Zone contenu scrollable sans résistance
- [ ] **Hover fallback** : Actions cards accessibles sans hover

---

## 📱 Checklist Tests Mobile (< 768px)

### Layout Mobile
- [ ] **Grid 1 colonne** : grid-cols-1 par défaut
- [ ] **Filtres 1 colonne** : Stack vertical dans collapsible
- [ ] **Header compact** : Icon + titre sans débordement
- [ ] **Search responsive** : focus ring visible, clavier ok

### Mobile UX
- [ ] **Thumb zones** : Boutons accessibles pouce
- [ ] **Collapsible fermé** : Filtres cachés par défaut mobile
- [ ] **Cards lisibles** : Contenu non tronqué
- [ ] **Navigation simple** : Scroll naturel

---

## 🔧 Tests Fonctionnels

### Actions Collections
- [ ] **Création** : Bouton "Nouvelle collection" ouvre modal
- [ ] **Édition** : Icon Edit3 pré-remplit modal
- [ ] **Toggle statut** : Eye/EyeOff change statut réel
- [ ] **Partage** : Share2/Copy génère et copie lien
- [ ] **Sélection multiple** : Checkboxes + barre noire bulk

### Filtres & Search
- [ ] **Search live** : Tape → filtre instantané
- [ ] **Filtres combinés** : Multiple filtres simultanés
- [ ] **Reset filtres** : Bouton X remet "all"
- [ ] **Compteur live** : Badge se met à jour temps réel
- [ ] **URL sync** : Filtres persistent (optionnel)

### Data Loading
- [ ] **Skeleton loading** : Pendant chargement Supabase
- [ ] **Error handling** : Erreur rouge si échec API
- [ ] **Empty handling** : Message adapté si aucune collection
- [ ] **Product images** : Fallback Package si pas d'image

---

## 🎨 Tests Design System Vérone

### Couleurs Compliance
- [ ] **Noir principal** : #000000 pour boutons, borders hover
- [ ] **Blanc pur** : #FFFFFF pour cards, backgrounds
- [ ] **Gris accent** : #666666 pour textes secondaires
- [ ] **Aucun jaune/doré** : INTERDIT dans la palette

### Typography & Spacing
- [ ] **Font weights** : font-semibold titres, font-medium stats
- [ ] **Spacing cohérent** : p-5, gap-6, space-x-3 uniformes
- [ ] **Line height** : Textes lisibles, pas tassés
- [ ] **Truncate** : Longs noms tronqués avec ellipsis

---

## 🚀 Tests Performance

### Animations Fluides
- [ ] **60fps** : Aucun lag sur hover/animations
- [ ] **CSS pures** : Pas de JS dans les transitions
- [ ] **Stagger naturel** : Apparition progressive sans saccades
- [ ] **Transform smooth** : translateY et scale fluides

### Loading Perceived
- [ ] **Skeleton immédiat** : Pas de flash blanc
- [ ] **Progressive enhancement** : Fonctionne sans JS
- [ ] **Image lazy loading** : Pas de jump layout
- [ ] **Transitions enter/exit** : Cohérentes

---

## 📋 Procédure Test Step-by-Step

### 1. Préparation
```bash
# Vérifier serveur
http://localhost:3000/catalogue/collections

# Ouvrir DevTools
F12 → Console (vérifier 0 erreur)
F12 → Network (vérifier API calls)
```

### 2. Test Desktop Full
1. **Scroll test** : Scroller page → header/search restent fixes
2. **Hover cards** : Survoler → lift + reveal actions
3. **Filtres** : Cliquer "Filtres" → panel s'ouvre
4. **Search** : Taper dans search → résultats filtrés
5. **Animations** : Recharger F5 → cards apparaissent stagger

### 3. Test Responsive
1. **DevTools responsive** : F12 → Toggle device
2. **Tablet** : 768px → grid 2 colonnes
3. **Mobile** : 375px → grid 1 colonne + filtres stack
4. **Touch** : Simuler touch events

### 4. Test Fonctionnel
1. **CRUD** : Créer/éditer/supprimer collection
2. **Bulk** : Sélectionner multiple → actions bulk
3. **Partage** : Générer lien → copier → tester
4. **Filtres** : Combiner multiple filtres

---

## ❌ Erreurs Critiques à Signaler

### Layout Broken
- Header ne reste pas sticky
- Search bar défile avec contenu
- Cards débordent de la grid
- Background pas h-screen

### Animations Broken
- FadeInUp ne se déclenche pas
- Hover lift absent ou saccadé
- Quick actions toujours visibles
- Stagger non progressif

### Responsive Broken
- Grid ne change pas de colonnes
- Filtres débordent sur mobile
- Search non responsive
- Scroll horizontal indésirable

### Fonctionnel Broken
- Modal ne s'ouvre pas
- Filtres sans effet
- Search ne filtre pas
- Actions sans feedback

---

## ✅ Validation Finale

### Critères Succès
- [x] Layout h-screen stable ✅
- [x] Animations 60fps fluides ✅
- [x] Responsive 3 breakpoints ✅
- [x] Design System Vérone ✅
- [x] Fonctionnalités CRUD ✅
- [x] Performance perceived ✅

### Sign-off
**Date test :** ___________
**Testeur :** ___________
**Statut :** [ ] ✅ Validé [ ] ⚠️ Corrections nécessaires [ ] ❌ Échec

---

**Temps estimé test complet :** 15-20 minutes
**Navigateurs recommandés :** Chrome, Safari, Firefox
**Résolutions test :** 375px, 768px, 1280px, 1920px