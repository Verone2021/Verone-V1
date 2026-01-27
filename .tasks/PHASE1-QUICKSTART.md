# 🚀 Phase 1 : Quick Start Guide

**Objectif** : Corriger 119 erreurs async en 2-3h (ou par batch)

---

## 📋 Préparation (5 min)

### 1. Vérifier l'État Actuel

```bash
# Compter les erreurs
pnpm lint 2>&1 | grep -c "error"
# Devrait afficher : ~119

# Lister les erreurs par fichier
pnpm lint 2>&1 | grep "error" | grep -oE "^[^:]+\.tsx?" | sort | uniq -c | sort -rn > errors-by-file.txt

# Voir les fichiers avec le plus d'erreurs
head -20 errors-by-file.txt
```

### 2. Créer Branche de Travail

```bash
# Option A : Tout corriger d'un coup
git checkout -b fix/eslint-async-errors-complete

# Option B : Par batch (recommandé si peu de temps)
git checkout -b fix/eslint-async-batch1-api
```

---

## 🎯 Batch 1 : API Routes (~40 erreurs) - PRIORITÉ 1

### Zones à Corriger

```bash
# Localiser les erreurs dans API routes
pnpm lint apps/back-office/src/app/api 2>&1 | grep "error"
pnpm lint apps/linkme/src/app/api 2>&1 | grep "error"
```

### Pattern Principal

**Avant** (❌ Erreur) :
```typescript
export async function POST(request: Request) {
  const data = await request.json();
  supabase.from('orders').insert(data); // ❌ no-floating-promises
  return NextResponse.json({ success: true });
}
```

**Après** (✅ Correct) :
```typescript
export async function POST(request: Request) {
  const data = await request.json();

  const { error } = await supabase.from('orders').insert(data);
  if (error) {
    console.error('[API] Insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### Commandes

```bash
# Fixer automatiquement ce qui peut l'être (peu de cas)
pnpm lint apps/back-office/src/app/api --fix
pnpm lint apps/linkme/src/app/api --fix

# Vérifier progrès
pnpm lint apps/back-office/src/app/api 2>&1 | grep -c "error"

# Commit (le hook validera)
git add apps/*/src/app/api
git commit -m "[NO-TASK] fix: async errors in API routes (Batch 1/4 - 40 errors)"
```

---

## 🎯 Batch 2 : React Query Hooks (~35 erreurs)

### Zones à Corriger

```bash
# Localiser les erreurs dans hooks
pnpm lint apps/back-office/src/hooks 2>&1 | grep "error"
pnpm lint apps/linkme/src/hooks 2>&1 | grep "error"
pnpm lint apps/linkme/src/lib/hooks 2>&1 | grep "error"
```

### Pattern Principal

**Avant** (❌ Erreur) :
```typescript
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: (data) => {
    queryClient.invalidateQueries(['orders']); // ❌ no-floating-promises
  }
});
```

**Après** (✅ Correct) :
```typescript
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: async (data) => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
  }
});
```

### Commandes

```bash
# Créer branche (si batch séparé)
git checkout -b fix/eslint-async-batch2-hooks

# Fixer
pnpm lint apps/*/src/hooks --fix
pnpm lint apps/linkme/src/lib/hooks --fix

# Vérifier
pnpm lint apps/*/src/hooks 2>&1 | grep -c "error"

# Commit
git add apps/*/src/hooks apps/linkme/src/lib/hooks
git commit -m "[NO-TASK] fix: async errors in React Query hooks (Batch 2/4 - 35 errors)"
```

---

## 🎯 Batch 3 : Event Handlers (~30 erreurs)

### Zones à Corriger

```bash
# Localiser erreurs dans composants
pnpm lint apps/back-office/src/components 2>&1 | grep "error" | grep "onClick\|onChange\|onSubmit"
pnpm lint apps/linkme/src/components 2>&1 | grep "error" | grep "onClick\|onChange\|onSubmit"
```

### Patterns Principaux

#### Pattern A : Fire-and-forget

**Avant** (❌) :
```typescript
<Button onClick={() => deleteItem(id)}>
  Supprimer
</Button>
```

**Après** (✅) :
```typescript
<Button onClick={() => {
  void deleteItem(id).catch((error) => {
    console.error('[Delete] Failed:', error);
    toast.error('Erreur lors de la suppression');
  });
}}>
  Supprimer
</Button>
```

#### Pattern B : Avec loading state

**Avant** (❌) :
```typescript
<Button onClick={() => createOrder(data)}>
  Commander
</Button>
```

**Après** (✅) :
```typescript
const [loading, setLoading] = useState(false);

const handleOrder = async () => {
  setLoading(true);
  try {
    await createOrder(data);
    toast.success('Commande créée');
  } catch (error) {
    console.error('[Order]:', error);
    toast.error('Erreur');
  } finally {
    setLoading(false);
  }
};

<Button onClick={() => { void handleOrder(); }} loading={loading}>
  Commander
</Button>
```

### Commandes

```bash
# Créer branche (si batch séparé)
git checkout -b fix/eslint-async-batch3-handlers

# Pas de fix auto (patterns manuels)
# Corriger manuellement avec patterns ci-dessus

# Vérifier progrès régulièrement
pnpm lint apps/*/src/components 2>&1 | grep -c "error"

# Commit
git commit -m "[NO-TASK] fix: async errors in event handlers (Batch 3/4 - 30 errors)"
```

---

## 🎯 Batch 4 : Autres Fichiers (~14 erreurs)

### Zones à Corriger

```bash
# Lister les erreurs restantes
pnpm lint 2>&1 | grep "error" | grep -v "api/" | grep -v "hooks/" | grep -v "components/"

# Ou compter total restant
pnpm lint 2>&1 | grep -c "error"
```

### Approche

Corriger au cas par cas avec patterns des batches précédents.

### Commandes

```bash
# Créer branche (si batch séparé)
git checkout -b fix/eslint-async-batch4-misc

# Corriger manuellement

# Vérifier qu'il ne reste AUCUNE erreur
pnpm lint 2>&1 | grep "error"
# Devrait être vide

# Commit final
git commit -m "[NO-TASK] fix: async errors in misc files (Batch 4/4 - 14 errors) ✅ 0 ERRORS"
```

---

## ✅ Validation Finale

### Checklist Complète

```bash
# 1. Aucune erreur ESLint
pnpm lint
# Doit afficher : ✖ X problems (0 errors, X warnings)

# 2. Type-check passe
pnpm type-check
# Doit afficher : No errors found

# 3. Build réussit
pnpm build
# Doit afficher : Build completed successfully

# 4. Tests E2E critiques (optionnel)
pnpm test:e2e
```

### Test Pre-commit Hook

```bash
# Tenter un commit SANS --no-verify
git commit -m "[NO-TASK] fix: all 119 async errors ✅"

# Résultat attendu :
# ✅ Pre-commit hook passe (lint-staged valide)
# ✅ Commit créé
# ✅ Vous pouvez développer normalement maintenant !
```

---

## 📊 Suivi de Progrès

### Commandes Utiles

```bash
# Compter erreurs restantes
pnpm lint 2>&1 | grep -c "error"

# Voir répartition par type
pnpm lint 2>&1 | grep "error" | grep -oE "@typescript-eslint/[a-z-]+" | sort | uniq -c

# Fichiers avec le plus d'erreurs
pnpm lint 2>&1 | grep "error" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10

# Progression (baseline = 119)
echo "Erreurs restantes: $(pnpm lint 2>&1 | grep -c "error") / 119"
```

### Table de Progrès

| Batch | Zone | Erreurs Initiales | Erreurs Restantes | Status |
|-------|------|-------------------|-------------------|--------|
| 1 | API Routes | 40 | ? | ⏳ |
| 2 | React Query | 35 | ? | ⏳ |
| 3 | Event Handlers | 30 | ? | ⏳ |
| 4 | Misc | 14 | ? | ⏳ |
| **TOTAL** | **All** | **119** | **?** | **⏳** |

Mettre à jour après chaque batch complété.

---

## 🆘 Si Bloqué

### Problème : Pattern pas clair

**Solution** : Lire `docs/current/eslint-strategy-2026.md` (section "Patterns de Correction")

### Problème : Trop d'erreurs dans un fichier

**Solution** : Skip temporairement, passer au suivant
```bash
# Ajouter override temporaire dans eslint.config.mjs
{
  files: ['path/to/problematic-file.ts'],
  rules: {
    '@typescript-eslint/no-floating-promises': 'warn'
  }
}
```

### Problème : Pre-commit hook trop strict

**Solution** : Commit avec --no-verify (temporaire)
```bash
git commit --no-verify -m "WIP: partial fix"
```

⚠️ Mais corriger avant la PR finale !

---

## 🎯 Après Phase 1 Complète

### Résultat Attendu

```bash
pnpm lint
# ✖ 1946 problems (0 errors, 1946 warnings)
#   0 errors, 1946 warnings

git commit -m "feat: nouvelle feature"
# ✅ Commit passe sans --no-verify
# ✅ Hook valide automatiquement
```

### Avantages Immédiats

✅ **Production sécurisée** : 0 bugs async silencieux
✅ **Développement fluide** : Pre-commit hook fonctionne
✅ **CI/CD propre** : Toutes les PR passent
✅ **Confiance** : Nouveau code = qualité garantie

### Phase 3 : Migration Graduelle (6-12 mois)

Corriger les 1,946 warnings progressivement :
- Boy Scout rule : corriger warnings du fichier modifié
- 1 fichier à la fois
- Pas de pression, qualité avant vitesse

---

**READY TO START ? 🚀**

```bash
# Vérifier état actuel
pnpm lint 2>&1 | grep -c "error"

# Créer branche
git checkout -b fix/eslint-async-batch1-api

# GO ! 💪
```
