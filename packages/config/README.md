# ⚙️ @verone/config - Configurations Partagées

**Configurations partagées** pour ESLint, Prettier, TypeScript, etc.

⚠️ **Statut** : Préparation (migration effective après Phase 1)

---

## 🎯 Objectif

Centraliser toutes les configurations pour garantir cohérence et maintenabilité.

---

## 📦 Contenu futur

```
packages/config/
├── eslint/
│   ├── base.js           # Config ESLint base
│   ├── react.js          # Config React/Next.js
│   └── nestjs.js         # Config NestJS
├── typescript/
│   ├── base.json         # TSConfig base
│   ├── react.json        # TSConfig React
│   └── node.json         # TSConfig Node/NestJS
├── prettier/
│   └── .prettierrc.js    # Config Prettier
├── tailwind/
│   └── preset.js         # Tailwind preset
├── vitest/
│   └── config.ts         # Vitest config
└── package.json
```

---

## 🚀 Usage futur (après migration)

```javascript
// apps/web/.eslintrc.js
module.exports = {
  extends: ['@verone/config/eslint/react']
}

// apps/api/.eslintrc.js
module.exports = {
  extends: ['@verone/config/eslint/nestjs']
}

// apps/web/tsconfig.json
{
  "extends": "@verone/config/typescript/react"
}
```

---

## ✅ Avantages

- **Cohérence** : Même config partout
- **Maintenabilité** : Changements centralisés
- **DX** : Setup rapide nouvelles apps
- **Best practices** : Config optimale partagée

---

## 📚 Configs à migrer

**De** : Racine projet
**Vers** : `packages/config/`

**Liste** :
- [ ] .eslintrc.json
- [ ] .prettierrc
- [ ] tsconfig.json
- [ ] tailwind.config.ts
- [ ] vitest.config.ts

---

*À migrer : Après Phase 1*
*Référence actuelle : Configs racine projet*
