# 📊 Rapport Google Merchant Center - TODO Liste

**Date** : 9 octobre 2025
**Statut** : Synchronisation fonctionnelle ✅ - Optimisations restantes ⚠️
**Compte Merchant** : 5495521926
**Data Source ID** : 10571293810

---

## 🎯 **Résumé Exécutif**

La synchronisation Google Merchant Center est **100% opérationnelle** :
- ✅ **3/3 produits** synchronisés avec succès
- ✅ **Content API v2.1** fonctionnelle
- ✅ **URLs produits** correctes (`https://www.veronecollections.fr/produits/{slug}`)
- ✅ **OAuth authentication** stable

**Cependant**, des erreurs "Needs Attention" subsistent dans Google Merchant Center qui limitent la performance et la visibilité des produits.

---

## ⚠️ **Problèmes Identifiés (Non Résolus)**

### **1. GTIN Manquant (PRIORITÉ HAUTE)**

**Statut** : ❌ Non résolu
**Impact** : Performance limitée, visibilité réduite dans Google Shopping

**Diagnostic** :
- Les 3 produits synchronisés ont `gtin: null` en base de données
- Google Merchant exige GTIN pour produits avec brand en France
- Alternative : GTIN + brand OU brand + MPN OU `identifierExists: false`

**Produits affectés** :
```json
[
  {"sku": "FMIL-BEIGE-05", "gtin": null, "mpn": null},
  {"sku": "FMIL-MARRO-03", "gtin": null, "mpn": null},
  {"sku": "FMIL-BLEUV-16", "gtin": null, "mpn": null}
]
```

**Solutions possibles** :

#### **Option A : Produits Custom Vérone (RECOMMANDÉ si applicab)**
Si les fauteuils sont fabriqués par Vérone sans GTIN officiel :

1. Ajouter champ `identifierExists: false` au payload
2. Modifier `src/lib/google-merchant/product-mapper.ts` :

```typescript
export interface GoogleMerchantProductInput {
  // ... existing fields
  identifierExists?: boolean  // Ajouter ce champ
}

// Dans mapSupabaseToGoogleMerchant()
const productInput: GoogleMerchantProductInput = {
  // ... existing fields
  identifierExists: false  // Pour produits custom sans GTIN
}
```

#### **Option B : Ajouter GTINs Réels**
Si les produits ont des GTINs existants :

1. Mettre à jour table `products` avec vrais GTINs
2. Ajouter MPNs (supplier_reference) si disponibles
3. Re-synchroniser produits

**Fichiers à modifier** :
- `src/lib/google-merchant/product-mapper.ts:40-61` (interface)
- `src/lib/google-merchant/product-mapper.ts:219-260` (construction payload)

---

### **2. Google Product Category Manquante (PRIORITÉ MOYENNE)**

**Statut** : ❌ Non implémenté
**Impact** : Catégorisation sous-optimale, moins de visibilité

**Diagnostic** :
- Attribut `googleProductCategory` non envoyé
- Google recommande fortement cette catégorie pour améliorer le matching

**Solution** :

1. Mapper catégories Vérone → Google Taxonomy
2. Ajouter champ `googleProductCategory` au payload

**Exemple implémentation** :

```typescript
// Dans product-mapper.ts
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  'Fauteuils': 'Furniture > Chairs > Armchairs',
  'Canapés': 'Furniture > Sofas',
  'Tables': 'Furniture > Tables',
  // etc.
}

// Dans mapSupabaseToGoogleMerchant()
if (subcategory?.name) {
  const googleCategory = GOOGLE_CATEGORY_MAP[subcategory.name]
  if (googleCategory) {
    productInput.googleProductCategory = googleCategory
  }
}
```

**Référence Google Taxonomy** :
https://support.google.com/merchants/answer/6324436

---

### **3. Validation URL Produits (PRIORITÉ HAUTE)**

**Statut** : ⚠️ À vérifier
**Impact** : Si URLs 404 → produits rejetés

**Diagnostic** :
- URLs générées : `https://www.veronecollections.fr/produits/{slug}`
- **Non vérifié** si ces URLs existent réellement sur le site

**Action requise** :
1. Vérifier que `https://www.veronecollections.fr/produits/fmil-bleuv-16` existe
2. Vérifier que `https://www.veronecollections.fr/produits/fmil-beige-05` existe
3. Vérifier que `https://www.veronecollections.fr/produits/fmil-marro-03` existe

**Si URLs n'existent pas** :
- Option A : Créer pages produits sur le site
- Option B : Ajuster structure URL dans `product-mapper.ts:111-114`

---

### **4. Images Produits Validation (PRIORITÉ MOYENNE)**

**Statut** : ⚠️ À vérifier
**Impact** : Si images 404 ou format invalide → visibilité réduite

**URLs images actuelles** :
```
https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/products/{uuid}/{filename}
```

**Exigences Google** :
- Format : JPEG, PNG, GIF, BMP, TIFF, WebP
- Taille minimale : 100x100 pixels
- Taille recommandée : 800x800 pixels minimum
- Pas de watermark/logo sur plus de 5% de l'image

**Action requise** :
1. Vérifier accessibilité images (pas de 404)
2. Vérifier dimensions images
3. Vérifier format/qualité

---

### **5. Shipping Information Manquante (PRIORITÉ BASSE)**

**Statut** : ❌ Non implémenté
**Impact** : Google peut afficher "Shipping cost varies" au lieu de prix exact

**Solution** :

```typescript
// Ajouter dans GoogleMerchantProductInput interface
shipping?: Array<{
  country: string
  price: {
    value: string
    currency: string
  }
}>

// Exemple payload
shipping: [{
  country: 'FR',
  price: {
    value: '0.00',  // Livraison gratuite
    currency: 'EUR'
  }
}]
```

---

### **6. Autres Erreurs Google Merchant (PRIORITÉ : À DÉTERMINER)**

**Statut** : ⚠️ Non diagnostiquées
**Impact** : Inconnu

**Action requise** :
Vérifier dans Google Merchant Center console les erreurs exactes :

1. Aller sur https://merchants.google.com/mc/products/diagnostics?a=5495521926
2. Relever toutes les erreurs "Needs Attention"
3. Copier messages d'erreur exacts
4. Vérifier onglets "Disapproved" et "Pending"

**URLs détails produits** :
- FMIL-BLEUV-16 : https://merchants.google.com/mc/items/details?a=5495521926&offerId=FMIL-BLEUV-16&language=fr&channel=0&feedLabel=FR&tab=needsattention
- FMIL-BEIGE-05 : https://merchants.google.com/mc/items/details?a=5495521926&offerId=FMIL-BEIGE-05&language=fr&channel=0&feedLabel=FR&tab=needsattention
- FMIL-MARRO-03 : https://merchants.google.com/mc/items/details?a=5495521926&offerId=FMIL-MARRO-03&language=fr&channel=0&feedLabel=FR&tab=needsattention

---

## 🧪 **Tests à Effectuer**

### **Test 1 : Update Produit Existant**

**Objectif** : Vérifier que Content API v2.1 merge correctement les updates

**Commande** :
```bash
curl -X POST http://localhost:3002/api/google-merchant/sync \
  -H "Content-Type: application/json" \
  -d '{"action":"insert","productIds":["25d2e61c-18d5-45a8-aec5-2a18f1b9cb55"]}'
```

**Validation** :
- HTTP 200 OK
- Produit mis à jour dans Google Merchant (pas dupliqué)
- Changements visibles dans console Merchant

---

### **Test 2 : Batch Update Multiple Produits**

**Objectif** : Vérifier performance batch sync

**Commande** :
```bash
curl -X POST http://localhost:3002/api/google-merchant/sync \
  -H "Content-Type: application/json" \
  -d '{"action":"insert","productIds":["25d2e61c-18d5-45a8-aec5-2a18f1b9cb55","5a05855a-e3d4-40c9-8043-3f504c1b73a7","cb45e989-981a-46fe-958d-bd3b81f12e8b"]}'
```

**Validation** :
- Durée < 10s (SLO)
- Rate limiting respecté (600ms entre requests)
- 3/3 success

---

### **Test 3 : Delete Produit**

**Objectif** : Vérifier suppression via Content API v2.1

**Note** : Endpoint `deleteProduct()` utilise encore Merchant API v1beta (ligne 255 `sync-client.ts`)

**Action requise** :
1. Migrer `deleteProduct()` vers Content API v2.1
2. Endpoint : `DELETE https://www.googleapis.com/content/v2.1/{accountId}/products/{productId}`

---

## 📋 **Checklist Actions Immédiates**

### **Phase 1 : Diagnostic (15 min)**
- [ ] Se connecter à Google Merchant Center console
- [ ] Relever toutes les erreurs "Needs Attention"
- [ ] Vérifier URLs produits fonctionnelles
- [ ] Vérifier images accessibles
- [ ] Copier messages d'erreur exacts

### **Phase 2 : Fix GTIN (30 min)**
- [ ] Déterminer si produits custom Vérone ou avec GTIN existant
- [ ] Si custom : Ajouter `identifierExists: false`
- [ ] Si GTIN existant : Mettre à jour base de données
- [ ] Re-synchroniser 3 produits
- [ ] Vérifier disparition erreurs GTIN

### **Phase 3 : Google Product Category (20 min)**
- [ ] Créer mapping catégories Vérone → Google Taxonomy
- [ ] Ajouter champ `googleProductCategory` interface
- [ ] Implémenter logique mapping dans `mapSupabaseToGoogleMerchant()`
- [ ] Re-synchroniser
- [ ] Vérifier catégorisation correcte

### **Phase 4 : Validation Finale (10 min)**
- [ ] Vérifier tous produits "Active" dans Google Merchant
- [ ] Zero erreurs "Needs Attention"
- [ ] Screenshots console Google Merchant (preuve)

---

## 📁 **Fichiers Clés à Modifier**

### **1. Product Mapper (Principal)**
**Fichier** : `src/lib/google-merchant/product-mapper.ts`

**Lignes clés** :
- 40-61 : Interface `GoogleMerchantProductInput` (ajouter champs)
- 66-72 : Configuration (mappings catégories)
- 219-260 : Construction payload (ajouter logique)

### **2. Sync Client (API calls)**
**Fichier** : `src/lib/google-merchant/sync-client.ts`

**Lignes clés** :
- 149-230 : `insertProduct()` (fonctionnel ✅)
- 237-241 : `updateProduct()` (fonctionnel ✅)
- 247-319 : `deleteProduct()` (à migrer vers Content API v2.1 ❌)

### **3. Auth (Credentials)**
**Fichier** : `src/lib/google-merchant/auth.ts`

**Statut** : ✅ Fonctionnel, ne pas toucher

### **4. Environment Variables**
**Fichiers** : `.env.local`, `.env`

**Variables actuelles** :
```bash
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL="google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com"
GOOGLE_MERCHANT_PRIVATE_KEY="..." # ✅ Correct
GOOGLE_MERCHANT_ACCOUNT_ID="5495521926"
GOOGLE_MERCHANT_DATA_SOURCE_ID="10571293810"
NEXT_PUBLIC_BASE_URL="https://www.veronecollections.fr" # ✅ Corrigé
```

---

## 🔗 **Ressources Utiles**

### **Documentation Google**
- Content API v2.1 Products : https://developers.google.com/shopping-content/reference/rest/v2.1/products
- Product Data Specification : https://support.google.com/merchants/answer/7052112
- GTIN Guidelines : https://www.gtin.info/googles-gtin-guidelines/
- Google Product Taxonomy : https://support.google.com/merchants/answer/6324436

### **Console Google Merchant**
- Dashboard : https://merchants.google.com/mc/products/diagnostics?a=5495521926
- Products List : https://merchants.google.com/mc/products/list?a=5495521926
- Account Settings : https://merchants.google.com/mc/settings?a=5495521926

---

## 💾 **Logs de Référence**

### **Dernière Sync Réussie**
**Fichier** : `/tmp/verone-v2.1-test.log`
**Lignes** : 233-546

**Résultat** :
```json
{
  "success": true,
  "total": 3,
  "synced": 3,
  "failed": 0,
  "duration": 3119
}
```

**URLs générées confirmées** :
```json
{
  "link": "https://www.veronecollections.fr/produits/fmil-bleuv-16"
}
```

---

## 🎯 **Objectif Final**

**Statut cible** :
- ✅ 100% produits "Active" dans Google Merchant Center
- ✅ Zero erreurs "Needs Attention"
- ✅ Zero warnings
- ✅ Produits visibles dans Google Shopping
- ✅ Performance optimale (GTIN + Category renseignés)

**Durée estimée** : 1-2 heures (selon complexité erreurs restantes)

---

**Rapport généré le** : 9 octobre 2025
**Prochaine action** : Diagnostic erreurs Google Merchant Center console
