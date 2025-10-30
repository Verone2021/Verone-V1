# 📖 Storybook - Inventaire Visuel Composants Vérone

**Objectif** : Documentation complète de TOUS les composants (v1 et v2) pour décision visuelle de suppression/conservation.

**Dernière mise à jour** : 2025-10-21
**Statut** : En construction
**Total composants** : 262 TSX identifiés

---

## 📁 Structure Stories

```
src/stories/
├── 1-ui-base/          # 49 composants UI de base
│   ├── Buttons/
│   ├── Cards/
│   ├── Inputs/
│   ├── Badges/
│   ├── Tables/
│   └── ...
├── 2-business/         # 173 composants métier
│   ├── Products/
│   ├── Orders/
│   ├── Stock/
│   ├── Organizations/
│   └── ...
├── 3-forms/            # 17 composants formulaires
├── 4-layout/           # 5 composants layout
├── 5-admin/            # 5 composants admin
└── README.md (ce fichier)
```

---

## 🎯 Convention Naming Stories

### Format fichier story
```
[ComponentName].stories.tsx
```

**Exemples** :
- `Button.stories.tsx`
- `ProductCard.stories.tsx`
- `ElegantKpiCard.stories.tsx`

### Format exports
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonV2 } from '@/components/ui-v2/button';

const meta = {
  title: '1-UI-Base/Buttons/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};
```

---

## 📊 Statistiques Inventaire

### Composants UI (49)
- **Buttons** : 8 variantes (button, action-button, modern-action-button, etc.)
- **Cards** : 10 variantes (card, verone-card, compact-kpi-card, elegant-kpi-card, etc.)
- **Inputs** : 12 types (input, textarea, select, combobox, etc.)
- **Badges** : 5 types (badge, role-badge, data-status-badge, etc.)
- **Tables** : 3 composants (data-table, sortable-table, etc.)
- **Autres** : 11 composants (avatar, calendar, dialog, etc.)

### Composants Business (173)
- **Products** : ~40 composants
- **Orders** : ~35 composants
- **Stock** : ~30 composants
- **Organizations** : ~25 composants
- **Autres** : ~43 composants

### Composants Forms (17)
- Formulaires produits, commandes, organisations, etc.

### Composants Layout (5)
- header, sidebar, footer, navigation, etc.

### Composants Admin (5)
- user-management, settings, analytics, etc.

---

## 🚀 Utilisation

### Lancer Storybook
```bash
npm run storybook
# Ouvre http://localhost:6006
```

### Build Storybook statique
```bash
npm run build-storybook
# Génère dans storybook-static/
```

---

## ✅ Checklist Création Stories

Pour chaque composant :

- [ ] Créer fichier `.stories.tsx`
- [ ] Définir `meta` avec title, component, parameters
- [ ] Ajouter `tags: ['autodocs']` pour documentation auto
- [ ] Définir `argTypes` pour contrôles interactifs
- [ ] Créer au moins 3 variants :
  - `Default` : État par défaut
  - `Interactive` : Avec interactions utilisateur
  - `Edge Cases` : Cas limites (vide, erreur, loading)
- [ ] Ajouter `parameters.docs` avec description
- [ ] Tester accessibilité (addon a11y)
- [ ] Tester rendering (addon vitest)

---

## 🎨 Design System V2 vs V1

### Identifier Version

**V1** (Ancien design system) :
- Composants nommés simplement : `button`, `card`, `input`
- Couleurs : Palette classique
- Styles : Standards shadcn/ui

**V2** (Nouveau design system 2025) :
- Composants préfixés : `modern-action-button`, `elegant-kpi-card`, `verone-card`
- Couleurs : Palette Vérone 2025 (bleu #3b86d1, vert #38ce3c, violet #844fc1)
- Styles : Gradients, micro-interactions, shadows élégantes

**Indication dans stories** :
```typescript
parameters: {
  docs: {
    description: {
      component: '🎨 **Design System V2** - Composant moderne avec gradients et micro-interactions.',
    },
  },
},
```

---

## 📝 Templates Disponibles

### Template Story Basique
Voir `_templates/basic-story.template.tsx`

### Template Story avec Variants
Voir `_templates/variants-story.template.tsx`

### Template Story Business Complex
Voir `_templates/business-story.template.tsx`

---

## 🔧 Maintenance

### Après création complète
1. Review visuelle dans Storybook
2. Décision suppression composants obsolètes
3. Mise à jour CLAUDE.md avec composants conservés
4. Archivage composants supprimés

### Règles suppression
- Si doublon V1/V2 → Conserver V2 uniquement
- Si composant non utilisé → Vérifier avec `knip` avant suppression
- Si composant critique → Garder même si peu utilisé

---

**Créé** : 2025-10-21
**Responsable** : Romeo Dos Santos
**Next steps** : Phase 2 - Création 49 UI stories manuelles
