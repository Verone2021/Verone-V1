# Guide de Correction ESLint - Exemples Concrets

**Date** : 2026-02-01
**Complément à** : `eslint-audit-2026-02-01.md`

---

## 🎯 Top 5 Patterns à Corriger

### 1. Supabase Queries Non Typées (1,500+ warnings)

**Pattern actuel** :

```typescript
// ❌ CAUSE ~15 warnings par query
const { data, error } = await supabase.from('products').select('*');

if (error) console.error(error.message); // no-unsafe-member-access
return data[0].name; // no-unsafe-member-access
```

**Warnings générés** :

- `no-unsafe-assignment` (data)
- `no-unsafe-member-access` (error.message)
- `no-unsafe-member-access` (data[0])
- `no-unsafe-member-access` (data[0].name)

**Solution complète** :

```typescript
// ✅ 0 warnings
import type { Database } from '@verone/types/supabase';
type Product = Database['public']['Tables']['products']['Row'];

const { data, error } = await supabase
  .from('products')
  .select('*')
  .returns<Product[]>();

if (error) {
  console.error('[ProductsPage] Error:', error.message); // Type-safe
  return null;
}

return data[0]?.name ?? 'Produit sans nom'; // Type-safe + nullish
```

**Gains** :

- 0 warnings (vs ~15)
- Autocomplétion IDE complète
- Bugs détectés à la compilation

**Fichiers à traiter** (TIER 1 - API Routes) :

- `app/api/**/*.ts` : ~30 fichiers
- `packages/@verone/*/src/hooks/**/*.ts` : ~50 fichiers

---

### 2. React Hook Form (300+ warnings)

**Pattern actuel** :

```typescript
// ❌ CAUSE ~10 warnings par formulaire
const { register, handleSubmit } = useForm();

const onSubmit = async (data: any) => {  // no-explicit-any
  await createProduct({
    name: data.name,                      // no-unsafe-member-access
    price: parseFloat(data.price),        // no-unsafe-argument
  });
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('name')} />
    <input {...register('price')} />
    <button type="submit">Créer</button>
  </form>
);
```

**Solution avec Zod** :

```typescript
// ✅ 0 warnings + validation runtime
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const productSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  price: z.coerce.number().positive('Prix doit être positif'),
});

type ProductFormData = z.infer<typeof productSchema>;

const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
});

const onSubmit = async (data: ProductFormData) => { // Type-safe
  await createProduct({
    name: data.name,    // string (autocomplete)
    price: data.price,  // number (déjà parsé par Zod)
  });
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('name')} />
    {errors.name && <span>{errors.name.message}</span>}

    <input {...register('price')} />
    {errors.price && <span>{errors.price.message}</span>}

    <button type="submit">Créer</button>
  </form>
);
```

**Gains** :

- 0 warnings (vs ~10)
- Validation client + serveur avec même schéma
- Messages d'erreur typés
- Parsing automatique (string → number)

**Fichiers à traiter** (TIER 3 - Components) :

- `app/(protected)/**/*Modal.tsx` : ~40 modals
- `app/(protected)/**/page.tsx` : Forms inline

---

### 3. useEffect avec Dépendances Manquantes (31 warnings - CRITIQUE)

**Pattern actuel** :

```typescript
// ❌ BUG POTENTIEL - Stale closure
const [data, setData] = useState([]);

const loadData = async () => {
  const result = await fetchData();
  setData(result);
};

useEffect(() => {
  loadData(); // react-hooks/exhaustive-deps
}, []); // loadData manquant = stale closure si loadData change
```

**Problème** :

- Si `loadData` change, l'effet utilise l'ancienne version
- Peut causer infinite loops si dépendances incorrectes

**Solution 1 : useCallback** (recommandé)

```typescript
// ✅ Stable callback
const loadData = useCallback(async () => {
  const result = await fetchData();
  setData(result);
}, []); // Dépendances de loadData

useEffect(() => {
  void loadData().catch(error => {
    console.error('[Component] Load failed:', error);
  });
}, [loadData]); // loadData stable grâce à useCallback
```

**Solution 2 : Inline** (si simple)

```typescript
// ✅ Pas de dépendance externe
useEffect(() => {
  void (async () => {
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error('[Component] Load failed:', error);
    }
  })();
}, []); // Vraiment vide maintenant
```

**Solution 3 : Désactiver check** (si vraiment nécessaire)

```typescript
// ⚠️ À utiliser UNIQUEMENT si logique validée manuellement
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // + Commentaire expliquant POURQUOI c'est safe
```

**Fichiers à traiter** (PHASE 1 - URGENT) :

- Tous les fichiers avec `react-hooks/exhaustive-deps` : 31 occurrences

---

### 4. Modal Props avec Casting (200+ warnings)

**Pattern actuel** :

```typescript
// ❌ CAUSE ~5 warnings par modal
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;  // no-explicit-any
}

function EditModal({ data }: EditModalProps) {
  const name = (data as any).name;           // no-unsafe-member-access
  const email = (data as any).email;         // no-unsafe-member-access

  return (
    <Modal>
      <Input defaultValue={name} />
      <Input defaultValue={email} />
    </Modal>
  );
}

// Utilisation
<EditModal data={selectedCustomer} />
```

**Solution avec Interface** :

```typescript
// ✅ 0 warnings
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

function EditCustomerModal({ customer }: EditCustomerModalProps) {
  if (!customer) return null;

  return (
    <Modal>
      <Input defaultValue={customer.name} />   {/* Autocomplete */}
      <Input defaultValue={customer.email} />  {/* Type-safe */}
      {customer.phone && (                     {/* Optional handled */}
        <Input defaultValue={customer.phone} />
      )}
    </Modal>
  );
}

// Utilisation (type-checked)
<EditCustomerModal customer={selectedCustomer} />
```

**Gains** :

- 0 warnings (vs ~5)
- Props validation automatique
- Impossible de passer mauvais type
- Refactoring safe (rename, delete fields)

**Fichiers à traiter** (TIER 3 - Components) :

- `**/*Modal.tsx` : ~40 fichiers
- `**/components/*.tsx` : Composants business

---

### 5. API Responses Non Typées (400+ warnings)

**Pattern actuel** :

```typescript
// ❌ CAUSE ~10 warnings par endpoint
export async function POST(request: Request) {
  const body = await request.json(); // any

  const { data, error } = await supabase.from('orders').insert({
    customer_id: body.customerId, // no-unsafe-member-access
    total: parseFloat(body.total), // no-unsafe-argument
  });

  if (error) {
    return NextResponse.json(
      { error: error.message }, // no-unsafe-member-access
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, order: data });
}
```

**Solution complète** :

```typescript
// ✅ 0 warnings + validation
import { z } from 'zod';
import type { Database } from '@verone/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];

// Schema validation
const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  total: z.number().positive(),
});

export async function POST(request: Request) {
  // Parse et valide
  const body = await request.json();
  const validated = createOrderSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validated.error.flatten(),
      },
      { status: 400 }
    );
  }

  // Type-safe insert
  const orderData: OrderInsert = {
    customer_id: validated.data.customerId,
    total: validated.data.total,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()
    .returns<Order>();

  if (error) {
    console.error('[API] Order creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order: data,
  });
}
```

**Gains** :

- 0 warnings (vs ~10)
- Validation automatique
- API errors catchées avant DB
- Response type-safe

**Fichiers à traiter** (TIER 1 - API Routes) :

- `app/api/**/*.ts` : ~30 fichiers

---

## 🛠️ Patterns de Migration

### Migration Progressive (recommandée)

**Approche TIER** :

```bash
# TIER 1 : API Routes (1 semaine)
# Focus : Typer réponses + validation Zod
find app/api -name "*.ts" | head -5 | xargs code

# TIER 2 : Hooks (2 semaines)
# Focus : Supabase queries typées
find packages/@verone/*/src/hooks -name "*.ts" | head -10 | xargs code

# TIER 3 : Components (2 semaines)
# Focus : Props interfaces + Forms Zod
find app -name "*Modal.tsx" | head -10 | xargs code

# TIER 4 : Legacy (1 semaine)
# Focus : Refactor code ancien
```

### Script d'Aide à la Migration

Créer `.claude/scripts/eslint-migrate-tier.sh` :

```bash
#!/bin/bash
# Usage: ./eslint-migrate-tier.sh api (TIER 1)
#        ./eslint-migrate-tier.sh hooks (TIER 2)
#        ./eslint-migrate-tier.sh components (TIER 3)

TIER=$1

case $TIER in
  api)
    echo "🎯 TIER 1 : API Routes"
    pnpm lint 2>&1 | grep "app/api" | grep "no-unsafe"
    ;;
  hooks)
    echo "🎯 TIER 2 : Hooks"
    pnpm lint 2>&1 | grep "hooks/" | grep "no-unsafe"
    ;;
  components)
    echo "🎯 TIER 3 : Components"
    pnpm lint 2>&1 | grep "Modal.tsx\|page.tsx" | grep "no-unsafe"
    ;;
  *)
    echo "Usage: $0 {api|hooks|components}"
    exit 1
    ;;
esac
```

---

## 📊 Métriques de Progrès

### Tracking par TIER

Créer `.claude/audits/eslint-progress.json` :

```json
{
  "baseline": {
    "date": "2026-02-01",
    "total_warnings": 3792,
    "by_app": {
      "back-office": 2714,
      "linkme": 1078,
      "site-internet": 0
    }
  },
  "tiers": {
    "tier1_api": {
      "target_warnings": 400,
      "status": "not_started",
      "deadline": "2026-02-08"
    },
    "tier2_hooks": {
      "target_warnings": 600,
      "status": "not_started",
      "deadline": "2026-02-22"
    },
    "tier3_components": {
      "target_warnings": 800,
      "status": "not_started",
      "deadline": "2026-03-08"
    }
  }
}
```

### Commande de Suivi

```bash
# Voir progrès global
pnpm lint 2>&1 | tail -1

# Voir progrès par TIER
bash .claude/scripts/eslint-migrate-tier.sh api

# Comparer avec baseline
diff <(cat .claude/audits/eslint-progress.json | jq '.baseline.total_warnings') \
     <(pnpm lint 2>&1 | tail -1 | grep -oE '[0-9]+ problems' | cut -d' ' -f1)
```

---

## 🎓 Checklist par Type de Fichier

### API Route Handler (`app/api/**/route.ts`)

- [ ] Schéma Zod pour request body
- [ ] Interface pour response type
- [ ] `.returns<T>()` sur queries Supabase
- [ ] Error handling typé
- [ ] Pas de `any` type

### React Hook (`packages/@verone/*/src/hooks/*.ts`)

- [ ] Types Supabase importés
- [ ] `.returns<T>()` sur toutes les queries
- [ ] Return type explicite
- [ ] Error handling dans try/catch
- [ ] Pas de `any` type

### Modal Component (`**/*Modal.tsx`)

- [ ] Interface pour props
- [ ] Interface pour data object
- [ ] Schema Zod si formulaire
- [ ] useForm<T> typé
- [ ] Pas de casting `as any`

### Page Component (`app/**/page.tsx`)

- [ ] Server Component si possible
- [ ] Client Component seulement si hooks nécessaires
- [ ] Props typées (searchParams, params)
- [ ] Async data fetching typé
- [ ] Pas de `any` type

---

## 🚀 Quick Start

**Pour commencer aujourd'hui** :

1. **Corriger react-hooks** (2h) :

   ```bash
   pnpm lint 2>&1 | grep "react-hooks/exhaustive-deps" > /tmp/hooks-to-fix.txt
   # Ouvrir chaque fichier et corriger avec patterns ci-dessus
   ```

2. **Auto-fix Prettier** (5min) :

   ```bash
   pnpm lint --fix
   git add . && git commit -m "[NO-TASK] chore: auto-fix prettier warnings"
   ```

3. **Cleanup unused vars** (30min) :

   ```bash
   pnpm lint 2>&1 | grep "no-unused-vars" > /tmp/unused-to-clean.txt
   # Supprimer imports/vars inutilisés
   ```

4. **Générer types Supabase** (5min) :
   ```bash
   pnpm db:types
   git add packages/@verone/types/src/supabase.ts
   git commit -m "[NO-TASK] chore: update supabase types"
   ```

**Temps total : ~3h pour 60+ warnings fixes**

---

## 📚 Ressources Externes

**TypeScript** :

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Pratique

**Zod** :

- [Zod Documentation](https://zod.dev/)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)

**Supabase** :

- [Generating Types](https://supabase.com/docs/guides/api/rest/generating-types)
- [TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

**ESLint** :

- [typescript-eslint rules](https://typescript-eslint.io/rules/)
- [Progressive Enhancement](https://typescript-eslint.io/blog/announcing-typescript-eslint-v6#stricter-parent-types-for-type-aware-rules)

---

**Prochaines étapes** :

1. Choisir un TIER (recommandé : react-hooks d'abord)
2. Créer branch : `git checkout -b fix/eslint-tier1-react-hooks`
3. Corriger avec patterns ci-dessus
4. Commit + Push + PR
5. Répéter pour TIER suivant
