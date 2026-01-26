# LinkMe - Systeme Feux Tricolores

Documentation du systeme de visualisation des marges avec indicateur tricolore.

## Concept

Les feux tricolores permettent aux affilies de visualiser rapidement si leur marge configuree est:
- **VERT**: Competitive (favorise les ventes)
- **ORANGE**: Correcte (equilibre marge/competitivite)
- **ROUGE**: Elevee (proche du prix public)

## Formule de Calcul des Seuils

### Source de verite

Les constantes sont definies dans `packages/@verone/utils/src/linkme/constants.ts`:

```typescript
TRAFFIC_LIGHTS: {
  GREEN_END_MULTIPLIER: 1,      // fin zone verte = marge suggeree × 1
  ORANGE_END_MULTIPLIER: 2,     // fin zone orange = marge suggeree × 2
  RED_START_MULTIPLIER: 2,      // debut zone rouge = marge suggeree × 2
}
```

### Calcul des zones

```typescript
// Marge suggeree = marge max / 3
suggestedMargin = maxMargin / 3

// Seuils
greenEnd = suggestedMargin × GREEN_END_MULTIPLIER   // = suggestedMargin
orangeEnd = suggestedMargin × ORANGE_END_MULTIPLIER // = suggestedMargin × 2
redStart = suggestedMargin × RED_START_MULTIPLIER   // = suggestedMargin × 2

// Zones resultantes
VERT:   0% → greenEnd
ORANGE: greenEnd → orangeEnd
ROUGE:  orangeEnd → max
```

### Exemple concret

```
Prix base: 100€ HT
Prix public: 150€ HT
Commission LinkMe: 5%

Prix LinkMe = 100 × 1.05 = 105€
Prix plafond securite = 150 × 0.95 = 142.50€ (buffer 5%)
Marge max = (142.50 - 105) / 105 = 35.7%

Marge suggeree = 35.7 / 3 = 11.9%

Zones:
- VERT:   0% → 11.9%
- ORANGE: 11.9% → 23.8%
- ROUGE:  23.8% → 35.7%
```

## Integration UI

### Slider avec jauge tricolore

```tsx
// Barre de progression tricolore (zones egales 33% chacune visuellement)
<div className="flex h-3 w-full overflow-hidden rounded-full">
  <div className="w-1/3 bg-green-400" />   // Zone verte
  <div className="w-1/3 bg-orange-400" />  // Zone orange
  <div className="w-1/3 bg-red-400" />     // Zone rouge
</div>

// Slider range
<input
  type="range"
  min={marginLimits.min}
  max={marginLimits.max}
  step={0.5}
  value={marginRate}
/>
```

### Indicateur de zone

```typescript
function getMarginZone(rate: number): 'green' | 'orange' | 'red' {
  if (rate <= marginLimits.greenEnd) return 'green';
  if (rate <= marginLimits.orangeEnd) return 'orange';
  return 'red';
}
```

### Messages contextuels

| Zone | Message | Description |
|------|---------|-------------|
| VERT | "Prix tres competitif" | Favorise les ventes et satisfaction client |
| ORANGE | "Prix correct" | Bon equilibre marge/competitivite |
| ROUGE | "Prix proche du public" | Marge elevee, proche du tarif officiel |

## Fichiers implementes

| Fichier | Role |
|---------|------|
| `AddToSelectionModal.tsx` | Ajout produit avec config marge |
| `EditMarginModal.tsx` | Modification marge existante |
| `constants.ts` | Constantes multiplicateurs |

## Code couleur CSS

```css
/* Zones */
.zone-green  { background-color: #4ade80; }  /* green-400 */
.zone-orange { background-color: #fb923c; }  /* orange-400 */
.zone-red    { background-color: #f87171; }  /* red-400 */

/* Messages */
.bg-green-100  { /* fond message vert */ }
.bg-orange-100 { /* fond message orange */ }
.bg-red-100    { /* fond message rouge */ }
```

## Legende affichee

```
Vert: 0-{greenEnd}%
Orange: {greenEnd}-{orangeEnd}%
Rouge: {orangeEnd}-{max}%
```

Avec pastilles colorees et noms:
- 🟢 Competitif
- 🟠 Correct
- 🔴 Proche public

## Regles metier

### Pas de blocage

Le systeme est informatif, pas bloquant:
- L'affilie peut choisir n'importe quelle marge dans les limites min/max
- Les zones ne sont que des recommendations visuelles

### Limites strictes

| Limite | Source | Description |
|--------|--------|-------------|
| `min_margin_rate` | channel_pricing | Marge minimum (defaut: 1%) |
| `max_margin_rate` | channel_pricing | Marge maximum |

Ces limites SONT bloquantes (validation Zod).

## UX Guidelines

1. **Zones egales visuellement**: Toujours 33% chacune pour coherence
2. **Feedback immediat**: Mise a jour en temps reel du gain affiche
3. **Messages positifs**: Meme en zone rouge, pas de ton negatif
4. **Transparence**: Afficher les seuils en % sous la barre

---

**Derniere mise a jour**: 2026-01-21
**Source**: FIGMA doc + implementation code
