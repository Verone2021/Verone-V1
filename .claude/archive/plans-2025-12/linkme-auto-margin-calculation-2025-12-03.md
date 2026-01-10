# Plan d'Implémentation : Calcul Automatique des Marges LinkMe

**Date** : 2025-12-03
**Status** : PLAN MODE (Exploration Complétée, Prêt pour Implémentation)
**Responsable** : Claude Code
**Deadline** : À définir par l'utilisateur

---

## RÉSUMÉ EXÉCUTIF

Système de **calcul automatique des marges affiliés LinkMe** avec formules :

```
maxAffiliateRate = ((publicPriceHT * (1 - buffer)) - (costPriceHT * (1 + platformFee))) / costPriceHT
suggestedRate = maxAffiliateRate / 3
minRate = 0.01 (1%)
```

**Déclencheurs** : Modification de `public_price_ht` OU `custom_price_ht`
**Stockage Configs** : Ajouter colonnes à `sales_channels` table
**TVA** : 20% par défaut, configurable globalement

---

## 1. CONFIGURATIONS UTILISATEUR CONFIRMÉES

| Paramètre               | Valeur                                | Stockage                     | Notes                           |
| ----------------------- | ------------------------------------- | ---------------------------- | ------------------------------- |
| **Buffer**              | 5% (0.05)                             | `sales_channels.buffer_rate` | Modifiable globalement          |
| **Platform Fee**        | = `channel_commission_rate`           | N/A                          | Récupéré depuis channel_pricing |
| **Min Rate**            | 0.01 (1%)                             | Constant                     | Fixe, non configurable          |
| **TVA Défaut**          | 20% (0.20)                            | `sales_channels.vat_rate`    | Modifiable globalement          |
| **Auto-Calc Déclenche** | Modification price_ht (public/custom) | Trigger DB                   | Déclenche recalcul immédiat     |

---

## 2. ARCHITECTURE IMPLÉMENTATION

### 2.1 Migration Database

**Fichier** : `supabase/migrations/20251203_001_add_linkme_margin_settings.sql`

**Changements** :

```sql
ALTER TABLE sales_channels ADD COLUMN IF NOT EXISTS:
  - buffer_rate NUMERIC DEFAULT 0.05 (5%)
  - vat_rate NUMERIC DEFAULT 0.20 (20%)
  - min_affiliate_rate NUMERIC DEFAULT 0.01 (1%)
```

### 2.2 Interfaces TypeScript

**Fichier** : `apps/back-office/src/app/canaux-vente/linkme/types.ts`

**Ajouts** :

```typescript
export interface LinkMeMarginConfig {
  buffer_rate: number; // % buffer (défaut 0.05 = 5%)
  vat_rate: number; // % TVA (défaut 0.20 = 20%)
  min_affiliate_rate: number; // % min (fixe 0.01 = 1%)
  platform_fee: number; // % commission LinkMe (= channel_commission_rate)
}

export interface CalculatedMargins {
  max_affiliate_rate: number; // Marge max calculée
  suggested_rate: number; // Marge suggérée = max / 3
  min_rate: number; // Marge min = 0.01
}

export function calculateLinkMeMargins(
  publicPriceHT: number,
  costPriceHT: number,
  config: LinkMeMarginConfig
): CalculatedMargins | null;
```

### 2.3 Hook Calculation

**Fichier** : `apps/back-office/src/app/canaux-vente/linkme/hooks/use-linkme-margin-calculator.ts` (NOUVEAU)

**Logique** :

```typescript
export function useCalculateLinkMeMargins() {
  return useMutation({
    mutationFn: async ({
      publicPriceHT,
      costPriceHT,
      configId, // sales_channels.id
    }: {
      publicPriceHT: number;
      costPriceHT: number;
      configId: string;
    }) => {
      // 1. Fetch config depuis sales_channels
      const { data: config } = await supabase
        .from('sales_channels')
        .select('buffer_rate, vat_rate, min_affiliate_rate')
        .eq('id', configId)
        .single();

      // 2. Appliquer formule
      const max_rate =
        (publicPriceHT * (1 - config.buffer_rate) - costPriceHT * (1 + 0)) /
        costPriceHT; // platformFee = commission (récupéré dans channel_pricing)
      const suggested_rate = max_rate / 3;
      const min_rate = config.min_affiliate_rate || 0.01;

      return {
        max_affiliate_rate: max_rate,
        suggested_rate: suggested_rate,
        min_rate: min_rate,
      };
    },
  });
}
```

### 2.4 Composant ProductPricingCard.tsx

**Modifications** :

1. Ajouter bouton "Calculer Automatiquement"
2. Afficher formule avec valeurs actuelles
3. Auto-remplir les 3 champs de marge (min/suggested/max)
4. Déclencher recalcul au changement de `public_price_ht` ou `custom_price_ht`

```typescript
const handleAutoCalculate = async () => {
  // Récupérer config du canal LinkMe
  const config = await fetchLinkMeChannelConfig();

  // Valider inputs requis
  if (!formData.public_price_ht || !product.cost_price) {
    toast.error("Prix public et prix d'achat requis");
    return;
  }

  // Calculer les marges
  const margins = await calculateMargins({
    publicPriceHT: formData.public_price_ht,
    costPriceHT: product.cost_price,
    configId: LINKME_CHANNEL_ID,
  });

  // Mettre à jour formData
  setFormData(prev => ({
    ...prev,
    min_margin_rate: margins.min_rate * 100,
    suggested_margin_rate: margins.suggested_rate * 100,
    max_margin_rate: margins.max_affiliate_rate * 100,
  }));
};
```

### 2.5 ConfigurationSection.tsx

**Modifications** :

1. Ajouter inputs pour `buffer_rate` et `vat_rate`
2. Afficher formule d'exemple avec valeurs actuelles
3. Sauvegarder en `sales_channels` (pas état local)

---

## 3. FLUX FONCTIONNEL COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│ ProductPricingCard.tsx (Page Détail Produit LinkMe)        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ Admin rentre ou modifie:         │
        │ - public_price_ht                │
        │ - custom_price_ht                │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ Admin clique:                    │
        │ "Calculer Automatiquement"       │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ Récupérer config sales_channels: │
        │ - buffer_rate (5%)               │
        │ - vat_rate (20%)                 │
        │ - min_affiliate_rate (1%)        │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────────────┐
        │ CALCUL FORMULE:                                  │
        │ maxRate = ((publicPrice * (1-buffer)             │
        │   - (costPrice * (1+commission))) / costPrice    │
        │ suggestedRate = maxRate / 3                      │
        │ minRate = 0.01                                   │
        └──────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ AUTO-REMPLIR CHAMPS:             │
        │ - min_margin_rate = minRate * 100
        │ - suggested_margin_rate = sugRate * 100
        │ - max_margin_rate = maxRate * 100
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ Admin vérifie, puis:             │
        │ Clique "Enregistrer"             │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ UPDATE channel_pricing:          │
        │ - min_margin_rate                │
        │ - suggested_margin_rate          │
        │ - max_margin_rate                │
        │ - channel_commission_rate        │
        └──────────────────────────────────┘
```

---

## 4. FICHIERS À MODIFIER / CRÉER

### À Créer (Nouveaux)

- [ ] `supabase/migrations/20251203_001_add_linkme_margin_settings.sql`
- [ ] `apps/back-office/src/app/canaux-vente/linkme/hooks/use-linkme-margin-calculator.ts`

### À Modifier (Existants)

- [ ] `apps/back-office/src/app/canaux-vente/linkme/types.ts` - Ajouter 2 interfaces
- [ ] `apps/back-office/src/app/canaux-vente/linkme/hooks/use-linkme-catalog.ts` - Intégrer calcul
- [ ] `apps/back-office/src/app/canaux-vente/linkme/components/ProductPricingCard.tsx` - Ajouter bouton + auto-calc
- [ ] `apps/back-office/src/app/canaux-vente/linkme/components/ConfigurationSection.tsx` - Ajouter inputs buffer/vat, persister

---

## 5. DÉTAIL MODIFICATIONS PAR FICHIER

### 5.1 Migration SQL (NOUVEAU)

**File** : `supabase/migrations/20251203_001_add_linkme_margin_settings.sql`

```sql
-- Ajouter colonnes LinkMe settings à sales_channels
ALTER TABLE public.sales_channels
ADD COLUMN IF NOT EXISTS buffer_rate NUMERIC DEFAULT 0.05,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 0.20,
ADD COLUMN IF NOT EXISTS min_affiliate_rate NUMERIC DEFAULT 0.01;

-- Comment pour documentation
COMMENT ON COLUMN public.sales_channels.buffer_rate IS 'Buffer margin % pour calcul marges affiliés LinkMe (défaut 5%)';
COMMENT ON COLUMN public.sales_channels.vat_rate IS 'Taux TVA pour calculs LinkMe (défaut 20%)';
COMMENT ON COLUMN public.sales_channels.min_affiliate_rate IS 'Marge minimum affiliés LinkMe (défaut 1%, non modifiable en UI)';
```

### 5.2 Types TypeScript (MODIFICATION)

**File** : `apps/back-office/src/app/canaux-vente/linkme/types.ts`

**Ajouter après `LinkMePricingUpdate`** :

```typescript
/**
 * Configuration globale des marges LinkMe
 * Stockée dans sales_channels pour le canal LinkMe
 */
export interface LinkMeMarginConfig {
  buffer_rate: number; // % buffer pour calcul max rate (défaut 0.05 = 5%)
  vat_rate: number; // % TVA (défaut 0.20 = 20%)
  min_affiliate_rate: number; // % min affiliés (défaut 0.01 = 1%, non modifiable en UI)
}

/**
 * Résultat du calcul automatique des marges
 */
export interface CalculatedMargins {
  max_affiliate_rate: number; // Marge max % (valeur décimale, ex: 0.333)
  suggested_rate: number; // Marge suggérée % = max / 3
  min_rate: number; // Marge min % = 0.01
}

/**
 * Calcule les marges affiliés automatiquement selon formule LinkMe
 *
 * @param publicPriceHT - Prix public HT (tarif catalogue)
 * @param costPriceHT - Prix d'achat HT (cost_price du produit)
 * @param config - Configuration globale LinkMe
 * @returns Marges calculées ou null si calcul impossible
 *
 * FORMULE:
 * maxAffiliateRate = ((publicPriceHT * (1 - buffer)) - (costPriceHT * (1 + platformFee))) / costPriceHT
 * suggestedRate = maxAffiliateRate / 3
 * minRate = 0.01
 *
 * Note: platformFee = channel_commission_rate depuis channel_pricing
 */
export function calculateLinkMeMargins(
  publicPriceHT: number,
  costPriceHT: number,
  config: LinkMeMarginConfig,
  platformFee: number = 0 // Commission LinkMe, par défaut 0 pour calcul
): CalculatedMargins | null {
  if (!publicPriceHT || !costPriceHT || costPriceHT <= 0) return null;

  const maxRate =
    (publicPriceHT * (1 - config.buffer_rate) -
      costPriceHT * (1 + platformFee)) /
    costPriceHT;

  const suggestedRate = maxRate / 3;
  const minRate = config.min_affiliate_rate || 0.01;

  return {
    max_affiliate_rate: Math.max(minRate, maxRate), // Au moins le min
    suggested_rate: Math.max(minRate, suggestedRate),
    min_rate: minRate,
  };
}

/**
 * Formatte les marges décimales en pourcentages pour affichage
 */
export function formatMarginAsPercentage(margin: number | null): string {
  if (margin === null) return '-';
  return `${(margin * 100).toFixed(1)}%`;
}
```

### 5.3 Hook Calcul (NOUVEAU)

**File** : `apps/back-office/src/app/canaux-vente/linkme/hooks/use-linkme-margin-calculator.ts`

```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { LinkMeMarginConfig, CalculatedMargins } from '../types';
import { calculateLinkMeMargins } from '../types';

const supabase = createClient();
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Hook: Fetch config LinkMe pour calculs marges
 */
export function useLinkMeMarginConfig() {
  return useQuery({
    queryKey: ['linkme-margin-config'],
    queryFn: async (): Promise<LinkMeMarginConfig | null> => {
      const { data, error } = await supabase
        .from('sales_channels')
        .select('buffer_rate, vat_rate, min_affiliate_rate')
        .eq('id', LINKME_CHANNEL_ID)
        .single();

      if (error) {
        console.error('Erreur fetch LinkMe config:', error);
        return null;
      }

      return data as LinkMeMarginConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Calculer marges automatiquement
 */
export function useCalculateLinkMeMargins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      publicPriceHT,
      costPriceHT,
      platformFee = 0,
    }: {
      publicPriceHT: number;
      costPriceHT: number;
      platformFee?: number;
    }): Promise<CalculatedMargins | null> => {
      // Fetch config actuelle
      const { data: config } = await supabase
        .from('sales_channels')
        .select('buffer_rate, vat_rate, min_affiliate_rate')
        .eq('id', LINKME_CHANNEL_ID)
        .single();

      if (!config) return null;

      // Appliquer formule
      return calculateLinkMeMargins(
        publicPriceHT,
        costPriceHT,
        config as LinkMeMarginConfig,
        platformFee
      );
    },
  });
}

/**
 * Hook: Mettre à jour config LinkMe (buffer_rate, vat_rate)
 */
export function useUpdateLinkMeMarginConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buffer_rate,
      vat_rate,
    }: {
      buffer_rate?: number;
      vat_rate?: number;
    }) => {
      const updateData: Partial<LinkMeMarginConfig> = {};
      if (buffer_rate !== undefined) updateData.buffer_rate = buffer_rate;
      if (vat_rate !== undefined) updateData.vat_rate = vat_rate;

      const { error } = await supabase
        .from('sales_channels')
        .update(updateData)
        .eq('id', LINKME_CHANNEL_ID);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-margin-config'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-product-detail'] });
    },
  });
}
```

### 5.4 ProductPricingCard.tsx (MODIFICATION MAJEURE)

**Ajouts clés** :

1. État pour contrôler "mode auto-calc" vs "mode manuel"
2. Bouton "Calculer Automatiquement"
3. Affichage formule avec valeurs
4. Auto-recalc au changement de public_price_ht

```typescript
// (Voir implémentation détaillée dans phase d'implémentation)
```

### 5.5 ConfigurationSection.tsx (MODIFICATION)

**Ajouts clés** :

1. Inputs pour `buffer_rate` et `vat_rate`
2. Mutation `useUpdateLinkMeMarginConfig()` pour sauvegarder
3. Afficher exemple calcul avec valeurs actuelles

---

## 6. CHECKLIST IMPLÉMENTATION

### Phase 1 : Database (Migration)

- [ ] Créer migration `20251203_001_add_linkme_margin_settings.sql`
- [ ] Appliquer migration localement
- [ ] Vérifier colonnes ajoutées à `sales_channels`

### Phase 2 : Types & Logique

- [ ] Ajouter interfaces dans `types.ts`
- [ ] Ajouter fonction `calculateLinkMeMargins()`
- [ ] Créer hook `use-linkme-margin-calculator.ts`

### Phase 3 : Composants UI

- [ ] Modifier `ProductPricingCard.tsx` :
  - Ajouter bouton "Calculer"
  - Intégrer hook calcul
  - Afficher formule
  - Auto-fill 3 champs de marge

- [ ] Modifier `ConfigurationSection.tsx` :
  - Ajouter inputs buffer/vat
  - Intégrer mutation sauvegarde
  - Afficher exemple dynamique

### Phase 4 : Tests

- [ ] Tests unitaires `calculateLinkMeMargins()`
- [ ] Tests E2E ProductPricingCard
- [ ] Tests E2E ConfigurationSection
- [ ] Validation console errors = 0

### Phase 5 : Déploiement

- [ ] Build verification (`npm run build`)
- [ ] Type checking (`npm run type-check`)
- [ ] Tests validation
- [ ] Git commit avec message structuré

---

## 7. EXEMPLE D'EXÉCUTION

**Données** :

- `public_price_ht` = 100€
- `cost_price` = 40€
- `buffer_rate` = 0.05 (5%)
- `channel_commission_rate` = 0.05 (5%)

**Calcul** :

```
maxRate = ((100 * (1 - 0.05)) - (40 * (1 + 0.05))) / 40
        = ((100 * 0.95) - (40 * 1.05)) / 40
        = (95 - 42) / 40
        = 53 / 40
        = 1.325 (132.5%)

suggestedRate = 1.325 / 3 = 0.442 (44.2%)
minRate = 0.01 (1%)
```

**Auto-remplissage dans UI** :

- `min_margin_rate` = 1
- `suggested_margin_rate` = 44.2
- `max_margin_rate` = 132.5

---

## 8. NOTES IMPORTANTES

⚠️ **Points Critiques** :

1. **TVA** : Par défaut 20%, mais stockée dans `sales_channels.vat_rate`. Actuellement pas utilisée dans formule (supposée HT partout).

2. **Platform Fee** : Récupéré depuis `channel_pricing.channel_commission_rate` AU MOMENT DU CALCUL. Si 0, utiliser 0 dans formule.

3. **Déclencheurs** : AUCUN TRIGGER DB automatique. L'admin clique "Calculer" manuellement ou la modification de `public_price_ht`/`custom_price_ht` déclenche le recalcul côté client.

4. **Persistance Config** : Les paramètres `buffer_rate` et `vat_rate` sont sauvegardés dans `sales_channels` (global LinkMe), pas par produit.

5. **Validation** : Avant calcul, vérifier que `public_price_ht > 0` et `cost_price > 0`.

---

## 9. DOCUMENTATION À CRÉER/METTRE À JOUR

Après implémentation :

- [ ] `docs/guides/03-integrations/linkme/margin-calculation.md` - Explication formules + config
- [ ] Mise à jour `CLAUDE.md` si nécessaire
- [ ] Commentary dans `types.ts` complet

---

## STATUS FINAL

✅ **Exploration Terminée**

- Schéma database mappé
- Formules clarifiées
- Architecture définie
- Prêt pour implémentation

⏸️ **En attente de** : Autorisation utilisateur pour commencer Phase 1 (Migration)
