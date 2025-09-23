# 📐 Conventions & Standards Vérone Back Office

**Date de création** : 22 novembre 2024
**Version** : 1.0
**Statut** : ✅ ACTIF

## 🎯 **Objectif**

Ce document définit les conventions et standards à suivre pour maintenir la cohérence et la qualité du code dans Vérone Back Office.

---

## 📖 **GLOSSAIRE - Nomenclature Unifiée**

### **Types de Clients**

| Frontend | Backend DB | Documentation | Description |
|----------|------------|---------------|-------------|
| `professional` | `organization` | Client B2B | Entreprises, organisations |
| `individual` | `individual` | Client B2C | Particuliers, personnes physiques |

**Règle** : Utiliser `professional/individual` dans le code TypeScript/React, `organization/individual` dans la DB.

### **Statuts Commandes**

| Code | Français | Description |
|------|----------|-------------|
| `draft` | Brouillon | Commande en cours de création |
| `confirmed` | Confirmée | Commande validée, stock réservé |
| `partially_shipped` | Partiellement expédiée | Livraison partielle |
| `shipped` | Expédiée | Totalement expédiée |
| `delivered` | Livrée | Reçue par le client |
| `cancelled` | Annulée | Commande annulée |

### **Types Mouvements Stock**

| Type | Direction | Description |
|------|-----------|-------------|
| `IN` | Entrée | Réception, ajustement positif |
| `OUT` | Sortie | Vente, ajustement négatif |
| `ADJUST` | Ajustement | Correction inventaire |
| `TRANSFER` | Transfert | Entre entrepôts |

---

## 🏗️ **ARCHITECTURE DOSSIERS**

```
verone-back-office/
├── src/                      # Code source application
│   ├── app/                  # Pages Next.js App Router
│   ├── components/           # Composants React
│   │   ├── ui/              # Composants UI base (shadcn)
│   │   ├── business/        # Composants métier
│   │   └── forms/           # Formulaires complexes
│   ├── hooks/               # React hooks custom
│   ├── lib/                 # Utilitaires et helpers
│   └── types/               # Types TypeScript
├── supabase/
│   └── migrations/          # Migrations DB SQL
├── manifests/               # Spécifications et PRDs
│   ├── business-rules/      # Règles métier
│   ├── architecture/        # Specs techniques
│   └── prd/                # Product Requirements
├── MEMORY-BANK/            # État actuel du projet
├── docs/                   # Documentation technique
└── TASKS/                  # Gestion des tâches
```

**Règles** :
- `manifests/` : Specs immuables, ne pas modifier après validation
- `MEMORY-BANK/` : État actuel, mettre à jour après chaque sprint
- `.serena/memories/` : NE PAS UTILISER (deprecated)

---

## 💻 **CONVENTIONS CODE**

### **TypeScript**

```typescript
// ✅ BON - Interface avec I prefix pour types DB
interface IProduct {
  id: string
  name: string
  sku: string
}

// ✅ BON - Type pour props composants
type ProductCardProps = {
  product: IProduct
  onClick?: () => void
}

// ✅ BON - Enum en SCREAMING_SNAKE_CASE
enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST'
}

// ❌ MAUVAIS - Pas de any
const data: any = fetchData() // INTERDIT
```

### **React Components**

```typescript
// ✅ BON - Composant avec destructuring props
export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div onClick={onClick}>
      {product.name}
    </div>
  )
}

// ❌ MAUVAIS - Props non typées
export function ProductCard(props) { // INTERDIT
  return <div>{props.product.name}</div>
}
```

### **Hooks**

```typescript
// ✅ BON - Hook avec gestion erreur
export function useProducts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [products, setProducts] = useState<IProduct[]>([])

  // Logic...

  return { products, loading, error }
}
```

### **Naming Conventions**

| Type | Convention | Exemple |
|------|------------|---------|
| Fichiers composants | PascalCase | `ProductCard.tsx` |
| Fichiers hooks | kebab-case | `use-products.ts` |
| Fichiers utils | kebab-case | `format-price.ts` |
| Variables | camelCase | `productName` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Types/Interfaces | PascalCase | `ProductType` |
| Enums | PascalCase | `OrderStatus` |

---

## 🗄️ **CONVENTIONS BASE DE DONNÉES**

### **Tables**

```sql
-- ✅ BON - Nom au pluriel, snake_case
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ MAUVAIS - Singulier ou camelCase
CREATE TABLE Product (...); -- INTERDIT
```

### **Colonnes**

```sql
-- ✅ BON - snake_case, types explicites
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Relations Polymorphiques**

```sql
-- Pattern pour relations multiples
CREATE TABLE sales_orders (
  customer_id UUID NOT NULL,
  customer_type VARCHAR(20) CHECK (customer_type IN ('organization', 'individual'))
);
-- Note: Pas de FK rigide, gestion par code
```

---

## 🎨 **DESIGN SYSTEM**

### **Couleurs Autorisées**

```css
/* ✅ AUTORISÉ */
--color-black: #000000;
--color-white: #FFFFFF;
--color-gray-*: #xxx; /* Nuances de gris uniquement */

/* ❌ INTERDIT ABSOLU */
--color-yellow: #xxx; /* JAMAIS de jaune */
--color-gold: #xxx;   /* JAMAIS de doré */
```

### **Composants UI**

- Utiliser **shadcn/ui** pour les composants de base
- Customiser avec classes Tailwind
- Respecter le design minimaliste noir/blanc/gris

---

## 📝 **DOCUMENTATION**

### **Commentaires Code**

```typescript
// ❌ ÉVITER - Commentaires évidents
// Incrémente le compteur
counter++

// ✅ BON - Commentaires business logic
// Applique remise B2B si commande > 500€
if (order.type === 'professional' && order.total > 500) {
  applyDiscount(0.1)
}
```

### **Documentation Fonctions**

```typescript
/**
 * Calcule le prix TTC avec TVA française
 * @param priceHT Prix hors taxes
 * @param vatRate Taux de TVA (défaut 20%)
 * @returns Prix TTC arrondi à 2 décimales
 */
function calculatePriceTTC(priceHT: number, vatRate = 0.20): number {
  return Math.round(priceHT * (1 + vatRate) * 100) / 100
}
```

---

## 🔄 **GIT CONVENTIONS**

### **Branches**

- `main` : Production
- `develop` : Développement
- `feature/nom-feature` : Nouvelles fonctionnalités
- `fix/nom-bug` : Corrections bugs
- `refactor/nom-refactor` : Refactoring

### **Commits**

```bash
# ✅ BON - Emoji + contexte + description
git commit -m "✨ Catalogue: Ajout filtres avancés produits"
git commit -m "🐛 Commandes: Fix calcul TVA B2B"
git commit -m "♻️ Stock: Refactor mouvements avec traçabilité"

# ❌ MAUVAIS
git commit -m "fix" # Trop vague
git commit -m "WIP" # Pas de commit WIP
```

### **Emojis Commits**

| Emoji | Usage |
|-------|-------|
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| ♻️ | Refactoring |
| 🎨 | UI/UX améliorations |
| ⚡ | Performance |
| 📝 | Documentation |
| 🔒 | Sécurité |
| 🗃️ | Base de données |
| ✅ | Tests |
| 🚀 | Déploiement |

---

## ✅ **CHECKLIST PRÉ-COMMIT**

Avant chaque commit, vérifier :

- [ ] Code TypeScript sans `any`
- [ ] Pas d'erreurs console (vérifier indicateur rouge)
- [ ] Tests manuels passants
- [ ] Documentation à jour si changement API
- [ ] Nomenclature cohérente (professional/individual)
- [ ] Pas de secrets/credentials dans le code
- [ ] Imports organisés et non utilisés supprimés
- [ ] Formatage code (Prettier)

---

## 📊 **MÉTRIQUES QUALITÉ**

### **Performance**
- Dashboard : < 2s
- Pages liste : < 3s
- Actions utilisateur : < 500ms

### **Code Quality**
- TypeScript strict : 100%
- ESLint : 0 erreurs
- Coverage tests : > 80%

### **UX**
- Mobile responsive : 100%
- Accessibilité WCAG : AA
- Console errors : 0

---

*Document de référence pour tous les développements Vérone Back Office.*
*En cas de doute, ce document fait autorité.*