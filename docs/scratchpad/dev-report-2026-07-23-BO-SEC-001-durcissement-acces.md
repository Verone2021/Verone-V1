# Dev report — BO-SEC-001 — Durcissement des accès (advisor sécurité)

Date : 2026-07-23
Branche : `fix/BO-SEC-001-durcissement-acces`
Contexte : audit advisor sécurité Supabase (685 lints ; 664 = bruit `security_definer_function_executable` par conception). Décision Roméo : « corriger le sûr, documenter le reste ».

## Appliqué (via mcp**supabase**execute_sql, prod ; migration file de trace)

3 `DROP POLICY` (fichier `supabase/migrations/20260723211445_bo_sec_001_durcissement_acces.sql`) :

1. `public.collection_images` — `collection_images_delete_authenticated` (DELETE, authenticated, USING=true) → **supprimée**.
2. `public.collection_images` — `collection_images_update_authenticated` (UPDATE, authenticated, USING/WITH CHECK=true) → **supprimée**.
   - Redondantes : `backoffice_full_access_collection_images` (ALL, `is_backoffice_user()`) couvre déjà les écritures. Audit call-sites : écritures uniquement via `@verone/collections` `use-collection-images.ts` → consommé par `CollectionImageUpload.tsx` (pages back-office `produits/catalogue/collections`). Site-internet = lecture seule. Aucun chemin non-back-office impacté.
   - `collection_images_select_authenticated` (SELECT) **conservée** (lecture non signalée).
3. `storage.objects` — `Allow public read of organisation-logos` (SELECT, public, bucket=organisation-logos) → **supprimée** (listage public). Bucket `public=true` confirmé → accès aux logos par URL directe inchangé.

Vérif : `pg_policies` post-op → 3 policies absentes, policies légitimes présentes.

## NON traité — décision Roméo requise

- **`auth_leaked_password_protection`** : réglage tableau de bord (Attack Protection → provider Email). Constat via navigateur : **« Only available on Pro plan and above »**, org sur plan **Free**. → **Impossible sur le plan actuel**. Décision business/financier (passage plan payant) réservée à Roméo. Rien modifié.

## Laissé en place PAR CONCEPTION (6 règles `rls_policy_always_true` en écriture système)

À NE PAS durcir (écritures via triggers `SECURITY DEFINER` / service role) :
`audit_logs` (audit_logs_system_insert), `individual_customers` (individual_customers_insert_self), `notifications` (notifications_insert_system), **`stock_movements` (system_triggers_can_insert_stock_movements) — PROTÉGÉ, cf. stock-triggers-protected.md**, `user_activity_logs` (service_insert_activity), `user_sessions` (service_manage_sessions).

## Autres signaux advisor (non traités, informatif)

- 4 `security_definer_view` ERROR : `linkme_public_products`, `v_transactions_unified`, `v_library_documents`, `v_library_missing_documents`.
- 7 `function_search_path_mutable` WARN (triggers updated_at / articles).
  → À planifier séparément si souhaité (non urgent, majoritairement par conception).
