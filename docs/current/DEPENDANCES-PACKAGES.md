# Carte des Dependances — packages/@verone/

**Genere le 2026-04-09** — Scanner `package.json` de chaque package

---

## Couches d'architecture

```
APPS (consommateurs)
  apps/back-office  →  @verone/orders, organisations, products, finance, stock, ...
  apps/linkme       →  @verone/orders, notifications, hooks
  apps/site-internet → @verone/products, hooks

DOMAIN PACKAGES (logique metier)
  @verone/orders         →  categories, finance, organisations, types, ui, utils
  @verone/finance        →  common, integrations, products, types, ui, utils
  @verone/consultations  →  finance, orders, products, types, ui, utils
  @verone/organisations  →  types, ui, utils  (+maplibre-gl, react-map-gl)
  @verone/products       →  types, ui, utils
  @verone/stock          →  types, ui, utils  (+@react-pdf/renderer)
  @verone/channels       →  types, ui, utils
  @verone/collections    →  types, ui, utils
  @verone/customers      →  types, ui, utils
  @verone/dashboard      →  types, ui, utils
  @verone/notifications  →  common, ui, utils, types
  @verone/categories     →  ui, utils, types
  @verone/logistics      →  types, ui, utils
  @verone/roadmap        →  common, notifications, ui, utils, types

FOUNDATION (base)
  @verone/common         →  collections, types, ui, utils
  @verone/ui-business    →  types, ui, utils
  @verone/ui             →  types, utils  (+radix-ui, lucide-react, tailwind, motion)
  @verone/hooks          →  react (aucune dep @verone/)
  @verone/utils          →  types  (+zod, tailwind-merge, clsx, isomorphic-dompurify)
  @verone/types          →  (aucune dep @verone/)
  @verone/integrations   →  utils, types
```

---

## Dependances par package

### @verone/types

**Depend de** : aucun package @verone/
**Utilise par** : TOUS les packages et apps (base de types Supabase)

### @verone/utils

**Depend de** : @verone/types
**Utilise par** : TOUS les packages et apps (formatters, logger, Supabase client)

### @verone/hooks

**Depend de** : react (aucune dep @verone/)
**Utilise par** : apps/site-internet

### @verone/ui

**Depend de** : @verone/types, @verone/utils
**Utilise par** : Tous les domain packages, tous les apps

### @verone/ui-business

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/common

**Depend de** : @verone/collections, @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office, @verone/finance, @verone/notifications, @verone/roadmap

### @verone/integrations

**Depend de** : @verone/utils, @verone/types
**Utilise par** : apps/back-office, @verone/finance

### @verone/categories

**Depend de** : @verone/ui, @verone/utils, @verone/types
**Utilise par** : apps/back-office, @verone/orders

### @verone/channels

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/collections

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office, @verone/common

### @verone/customers

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/dashboard

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/organisations

**Depend de** : @verone/types, @verone/ui, @verone/utils + maplibre-gl, react-map-gl, supercluster
**Utilise par** : apps/back-office, @verone/orders

### @verone/products

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office, apps/site-internet, @verone/consultations, @verone/finance

### @verone/finance

**Depend de** : @verone/common, @verone/integrations, @verone/products, @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office, @verone/consultations, @verone/orders

### @verone/orders

**Depend de** : @verone/categories, @verone/finance, @verone/organisations, @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office, @verone/consultations

### @verone/stock

**Depend de** : @verone/types, @verone/ui, @verone/utils + @react-pdf/renderer
**Utilise par** : apps/back-office

### @verone/consultations

**Depend de** : @verone/finance, @verone/orders, @verone/products, @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/notifications

**Depend de** : @verone/common, @verone/ui, @verone/utils, @verone/types
**Utilise par** : apps/linkme, @verone/roadmap

### @verone/logistics

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office (via commandes)

### @verone/roadmap

**Depend de** : @verone/common, @verone/notifications, @verone/ui, @verone/utils, @verone/types
**Utilise par** : apps/back-office

---

## Dependances critiques (risque impact cascade)

| Package modifie         | Impact potentiel                                |
| ----------------------- | ----------------------------------------------- |
| `@verone/types`         | **TOUS** les packages et apps — rebuild complet |
| `@verone/utils`         | **TOUS** les packages et apps                   |
| `@verone/ui`            | Tous les domain packages                        |
| `@verone/common`        | finance, notifications, roadmap + apps          |
| `@verone/finance`       | orders, consultations + apps                    |
| `@verone/organisations` | orders + apps                                   |

---

## Composants dans apps/ a migrer

Ces composants existent dans `apps/` mais devraient etre dans `packages/@verone/` selon les regles du projet :

| Composant                 | App         | Package cible suggere | Raison                                      |
| ------------------------- | ----------- | --------------------- | ------------------------------------------- |
| `LinkMeOrderDetailModal`  | back-office | @verone/orders        | Doublon OrderDetailModal                    |
| `CreateEnseigneModal`     | back-office | @verone/organisations | Doublon CustomerOrganisationFormModal       |
| `EditEnseigneModal`       | back-office | @verone/organisations | Doublon CustomerOrganisationFormModal       |
| `EnseigneCreateEditModal` | back-office | @verone/organisations | Doublon CustomerOrganisationFormModal       |
| `CreateOrderModal`        | linkme      | @verone/orders        | Doublon SalesOrderFormModal (adapte LinkMe) |
| `OrderDetailModal`        | linkme      | @verone/orders        | Doublon OrderDetailModal                    |

**Note** : Certains composants LinkMe (`ProductDetailSheet`, `SelectionConfigSheet`) utilisent le pattern Sheet au lieu de Modal, specifique a l'UX affilies. Ils ne sont pas des doublons stricts mais meritent evaluation.
