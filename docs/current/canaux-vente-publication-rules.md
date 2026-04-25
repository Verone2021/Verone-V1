# Canaux de vente — règles de publication

**Source de vérité** pour la logique métier de publication d'un produit sur les canaux de vente Verone. Lue obligatoirement par tout agent qui touche à la fiche produit (onglet Publication, onglet Général > Pricing par canal), à la page `/canaux-vente/*` ou aux routes API `/api/google-merchant/*`, `/api/meta-commerce/*`, `/api/channel-pricing/*`.

Dernière mise à jour : 2026-04-25 — règle dictée par Romeo le même jour.

---

## Hiérarchie des canaux

Verone publie un produit sur 4 canaux de vente :

| Canal                                             | Type                                           | Indépendance                   | Pilotable depuis                   |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------ | ---------------------------------- |
| **Site Internet Vérone**                          | E-commerce propriétaire (`apps/site-internet`) | **Indépendant** (canal racine) | BO + app site-internet             |
| **LinkMe**                                        | Plateforme d'affiliation (`apps/linkme`)       | **Indépendant** (canal racine) | BO + app LinkMe                    |
| **Google Merchant Center**                        | Marketplace Google Shopping                    | **Dépend du Site Internet**    | BO uniquement (read-only ailleurs) |
| **Meta Commerce** (Facebook + Instagram Shopping) | Social commerce Meta                           | **Dépend du Site Internet**    | BO uniquement (read-only ailleurs) |

---

## Règle de publication critique

**Google Merchant et Meta Commerce sont des miroirs du Site Internet.** Ils ne publient que ce qui est déjà publié sur Site Internet.

### Matrice d'éligibilité

| Site Internet | Google Merchant | Meta Commerce | État autorisé ?                         |
| ------------- | --------------- | ------------- | --------------------------------------- |
| ❌ non publié | ❌ non publié   | ❌ non publié | ✅ OK (pas en ligne)                    |
| ❌ non publié | ❌ non publié   | ✅ publié     | ❌ **INTERDIT** (Meta dépend du Site)   |
| ❌ non publié | ✅ publié       | ❌ non publié | ❌ **INTERDIT** (Google dépend du Site) |
| ✅ publié     | ❌ non publié   | ❌ non publié | ✅ OK (uniquement Site)                 |
| ✅ publié     | ✅ publié       | ❌ non publié | ✅ OK (Site + Google)                   |
| ✅ publié     | ❌ non publié   | ✅ publié     | ✅ OK (Site + Meta)                     |
| ✅ publié     | ✅ publié       | ✅ publié     | ✅ OK (les 3 visibles)                  |

### Conséquences pratiques

- **Dépublier un produit du Site Internet** doit en cascade dépublier de Google Merchant et de Meta Commerce. Aucun bouton ne doit permettre de garder Google ou Meta actifs si le Site est inactif.
- **Activer Google ou Meta** sans Site Internet préalable doit être **bloqué côté UI** (toggle disabled + tooltip explicatif) **et côté API** (route `/api/google-merchant/publish` et `/api/meta-commerce/publish` rejettent en 422 si `is_published_online = false`).
- **LinkMe est complètement indépendant** : un produit peut être actif sur LinkMe et inactif sur Site Internet (ou vice-versa). Aucune règle de cascade entre LinkMe et les autres canaux.

---

## Mapping technique (état actuel à valider)

### Tables et colonnes

- `products.is_published_online` (boolean) — flag global Site Internet
- `channel_pricing.is_active` (boolean) — activation par canal pour un produit (5 lignes possibles : `site_internet`, `linkme`, `google_merchant`, `meta_commerce`, `manuel`)
- `google_merchant_syncs` — état de synchronisation par produit (sync_status, google_status)
- `meta_commerce_syncs` — état de synchronisation par produit (sync_status, meta_status)
- `linkme_selections` + `linkme_selection_items` — le canal LinkMe expose les produits via des sélections curatées par enseigne

### Routes API — état confirmé par audit 2026-04-25

| Action                            | Route                                                                                               | État                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publier / dépublier Site Internet | `POST /api/products/[id]/publish` + `unpublish`                                                     | **À créer** (toggle global `is_published_online` avec cascade Google + Meta)                                                                                            |
| Publier / dépublier LinkMe        | hook direct `useToggleLinkMeProductField('is_enabled', value)` flippant `channel_pricing.is_active` | ✅ Existe (pas de route HTTP dédiée — mutation Supabase directe via hook)                                                                                               |
| Publier sur Google Merchant       | `POST /api/google-merchant/products/batch-add`                                                      | ✅ Existe                                                                                                                                                               |
| Toggle visibilité Google Merchant | `PATCH /api/google-merchant/products/[id]/visibility` (RPC `toggle_google_merchant_visibility`)     | ✅ Existe (à wrap d'un guard 422 si `is_published_online = false`)                                                                                                      |
| Dépublier de Google Merchant      | `DELETE /api/google-merchant/products/[id]`                                                         | ✅ Existe                                                                                                                                                               |
| Publier sur Meta Commerce         | (toggle visibilité ou batch-add)                                                                    | ❌ **Absent** — seule route Meta existante : `POST /api/meta-commerce/sync-statuses`. À créer : `PATCH /api/meta-commerce/products/[id]/visibility` (symétrique Google) |
| Dépublier de Meta Commerce        | `DELETE /api/meta-commerce/products/[id]`                                                           | ❌ **Absent** — à créer                                                                                                                                                 |

---

## Pages où la règle s'applique

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-publication-tab.tsx` — onglet **Publication** de la fiche produit (à refondre, voir `docs/scratchpad/dev-plan-2026-04-25-publication-refonte.md` quand créé)
- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_pricing-blocks/ChannelPricingDetailed.tsx` — onglet **Général > Prix par canal** (édition prix avec verrou min)
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/**` — catalogue Site Internet pilotable depuis BO
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/**` — catalogue LinkMe pilotable depuis BO
- `apps/back-office/src/app/(protected)/canaux-vente/google-merchant/**` — catalogue Google Merchant pilotable depuis BO
- `apps/back-office/src/app/(protected)/canaux-vente/meta-commerce/**` — catalogue Meta Commerce pilotable depuis BO (à créer s'il n'existe pas)

---

## URLs publiques par canal

Confirmées par audit code 2026-04-25 :

- **Site Internet** : `https://veronecollections.fr/produit/[id]` (pattern fichier : `apps/site-internet/src/app/produit/[id]/page.tsx`). ⚠️ Pattern singulier `produit/[id]`, pas `produits/[slug]`.
- **LinkMe** : **pas de page produit publique unitaire** — confirmé. App LinkMe n'expose que `/mes-produits/[id]` (privé affilié) et `/[affiliateSlug]/[selectionSlug]` (sélection publique). Le lien "voir sur LinkMe" depuis le BO pointera vers le catalogue back-office filtré, ou vers la 1ère sélection LinkMe active contenant le produit.
- **Google Merchant** : URL produit Google Shopping `https://shopping.google.com/.../[google_product_id]` — `google_product_id` lisible dans `google_merchant_syncs.google_product_id`. À documenter dans guide intégration.
- **Meta Commerce** : URL produit Meta `https://www.facebook.com/commerce/.../[meta_product_id]` — `meta_product_id` lisible dans `meta_commerce_syncs.meta_product_id`. À documenter.

---

## Référence

- Règle dictée par Romeo le 2026-04-25 (suite à audit fiche produit révélant 3 canaux affichés sur 4 et publication automatique non pilotable).
- Doc historique restaurée depuis git history : `docs/restored/google-merchant-2025-11/`, `docs/restored/canaux-vente-2025/`, `docs/restored/meta-facebook-feeds/`.
- Voir aussi : `docs/restored/canaux-vente-2025/README.md` (ancien module 13), `docs/current/INDEX-CANAUX-VENTE.md` (créé en parallèle).
