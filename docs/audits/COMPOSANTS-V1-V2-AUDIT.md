# 🔍 Audit Composants V1/V2 - Vérone Back Office

**Date**: 2025-10-21
**Audit Method**: knip dead code analysis + manual code review
**Total Components Analyzed**: 49 UI components

---

## 📊 Résumé Exécutif

| Catégorie | Nombre | Action |
|-----------|--------|--------|
| ✅ **KEEP (V2)** | 37 | Conserver et enrichir dans Storybook |
| ❌ **DELETE** | 12 | Supprimer (inutilisés détectés par knip) |
| ⚠️ **REVIEW** | 3 | Décision utilisateur requise |
| **TOTAL** | **52** | - |

---

## ❌ SUPPRIMER (12 Composants Inutilisés)

### Détectés par `npm run audit:deadcode` (knip)

Ces composants **ne sont jamais importés** dans le codebase. Suppression sécurisée.

#### 1. Buttons (2)
```bash
# ❌ DELETE
src/components/ui/action-button.tsx              # 4.8 KB - Oct 20
src/components/ui/standard-modify-button.tsx     # 705 B - Oct 15 (V1)
```

**Raison**:
- `action-button.tsx`: Utilisait CVA, mais **remplacé par** `modern-action-button.tsx` (V2)
- `standard-modify-button.tsx`: Wrapper obsolète sur ancien `Button` (pas `ButtonV2`)

**Remplacé par**: `modern-action-button.tsx` (V2 avec ActionType system)

---

#### 2. KPI Cards (2)
```bash
# ❌ DELETE
src/components/ui/compact-kpi-card.tsx            # 3.3 KB - Oct 20
src/components/ui/medium-kpi-card.tsx             # 4.8 KB - Oct 20
```

**Raison**: Doublons fonctionnels. **Remplacé par** `elegant-kpi-card.tsx` (Design System V2)

**Remplacé par**: `elegant-kpi-card.tsx` (V2 moderne)

---

#### 3. Quick Actions (2)
```bash
# ❌ DELETE
src/components/ui/quick-actions-list.tsx          # Oct 20
src/components/ui/compact-quick-actions.tsx       # Oct 20
```

**Raison**: **Jamais utilisés**. Fonctionnalité probablement intégrée ailleurs.

---

#### 4. Navigation & UI Utilities (6)
```bash
# ❌ DELETE
src/components/ui/activity-timeline.tsx           # Oct 20
src/components/ui/breadcrumb.tsx                  # Oct 20
src/components/ui/command-palette.tsx             # Oct 20
src/components/ui/group-navigation.tsx            # Oct 20
src/components/ui/notification-system.tsx         # Oct 20
src/components/ui/stat-pill.tsx                   # Oct 20
```

**Raison**:
- **Jamais utilisés** (knip dead code detection)
- `notification-system.tsx`: Probablement remplacé par système toast (react-hot-toast)
- `breadcrumb.tsx`, `command-palette.tsx`: Fonctionnalités non implémentées

---

## ✅ CONSERVER (37 Composants V2)

### Design System V2 - Vérone 2025

Ces composants utilisent le **Design System V2** avec:
- Palette moderne (#3b86d1 bleu, #38ce3c vert, #844fc1 violet)
- Rounded corners (10px)
- Micro-interactions (hover scale, transitions 200ms)
- Tokens depuis `/src/lib/design-system`

#### 1. Buttons (1)
```bash
# ✅ KEEP
src/components/ui/button.tsx                      # 6.5 KB - Oct 20
  → Exports: ButtonV2 ✅ | Button ⚠️ (V1, à supprimer)
```

**Action**:
- ✅ Conserver `ButtonV2` (7 variants: primary, secondary, outline, success, danger, warning, ghost)
- ⚠️ **Supprimer export `Button`** (V1 obsolète, remplacé par ButtonV2)

**Story**: ✅ Créée manuellement (`Button.stories.tsx`, 14 stories)

---

#### 2. Action Buttons (1)
```bash
# ✅ KEEP
src/components/ui/modern-action-button.tsx        # 4.3 KB - Oct 20
  → Exports: ModernActionButton (9 ActionType prédéfinis)
```

**Fonctionnalités**:
- Utilise `ButtonV2` comme base
- 9 actions prédéfinies: edit, archive, delete, view, download, upload, copy, approve, reject
- **Supérieur à** `action-button.tsx` (inutilisé)

**Story**: ⚠️ À générer automatiquement

---

#### 3. Cards (2)
```bash
# ✅ KEEP
src/components/ui/card.tsx                        # 1.9 KB - Oct 20
  → Exports: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
```

**Note**: Composant **shadcn/ui de base**, toujours utilisé. **Pas un doublon**.

**Story**: ✅ Créée manuellement (`Card.stories.tsx`, 9 stories)

```bash
# ✅ KEEP
src/components/ui/verone-card.tsx                 # 6.0 KB - Oct 20
  → Exports: VéroneCard (pour entities: family, category, product)
```

**Fonctionnalités**:
- Card spécialisée Design System V2
- Affichage entities (family, category, product, supplier, customer)
- Props: title, description, count, isActive, onEdit, onDelete, imageUrl

**Story**: ✅ Créée manuellement (`VeroneCard.stories.tsx`, 13 stories)

---

#### 4. KPI Cards (1)
```bash
# ✅ KEEP
src/components/ui/elegant-kpi-card.tsx            # 3.2 KB - Oct 20
  → KPI Card moderne Design System V2
```

**Remplace**: `compact-kpi-card.tsx`, `medium-kpi-card.tsx` (inutilisés)

**Story**: ⚠️ À générer automatiquement

---

#### 5. Badges (4)
```bash
# ✅ KEEP
src/components/ui/badge.tsx                       # Oct 20
src/components/ui/role-badge.tsx                  # Oct 20
src/components/ui/data-status-badge.tsx           # Oct 20
```

**Note**: `stat-pill.tsx` ❌ inutilisé (supprimer)

**Story**:
- ✅ `Badge.stories.tsx` créée manuellement (16 stories)
- ⚠️ `RoleBadge`, `DataStatusBadge` à générer

---

#### 6. Inputs & Forms (9)
```bash
# ✅ KEEP
src/components/ui/input.tsx                       # Oct 20
src/components/ui/textarea.tsx                    # Oct 20
src/components/ui/select.tsx                      # Oct 20
src/components/ui/combobox.tsx                    # Oct 20
src/components/ui/checkbox.tsx                    # Oct 20
src/components/ui/radio-group.tsx                 # Oct 20
src/components/ui/switch.tsx                      # Oct 20
src/components/ui/label.tsx                       # Oct 20
src/components/ui/form.tsx                        # Oct 20
```

**Story**:
- ✅ `Input.stories.tsx` créée manuellement (12 stories)
- ⚠️ Autres à générer automatiquement

---

#### 7. Tables & Data Display (4)
```bash
# ✅ KEEP
src/components/ui/table.tsx                       # Oct 20
src/components/ui/data-table.tsx                  # Oct 20
src/components/ui/sortable-table.tsx              # Oct 20
src/components/ui/avatar.tsx                      # Oct 20
```

---

#### 8. Dialogs & Overlays (6)
```bash
# ✅ KEEP
src/components/ui/dialog.tsx                      # Oct 20
src/components/ui/popover.tsx                     # Oct 20
src/components/ui/dropdown-menu.tsx               # Oct 20
src/components/ui/command.tsx                     # Oct 20
src/components/ui/sheet.tsx                       # Oct 20
src/components/ui/tooltip.tsx                     # Oct 20
```

---

#### 9. Navigation & Layout (4)
```bash
# ✅ KEEP
src/components/ui/sidebar.tsx                     # Oct 20
src/components/ui/tabs.tsx                        # Oct 20
src/components/ui/separator.tsx                   # Oct 20
src/components/ui/scroll-area.tsx                 # Oct 20
```

---

#### 10. Feedback & Status (5)
```bash
# ✅ KEEP
src/components/ui/alert.tsx                       # Oct 20
src/components/ui/toast.tsx                       # Oct 20
src/components/ui/progress.tsx                    # Oct 20
src/components/ui/skeleton.tsx                    # Oct 20
src/components/ui/spinner.tsx                     # Oct 20
```

---

#### 11. Utilities (2)
```bash
# ✅ KEEP
src/components/ui/calendar.tsx                    # Oct 20
src/components/ui/view-mode-toggle.tsx            # Oct 20
```

---

## ⚠️ REVIEW (Décision Utilisateur)

### Exports Multiples dans Fichiers V2

#### button.tsx
**État actuel**: Exporte **2 composants**
- ✅ `ButtonV2` (V2 moderne, utilisé, **KEEP**)
- ❌ `Button` (V1 obsolète, **À SUPPRIMER**)

**Action recommandée**:
```typescript
// ❌ Supprimer export V1
export const Button = React.forwardRef<...>  // DELETE

// ✅ Conserver export V2
export function ButtonV2({ ... })  // KEEP

// ✅ Optionnel: Renommer ButtonV2 → Button (migration complète V2)
export { ButtonV2 as Button }
```

**Impact**: Vérifier imports dans codebase (`standard-modify-button.tsx` l'utilise, mais **fichier inutilisé** donc OK)

---

## 📋 Plan d'Action

### Phase 1: Suppression Sécurisée (5 min)
```bash
# Backup avant suppression
git tag backup-before-v1-cleanup-$(date +%Y%m%d)

# Supprimer 12 composants inutilisés
rm src/components/ui/action-button.tsx
rm src/components/ui/standard-modify-button.tsx
rm src/components/ui/compact-kpi-card.tsx
rm src/components/ui/medium-kpi-card.tsx
rm src/components/ui/quick-actions-list.tsx
rm src/components/ui/compact-quick-actions.tsx
rm src/components/ui/activity-timeline.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/command-palette.tsx
rm src/components/ui/group-navigation.tsx
rm src/components/ui/notification-system.tsx
rm src/components/ui/stat-pill.tsx

# Vérifier compilation
npm run build
```

### Phase 2: Nettoyage Exports V1 (3 min)
```bash
# Éditer button.tsx: Supprimer export Button (V1)
# Option 1: Supprimer export Button complètement
# Option 2: Alias ButtonV2 as Button (migration douce)
```

### Phase 3: Génération Stories Restantes (2 min)
```bash
# Générer stories pour 37 composants V2 restants
npm run generate:stories

# Vérifier dans Storybook
npm run storybook
# → http://localhost:6006
```

### Phase 4: Validation (5 min)
```bash
# Tests
npm run type-check
npm run build

# Console errors check (MCP Playwright)
# → Ouvrir http://localhost:6006
# → Vérifier zéro erreur console
```

---

## 📊 Métriques Finales

### Avant Cleanup
- 📦 **262 composants TSX** (total)
- 🗂️ **49 UI components** analysés
- ⚠️ **183 fichiers inutilisés** (knip total)

### Après Cleanup
- ✅ **37 composants UI V2** conservés
- ❌ **12 composants UI** supprimés (-24%)
- 📝 **257 stories** à générer (auto-générateur prêt)
- 🎯 **Codebase 24% plus léger** (UI uniquement)

---

## 🔗 Références

- **Storybook**: http://localhost:6006
- **Design System V2**: `src/lib/design-system/`
- **Audit Dead Code**: `npm run audit:deadcode`
- **Stories Templates**: `src/stories/_templates/`
- **Auto-Generator**: `tools/scripts/generate-stories.js`

---

**Créé**: 2025-10-21
**Responsable**: Claude Code + Romeo Dos Santos
**Prochaine étape**: Approbation utilisateur → Suppression Phase 1
