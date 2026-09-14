# S1 — Fonctions exposées au rôle public (`anon`) — étape 1 (lecture seule) + proposition

Date : 2026-09-11. Base `aorroydfjsrygmosnzrl` (vérifiée par `get_project_url`). Lecture seule : SELECT sur
`pg_proc`, `pg_default_acl`, `pg_trigger`, `pg_policy`, `pg_stat_statements`, `cron.job`,
`supabase_migrations.schema_migrations` + recherche dans le code. **Aucun GRANT/REVOKE exécuté.**
Référence : OWASP API5:2023 Broken Function Level Authorization.

---

## 1. Constat principal — pourquoi le compteur ne baisse jamais

- **332** fonctions `SECURITY DEFINER` de `public` exécutables par `anon` (327 noms), dont 108 fonctions de trigger ;
  **571 / 574** fonctions de `public` exécutables par `anon`.
- **330 des 332** tiennent ce droit via **`PUBLIC`** (`=X/postgres` dans `proacl`), pas via un droit `anon`.
  La révocation de masse `supabase/migrations/20260430_sec_sdf_funcs_006_revoke_execute_mass_with_whitelist.sql`
  a fait `REVOKE … FROM anon, authenticated` **sans `FROM PUBLIC`** ⇒ sans effet réel pour `anon`.
  **Toute correction doit révoquer `PUBLIC`**, puis rendre le droit à `authenticated` / `service_role` si besoin.
- **Privilèges par défaut** (`pg_default_acl`, schéma `public`, propriétaires `postgres` et `supabase_admin`) :
  fonctions `{anon=X, authenticated=X, service_role=X}`, tables `anon=arwdDxtm`, séquences `anon=rwU`. Plus le
  `EXECUTE TO PUBLIC` implicite de Postgres. ⇒ **chaque nouvelle fonction naît exposée à `anon`.**
- **Écart dépôt / base** : la migration `20260731075651 bo_audit_003_guard_reset_finance_auto_data` est inscrite en
  base mais **aucun fichier local** ne lui correspond.

## 2. Réévaluation de `reset_finance_auto_data`

Contrairement aux audits précédents, elle est **déjà protégée** : garde `[BO-AUDIT-003]` en tête de fonction
(lève 42501 si `auth.uid()` absent ou si l'utilisateur n'est pas owner/admin back-office actif). Un appel `anon`
est refusé avant toute lecture. Le droit `EXECUTE` reste à retirer pour `PUBLIC`/`anon` (défense en profondeur).
Appelée par `apps/back-office/src/app/(protected)/finance/admin/reset/page.tsx:62,112`.

## 3. Les fonctions réellement dangereuses aujourd'hui (vérifiées une par une)

Exécutables sans connexion, **sans aucune garde de rôle** dans leur corps :

| Fonction                                                              | Effet                                                                                          | Droits actuels                          | Appelants                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `delete_organisation_safe(uuid)`                                      | supprime / délie des organisations et désactive des règles de rapprochement                    | PUBLIC + anon explicite + authenticated | `packages/@verone/organisations/src/hooks/use-organisations-crud.ts:353` ; SQL : `cleanup_auto_suppliers`   |
| `mark_payment_received(uuid,numeric,uuid,text,text,text,timestamptz)` | enregistre un paiement sur une commande client                                                 | PUBLIC + anon explicite + authenticated | `packages/@verone/orders/src/hooks/use-sales-orders-payments.ts:51,95`                                      |
| `mark_po_payment_received(…)` ×2                                      | enregistre un paiement sur une commande fournisseur                                            | PUBLIC + anon explicite + authenticated | `packages/@verone/orders/src/hooks/purchase-orders/purchase-order-mutations.ts:265`                         |
| `invoke_edge_function(text)`                                          | appelle une Edge Function **avec la clé service lue dans le coffre**                           | PUBLIC + anon + authenticated           | cron `run-scheduled-publications-every-5min`, `sync-meta-image-insights-daily` (rôle postgres) ; aucun code |
| `set_closed_fiscal_year(integer)`                                     | clôture l'exercice comptable                                                                   | PUBLIC                                  | aucun                                                                                                       |
| `reset_po_sequence_to_max()` / `reset_so_sequence_to_max()`           | modifie les séquences de numérotation                                                          | PUBLIC                                  | aucun                                                                                                       |
| `resync_all_product_stocks()`                                         | **réécrit `products.stock_real` et `stock_quantity`** de tous les produits (`UPDATE products`) | PUBLIC                                  | aucun                                                                                                       |
| `cleanup_auto_suppliers(boolean)`                                     | supprime des fournisseurs auto-créés                                                           | PUBLIC                                  | aucun                                                                                                       |
| `test_custom_access_token_hook(uuid)`                                 | renvoie l'e-mail de n'importe quel compte (fuite)                                              | PUBLIC                                  | aucun                                                                                                       |
| `debug_auth_uid()`                                                    | outil de débogage                                                                              | PUBLIC                                  | aucun                                                                                                       |

Protégées par une garde interne (pas urgentes) : `reset_finance_auto_data`, `approve_affiliate_product`,
`get_linkme_users_emails` (filtre `is_backoffice_user()`).

À surveiller (nécessaire au formulaire public LinkMe, pas de garde de rôle) : `create_affiliate_order`,
`create_public_linkme_order`.

## 4. Classement complet des 332

| Famille                                                       | Signatures                        | Règle proposée                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| F1 fonctions de trigger                                       | 108 (96 attachées, 12 orphelines) | retirer à `PUBLIC`, `anon`, `authenticated` ; un trigger ne vérifie pas `EXECUTE` au déclenchement (à démontrer sur une copie avant) |
| F2 appelées par `anon` (pages publiques ou règles RLS)        | 19                                | **ne rien retirer**                                                                                                                  |
| F3 appelées par `authenticated` / `service_role` / en interne | 126                               | retirer à `PUBLIC`, `anon` ; garder `authenticated`, `service_role`                                                                  |
| F4 aucun appelant trouvé                                      | 79                                | retirer à `PUBLIC`, `anon`, `authenticated`                                                                                          |

**F2 à conserver pour `anon`** (sinon une page publique casse) : `get_site_internet_products` (site : accueil,
catalogue, fiche, collections, favoris, plan du site) · `increment_article_view` (journal) · `get_public_selection` ×2 et
`get_public_selection_by_slug` (LinkMe `/s/[id]`) · `track_selection_view` · `get_product_detail_public` ·
`create_public_linkme_order` · `create_affiliate_order` · `is_backoffice_user`, `is_customer_user`,
`is_enseigne_admin_for`, `user_has_access_to_organisation`, `get_user_organisation_id` (appelées par des règles RLS
visibles du public) · `get_activity_stats`, `get_pending_approvals_count`, `get_categories_with_real_counts`,
`check_linkme_access_by_email`, `get_linkme_public_stats` (appels anon résiduels, sans page publique : à basculer en
F3 dans un second temps).

**F1 orphelines (12)** : auto_validate_alerts_on_order_confirmed, handle_new_customer_signup,
handle_purchase_order_validation, manage_purchase_order_stock, reactivate_alert_on_order_cancelled,
revalidate_alerts_on_reception, rollback_po_forecasted, sync_user_metadata_to_jwt,
trg_purchase_orders_stock_automation, trigger_error_report_notification, trigger_update_section_metrics,
update_so_forecasted_out. ⚠️ Plusieurs portent des noms de la règle `stock-triggers-protected.md` : on ne retire que
le droit d'exécution, on ne les modifie ni ne les supprime.

**F4 (78 noms)** : liste intégrale dans le compte rendu d'analyse ; noms sensibles repris au § 3. `pg_stat_statements`
a été remis à zéro le 2025-09-05 et a subi 131 évictions : « aucun appel » est une preuve faible, d'où la
vérification systématique dans le code.

**Nouvelles depuis la baseline 315 (17)** — toutes créées le 2026-05-08 ou après : `get_site_internet_collections`,
`get_channel_stats_aggregated`, `get_channel_stats_history`, `snapshot_channel_stats`, `get_site_top_products`,
`get_media_asset_analytics_summary`, `get_top_images`, `get_ai_usage_by_endpoint`, `get_ai_usage_stats`,
`get_scheduled_publications_calendar`, `get_pinterest_pin_products`, `get_pinterest_pin_stats`,
**`invoke_edge_function`** (`20260510201400_bo_mkt_pub_auto_001_cron_jobs.sql`), `increment_article_view`,
`get_affiliate_partner_organisation_id`, `tg_linkme_create_expense_on_invoice_received`,
`link_linkme_payment_to_bank_transaction`. (La baseline ne stocke que des compteurs : la comparaison se fait sur
la date du premier `CREATE FUNCTION` local.)

---

## 5. Proposition — étape 2, en lots (SQL montré, **non appliqué**)

### Lot 1 — urgent, chirurgical (les 12 signatures du § 3)

```sql
-- Aucun appelant applicatif : réservées à postgres / service_role (et au cron pour invoke_edge_function)
REVOKE EXECUTE ON FUNCTION public.invoke_edge_function(text)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_closed_fiscal_year(integer)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_po_sequence_to_max()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_so_sequence_to_max()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resync_all_product_stocks()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_auto_suppliers(boolean)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.test_custom_access_token_hook(uuid)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_auth_uid()                       FROM PUBLIC, anon, authenticated;

-- Appelées par le back-office connecté : on ferme PUBLIC et anon, on garde authenticated
REVOKE EXECUTE ON FUNCTION public.delete_organisation_safe(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_finance_auto_data(boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_organisation_safe(uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.mark_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.reset_finance_auto_data(boolean) TO authenticated, service_role;
```

- **Ce qui casserait si on se trompe** : le cron des publications programmées et des statistiques Meta si
  `invoke_edge_function` était appelé par un autre rôle que `postgres` (vérifié : rôle postgres, 35 685 exécutions) ;
  rien d'autre (aucun appelant applicatif pour les 8 premières ; les 5 suivantes gardent `authenticated`).
- **Retour arrière** : `GRANT EXECUTE ON FUNCTION … TO PUBLIC;` fonction par fonction (liste écrite dans la migration).
- **Vérification après** : `has_function_privilege('anon', oid, 'EXECUTE')` = false sur les 12 ; cron du prochain
  créneau de 5 min exécuté ; enregistrement d'un paiement testé à l'écran en lecture seule (ouverture du formulaire,
  sans valider) ; compteur advisors.
- **Limite restante** : un compte LinkMe (`authenticated`) peut encore appeler `delete_organisation_safe` et
  `mark_payment_received` ⇒ **lot 2**.

### Lot 2 — garde de rôle dans le corps des 3 fonctions de paiement / suppression

> **APPLIQUÉ le 2026-09-11 soir** (accord écrit Roméo) — garde owner/admin (pas seulement « utilisateur back-office »,
> décision Roméo). Carnet `20260911230000 bo_audit_sec_s1_lot2_role_guard`, fichier
> `supabase/migrations/20260911230000_bo_audit_sec_s1_lot2_role_guard.sql`. Tests (claims simulés, aucune écriture) :
> sans identité 42501, affilié LinkMe 42501 (paiement + suppression), catalog_manager 42501, owner passe la garde.
> Ajouter en tête de `delete_organisation_safe`, `mark_payment_received`, `mark_po_payment_received` ×2 le même contrôle
> que `reset_finance_auto_data` (utilisateur back-office actif, sinon 42501). Modification de fonction ⇒ SQL complet
> montré, types régénérés, accord écrit.

### Lot 3 — F4 (79 signatures) : `REVOKE … FROM PUBLIC, anon, authenticated`, script généré depuis la liste figée.

> **APPLIQUÉ le 2026-09-12** (accord écrit Roméo) sur **72** signatures recalculées le jour même (aucun appel code hors
> copies de types, aucune fonction SQL appelante, règle RLS, vue, défaut, contrainte, cron, ni appel anon/authenticated
> dans `pg_stat_statements` ; aides à nom dynamique stockage/Meta vérifiées). `GRANT … TO service_role` conservé.
> Carnet `20260912000000`, fichier `supabase/migrations/20260912000000_bo_audit_sec_s1_lot3_revoke_unused_definer_functions.sql`.
> Compteurs : anon 319 → 247, authenticated 324 → 252. HTTP sans connexion : `get_dashboard_metrics` 401/42501 ;
> `get_linkme_public_stats` et `get_site_internet_products` 200.

### Lot 4 — F3 (126) : `REVOKE … FROM PUBLIC, anon` + `GRANT … TO authenticated, service_role`.

> **APPLIQUÉ le 2026-09-12** (accord écrit Roméo) sur **120** signatures = SD hors triggers encore exécutables par anon
> après le lot 3, moins les 18 noms F2. Vérifié avant : 0 appel anon en `pg_stat_statements`, 0 règle RLS visant
> anon/PUBLIC, 0 appelant SECURITY INVOKER, site = clé serveur, outils LinkMe concernés seulement dans l'espace connecté.
> Carnet `20260912010000`. Compteurs : anon 247 → 127 (19 hors triggers restants = F2), authenticated 252.
> Après : HTTP anon 401/42501 sur fonctions fermées ; F2 200 ; sites 200 ; salarié connecté OK.
> **Lot 5 APPLIQUÉ le 2026-09-12** (accord écrit Roméo, automatismes de stock compris). Démonstration préalable
> « essai temporaire » (bloc annulé par exception, 0 objet restant) : EXECUTE retiré ⇒ déclencheurs definer et invoker
> exécutés en rôles authenticated et anon. 108 signatures, carnet `20260912020000`. Compteurs : anon 127 → 19 (F2),
> authenticated 252 → 144. 246 déclencheurs / 243 actifs, empreinte identique avant/après.

### Lot 5 — F1 (108) : démonstration sur copie (branche Supabase ou base locale) qu'un trigger se déclenche encore,

puis `REVOKE … FROM PUBLIC, anon, authenticated`.

### Lot 6 — garde-fou permanent

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
```

(+ `FOR ROLE supabase_admin` si le rôle de migration le permet — à vérifier, peut être refusé.) Plus un contrôle CI
qui échoue si une fonction `SECURITY DEFINER` hors liste F2 devient exécutable par `anon`, et mise à jour de
`scripts/supabase-advisors-baseline.json` au nouveau compteur (jamais relevé à la hausse).

### Hors lot, à régulariser dans la même PR

Fichier local manquant pour `20260731075651 bo_audit_003_guard_reset_finance_auto_data` (reconstruit depuis
`pg_get_functiondef`, sans le rejouer).

---

## 6. Ce qui attend l'accord écrit de Roméo

1. **Lot 1** (12 signatures, § 5) — recommandé immédiatement.
2. Lots 2 à 6 ensuite, un par un, chacun montré avant.
