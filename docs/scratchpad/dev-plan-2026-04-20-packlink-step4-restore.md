# Plan de restauration — Packlink Étape 4 (SI-PACKLINK-RESTORE-001)

**Date** : 2026-04-20
**Auteur** : Coordinateur (audit)
**Objet** : Rétablir le fonctionnement de l'Étape 4 du wizard Packlink (sélection transporteur) cassée depuis fin mars 2026.

---

## 1. Symptôme

- URL : `/canaux-vente/linkme/commandes/45f766be-b9b5-42a0-8fad-0927496db777/details`
- Commande concernée : **SO-2026-00158** (LinkMe, Pokawa Marseille Terrasses du Port)
- À l'Étape 4 du wizard Packlink, l'UI affiche : **« Aucun service disponible pour cette destination. »**
- Le résumé à droite affiche correctement l'expéditeur mais la ligne destinataire est tronquée : `Pokawa Marseille Terrasses du Port` + `,` puis vide.

---

## 2. Reproduction runtime (prod)

Playwright lane-2 sur `verone-backoffice.vercel.app` :

1. Login MVP Test OK
2. Navigation vers la commande LinkMe : OK
3. Clic « Expédier » → modal ouvre Étape 1 (Stock) : OK, 30 unités Plateau bois
4. Étape 2 (Mode) → sélection Packlink : OK
5. Étape 3 (Colis) → Valeurs par défaut 5kg 30×30×30 : OK, clic « Rechercher les transporteurs »
6. Étape 4 : **aucune requête HTTP vers `/api/packlink/services`** émise, zéro erreur console, UI vide.

Le fait qu'aucun appel réseau ne soit émis = `fetchServices()` a fait un **early return** sur la garde `if (!destinationZip) return;` (`useShipmentWizard.ts:231`).

---

## 3. Cause racine prouvée

### 3.1 — La colonne DB est de type `jsonb`

```sql
SELECT column_name, data_type, udt_name FROM information_schema.columns
WHERE table_name = 'sales_orders' AND column_name = 'shipping_address';
-- shipping_address | jsonb | jsonb
```

### 3.2 — La valeur stockée est une **string JSON**, pas un objet

Intercepteur `fetch` installé côté client → réponse PostgREST capturée :

```json
{
  "shipping_address": "{\"address_line1\":\"9, Quai du Lazaret\",\"address_line2\":\"\",\"city\":\"Marseille\",\"postal_code\":\"13002\",\"country\":\"FR\"}",
  "type": "string"
}
```

Confirmation SQL :

```sql
SELECT order_number, jsonb_typeof(shipping_address)
FROM sales_orders
WHERE id = '45f766be-b9b5-42a0-8fad-0927496db777';
-- SO-2026-00158 | string  ← BUG : string au lieu d'object
```

### 3.3 — Le code cast aveuglément

`useShipmentWizard.ts:193-196` :

```ts
const destinationZip = useMemo(() => {
  const addr = salesOrder.shipping_address as Record<string, string> | null;
  return addr?.postal_code ?? addr?.zip ?? '';
}, [salesOrder.shipping_address]);
```

Le cast est un **mensonge TypeScript** : `addr` est en réalité une `string`. Accéder à `.postal_code` sur une string renvoie `undefined` → `destinationZip = ''` → `fetchServices` early return.

---

## 4. Scope de la corruption (SELECT DB)

| Table                      | Corrompues (string) | Saines (object) | NULL |
| -------------------------- | ------------------- | --------------- | ---- |
| `sales_orders`             | **13**              | 91              | 59   |
| `financial_documents`      | **1**               | 9               | 19   |
| `affiliate_pending_orders` | 0                   | 0               | 0    |

**Total à restaurer : 14 lignes.**

### Fenêtre de corruption

- Première commande corrompue : SO-2026-00131 (créée 2026-03-19 13:50)
- Dernière commande corrompue : SO-2026-00164 (créée 2026-04-17 15:41)
- SO-2026-00165 et suivantes : **saines** (object)

→ Un fix code a été déployé entre le 17 et le 20 avril 2026. **Le code actuel de `route.db.ts:104` n'utilise pas `JSON.stringify`** — il passe l'objet directement. Donc les INSERT actuels sont OK. **Seules les données historiques restent corrompues.**

---

## 5. Proposition de correction

### Phase 1 — Restauration données (FEU ROUGE, migration SQL)

Créer `supabase/migrations/20260420HHMMSS_fix_shipping_address_doubleencode.sql` :

```sql
-- Restaure les shipping_address stockées en double-encodage (string JSON → object JSONB)

UPDATE sales_orders
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

UPDATE financial_documents
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

-- Vérification post-migration
-- SELECT COUNT(*) FILTER (WHERE jsonb_typeof(shipping_address) = 'string') FROM sales_orders;
-- Doit retourner 0.
```

**Impact** : 14 lignes mises à jour. Aucun trigger stock touché. Aucune donnée métier perdue — juste un reformatage du JSONB.

Après migration : `python3 scripts/generate-docs.py --db`.

### Phase 2 — Défense en profondeur (FEU VERT, code)

Même après le fix data, Romeo peut recréer une ligne corrompue si un futur refactor réintroduit le `JSON.stringify`. Ajouter un parse tolérant :

`packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts` :

```ts
function parseAddressJson(raw: unknown): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return null;
    }
  }
  return raw as Record<string, string>;
}

// Utilisation
const destinationZip = useMemo(() => {
  const addr = parseAddressJson(salesOrder.shipping_address);
  return addr?.postal_code ?? addr?.zip ?? '';
}, [salesOrder.shipping_address]);
```

Même traitement dans `WizardSummaryPanel.tsx:16-19`.

**Bonus** : corriger le mismatch de clé dans le panneau résumé. Ligne 46 il lit `addr.line1` mais la DB stocke `address_line1`. Cela casse l'affichage même pour les commandes saines. Remplacer par `addr.address_line1 ?? addr.line1 ?? ''` (tolérant aux deux schémas).

### Phase 3 — Non traité, à voir plus tard

- Identifier le commit précis qui a introduit le double-stringify (fenêtre 19 mars → 17 avril). Pas bloquant : le code actuel est sain.
- Guard Zod à l'insertion pour refuser une string si le schéma exige un objet.

---

## 6. Ce qui est **hors périmètre**

- Pas de modification des triggers stock (RÈGLE ABSOLUE `stock-triggers-protected.md`).
- Pas de modification de route API Qonto.
- Pas de refactor du wizard au-delà des 2 endroits listés en Phase 2.

---

## 7. Demande de validation Romeo

| Phase                               | Risque | Validation nécessaire                                                                                                               |
| ----------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1** — Migration SQL 14 rows | FAIBLE | **FEU ROUGE** → ordre explicite de Romeo requis                                                                                     |
| **Phase 2** — Fix code tolérant     | NUL    | FEU VERT après Phase 1 (ou en parallèle)                                                                                            |
| **Commits**                         | —      | 1 PR : `[BO-PACKLINK-001] fix: restore double-encoded shipping_address + tolerant parse` (migration + code + regen types + docs DB) |

**Tests de non-régression à faire après fix** :

1. SO-2026-00158 : rouvrir wizard Packlink → Étape 4 doit afficher des transporteurs
2. SO-2026-00165 : vérifier que rien n'a bougé (commande saine)
3. `/stocks/expeditions` : liste globale doit continuer à fonctionner
4. `/factures` : détail facture avec `financial_documents.shipping_address` corrompue doit afficher correctement
