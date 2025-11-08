# Guide Migration Composants Unifiés

## Vue d'ensemble

**Fichiers à migrer** : 10 (au lieu de 73 estimés)
- **Buttons** : 4 fichiers
- **KPI Cards** : 6 fichiers

## Button Migrations

### ActionButton → ButtonUnified

**AVANT** :
```tsx
import { ActionButton } from '@/components/ui/action-button';

<ActionButton
  label="Créer"
  icon={Plus}
  color="primary"
  variant="square"
  onClick={handleCreate}
/>
```

**APRÈS** :
```tsx
import { ButtonUnified } from '@/components/ui/button-unified';
import { Plus } from 'lucide-react';

<ButtonUnified
  icon={Plus}
  size="icon"
  onClick={handleCreate}
>
  Créer
</ButtonUnified>
```

**Mapping props** :
- `label` → `children` (contenu)
- `color="primary"` → `variant="default"`
- `color="danger"` → `variant="destructive"`
- `variant="square"` → `size="icon"`
- `variant="inline"` → `size="md"`

---

### ModernActionButton → ButtonUnified

**AVANT** :
```tsx
import { ModernActionButton } from '@/components/ui/modern-action-button';

<ModernActionButton action="edit" onClick={handleEdit} />
<ModernActionButton action="delete" loading={isDeleting} />
```

**APRÈS** :
```tsx
import { ButtonUnified } from '@/components/ui/button-unified';
import { Edit, Trash2 } from 'lucide-react';

<ButtonUnified variant="secondary" icon={Edit} onClick={handleEdit}>
  Modifier
</ButtonUnified>
<ButtonUnified variant="destructive" icon={Trash2} loading={isDeleting}>
  Supprimer
</ButtonUnified>
```

**Mapping actions** :
- `action="edit"` → `variant="secondary"` + `icon={Edit}` + children="Modifier"
- `action="delete"` → `variant="destructive"` + `icon={Trash2}` + children="Supprimer"
- `action="archive"` → `variant="outline"` + `icon={Archive}` + children="Archiver"
- `action="view"` → `variant="ghost"` + `icon={Eye}` + children="Voir"
- `action="approve"` → `variant="default"` + `icon={Check}` + children="Approuver"

---

### StandardModifyButton → ButtonUnified

**AVANT** :
```tsx
import { StandardModifyButton } from '@/components/ui/standard-modify-button';

<StandardModifyButton onClick={handleModify} />
<StandardModifyButton onClick={handleModify}>Custom</StandardModifyButton>
```

**APRÈS** :
```tsx
import { ButtonUnified } from '@/components/ui/button-unified';
import { Edit } from 'lucide-react';

<ButtonUnified variant="outline" size="sm" icon={Edit} onClick={handleModify}>
  Modifier
</ButtonUnified>
<ButtonUnified variant="outline" size="sm" icon={Edit} onClick={handleModify}>
  Custom
</ButtonUnified>
```

**Props par défaut** :
- `variant="outline"`
- `size="sm"`
- `icon={Edit}`
- children="Modifier" (si pas spécifié)

---

## KPI Card Migrations

### ElegantKpiCard → KPICardUnified

**AVANT** :
```tsx
import { ElegantKpiCard } from '@/components/ui/elegant-kpi-card';

<ElegantKpiCard
  label="Produits actifs"
  value="1,234"
  icon={Package}
  trend={{ value: 12, isPositive: true }}
  description="vs mois dernier"
/>
```

**APRÈS** :
```tsx
import { KPICardUnified } from '@/components/ui/kpi-card-unified';
import { Package } from 'lucide-react';

<KPICardUnified
  variant="elegant"
  title="Produits actifs"
  value="1,234"
  icon={Package}
  trend={{ value: 12, isPositive: true }}
  description="vs mois dernier"
/>
```

**Mapping props** :
- `label` → `title`
- Ajouter `variant="elegant"`
- Garder `value`, `icon`, `trend`, `description` tel quel

---

## Checklist Migration

**Pour chaque fichier** :

1. ✅ Lire le fichier
2. ✅ Identifier les imports à remplacer
3. ✅ Transformer les composants selon guide ci-dessus
4. ✅ Ajouter imports manquants (icônes Lucide)
5. ✅ Vérifier type-check : `npm run type-check | grep nomDuFichier`
6. ✅ Tester visuellement dans le navigateur
7. ✅ Commit individuel avec message descriptif

---

## Fichiers à migrer

### Buttons (4 fichiers)

1. **src/app/produits/catalogue/page.tsx**
   - ActionButton (2 usages estimés)
   - ModernActionButton (1 usage estimé)

2. **src/shared/modules/ui/components/sections/UnifiedDescriptionEditSection.tsx**
   - StandardModifyButton (1 usage)

3. **src/shared/modules/products/components/sections/ProductNameEditSection.tsx**
   - StandardModifyButton (1 usage)

4. **src/shared/modules/products/components/sections/CharacteristicsEditSection.tsx**
   - StandardModifyButton (1 usage)

### KPI Cards (6 fichiers)

5. **src/app/produits/catalogue/variantes/page.tsx**
   - ElegantKpiCard (usage inconnu)

6. **src/app/produits/catalogue/dashboard/page.tsx**
   - ElegantKpiCard (usage inconnu)

7. **src/app/produits/catalogue/collections/page.tsx**
   - ElegantKpiCard (usage inconnu)

8. **src/app/produits/page.tsx**
   - ElegantKpiCard (usage inconnu)

9. **src/app/dashboard/page.tsx**
   - ElegantKpiCard (usage inconnu)

10. **src/app/contacts-organisations/page.tsx**
    - ElegantKpiCard (usage inconnu)

---

## Notes

- **ButtonV2/Button** (228 fichiers) : **PAS de migration nécessaire** (déjà compatible)
- **CompactKpiCard** : 0 fichiers
- **MediumKpiCard** : 0 fichiers

**Temps estimé** : ~20-30 minutes (au lieu de 40-60)
