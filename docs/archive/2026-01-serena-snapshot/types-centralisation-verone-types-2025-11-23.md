# Migration Types Supabase → Package Partagé @verone/types

**Date** : 2025-11-23  
**Statut** : ✅ COMPLÉTÉ  
**Type** : Clean Architecture - Centralisation Types

---

## 🎯 OBJECTIF

Centraliser la définition des types `Database` Supabase dans le package partagé `@verone/types` pour permettre leur réutilisation dans les 3 applications (back-office, site-internet, linkme).

**Problème initial** : Types générés uniquement dans `apps/back-office/src/types/supabase.ts`, inaccessibles proprement aux autres apps.

---

## ✅ IMPLÉMENTATION

### Phase 1 : Configuration Package

- ✅ Ajout dépendance `@verone/types: "workspace:*"` dans `apps/back-office/package.json`
- ✅ Création script centralisé `generate:types` dans `package.json` racine
- ✅ Build package `@verone/types` validé

### Phase 2 : Migration Imports

- ✅ **7 fichiers refactorés** (imports `@/types/supabase` → `@verone/types`)
  1. `apps/back-office/src/app/canaux-vente/prix-clients/page.tsx`
  2. `apps/back-office/src/app/canaux-vente/site-internet/types.ts`
  3. `apps/back-office/src/app/produits/catalogue/[productId]/page.tsx`
  4. `apps/back-office/src/app/produits/sourcing/echantillons/page.tsx`
  5. `apps/back-office/src/app/contacts-organisations/customers/page.tsx`
  6. `apps/back-office/src/app/contacts-organisations/suppliers/page.tsx`
  7. `apps/back-office/src/app/contacts-organisations/partners/page.tsx`

### Phase 3 : Archivage & Validation

- ✅ Ancien fichier `apps/back-office/src/types/supabase.ts` archivé dans `backups/types-migration-2025-11-23/`
- ✅ Type-check complet : **30/30 tasks successful** (100%)
- ✅ Build @verone/types : **PASSÉ**
- ✅ Documentation CLAUDE.md mise à jour (ligne 94)

---

## 📝 COMMANDE GÉNÉRATION TYPES

```bash
# ✅ NOUVELLE COMMANDE (depuis Phase 4)
npm run generate:types

# Génère dans : packages/@verone/types/src/supabase.ts
# Utilisable dans TOUTES les apps via : import type { Database } from '@verone/types'
```

**Ancien workflow obsolète** :

```bash
# ❌ OBSOLÈTE
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

---

## 🔗 IMPORT PATTERN

### ✅ CORRECT (Post-migration)

```typescript
import type { Database } from '@verone/types';

type Product = Database['public']['Tables']['products']['Row'];
```

### ❌ OBSOLÈTE (Pré-migration)

```typescript
import type { Database } from '@/types/supabase'; // ❌ Ancien chemin
```

---

## 📊 RÉSULTATS

- **Fichiers modifiés** : 9 (1 package.json back-office, 1 package.json racine, 7 imports)
- **Fichiers archivés** : 1 (supabase.ts)
- **Type-check** : ✅ 100% (30/30 packages)
- **Build @verone/types** : ✅ PASSÉ
- **Régression** : ❌ AUCUNE

---

## 🚀 PROCHAINE ÉTAPE

**BLOQUÉE** : Migration apps `site-internet` et `linkme` en attente validation utilisateur.

**Instruction utilisateur** :

> "Ne touche pas encore aux apps `site-internet` ou `linkme` pour l'instant. On valide d'abord le back-office."

---

## 🧠 RÈGLES ANTI-HALLUCINATION

1. **TOUJOURS utiliser** `import type { Database } from '@verone/types'`
2. **NE JAMAIS référencer** `@/types/supabase` (obsolète)
3. **Générer types via** `npm run generate:types` (commande centralisée)
4. **Package source unique** : `packages/@verone/types/src/supabase.ts`

---

**Mainteneur** : Romeo Dos Santos + Claude Code  
**Validation** : Type-check 100% + Build @verone/types OK
