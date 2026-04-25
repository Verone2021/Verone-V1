# Google Merchant Center — Comment l'utiliser

**Audience** : Romeo (utilisateur final). Symétrique de `docs/current/integrations/meta-commerce/USAGE.md`.

**Date** : 2026-04-25 — état des lieux après audit + configuration Vercel.

---

## TL;DR

Le canal **Google Merchant Center** est configuré côté code (Service Account, 11 routes API HTTP, 9+ RPCs DB, hook visibility avec guard cascade). Variables Vercel `GOOGLE_MERCHANT_*` ajoutées le 2026-04-25 pour les 3 environnements via les credentials du Service Account `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com`.

⚠️ **Validité des credentials à confirmer** : ces clés ont transité par `git history` en 2025-10 (fichier `GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md` commité, restauré depuis l'historique le 2026-04-25). Google Cloud Secret Scanner peut les avoir détectées et révoquées automatiquement. Test fonctionnel post-merge via `curl /api/google-merchant/test-connection`.

Si la clé est révoquée → suivre la procédure section "Régénérer la clé" ci-dessous (5 minutes via Google Cloud Console).

---

## Identifiants Verone

| Identifiant                 | Valeur                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Project Google Cloud**    | `make-gmail-integration-428317`                                                |
| **Service Account**         | `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com` |
| **Merchant Center Account** | `5495521926`                                                                   |
| **Domain vérifié**          | `veronecollections.fr`                                                         |

---

## Variables Vercel (configurées 2026-04-25)

| Variable                                | Description                         | Statut    |
| --------------------------------------- | ----------------------------------- | --------- |
| `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL` | Email du Service Account            | ✅ 3 envs |
| `GOOGLE_MERCHANT_PRIVATE_KEY`           | Clé privée RSA (avec `\n` échappés) | ✅ 3 envs |
| `GOOGLE_MERCHANT_PRIVATE_KEY_ID`        | ID de la clé                        | ✅ 3 envs |
| `GOOGLE_MERCHANT_CLIENT_ID`             | Client ID OAuth                     | ✅ 3 envs |
| `GOOGLE_CLOUD_PROJECT_ID`               | `make-gmail-integration-428317`     | ✅ 3 envs |

Source des valeurs : `docs/restored/google-merchant-2025-11/GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md`.

---

## Routes API back-office (toutes existantes)

11 routes Google Merchant côté `/apps/back-office/src/app/api/google-merchant/` :

| Route                            | Méthode    | But                                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `/test-connection`               | POST       | Vérifier auth Service Account + accès API Content                           |
| `/batch-sync`                    | POST       | Sync batch produits                                                         |
| `/poll-statuses`                 | POST       | Pull statuses Google → met à jour `google_merchant_syncs.google_status`     |
| `/sync-product/[id]`             | GET / POST | Sync individuel                                                             |
| `/products/batch-add`            | GET / POST | Ajout en lot                                                                |
| `/products/[id]`                 | DELETE     | Soft delete                                                                 |
| `/products/[id]/visibility`      | PATCH      | Toggle visibility (✅ avec guard cascade depuis `[BO-API-PUB-001]` PR #762) |
| `/products/[id]/price`           | PUT        | Update prix                                                                 |
| `/products/[id]/metadata`        | PATCH      | Update méta-données                                                         |
| `/cron/google-merchant-poll`     | GET        | Cron Vercel — poll statuses                                                 |
| `/exports/google-merchant-excel` | POST       | Export Excel format Google Merchant                                         |

---

## Tables & RPCs

### Table `google_merchant_syncs`

| Colonne                                              | Type            | Description                                         |
| ---------------------------------------------------- | --------------- | --------------------------------------------------- |
| `id`                                                 | uuid            | PK                                                  |
| `product_id`                                         | uuid            | FK products                                         |
| `google_product_id`                                  | text            | ID retailer côté Google (= notre SKU)               |
| `merchant_id`                                        | text            | `5495521926`                                        |
| `sync_status`                                        | text            | `pending` / `synced` / `error` / `removed`          |
| `sync_operation`                                     | text            | `add` / `update` / `remove` / `toggle_visibility`   |
| `google_status`                                      | text            | `active` / `pending` / `disapproved` / `not_synced` |
| `google_status_detail`                               | jsonb           | Détails erreurs Google                              |
| `impressions`, `clicks`, `conversions`, `revenue_ht` | numeric/integer | Analytics                                           |
| `synced_at`, `google_status_checked_at`              | timestamptz     | Timestamps                                          |

### RPCs Supabase

- `toggle_google_merchant_visibility(p_product_id, p_visible)` — flip statut
- `remove_from_google_merchant(p_product_id)` — soft delete
- `batch_add_google_merchant_products(product_ids, merchant_id)` — ajout lot
- `update_google_merchant_price(p_product_id, p_price_ht_cents, p_tva_rate)` — update prix
- `update_google_merchant_metadata(...)` — update meta
- `get_google_merchant_products(...)` — fetch produits synced
- `get_google_merchant_eligible_products(...)` — fetch produits éligibles (publiés SI)
- `get_google_merchant_stats(...)` — KPIs canal
- `get_google_merchant_product_price(...)` — prix actuel
- `poll_google_merchant_statuses(...)` — poll utilisé par le cron
- `refresh_google_merchant_stats()` — refresh matérialized stats

---

## Hooks consommateurs

Tous dans `packages/@verone/channels/src/hooks/google-merchant/` :

- `useGoogleMerchantProducts` — liste produits synced
- `useGoogleMerchantEligibleProducts` — liste éligibles
- `useToggleGoogleMerchantVisibility` — appelle déjà la route HTTP `PATCH /api/google-merchant/products/[id]/visibility` ✅
- `useRemoveFromGoogleMerchant` — appelle déjà la route HTTP `DELETE /api/google-merchant/products/[id]` ✅
- `useUpdateGoogleMerchantPrice` — appelle route HTTP price ✅
- `useUpdateGoogleMerchantMetadata` — appelle route HTTP metadata ✅
- `useAddProductsToGoogleMerchant` — appelle route HTTP batch-add ✅
- `usePollGoogleMerchantStatuses` — appelle route HTTP poll ✅
- `useGoogleMerchantConfig`, `useGoogleMerchantSync`, `useGoogleMerchantStats` — read-only

Tous ces hooks passent déjà par les routes HTTP (donc bénéficient du guard cascade côté visibility). Pas de refactoring nécessaire (contrairement à Meta).

---

## Page back-office

`apps/back-office/src/app/(protected)/canaux-vente/google-merchant/page.tsx` — Tabs `synced` / `add`. Composants `meta-products-table.tsx`-like (à confirmer le nom exact dans `_components/`).

---

## URL produit publique

Pour un produit synchronisé, l'URL Google Shopping est de la forme :

```
https://shopping.google.com/.../[google_product_id]
```

Le `google_product_id` est stocké dans `google_merchant_syncs.google_product_id`.

---

## Cron de poll automatique

Déjà configuré dans `vercel.json` (à vérifier — sinon, route `/api/cron/google-merchant-poll` doit être appelée par un cron externe). Schedule recommandé : toutes les 1-2h.

---

## Régénérer la clé Service Account (si révoquée par Secret Scanner)

Si `curl /api/google-merchant/test-connection` retourne 401/invalid_grant :

1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=make-gmail-integration-428317
2. Cliquer sur le Service Account `google-merchant-verone`
3. Onglet **Clés** → **Ajouter une clé** → **Créer une nouvelle clé** → JSON
4. Le fichier JSON est téléchargé (ex : `make-gmail-integration-428317-XXXX.json`)
5. Extraire les 5 champs (`client_email`, `private_key`, `private_key_id`, `client_id`, `project_id`)
6. Mettre à jour les 5 variables Vercel correspondantes (3 envs)
7. Redeploy production (`vercel --prod` ou push sur main)
8. Re-tester `curl /api/google-merchant/test-connection`
9. Révoquer l'ancienne clé dans Google Cloud Console

⚠️ Le nouveau JSON contient une `private_key` avec de vrais retours à la ligne. Pour Vercel, il faut convertir en `\n` échappés OU utiliser `vercel env add ... < file` qui préserve les newlines.

---

## Voir aussi

- `docs/current/canaux-vente-publication-rules.md` — règle cascade Site → Google + Meta
- `docs/current/INDEX-CANAUX-VENTE.md` — sommaire canaux
- `docs/restored/google-merchant-2025-11/` — doc historique (configuration complète, plan d'intégration, domain verification)
- Documentation Google Content API : https://developers.google.com/shopping-content
- Merchant Center : https://merchants.google.com/mc/accounts/5495521926
- Google Cloud Console (project) : https://console.cloud.google.com/?project=make-gmail-integration-428317
