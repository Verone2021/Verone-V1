# Vérone Design System V2 - Révolution 2025

## 🎨 Nouvelle Direction Design (Octobre 2025)

**Transition majeure** : Passage du minimalisme noir/blanc strict vers une **palette moderne colorée** inspirée des meilleures pratiques 2025.

### Palette Officielle V2

```typescript
primary:  #3b86d1  // Bleu professionnel (actions, liens, navigation)
success:  #38ce3c  // Vert validation (confirmations, états positifs)
warning:  #ff9b3e  // Orange attention (alertes modérées)
accent:   #844fc1  // Violet créatif (highlights, badges)
danger:   #ff4d6b  // Rouge critique (erreurs, suppressions)
neutral:  #6c7293  // Gris interface (textes, bordures, backgrounds)
```

### Architecture Design System

**Fichiers principaux :**
- `src/lib/design-system/` - Architecture professionnelle avec tokens atomiques
  - `tokens/colors.ts` - Palette complète avec nuances (50-900)
  - `tokens/spacing.ts` - Spacing system
  - `tokens/typography.ts` - Typography scale
  - `tokens/shadows.ts` - Shadow system
  - `themes/light.ts` - Thème clair
  - `themes/dark.ts` - Thème sombre
  - `utils/index.ts` - Utilitaires (cn, etc.)
- `src/lib/theme-v2.ts` - Thème complet avec gradients pré-définis
- `src/components/ui-v2/` - Composants modernes

### Composants UI V2 Disponibles

```
ui-v2/
├── button.tsx                 # Bouton moderne (tendances 2025)
├── elegant-kpi-card.tsx       # KPI Cards élégantes 96px
├── medium-kpi-card.tsx        # KPI Cards moyennes 65px
├── compact-kpi-card.tsx       # KPI Cards compactes 40px
├── stat-pill.tsx              # Pills statistiques
├── activity-timeline.tsx      # Timeline d'activités
├── quick-actions-list.tsx     # Liste actions rapides
├── action-button.tsx          # Boutons actions avec gradients
└── compact-quick-actions.tsx  # Actions rapides compactes
```

### Tendances Design 2025 Appliquées

- ✅ **Rounded corners** (10px, 12px pour cards)
- ✅ **Micro-interactions** (hover scale 1.02, active 0.98)
- ✅ **Transitions smooth** (200ms cubic-bezier)
- ✅ **Shadows élégantes** (depth progressive)
- ✅ **Gradients modernes** (blueGreen, purpleBlue, etc.)
- ✅ **Accessibilité ARIA** complète
- ✅ **Typography scale** cohérente
- ✅ **Spacing system** (4px grid)

### Inspirations

- **Odoo** - Dashboard moderne, KPI cards compactes
- **Figma** - Micro-interactions, transitions fluides
- **Dribbble 2025** - Tendances visuelles actuelles
- **shadcn/ui** - Architecture composants, accessibilité
- **Vercel** - Minimalisme sophistiqué
- **Linear** - Interface élégante et performante

### Migration Progressive

**Stratégie adoptée :**
1. ✅ Design System V2 créé et documenté
2. ✅ CLAUDE.md mis à jour avec nouvelle palette
3. ✅ Mémoire "verone-design-system-yellow-ban" supprimée (obsolète)
4. 🔄 **Migration pages** - Une par une, manuellement (en cours)
5. ⏳ Composants legacy coexistent avec ui-v2 temporairement

**Pas de migration automatique** : Chaque page sera migrée individuellement pour garantir qualité et cohérence.

### Règles Design V2

**✅ AUTORISÉ maintenant :**
- Couleurs vives (bleu, vert, orange, violet, rouge)
- Gradients modernes
- Backgrounds colorés subtils
- Bordures colorées
- Icons avec couleurs sémantiques

**❌ TOUJOURS INTERDIT :**
- Jaune pur (#ffff00 et similaires) - Trop agressif visuellement
- Surcharge de couleurs (max 2-3 couleurs par vue)
- Animations excessives (> 300ms)
- Contraste insuffisant (WCAG AA minimum)

### Documentation

- `CLAUDE.md` (lignes 170-187) - Design System V2 officiel
- `src/lib/design-system/tokens/colors.ts` - Palette complète
- `src/lib/theme-v2.ts` - Thème avec gradients
- Composants `ui-v2` - Documentation inline JSDoc

### Changelog

**2025-10-15** - Création Design System V2
- Palette moderne 6 couleurs
- Architecture tokens atomiques
- 9 composants ui-v2 créés
- CLAUDE.md mis à jour
- Mémoire obsolète supprimée

**Impact :** Révolution design Vérone - Passage d'un système noir/blanc strict à une palette moderne professionnelle tout en conservant l'élégance de la marque.