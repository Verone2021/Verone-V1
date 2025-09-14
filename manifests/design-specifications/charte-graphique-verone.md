# Charte Graphique Vérone - Spécifications Techniques

> **Version** : 1.0  
> **Date** : Septembre 2024  
> **Statut** : Officiel - Règles strictes à respecter

## 🎯 Philosophie Design

La marque Vérone incarne **l'élégance par la simplicité**. Notre identité visuelle repose sur un **minimalisme sophistiqué** utilisant exclusivement le noir et le blanc pour créer une expérience premium sans artifice.

## 🎨 Palette Couleurs Officielle

### **Couleurs Autorisées**
```css
/* Couleurs principales Vérone */
--verone-noir: #000000;           /* Couleur principale */
--verone-blanc: #FFFFFF;          /* Couleur secondaire */

/* Usage recommandé */
--text-primary: #000000;          /* Textes principaux */
--background-primary: #FFFFFF;    /* Fonds principaux */
--border-primary: #000000;        /* Bordures et séparateurs */
```

### **Couleurs Interdites**
- **Toutes couleurs décoratives** : Strictement interdites (y compris jaune, doré, etc.)
- **Dégradés** : Non autorisés

### **Couleurs Fonctionnelles** (Système uniquement)
```css
/* États système - usage exceptionnel uniquement */
--system-success: #22c55e;        /* Confirmations */
--system-warning: #f59e0b;        /* Alertes */
--system-error: #ef4444;          /* Erreurs */
--system-info: #3b82f6;           /* Informations */
```

## 📝 Typographies Officielles

### **Hiérarchie Typographique**
```css
/* Fonts officielles selon charte Vérone */
--font-logo: 'Balgin Light SM Expanded';      /* UNIQUEMENT pour logo et titres principaux */
--font-heading: 'Monarch Regular';            /* Sous-titres et éléments élégants */
--font-body: 'Fieldwork 10 Geo Regular';      /* Corps de texte et interface */
--font-mono: 'JetBrains Mono';                /* Code et références techniques */

/* Scale harmonieuse */
--text-xs: 0.75rem;      /* 12px - Labels, métadonnées */
--text-sm: 0.875rem;     /* 14px - Descriptions, sous-textes */
--text-base: 1rem;       /* 16px - Corps principal */
--text-lg: 1.125rem;     /* 18px - Sous-titres */
--text-xl: 1.25rem;      /* 20px - Titres de sections */
--text-2xl: 1.5rem;      /* 24px - Titres principaux */
--text-3xl: 1.875rem;    /* 30px - Headers display */
```

### **Usage des Typographies**
- **Balgin Light SM Expanded** : Réservée au logo Vérone et titres principaux exceptionnels
- **Monarch Regular** : Sous-titres élégants, navigation principale
- **Fieldwork 10 Geo Regular** : Interface utilisateur, formulaires, corps de texte

## 🏷️ Logo et Identité Visuelle

### **⚠️ RÈGLES CRITIQUES LOGO**
1. **INTERDICTION ABSOLUE** : Ne JAMAIS ajouter "by Romeo" sous le logo blanc
2. **Versions autorisées** :
   - Logo noir sur fond blanc/clair
   - Logo blanc sur fond noir/foncé
   - Symbole V seul (même règles de couleur)
3. **Intégrité** : Aucune modification, déformation ou ajout non autorisé

### **Zone de Protection**
- **Espace minimal** : Équivalent à la hauteur de la lettre 'V' autour du logo
- **Taille minimale** : 100px largeur (digital) / 20mm (print)

### **Usages Logo**
```css
/* Classes utilitaires pour logo */
.logo-black { color: #000000; }              /* Sur fond clair */
.logo-white { color: #FFFFFF; }              /* Sur fond sombre */
.logo-min-size { min-width: 100px; }         /* Taille minimale */
```

## 🎭 Composants UI Vérone

### **Boutons**
```css
/* Bouton primaire */
.btn-primary {
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: #FFFFFF;
  color: #000000;
}

/* Bouton secondaire */
.btn-secondary {
  background: #FFFFFF;
  color: #000000;
  border: 2px solid #000000;
}

.btn-secondary:hover {
  background: #000000;
  color: #FFFFFF;
}
```

### **Cards et Conteneurs**
```css
.card-verone {
  background: #FFFFFF;
  border: 1px solid #000000;
  box-shadow: none; /* Pas d'ombre - design épuré */
}

.card-inverse {
  background: #000000;
  color: #FFFFFF;
  border: 1px solid #000000;
}
```

### **Navigation**
```css
.nav-verone {
  background: #FFFFFF;
  border-bottom: 1px solid #000000;
}

.nav-item {
  color: #000000;
  font-family: 'Monarch Regular';
  transition: opacity 150ms ease-out;
}

.nav-item:hover {
  opacity: 0.7; /* Effet subtil */
}
```

## 📱 Design Responsive

### **Breakpoints Standards**
```css
/* Approche mobile-first */
--mobile: 320px;          /* Mobile small */
--mobile-lg: 480px;       /* Mobile large */
--tablet: 768px;          /* Tablette */
--desktop: 1024px;        /* Desktop */
--desktop-lg: 1280px;     /* Desktop large */
--ultra-wide: 1536px;     /* Ultra-wide */
```

### **Principes Responsive**
1. **Mobile-first** : Design prioritaire pour mobile
2. **Touch-friendly** : Targets ≥44px pour interactions tactiles
3. **Lisibilité** : Contraste maximal noir/blanc sur tous écrans
4. **Performance** : Images optimisées, CSS minimal

## ✨ Animations et Transitions

### **Durées Standards**
```css
--duration-fast: 150ms;     /* Hovers, micro-interactions */
--duration-normal: 300ms;   /* Modals, navigation */
--duration-slow: 500ms;     /* Transitions de page */
```

### **Easings**
```css
--ease-standard: ease-out;  /* Transition standard */
--ease-sharp: ease-in;      /* Fermetures */
--ease-smooth: ease-in-out; /* Transitions fluides */
```

### **Animations Autorisées**
- **Fade** : Apparitions/disparitions
- **Slide** : Déplacements latéraux/verticaux
- **Scale** : Agrandissement/réduction subtile
- **Opacity** : Changements de transparence

## 🚫 Interdictions Strictes

### **Couleurs**
- ❌ Toute couleur décorative (jaune, doré, etc.)
- ❌ Dégradés, ombres colorées

### **Logo**
- ❌ "by Romeo" sous le logo blanc
- ❌ Modifications du logo officiel
- ❌ Logo sur fond inadapté (mauvais contraste)

### **Design**
- ❌ Ornements, décorations superflues
- ❌ Effets 3D, textures
- ❌ Typographies non autorisées
- ❌ Animations flashy ou distractives

## 📐 Grille et Spacing

### **Système de Grille**
```css
/* Système 8px base */
--space-xs: 4px;      /* 0.25rem */
--space-sm: 8px;      /* 0.5rem */
--space-md: 16px;     /* 1rem */
--space-lg: 24px;     /* 1.5rem */
--space-xl: 32px;     /* 2rem */
--space-2xl: 48px;    /* 3rem */
--space-3xl: 64px;    /* 4rem */

/* Containers */
--container-xs: 480px;
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
```

## 🎯 Standards Accessibilité

### **Contrastes**
- **Noir sur Blanc** : Ratio 21:1 (AAA)
- **Blanc sur Noir** : Ratio 21:1 (AAA)
- **Texte minimum** : 16px (1rem) pour lisibilité optimale

### **Navigation**
- **Focus visible** : Outline noir 2px sur tous éléments interactifs
- **Keyboard navigation** : 100% accessible clavier
- **Screen readers** : Labels ARIA complets
- **Touch targets** : Minimum 44px × 44px

## 📊 Métriques Qualité

### **Performance**
- **First Contentful Paint** : <1.5s
- **Largest Contentful Paint** : <2.5s
- **Cumulative Layout Shift** : <0.1

### **UX**
- **Contraste** : AAA sur tous les textes
- **Touch targets** : 100% conformes (≥44px)
- **Responsive** : Parfait sur tous breakpoints

Cette charte garantit une identité Vérone cohérente, élégante et accessible à travers tous les touchpoints digitaux.