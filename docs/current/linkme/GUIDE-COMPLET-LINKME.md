Configuration marge par produit (slider feux tricolores)
|
v
Publication (toggle is_public)
|
v
URL publique: /s/{slug}

```

### 5.4 Statuts Selection

```

draft ----------> active (publication)
| |
+---- archived <---+ (archivage)

````

### 5.5 Table `linkme_selection_items`

| Colonne            | Type    | Description                                           |
| ------------------ | ------- | ----------------------------------------------------- |
| `selection_id`     | FK      | Lien vers la selection                                |
| `product_id`       | FK      | Lien vers le produit                                  |
| `base_price_ht`    | decimal | Copie depuis `channel_pricing.public_price_ht`        |
| `margin_rate`      | decimal | Taux de marge additif (ex: 15.00 = 15%)               |
| `selling_price_ht` | decimal | **GENERATED ALWAYS** = `base * (1 + margin_rate/100)` |

La colonne `selling_price_ht` est **calculee automatiquement par PostgreSQL** (GENERATED COLUMN). On ne la modifie JAMAIS directement.

### 5.6 Affichage des prix

Chaque selection a un champ `price_display_mode` :

- `'HT'` : Affiche les prix hors taxes au client
- `'TTC'` : Affiche les prix TTC au client (HT x 1.20)

Les calculs internes restent TOUJOURS en HT.

---

## 6. Taux de Marge Additif

### Distinction avec l'ancien modele

|                 | Taux de Marge Additif (utilise par LinkMe) | Taux de Marque (ancien modele)     |
| --------------- | ------------------------------------------ | ---------------------------------- |
| **Formule**     | `marge / prix_achat`                       | `marge / prix_vente`               |
| **Calcul prix** | `selling = base * (1 + taux/100)`          | `selling = base / (1 - taux/100)`  |
| **Exemple**     | base=100, taux=15% -> vente=115.00         | base=100, taux=15% -> vente=117.65 |

**LinkMe utilise le TAUX DE MARGE ADDITIF** (migration `20260318200000_switch_to_additive_margin_model.sql`).

### Formules Officielles (SSOT)

```sql
-- Prix de vente (GENERATED COLUMN)
selling_price_ht = base_price_ht * (1 + margin_rate / 100)

-- Retrocession (gain affilie) par ligne
retrocession = selling_price_ht * (margin_rate / 100) * quantity

-- Verification
retrocession = (selling_price_ht - base_price_ht) * quantity  -- Equivalent
````

### Exemple Concret : Plateau bois 20x30

```
base_price_ht   = 20.19 EUR
margin_rate     = 15%

selling_price_ht = 20.19 * (1 + 0.15)
                 = 20.19 * 1.15
                 = 23.22 EUR

gain_affilie_ht  = 23.22 - 20.19 = 3.03 EUR
verification     = 23.22 * 15%  = 3.48 EUR (retrocession sur prix de vente)

ERREUR COMMUNE : 20.19 * 15% = 3.03 EUR (FAUX si applique au base_price au lieu du selling_price)
```

### Source de Verite TypeScript

```
packages/@verone/utils/src/linkme/margin-calculation.ts     -- Fonctions
packages/@verone/utils/src/linkme/__tests__/margin-calculation.test.ts  -- Tests
packages/@verone/utils/src/linkme/constants.ts              -- Constantes
```

---

## 7. Feux Tricolores

Systeme de visualisation qui guide l'affilie dans le choix de sa marge. **Informatif, pas bloquant.**

### Calcul des Zones

```
maxMargin = (prix_plafond - prix_base_avec_commission) / prix_base_avec_commission
suggestedMargin = maxMargin / 3

VERT   : 0%              -> suggestedMargin        "Prix tres competitif"
ORANGE : suggestedMargin  -> suggestedMargin * 2    "Prix correct"
ROUGE  : suggestedMargin * 2 -> maxMargin           "Prix proche du public"
```

### Exemple

```
Prix base: 100 EUR HT
Prix public: 150 EUR HT
Commission LinkMe: 5%

Prix LinkMe = 100 * 1.05 = 105 EUR
Prix plafond = 150 * 0.95 = 142.50 EUR (buffer securite 5%)
Marge max = (142.50 - 105) / 105 = 35.7%
Marge suggeree = 35.7 / 3 = 11.9%

VERT   : 0% -> 11.9%
ORANGE : 11.9% -> 23.8%
ROUGE  : 23.8% -> 35.7%
```

### Limites Strictes (bloquantes)

| Limite            | Source            | Description          |
| ----------------- | ----------------- | -------------------- |
| `min_margin_rate` | `channel_pricing` | Minimum (defaut: 1%) |
| `max_margin_rate` | `channel_pricing` | Maximum              |

Les limites min/max **sont bloquantes** (validation Zod). Les zones couleur ne sont que des recommandations visuelles.

### Integration UI

```tsx
// Barre de progression tricolore (zones egales 33% chacune visuellement)
<div className="flex h-3 w-full overflow-hidden rounded-full">
  <div className="w-1/3 bg-green-400" />
  <div className="w-1/3 bg-orange-400" />
  <div className="w-1/3 bg-red-400" />
</div>
```

### Constantes

```typescript
// packages/@verone/utils/src/linkme/constants.ts
TRAFFIC_LIGHTS: {
  GREEN_END_MULTIPLIER: 1,
  ORANGE_END_MULTIPLIER: 2,
  RED_START_MULTIPLIER: 2,
}
```

---

## 8. Page Publique
