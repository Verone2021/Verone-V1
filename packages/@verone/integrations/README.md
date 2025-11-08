# @verone/integrations

Intégrations externes pour le système Vérone CRM/ERP

## 📦 Contenu

### Abby (Facturation)
- Client API Abby
- Sync processor pour synchronisation
- Webhook validator
- Types & erreurs

### Google Merchant (E-commerce)
- Client Google Content API
- Product mapper & transformer
- Sync client pour synchronisation
- Excel transformer pour exports
- Auth & configuration

### Qonto (Banking)
- Client Qonto API
- Types transactions bancaires
- Error handling

## 🚀 Usage

```tsx
// Abby
import { AbbyClient } from '@verone/integrations/abby';

const abby = new AbbyClient();
await abby.sync();

// Google Merchant
import { GoogleMerchantClient } from '@verone/integrations/google-merchant';

const gm = new GoogleMerchantClient();
await gm.syncProduct(productId);

// Qonto
import { QontoClient } from '@verone/integrations/qonto';

const qonto = new QontoClient();
const transactions = await qonto.getTransactions();
```

## 📊 Statistiques

- **17 fichiers** TypeScript
- **3 intégrations** tierces
- **100% types** stricts

**Version** : 1.0.0
**Mainteneur** : Romeo Dos Santos
