# Vérone Design System - Interdiction Absolue des Couleurs Jaunes/Dorées

## 🚨 RÈGLE CRITIQUE - JAMAIS VIOLER

**INTERDICTION TOTALE** : Aucune couleur jaune, dorée, ambre ou orange ne doit JAMAIS être utilisée dans le système Vérone.

### Couleurs Strictement Interdites

#### Codes Hex Interdits
- `#ffff*` (toutes variations de jaune hex)
- `#ff0*` (toutes variations de jaune/orange hex)
- `#f59e0b` (orange Tailwind)
- `#fbbf24` (jaune Tailwind)
- `#eab308` (yellow-500)
- `#facc15` (yellow-400)
- `#fde047` (yellow-300)

#### Classes CSS Interdites
- `bg-yellow-*` (toutes variations)
- `text-yellow-*` (toutes variations)
- `border-yellow-*` (toutes variations)
- `bg-amber-*` (toutes variations)
- `text-amber-*` (toutes variations)
- `border-amber-*` (toutes variations)
- `bg-gold-*` (toutes variations)
- `text-gold-*` (toutes variations)
- `border-gold-*` (toutes variations)

### Alternatives Obligatoires

**Au lieu de jaune/doré, TOUJOURS utiliser :**
- ✅ `text-black` ou `#000000`
- ✅ `bg-black text-white` pour highlights
- ✅ `border-black` pour bordures
- ✅ `text-gray-600` pour texte secondaire

### Fichiers Concernés

Cette règle s'applique SANS EXCEPTION à :
- **Composants React** (`src/components/**`)
- **Pages Next.js** (`src/app/**`)
- **Styles CSS/Tailwind** (`tailwind.config.js`, `*.css`)
- **Documentation** (`CLAUDE.md`, `manifests/**`)
- **Agents MCP** (`.claude/agents/**`)
- **Commandes Claude** (`.claude/commands/**`)

### Application Immédiate

**Action requise** si couleur jaune détectée :
1. Remplacer immédiatement par équivalent noir/blanc
2. Vérifier tous fichiers liés
3. Tester visuellement l'interface
4. Documenter le changement

### Philosophie Vérone

La marque Vérone incarne **l'élégance par la simplicité** avec un **minimalisme sophistiqué** utilisant EXCLUSIVEMENT noir et blanc pour créer une expérience premium sans artifice.

**Toute couleur décorative viole l'identité de marque Vérone.**

## Historique des Violations Corrigées

### 2025-09-15 - Nettoyage Complet
- ✅ `src/app/dashboard/page.tsx:136` - `text-yellow-500` → `text-black`
- ✅ `src/components/ui/badge.tsx:16` - `bg-blue-600` → `bg-black`
- ✅ `manifests/design-specifications/charte-graphique-verone.md:33` - `#f59e0b` → `#000000`
- ✅ `.claude/agents/verone-design-expert.md:5` - `color: yellow` → `color: black`
- ✅ `.claude/commands/design-verone.md:104` - `#f59e0b` → `#000000`
- ✅ `CLAUDE.md:496` - `#f59e0b` → `#000000`

**Résultat** : 100% des couleurs jaunes/dorées supprimées du système.