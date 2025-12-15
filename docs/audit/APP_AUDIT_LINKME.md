# APP_AUDIT_LINKME.md - Audit Application LinkMe

**Date** : 2025-12-15
**Scope** : apps/linkme/
**Mode** : READ-ONLY Audit

---

## 1. Ce qui est en place

### Métriques Globales

| Métrique        | Valeur |
| --------------- | ------ |
| Fichiers source | 20     |
| Pages           | 14     |
| API routes      | 2      |
| Hooks custom    | 6      |
| Components      | 15+    |
| Lignes code     | ~4,500 |

### Routes

#### Routes Publiques (No Auth)

| Route                              | Fichier                                    | Purpose                        |
| ---------------------------------- | ------------------------------------------ | ------------------------------ |
| `/`                                | `page.tsx`                                 | Homepage (hero, features, CTA) |
| `/login`                           | `login/page.tsx`                           | Authentification               |
| `/[affiliateSlug]`                 | `[affiliateSlug]/page.tsx`                 | Profil affilié public          |
| `/[affiliateSlug]/[selectionSlug]` | `[affiliateSlug]/[selectionSlug]/page.tsx` | Catalogue sélection (checkout) |
| `/cart`                            | `cart/page.tsx`                            | Panier                         |
| `/checkout`                        | `checkout/page.tsx`                        | Confirmation commande          |
| `/confirmation`                    | `confirmation/page.tsx`                    | Succès paiement                |

#### Routes Protégées (Auth Required)

| Route                    | Rôles Requis                         | Purpose             |
| ------------------------ | ------------------------------------ | ------------------- |
| `/dashboard`             | Tous                                 | Dashboard KPIs      |
| `/catalogue`             | `enseigne_admin`, `org_independante` | Catalogue complet   |
| `/ma-selection`          | `enseigne_admin`, `org_independante` | Mes sélections      |
| `/ma-selection/nouvelle` | `enseigne_admin`, `org_independante` | Créer sélection     |
| `/ma-selection/[id]`     | `enseigne_admin`, `org_independante` | Éditer sélection    |
| `/ventes`                | Tous                                 | Historique ventes   |
| `/commissions`           | Tous                                 | Détails commissions |
| `/commissions/demandes`  | Tous                                 | Demandes paiement   |
| `/statistiques`          | Tous                                 | Analytics avancés   |

#### API Routes

| Endpoint               | Method | Purpose                |
| ---------------------- | ------ | ---------------------- |
| `/api/create-order`    | POST   | Créer commande Revolut |
| `/api/webhook/revolut` | POST   | Webhook paiement       |

### Tables Supabase Utilisées

| Table                     | Opérations                     | Domaine             |
| ------------------------- | ------------------------------ | ------------------- |
| `linkme_affiliates`       | SELECT, SINGLE                 | Profils affiliés    |
| `linkme_selections`       | SELECT, INSERT, UPDATE         | Sélections produits |
| `linkme_selection_items`  | SELECT, INSERT, UPDATE, DELETE | Items sélection     |
| `linkme_commissions`      | SELECT, COUNT                  | Commissions         |
| `linkme_payment_requests` | SELECT                         | Demandes paiement   |
| `channel_pricing`         | SELECT                         | Tarification canal  |
| `products`                | SELECT (JOIN)                  | Produits maîtres    |
| `product_images`          | SELECT                         | Images produits     |
| `user_app_roles`          | SELECT                         | Vérification rôles  |
| `v_linkme_users`          | SELECT (VIEW)                  | Vue utilisateurs    |
| `organisations`           | SELECT                         | Fournisseurs        |
| `sales_order_items`       | SELECT                         | Items commandes     |

### Hooks Custom

| Hook                           | Lignes | Fonctionnalités                    |
| ------------------------------ | ------ | ---------------------------------- |
| `use-linkme-catalog.ts`        | 450    | Catalogue, catégorisation, filtres |
| `use-user-selection.ts`        | 716    | CRUD sélections complet            |
| `use-affiliate-commissions.ts` | 130    | Commissions + compteurs            |
| `use-affiliate-analytics.ts`   | 492    | Analytics + charts                 |
| `use-linkme-public.ts`         | 342    | Données publiques                  |
| `use-payment-requests.ts`      | N/A    | Demandes paiement                  |

### Auth Pattern

```typescript
// AuthContext.tsx (308 lignes)
- Singleton Supabase client
- Fetch v_linkme_users ou user_app_roles
- Vérifie: app='linkme' && is_active=true
- Stocke: user, session, linkMeRole, permissions
- Redirige si pas de rôle LinkMe
```

---

## 2. Risques / Dettes

### Risques Critiques

| #   | Risque                            | Gravité | Impact                                                                |
| --- | --------------------------------- | ------- | --------------------------------------------------------------------- |
| 1   | **Filtrage client-side produits** | ÉLEVÉ   | `categorizeProducts()` filtre en JS par enseigne_id. Bypass possible. |
| 2   | **RLS non vérifié**               | ÉLEVÉ   | Frontend assume isolation. Pas de preuve RLS sur linkme_commissions.  |
| 3   | **Webhook sans signature**        | MOYEN   | `/api/webhook/revolut` - vérification HMAC non visible.               |
| 4   | **Channel ID hardcodé**           | BAS     | `93c68db1-5a30-4168-89ec-6383152be405` dans 2 fichiers.               |

### Code Pattern Problématique

```typescript
// use-linkme-catalog.ts - Filtrage client-side (RISQUE)
export const categorizeProducts = (products, enseigne_id, organisation_id) => {
  const customProducts = products.filter(
    p =>
      p.enseigne_id === enseigne_id || p.assigned_client_id === organisation_id
  );
  // ⚠️ Ce filtrage devrait être RLS côté serveur
};
```

### Performance Concerns

| Issue                          | Impact          | Mitigation                    |
| ------------------------------ | --------------- | ----------------------------- |
| Multiple queries séquentielles | N+1 problem     | Batch queries ou RPC          |
| Images waterfall               | Slow render     | Combine product+image queries |
| Homepage charge tout catalogue | Cold start lent | Pagination/lazy-load          |

### Type Safety

```typescript
// Plusieurs hooks ont:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// → Désactive checking, masque erreurs potentielles
```

---

## 3. Flows Utilisateur

### Flow 1: Auth

```
1. User → /login
2. signInWithPassword()
3. Fetch user_app_roles (app='linkme', is_active=true)
4. Si pas de rôle → Erreur "Pas accès LinkMe"
5. Si rôle OK → Redirect /dashboard
```

### Flow 2: Catalogue → Sélection

```
1. User → /catalogue
2. Fetch channel_pricing (LINKME_CHANNEL_ID)
3. categorizeProducts() → custom vs general
4. User ajoute produit → POST /api/linkme/selections/add-item
5. Update linkme_selections.products_count
```

### Flow 3: Commande → Commission

```
1. Client → /[affiliate]/[selection]
2. Ajoute au panier → /cart
3. Checkout → POST /api/create-order (Revolut)
4. Paiement → Webhook POST /api/webhook/revolut
5. Création sales_orders + linkme_commissions
6. Affilié voit → /commissions
```

---

## 4. Ce qui manque pour phase data + tests

### Checklist

- [ ] Audit RLS linkme_commissions, channel_pricing
- [ ] Vérification signature webhook Revolut
- [ ] Env var pour LINKME_CHANNEL_ID
- [ ] Types générés Supabase (`supabase gen types`)
- [ ] Tests hooks (use-user-selection, use-affiliate-analytics)
- [ ] Error handling user-facing (toasts)
- [ ] Pagination catalogue

### Seed Minimal Requis

1. 1 organisation (fournisseur)
2. 3 produits avec images
3. 3 channel_pricing (LINKME channel)
4. 1 enseigne
5. 1 user avec rôle linkme (enseigne_admin)
6. 1 linkme_affiliates
7. 1 linkme_selections

---

## 5. Preuves

### Commandes Exécutées

```bash
# Structure
find apps/linkme/src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l → 20

# Tables utilisées
grep -rh "from(" apps/linkme/src --include="*.ts" | grep -oE "from\(['\"]([a-z_]+)" | sort | uniq -c

# RPC calls
grep -rh ".rpc(" apps/linkme/src → track_selection_view, increment_selection_views
```

### Fichiers Référencés

- `apps/linkme/src/app/` - 14 pages
- `apps/linkme/src/lib/hooks/` - 6 hooks custom
- `apps/linkme/src/contexts/AuthContext.tsx` - Auth context
- `apps/linkme/src/components/` - 15+ composants

---

## 6. Décisions à prendre

### Decision 1: RLS Product Filtering

**Options** :

1. **Ajouter RLS** sur channel_pricing (SELECT WHERE enseigne_id = auth.user_enseigne OR enseigne_id IS NULL)
2. **Garder client-side** avec rate limiting API
3. **RPC sécurisée** qui filtre côté serveur

**Recommandation** : Option 1 - RLS est la solution correcte, le client-side filter devient redondant mais safe.

### Decision 2: Webhook Security

**Options** :

1. **Implémenter HMAC** verification (Revolut signature)
2. **IP whitelist** (moins sécurisé)
3. **Replay protection** (nonce + timestamp)

**Recommandation** : Option 1 + 3 combinées pour sécurité maximale.

---

**Dernière mise à jour** : 2025-12-15 13:30 UTC+1
