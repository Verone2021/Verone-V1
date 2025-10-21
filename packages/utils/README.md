# 🛠️ @verone/utils - Helpers & Utilitaires

**Helpers et utilitaires communs** partagés entre toutes les apps.

⚠️ **Statut** : Préparation (migration effective après Phase 1)

---

## 🎯 Objectif

Centraliser tous les helpers, formatters, validators, et utilitaires réutilisables.

---

## 📦 Contenu futur

```
packages/utils/
├── src/
│   ├── formatters/
│   │   ├── currency.ts       # formatCurrency(value, locale)
│   │   ├── date.ts           # formatDate(date, format)
│   │   └── number.ts         # formatNumber(value, options)
│   ├── validators/
│   │   ├── sku.ts            # validateSKU(sku)
│   │   ├── email.ts          # validateEmail(email)
│   │   └── phone.ts          # validatePhone(phone)
│   ├── calculators/
│   │   ├── margin.ts         # calculateMargin(cost, price)
│   │   ├── tax.ts            # calculateTax(amount, rate)
│   │   └── stock.ts          # calculateStockValue(qty, price)
│   ├── converters/
│   │   ├── units.ts          # convertUnit(value, from, to)
│   │   └── currency.ts       # convertCurrency(amount, from, to)
│   ├── helpers/
│   │   ├── array.ts          # chunk, groupBy, uniq, etc.
│   │   ├── object.ts         # deepMerge, pick, omit, etc.
│   │   └── string.ts         # slugify, truncate, etc.
│   └── index.ts
├── tests/
│   ├── formatters.test.ts
│   ├── validators.test.ts
│   └── ...
├── package.json
└── tsconfig.json
```

---

## 🚀 Usage futur (après migration)

```typescript
// Dans apps/web ou apps/api
import { formatCurrency, calculateMargin, validateSKU } from '@verone/utils'

const price = formatCurrency(1234.56, 'fr-FR') // "1 234,56 €"
const margin = calculateMargin(100, 150)       // 50
const isValid = validateSKU('PROD-12345')      // true
```

---

## ✅ Avantages

- **Réutilisation** : Code partagé entre apps
- **Tests** : Testé une fois, utilisé partout
- **Type-safety** : TypeScript complet
- **Performance** : Optimisations centralisées

---

## 📚 Utils à migrer

**De** : `src/lib/utils/`, `src/lib/helpers/`
**Vers** : `packages/utils/src/`

**Liste initiale** :
- [ ] Formatters (currency, date, number)
- [ ] Validators (SKU, email, phone, SIREN)
- [ ] Calculators (margin, tax, stock value)
- [ ] Array helpers (chunk, groupBy, uniq)
- [ ] String helpers (slugify, truncate)
- [ ] Object helpers (deepMerge, pick, omit)

---

*À migrer : Après Phase 1*
*Référence actuelle : src/lib/utils/, src/lib/helpers/*
