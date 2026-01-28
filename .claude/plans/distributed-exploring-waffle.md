# AUDIT COMPLET - Middleware & Erreurs Back-Office

**Date**: 26 janvier 2026
**Branche**: `integration/2026-01-consolidation`

---

## 1. DIAGNOSTIC CHROME DEVTOOLS

### État Actuel (Screenshot)
- ✅ Dashboard accessible (`/dashboard`)
- ✅ Sidebar visible avec navigation
- ✅ Utilisateur connecté (session active)
- ⚠️ KPIs en loading (skeletons gris)

### Erreurs Console
| Type | Message | Gravité |
|------|---------|---------|
| warn | `Multiple GoTrueClient instances detected` | ⚠️ Moyenne |

### Erreurs Réseau (CRITIQUE)
| Endpoint | Status | Impact |
|----------|--------|--------|
| `linkme_orders_enriched` | **500** | ❌ Bloque KPIs LinkMe |
| Toutes autres requêtes | 200 | ✅ OK |

**Cause racine**: La vue `linkme_orders_enriched` dans Supabase échoue.

---

## 2. ANALYSE MIDDLEWARE

### Historique des Modifications (2 semaines)

| Date | Commit | Description | Stable? |
|------|--------|-------------|---------|
| 26 Jan | `39a5bb61` | Add root path to public routes | ✅ Actuel |
| 26 Jan | `1be4785b` | Correct redirect /auth/login → /login | ⚠️ Bug '/' |
| 24 Jan | `f14e009a` | Vérifier rôle LinkMe | ✅ |
| 20 Jan | `ae1214ff` | **Pattern SSR officiel Supabase** | ✅ **GOLDEN** |
| 15 Jan | `170aecf0` | Security protect linkme admin | ✅ |

### Version Stable Identifiée
**Commit**: `ae1214ff` (20 Jan 2026)
**Raison**: Pattern officiel Supabase SSR sans customisation

### État Actuel du Middleware
```
✅ Refresh token fonctionne (reqid=79 → 200)
✅ Auth user fonctionne (multiples 200)
✅ Session active maintenue
⚠️ Multiple GoTrueClient instances (warning non-bloquant)
```

---

## 3. PROBLÈME RÉEL IDENTIFIÉ

### Ce n'est PAS le middleware !

Le middleware fonctionne correctement. Les erreurs viennent de :

**Vue `linkme_orders_enriched`** → Erreur 500

Cette vue PostgreSQL échoue probablement à cause de :
1. Colonnes manquantes après migration
2. RLS policy incorrecte
3. Jointures cassées sur tables modifiées

---

## 4. SOURCES WEB - Problèmes Connus Supabase

### "Refresh Token Not Found" - Bug Documenté
- [GitHub Issue #68](https://github.com/supabase/ssr/issues/68) - Bug SSR
- [Discussion #33008](https://github.com/orgs/supabase/discussions/33008) - Race condition

### Solutions Recommandées
1. **Utiliser `getUser()` au lieu de `getSession()`** dans le middleware
2. **Éviter multiple instances GoTrueClient**
3. **Ne pas mixer auth-helpers et @supabase/ssr**

---

## 5. PLAN DE CORRECTION

### Priorité 1: Corriger `linkme_orders_enriched` (URGENT) ← PLAN PRÊT

**Migrations identifiées**:
- `20260121_001_fix_security_definer_views.sql` - Définition de la vue
- `20260125_003_optimize_linkme_orders_performance.sql` - Index performance

**Tables/Colonnes référencées par la vue**:
```
sales_orders: id, order_number, status, payment_status, total_ht, total_ttc,
              customer_type, customer_id, channel_id, created_at, updated_at
organisations: id, trade_name, legal_name, address_line1, postal_code, city, email, phone
individual_customers: id, first_name, last_name, address_line1, postal_code, city, email, phone
sales_order_items: id, sales_order_id, linkme_selection_item_id
linkme_selection_items: id, selection_id
linkme_selections: id, name, affiliate_id
linkme_affiliates: id, display_name, enseigne_id, organisation_id
```

**Étapes de correction**:
1. Tester la vue via Supabase MCP → identifier l'erreur exacte
2. Vérifier si la migration a été appliquée
3. Comparer les colonnes existantes avec celles attendues
4. Réappliquer ou corriger la migration si nécessaire

**Commandes à exécuter**:
```sql
-- 1. Test basique
SELECT * FROM linkme_orders_enriched LIMIT 1;

-- 2. Si erreur, vérifier existence vue
SELECT viewname FROM pg_views WHERE viewname = 'linkme_orders_enriched';

-- 3. Si vue manquante, réappliquer migration
-- psql "$DATABASE_URL" -f supabase/migrations/20260121_001_fix_security_definer_views.sql
```

### Priorité 2: Finaliser consolidation branches
- Type-check: ✅ 31/31
- Build: ✅ 7/7
- Créer PR vers main (après fix vue)

### Priorité 3: Éliminer warning GoTrueClient (optionnel)
- Warning non-bloquant, peut être traité plus tard

---

## 6. VÉRIFICATION FINALE

- [x] Dashboard accessible
- [x] Middleware fonctionne (pas d'erreur Refresh Token)
- [ ] Corriger vue `linkme_orders_enriched`
- [ ] KPIs se chargent correctement
- [ ] PR créée vers main

---

# ANCIENNE SECTION - Unification des Branches

## Situation Actuelle (RÉSOLUE)

**Problème initial**: 141 commits répartis sur 3 branches → **MERGÉ**

| Branche | Commits | Contenu |
|---------|---------|---------|
| `feat/BO-DASH-CLEANUP-remove-old-dashboard` | 65 | Sidebars, ChannelTabs, dashboard cleanup |
| `feat/BO-FIN-invoice-workflow-3-statuses` | 28 | Workflow factures 3 statuts |
| `feat/LINKME-MARKETING-real-data` | 48 | Marketing pages avec vraies données |

**Branches locales**: 80 (trop!)
**Branches remote**: 61

---

## Stratégie Professionnelle

### Étape 1: Créer branche d'intégration

```bash
git checkout main
git pull origin main
git checkout -b integration/2026-01-consolidation
```

### Étape 2: Merger les branches dans l'ordre chronologique

```bash
# 1. D'abord BO-DASH-CLEANUP (base - contient les sidebars)
git merge feat/BO-DASH-CLEANUP-remove-old-dashboard --no-ff

# 2. Ensuite BO-FIN-invoice-workflow
git merge feat/BO-FIN-invoice-workflow-3-statuses --no-ff

# 3. Enfin LINKME-MARKETING (le plus récent)
git merge feat/LINKME-MARKETING-real-data --no-ff
```

### Étape 3: Vérification

```bash
pnpm type-check
pnpm build
# Test visuel avec Playwright MCP
```

### Étape 4: Créer PR vers main

```bash
gh pr create --title "feat: consolidation janvier 2026" --body "..."
```

### Étape 5: Nettoyage des branches obsolètes

Branches à GARDER:
- `main`
- `integration/2026-01-consolidation` (temporaire jusqu'au merge)

Branches à SUPPRIMER (après merge réussi):
- Toutes les branches `chore/*`, `fix/*`, `hotfix/*`, `docs/*`, `rollback/*`, `backup/*` de janvier
- Les 3 branches features après merge

---

## Meilleures Pratiques (Pour Ne Plus Revivre Ça)

### Règle 1: UNE seule branche de développement active

```
main (production)
  └── feat/current-sprint (tout le développement)
        └── feat/specific-feature (si besoin, courte durée)
```

**JAMAIS** créer une nouvelle branche sans avoir mergé la précédente.

### Règle 2: Merge fréquent vers main

- Merge minimum 1x par semaine
- Dès qu'une feature est testée → PR → merge
- Ne pas attendre d'avoir "fini" pour merger

### Règle 3: Pas de branches parallèles longue durée

Si une branche a plus de 5 jours → la merger ou l'abandonner.

### Règle 4: Nommage clair

```
feat/TICKET-description   # Feature
fix/TICKET-description    # Bug fix
hotfix/description        # Urgence production
```

### Règle 5: Avant de créer une branche

1. Vérifier que main est à jour
2. Vérifier qu'il n'y a pas de branche active non mergée
3. Se baser toujours sur main (ou la branche d'intégration)

---

## Workflow Recommandé Post-Consolidation

```
1. Développement sur feat/current-sprint
2. Tests locaux passent
3. git push
4. PR vers main
5. Review (auto ou manuel)
6. Merge
7. Supprimer la branche feature
8. Créer nouvelle branche pour prochaine feature
```

---

## Actions Immédiates

1. [ ] Créer `integration/2026-01-consolidation` depuis main
2. [ ] Merger `feat/BO-DASH-CLEANUP-remove-old-dashboard`
3. [ ] Résoudre conflits si nécessaire
4. [ ] Merger `feat/BO-FIN-invoice-workflow-3-statuses`
5. [ ] Résoudre conflits si nécessaire
6. [ ] Merger `feat/LINKME-MARKETING-real-data`
7. [ ] Résoudre conflits si nécessaire
8. [ ] `pnpm type-check && pnpm build`
9. [ ] Test visuel (sidebars visibles, dashboard OK)
10. [ ] Créer PR vers main
11. [ ] Après merge PR: supprimer les 3 branches features
12. [ ] Nettoyer toutes les branches obsolètes

---

## Vérification Finale

- [ ] Dashboard accessible avec sidebars
- [ ] Navigation LinkMe fonctionnelle
- [ ] Pas d'erreurs TypeScript
- [ ] Build réussi
- [ ] Seulement 2-3 branches restantes (main + intégration)
