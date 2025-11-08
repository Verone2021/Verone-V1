# Composants Désactivés - @verone/ui

**Date** : 2025-11-08
**Raison** : Migration massive vers package npm indépendant

---

## 🚫 Composants Temporairement Désactivés (3)

Ces composants dépendent de modules externes non disponibles dans le package `@verone/ui` isolé.

### 1. ImageUploadZone

**Fichier** : `src/components/ui/image-upload-zone.tsx`

**Dépendance bloquante** :

```typescript
import { createClient } from '@verone/utils';
```

**Problème** :

- Dépend du client Supabase (Storage)
- `@verone/utils` ne contient que des utilitaires purs (cn, etc.)
- Logique métier upload/storage non portable en package UI

**Solutions futures** :

1. **Recommandé** : Déplacer vers app principale (`src/components/business/`)
2. Créer package dédié `@verone/upload` avec Supabase client
3. Abstraire upload logic avec interface générique

**Usage actuel** : StockAdjustmentForm, ExpenseForm, ProductForm (Step 2)

---

### 2. PhaseIndicator

**Fichier** : `src/components/ui/phase-indicator.tsx`

**Dépendance bloquante** :

```typescript
import {
  getModulePhase,
  getModuleDeploymentStatus,
  PHASE_LABELS,
  PHASE_COLORS,
} from '@/lib/feature-flags';
```

**Problème** :

- Dépend de la logique feature flags applicative
- Import alias `@/lib/feature-flags` spécifique à l'app
- Pas de sens dans un package UI générique

**Solutions futures** :

1. **Recommandé** : Déplacer vers app principale (`src/components/layout/`)
2. Accepter `phaseConfig` comme prop pour rendre générique
3. Supprimer si déploiement progressif terminé (Phase 1 achevée)

**Usage actuel** : Affichage badges "Bientôt disponible" modules Phase 2+

---

### 3. RoomMultiSelect

**Fichier** : `src/components/ui/room-multi-select.tsx`

**Dépendance bloquante** :

```typescript
import type { RoomType } from '../../types/room-types';
import {
  ROOM_CONFIGS,
  ROOM_CATEGORIES,
  getRoomLabel,
  getRoomsByCategory,
} from '../../types/room-types';
```

**Problème** :

- Dépend de types business métier spécifiques (pièces décoration)
- Fichier `../../types/room-types` n'existe pas dans package UI
- Composant très spécifique métier, pas générique

**Solutions futures** :

1. **Recommandé** : Déplacer vers app principale (`src/components/business/`)
2. Créer `@verone/types` avec types business partagés
3. Généraliser en `MultiSelect` générique + config room externe

**Usage actuel** : Sélection multi-pièces pour produits décoration

---

## ✅ Statut Exports

**Fichier** : `src/components/ui/index.ts`

```typescript
// DISABLED: Dépend de @verone/utils createClient non disponible
// export * from './image-upload-zone';

// DISABLED: Dépend de @/lib/feature-flags non disponible dans @verone/ui
// export * from './phase-indicator';

// DISABLED: Dépend de ../../types/room-types non disponible dans @verone/ui
// export * from './room-multi-select';
```

**Composants exportables** : 51 / 54 (94%)
**Composants désactivés** : 3 / 54 (6%)

---

## 📋 Migration Checklist

**Avant production package `@verone/ui`** :

- [ ] Déplacer `ImageUploadZone` → `src/components/business/`
- [ ] Déplacer `PhaseIndicator` → `src/components/layout/`
- [ ] Déplacer `RoomMultiSelect` → `src/components/business/`
- [ ] Supprimer fichiers `.tsx` désactivés du package
- [ ] Mettre à jour imports dans app principale
- [ ] Tests imports fonctionnels

**OU Alternative** :

- [ ] Créer `@verone/upload` avec ImageUploadZone + Supabase
- [ ] Créer `@verone/types` avec RoomType + autres types métier
- [ ] Supprimer PhaseIndicator si Phase 1 déployée en prod

---

**Note** : Ces composants sont marqués `// @ts-nocheck` pour permettre le build du package sans erreurs TypeScript.
