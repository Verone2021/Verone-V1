# Carte des Dependances — packages/@verone/

**Genere le 2026-04-12** — Scanner `package.json` de chaque package

---

## Dependances par package

### @verone/categories

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/orders

### @verone/channels

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/collections

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/common

### @verone/common

**Depend de** : @verone/collections, @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/finance, @verone/notifications, @verone/roadmap

### @verone/consultations

**Depend de** : @verone/finance, @verone/orders, @verone/products, @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/customers

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/dashboard

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/finance

**Depend de** : @verone/common, @verone/integrations, @verone/products, @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/consultations, @verone/orders

### @verone/hooks

**Depend de** : aucun package @verone/
**Utilise par** : apps/site-internet

### @verone/integrations

**Depend de** : @verone/types, @verone/utils
**Utilise par** : @verone/finance

### @verone/logistics

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/notifications

**Depend de** : @verone/common, @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/roadmap, apps/linkme

### @verone/orders

**Depend de** : @verone/categories, @verone/finance, @verone/organisations, @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/consultations

### @verone/organisations

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/orders

### @verone/prettier-config

**Depend de** : aucun package @verone/
**Utilise par** : aucun

### @verone/products

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : @verone/consultations, @verone/finance, apps/site-internet

### @verone/roadmap

**Depend de** : @verone/common, @verone/notifications, @verone/types, @verone/ui, @verone/utils
**Utilise par** : apps/back-office

### @verone/stock

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/types

**Depend de** : aucun package @verone/
**Utilise par** : @verone/categories, @verone/channels, @verone/collections, @verone/common, @verone/consultations, @verone/customers, @verone/dashboard, @verone/finance, @verone/integrations, @verone/logistics, @verone/notifications, @verone/orders, @verone/organisations, @verone/products, @verone/roadmap, @verone/stock, @verone/ui, @verone/ui-business, @verone/utils, apps/back-office, apps/site-internet

### @verone/ui

**Depend de** : @verone/types, @verone/utils
**Utilise par** : @verone/categories, @verone/channels, @verone/collections, @verone/common, @verone/consultations, @verone/customers, @verone/dashboard, @verone/finance, @verone/logistics, @verone/notifications, @verone/orders, @verone/organisations, @verone/products, @verone/roadmap, @verone/stock, @verone/ui-business, apps/linkme, apps/site-internet

### @verone/ui-business

**Depend de** : @verone/types, @verone/ui, @verone/utils
**Utilise par** : aucun

### @verone/utils

**Depend de** : @verone/types
**Utilise par** : @verone/categories, @verone/channels, @verone/collections, @verone/common, @verone/consultations, @verone/customers, @verone/dashboard, @verone/finance, @verone/integrations, @verone/logistics, @verone/notifications, @verone/orders, @verone/organisations, @verone/products, @verone/roadmap, @verone/stock, @verone/ui, @verone/ui-business, apps/linkme

---

## Apps

### apps/back-office

**Depend de** : @verone/roadmap, @verone/types

### apps/linkme

**Depend de** : @verone/notifications, @verone/ui, @verone/utils

### apps/site-internet

**Depend de** : @verone/hooks, @verone/products, @verone/types, @verone/ui
