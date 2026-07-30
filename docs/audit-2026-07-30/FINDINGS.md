# Findings — audit du 2026-07-30

Liste brute des défauts constatés, chacun vérifié par lecture du code ou mesure en base. Aucun finding déduit ou supposé.

**Groupés par lot de correction** (voir `PLAN-CORRECTION.md`). Format :

> **[SÉVÉRITÉ] Titre** — `fichier:ligne` — ce qui se passe → correctif

Sévérités : `CRITIQUE` = perte de données, faille exploitable ou fonctionnalité totalement inopérante · `MAJEUR` = comportement faux ou inutilisable · `MINEUR` = dette, piège armé, incohérence.

---

## Lot 0 — Hémostase

**[INCIDENT] Secrets de production exposés publiquement dans l'historique git depuis le 2026-01-15**

Le repo `https://github.com/Verone2021/Verone-V1.git` est **PUBLIC** (`gh repo view` → `"visibility":"PUBLIC"`, `"isPrivate":false`).

Trois fichiers de sauvegarde d'environnement ont été **committés** le 2026-01-15 (commit `170aecf0`, PR #37, 419 lignes au total) puis supprimés le 2026-01-20 (commit `b07283b7`, PR #82) — dont le message de commit indique lui-même « _Remove 3 .env.local.backup files (GitHub PAT + Supabase service_role keys)_ » :

```
apps/back-office/.env.local.backup-20260114-065620    156 lignes
apps/linkme/.env.local.backup-20260114-065620         136 lignes
apps/site-internet/.env.local.backup-20260114-234029  127 lignes
```

**La suppression ne retire rien de l'historique.** Les blobs restent accessibles publiquement (`git log -p`, `git cat-file`) depuis six mois, sur 1 566 commits. Les scanners de secrets automatisés indexent ce genre de contenu en minutes.

**Cause technique** : le `.gitignore` racine **existe** et couvre bien `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local` (lignes 26-30) — vérifié, `git check-ignore apps/back-office/.env.local` passe. Mais aucun de ces motifs ne correspond à `.env.local.backup-20260114-065620`. Un motif exact au lieu d'un glob.

**Variables présentes dans les trois fichiers** (noms uniquement) : `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `DATABASE_URL`, `QONTO_API_KEY`, `QONTO_WEBHOOK_SECRET`, `QONTO_ORGANIZATION_ID`, `PACKLINK_API_KEY`, `RESEND_API_KEY`, `GH_TOKEN`, `VERCEL_TOKEN`, `VERCEL_DEPLOY_HOOK_URL`, `VERCEL_PROJECT_ID`, `GOOGLE_MERCHANT_PRIVATE_KEY`, `GOOGLE_MERCHANT_PRIVATE_KEY_ID`, `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `ABBY_API_KEY`, `ABBY_WEBHOOK_SECRET`, `CRON_SECRET`, `REF_API_KEY`.

**Aggravation croisée** : un repo public **plus** 86 routes API sans authentification (Lot 1) signifie que l'absence de `getUser()` dans `api/qonto/balance/route.ts` était lisible par n'importe qui. Le code public servait de mode d'emploi.

**Actions, dans cet ordre :**

1. Passer le repo en privé (GitHub → Settings → Danger Zone → Change visibility). Immédiat, gratuit.
2. **Rotation de toutes les variables listées ci-dessus.** Priorité : `SUPABASE_SERVICE_ROLE_KEY` (accès total à la base, RLS contournée), `QONTO_API_KEY` (accès bancaire), `GH_TOKEN` (accès aux repos), `VERCEL_TOKEN`.
3. Revue des accès : logs Supabase, historique de connexions Qonto, audit log et sessions GitHub. Chercher toute origine inhabituelle depuis le 2026-01-15.
4. Purge de l'historique (`git filter-repo` ou BFG) **après** la rotation, jamais à la place. Un fork ou un cache GitHub peut conserver les blobs indéfiniment : la rotation est la seule mesure qui neutralise réellement.
5. Élargir le `.gitignore` racine : remplacer les motifs exacts par `.env*` avec `!.env.example`, et ajouter `*.backup`, `*.bak`, `.env.local.*`.
6. **Gate** : `gitleaks` (ou `git-secrets`) en pre-commit **et** en CI bloquant. Le `pre-push` actuel est un `exit 0` — c'est l'endroit prévu pour ça (« Le pre-push reste pour permettre l'ajout de hooks futurs (ex: scan secrets) », `.husky/pre-push`).

**[INCIDENT — 2ᵉ fuite, celle-ci ACTIVE] Le PAT Supabase de `.mcp.json` est dans l'historique public et toujours valide**

`.mcp.json` est correctement ignoré aujourd'hui (`.gitignore:33`, non tracké dans HEAD), mais il a été committé dans **6 commits** de l'historique (`c5639550`, `c2352fe3`, `f3f6d41f`, `ebdb136b`, `175189d7`, `c11af897`), et **le token `sbp_…` qui y figure est exactement celui encore en service aujourd'hui** (vérifié par comparaison).

Ce token est un **Personal Access Token de management Supabase**, pas une clé de projet. Sa portée est le compte entier : lister tous les projets, lire leurs clés API, exécuter du SQL arbitraire, créer et supprimer des branches. Il couvre donc aussi les futurs projets « back-office Affect » et « back-office Want It Now ».

→ **Révoquer et régénérer immédiatement** : Supabase Dashboard → Account → Access Tokens. Aucune coupure de service, aucun redéploiement. C'est la seule action de tout cet audit qui coûte un clic et referme un accès total.
→ Puis sortir les secrets de `.mcp.json` : `"Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"` et `"X-Goog-Api-Key": "${STITCH_API_KEY}"`, valeurs dans `.mcp.env` (déjà gitignoré, `.gitignore:34`).

Le token Google Stitch actuellement dans `.mcp.json` n'est **pas** dans l'historique (vérifié) — pas d'urgence, mais à externaliser aussi.

**[NON — deux faux positifs écartés, ne pas y passer de temps]**

- `chrome-extension/popup.html` et `docs/restored/google-merchant-2025-11/google-merchant-setup.md` contiennent un JWT Supabase, mais son payload décodé donne `role: anon`. La clé `anon` est **publique par conception** (elle vit dans le bundle JS de toute app Supabase) ; ce qui protège les données est la RLS, pas son secret. Aucune `service_role` n'existe dans les fichiers trackés (vérifié sur l'ensemble de `git ls-files`).
- La `GOOGLE_MERCHANT_PRIVATE_KEY` du même fichier `.md` est un placeholder de documentation (`MIIEvQIBADANBgkq…` suivi de « ... (votre clé privée complète) ... »).

**[IMPORTANT — contrainte technique sur la rotation Supabase]** Le projet `aorroydfjsrygmosnzrl` est encore en **système de clés legacy** (`get_publishable_keys` → une seule clé, `"type":"legacy"`). Conséquence : `anon` et `service_role` sont deux JWT signés par le même JWT secret du projet, et la rotation directe d'une clé legacy **n'est plus proposée** par Supabase. Régénérer le JWT secret invaliderait les deux clés d'un coup et couperait toutes les connexions jusqu'au redéploiement des 3 apps. → La voie sans coupure est de **migrer vers les nouvelles clés** (`sb_publishable_…` / `sb_secret_…`, Dashboard → Settings → API Keys), qui se révoquent indépendamment, puis de désactiver la `service_role` legacy. À planifier comme une tâche à part entière du Lot 0, pas comme un clic., `api/qonto/transactions/route.ts:27`, `api/qonto/clients/route.ts:55` — aucun `getUser()`, aucun secret dans les trois fichiers. `curl 'https://<bo>/api/qonto/transactions?perPage=100'` sans cookie renvoie les transactions bancaires ; `/balance` renvoie soldes, IBAN masqués et comptes. → `requireBackofficeAdmin(request)` en tête des trois handlers. Retirer `qonto/debug`, `qonto/debug-counts`, `qonto/test-connection`, `qonto/health` du build de production.

**[CRITIQUE] RPC destructive exécutable par `anon`** — whitelist `supabase/migrations/20260430_sec_sdf_funcs_006_revoke_execute_mass_with_whitelist.sql:126` puis `GRANT ... TO authenticated, anon` ligne 153 ; corps `20251228_011_rpc_reset_finance_auto_data.sql:10-93` — `reset_finance_auto_data(p_dry_run boolean)` est `SECURITY DEFINER` sans aucun contrôle interne. Avec la clé anon (publique, présente dans le bundle JS de LinkMe et du site) : `DELETE FROM organisations`, `UPDATE matching_rules SET is_active = false`. → `REVOKE EXECUTE ... FROM anon, authenticated` + `IF NOT public.is_backoffice_user() THEN RAISE EXCEPTION 'forbidden'; END IF;` en tête du corps.

---

## Lot 1 — Le mur (middleware API)

**[CRITIQUE] Aucun middleware, 86 routes sur 151 sans contrôle d'accès** — absence de `apps/back-office/src/middleware.ts` (vérifié : seul `apps/site-internet/src/lib/supabase/middleware.ts` existe) ; la seule garde de rôle est `apps/back-office/src/app/(protected)/layout.tsx:29-42`, qui ne couvre pas `src/app/api`, son frère dans l'arbre. Métriques : 59 routes (39 %) avec une vérification d'auth quelconque, 14 (9,3 %) avec vérification de rôle, **86 (57 %) sans rien**, dont **62 mutations sur 115**. → middleware `matcher: ['/api/:path*']`, 401 par défaut, allow-list courte.

**[CRITIQUE] Relais mail ouvert** — `api/emails/form-reply/route.ts:70` (interpolation HTML brute de `replyMessage`), `:128` (`request.json()` casté sans Zod), `:183-186` (`from: Vérone <contact@veronecollections.fr>`) ; `api/emails/send-document/route.ts:93` (service role, zéro auth) — sur 18 routes `api/emails/*`, seules `send-shipping-tracking` et `preview-shipping-tracking` appellent `auth.getUser()`. Un POST anonyme envoie un HTML arbitraire depuis le domaine vérifié Resend, SPF/DKIM valides. → `requireBackofficeAdmin` sur les 15 routes ; utiliser le `escapeHtml()` déjà présent dans `send-document/route.ts:75` ; restreindre `to` aux e-mails en base pour la soumission référencée.

**[CRITIQUE] Exfiltration de facture vers une adresse arbitraire** — `api/qonto/invoices/[id]/send/route.ts:30,48,66` — pas de Zod, pas de `getUser()`, `emails` vient du body et part chez Qonto. Les UUID sont énumérables via `GET /api/qonto/invoices`, également ouvert. → auth + `z.object({ emails: z.array(z.string().email()).max(5).optional() })` + vérifier que chaque destinataire correspond au client de la facture.

**[CRITIQUE] Webhook Packlink fail-open** — `api/webhooks/packlink/route.ts:24-33` — `if (webhookSecret) { ... }` et `PACKLINK_WEBHOOK_SECRET` est absent de `.env.local` : la branche est morte. Un POST anonyme avec `{"event":"shipment.carrier.success"}` passe `packlink_status` à `paye`, ce qui **déclenche le trigger `confirm_packlink_shipment_stock()`** et décrémente le stock réel ; `{"event":"shipment.delivered"}` (`:259-291`) passe les commandes en `delivered`. → secret obligatoire (`if (!secret) return 500`), comparaison `crypto.timingSafeEqual`, validation HMAC sur le corps brut si Packlink en fournit.

**[MAJEUR] Deux crons fail-open** — `api/cron/sync-comptabilite/route.ts:42-51`, `api/cron/meta-commerce-sync/route.ts:37-46` — `if (cronSecret) { ... }` avec `CRON_SECRET` absent de `.env.local`. Déclenchement à volonté de la synchro Qonto complète et du téléchargement de toutes les pièces jointes bancaires en service role. Le bon motif fail-closed existe dans `api/cron/google-merchant-poll/route.ts:72-78`. → aligner sur ce motif.

**[MAJEUR] Cookie partagé entre les 3 apps + 45 routes qui ne vérifient que `getUser()`** — `packages/@verone/utils/src/supabase/server.ts:6-8` et `:39` (« Toutes les apps utilisent le cookie par défaut `sb-{PROJECT_ID}-auth-token` ») — routes concernées : `api/exports/products/route.ts:10`, `api/finance/export-fec/route.ts:86`, `api/finance/export-justificatifs/route.ts:253`, `api/finance/send-to-accountant/route.ts:183`, `api/sales-orders/[id]/cancel/route.ts:184`, `api/organisations/[id]/shipping-address/route.ts:36`, `api/ambassadors/create-auth/route.ts:38`, `api/qonto/invoices/[id]/finalize`, `api/qonto/invoices/consolidate`, `api/qonto/quotes/[id]/accept`, `api/qonto/quotes/[id]/convert`. Un affilié LinkMe légitime pose son cookie sur le domaine du back-office et obtient un Excel avec `cost_price` et marges (`api/exports/products/route.ts:32,238-240`), ou crée un compte `auth.users` via service role. → `requireBackofficeAdmin` partout ; vérifier `user_app_roles.app='back-office'`, pas seulement `getUser()`.

**[MAJEUR] PII clients par UUID de commande, sans auth** — `api/sales-orders/[id]/customer-address/route.ts:16,30-43` — `createAdminClient()` (RLS contournée), pas de validation d'UUID, pas d'auth. Renvoie `name, surname, email, phone, street1, city, zip_code, country, company`. Violation RGPD directe. → auth + `z.string().uuid().parse(id)` + `createServerClient()` au lieu du client admin, en défense en profondeur.

**[MAJEUR] Export catalogue complet sans auth** — `api/exports/google-merchant-excel/route.ts:178-207`, `:14`, `:57` — seule « garde » : le feature flag `NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED`, public par définition. `select('*')` sur `products` en service role = 99 colonnes dont tous les coûts. Filtres non validés, `parseInt` sans borne (`limit` → `NaN` possible). → auth sur GET et POST (`:357`), colonnes explicites, Zod avec `limit: z.coerce.number().int().min(1).max(5000)`.

**[MAJEUR] 62 routes de mutation sans authentification** — liste vérifiée : `qonto/invoices/[id]/delete/route.ts:24`, `qonto/invoices/[id]/cancel`, `mark-paid`, `reconcile`, `convert-to-quote`, `qonto/invoices/route.ts` (POST), `qonto/quotes/route.ts` (POST), `qonto/quotes/[id]/route.ts` (PATCH, DELETE), `qonto/quotes/[id]/decline`, `qonto/credit-notes/[id]/route.ts` (PATCH, DELETE), `quotes/[id]/finalize`, `quotes/[id]/push-to-qonto`, `stock-movements/[id]/route.ts` (DELETE), `meta-commerce/products/[id]/route.ts` (DELETE), `google-merchant/products/[id]/route.ts` (DELETE), `packlink/shipment/route.ts:56` (POST — crée des expéditions réelles facturées), `packlink/shipment/[ref]/route.ts` (DELETE), `transactions/update-vat`, `channel-pricing/upsert`, `expenses/classify`. → couvertes par le middleware ; motif correct à copier : `api/linkme/users/hard-delete/route.ts:24-27`.

**[MINEUR] Route `/api/logs` ouverte en lecture et écriture** — `api/logs/route.ts:23-25`, `:98-113` — le GET renvoie à un anonyme tous les logs d'erreurs console du jour (chemins internes, messages Supabase) ; le POST écrit sur le disque d'une fonction serverless, sans borne de taille. → supprimer la route, Sentry la remplace (Lot 3).

**[MINEUR] Token accepté en paramètre d'URL sur le webhook Gmail** — `api/gmail/inbound/route.ts:188-195` — `queryToken = searchParams.get('token')`. Les URL complètes sont journalisées par Vercel, les proxies et Sentry. Comparaison `!==` non constante en temps. Le reste de la route est correct (fail-closed `:180-186`). → supprimer la lecture en query, `crypto.timingSafeEqual`.

**[MINEUR] Le middleware de sécurité maison n'est branché que sur 1 route sur 151** — `packages/@verone/utils/src/middleware/api-security.ts:26,108,113-121` ; unique consommateur `api/catalogue/products/route.ts:12,327` — en-têtes de sécurité, CORS et rate limiting ne s'appliquent qu'à une route. Le `Map` en mémoire (`:26`) est inopérant en serverless (un compteur par instance) et le `setInterval` au niveau module est incompatible Edge. → brancher les en-têtes de `src/lib/security/headers.ts` dans le middleware global, rate limiting via Upstash ou `@vercel/firewall`.

---

## Lot 2 — Gates CI

**[CRITIQUE] Les 3 jobs E2E sont désactivés en dur** — `.github/workflows/quality.yml:283` (`smoke-domaine`), `:327` (`smoke-golden`), `:552` (`e2e-full`) — tous préfixés `if: false &&`. Ils ne sont pas seulement non-bloquants : ils ne tournent pas. Combiné à l'auto-merge par défaut (ADR-032), les seuls garde-fous du merge sont ESLint, `tsc` et `next build`. L'ADR-016 note « 30+ régressions concrètes en production alors que la CI était verte ». → retirer les `if: false`, fiabiliser `smoke-golden`, retirer son `continue-on-error`, l'ajouter aux checks requis, conditionner l'auto-merge.

**[CRITIQUE] La baseline advisors valide l'état vulnérable** — `scripts/supabase-advisors-baseline.json` — accepte comme normal : `anon_security_definer_function_executable` **315**, `authenticated_security_definer_function_executable` **315**, `rls_policy_always_true` **48**, `security_definer_view` **14**, `function_search_path_mutable` **24**, `auth_users_exposed` **1**, `public_bucket_allows_listing` **1**. Le job (`quality.yml:836-857`) est de plus en `continue-on-error: true`. → remettre à zéro sur les catégories `ERROR`, ne conserver en exception documentée que les 6 règles système `always-true` déclarées « par conception » dans `ACTIVE.md`, retirer le `continue-on-error`.

**[MAJEUR] `validate:types` et `check:console` existent et ne tournent nulle part** — `scripts/check-db-type-alignment.ts` (détecte colonnes inexistantes, enums hardcodés, types manuels), `scripts/check-console-errors.ts` — absents de `.github/workflows/`, absents de `.husky/pre-commit` et `pre-push` (ce dernier est un `exit 0`). Le premier aurait attrapé à lui seul les findings « colonne `status` inexistante », « `backorder` », « `TACTICAL`/`OPERATIONAL` ». → `pnpm validate:types` bloquant en CI.

**[MAJEUR] Le smoke annonce 147 pages, en liste 106, il en existe 168** — `tests/e2e/smoke/smoke-147-pages.spec.ts` (384 lignes) — 62 pages (37 %) hors filet. 16 des 35 fichiers de test n'assertent que « la page charge, pas de redirection `/login`, pas d'erreur console ». → régénérer la liste depuis `find apps/back-office/src/app -name page.tsx` en CI et échouer si elle diverge.

**[MAJEUR] `auth_users_exposed`** — advisor Supabase, présent dans la baseline — la table `auth.users` est exposée via une vue ou l'API. Non investigué en détail faute d'accès en écriture ; à traiter au Lot 2 en même temps que la purge de baseline. → identifier la vue fautive, la restreindre.

**[MINEUR] `public_bucket_allows_listing`** — advisor Supabase, dans la baseline — un bucket public permet de lister son contenu, donc d'énumérer tous les fichiers stockés. → passer le bucket en privé + URL signées, ou désactiver le listing.

---

## Lot 3 — Erreurs visibles

**[CRITIQUE] Sentry a un DSN et aucun code** — `NEXT_PUBLIC_SENTRY_DSN` présent dans `apps/back-office/.env.local`, **zéro fichier Sentry dans le back-office** (vérifié par grep). Aucune erreur de production n'est collectée. → `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, wrapper dans `next.config.js`, sur les 3 apps.

**[CRITIQUE] Motif « erreur avalée » : 33 occurrences de `const { data } = await supabase` sans lecture de `error`** — sur erreur RLS, colonne renommée ou réseau, `data` vaut `null`, le `if (data)` est sauté, et l'écran affiche son état vide. Une erreur devient indiscernable d'un résultat vide. Occurrences les plus nuisibles :

- `packages/@verone/organisations/src/components/sections/OrganisationProductsSection.tsx:59-68` — affiche « Aucun produit associé à X » avec un bouton de création. Pas de `.limit()` non plus.
- `packages/@verone/finance/src/components/RapprochementContent/useRapprochementFetchers.ts:99-111` — si la requête échoue, `linkedTxIds` reste vide et **toutes** les transactions déjà rapprochées sont proposées comme candidates.
- `packages/@verone/finance/src/components/RapprochementModal/use-rapprochement-data.ts:204-211` (+ `:155`, `:312`) — contient en prime un `console.warn('[RapprochementModal] sales_orders query result:')` de debug en production. Sur échec, l'onglet affiche « Aucune commande trouvée ».
- `apps/back-office/src/app/(protected)/marketing/bibliotheque/page.tsx:19-24`, `MarketingStudio.tsx:58-59`, `ManualGenerationModal.tsx:101-104` — filtres de marque vides sans trace.
- `apps/back-office/src/app/actions/bank-matching-helpers.ts:33-43` — `count` non vérifié dans la numérotation de facture.

→ helper unique `handleSupabaseError(error, contexte)` + règle ESLint avec ratchet. Modèle correct déjà présent dans le repo : `packages/@verone/marketing/src/components/MarketingStudio/PromptBuilder.tsx:60-65`.

**[CRITIQUE] Faux succès : `toast.success` affiché sur une écriture échouée**

- `packages/@verone/products/src/components/wizards/complete-product/useCompleteProductWizard.ts:206-222` — `createProduct` attrape l'erreur et retourne `null` (`use-products.ts:267-276`), le toast « Brouillon sauvegardé » est inconditionnel. Deux toasts contradictoires s'affichent. `:287` : `void saveDraft(false).catch(() => undefined)` efface l'échec à la navigation.
- `packages/@verone/products/src/hooks/utils/variant-group-propagation.ts:142-150,177-185,237-249` + `use-variant-group-crud.ts:119-138` — propagation d'un fournisseur ou prix commun à N variantes : `error` non lu, une requête par produit, puis `toast({ title: 'Succès' })`.
- `packages/@verone/products/src/hooks/sourcing/use-sourcing-create-update.ts:109-139` — toutes les photos peuvent échouer (`continue` ligne 128, catch avalé ligne 131), le toast dit « Produit en sourcing créé ».
- `packages/@verone/products/src/hooks/use-product-images.ts:296-311` et `packages/@verone/collections/src/hooks/use-collection-images.ts:306-312` — `Promise.all` sur des builders Supabase ne rejette jamais (ils résolvent avec `{ error }`) ; l'ordre revient en arrière au `fetchImages()` sans message.
- `packages/@verone/finance/src/components/RapprochementModal/use-rapprochement-actions.ts:309-327` — dérapprochement : `error` non lu sur le `select` ni sur l'`update`, toast de succès systématique. Si le `select` échoue, `remainingLinks` est `null` et la transaction est remise à `unmatched` alors que d'autres liens subsistent.
- `apps/back-office/src/app/api/qonto/attachments/auto-attach/route.ts:193-200` — renvoie `status: 200` avec `{ error, skipped: true }` sur échec réel ; le consommateur ne teste que `data.success` (`use-rapprochement-vat.ts:35`). Un échec d'upload est indistinguable d'un succès.

**[CRITIQUE] Échec d'enregistrement produit silencieux, sur le handler central de tous les onglets** — `apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/_components/hooks/use-product-detail.tsx:165-206` — update optimiste ligne 167, `console.error` ligne 178 comme seul retour, refetch explicitement `silent: true`. La nouvelle valeur s'affiche une seconde puis revient à l'ancienne, sans explication. → `toast` destructif dans la branche `if (updateError)` et dans le `catch` ligne 201.

**[MAJEUR] Création de fournisseur : sur échec, le bouton ne fait rien** — `packages/@verone/organisations/src/components/suppliers/QuickSupplierModal.tsx:68-90` — `createOrganisation` attrape l'erreur, appelle `setError` sur l'état interne de `useOrganisations` non lu par ce modal, et retourne `null`. Le `catch` n'est jamais atteint, le `if (newOrg)` est faux : le spinner tourne, s'arrête, la modale reste ouverte. Idem `SupplierFormModal.tsx:199-202` dont l'`alert()` ne dit pas la cause. → lire `error` du hook et l'afficher.

**[MAJEUR] `alert()` natif au lieu du système de toast** — `apps/back-office/src/app/(protected)/marketing/calendrier/page.tsx:137-141`, `packages/@verone/organisations/src/components/forms/SupplierFormModal.tsx:201` ; et `MediaAssetDetailModal.tsx:142,156,187` où l'objet d'erreur est jeté sans `console.error`. → `toast.error` + journalisation.

**[MINEUR] Trois systèmes de toast concurrents** — `useToast` maison 139 fichiers, `sonner` 82, `react-hot-toast` 18. → garder `sonner`, interdire les autres par lint.

**[MINEUR] Promesse flottante sans `.catch()`** — `packages/@verone/marketing/src/components/MediaLibrary/MediaLibraryView.tsx:140` (`void fetchPublicationCounts(...).then(...)`), et `api/emails/send-shipping-tracking/route.ts:155-174` (insert lancé juste avant le `return` d'une fonction serverless — l'exécution peut être gelée avant la fin). → `.catch()` explicite ; `await` avant le `return` côté serveur.

---

## Lot 4 — Performance

**[GAIN FORT] 216 policies RLS appellent `is_backoffice_user()` sans wrapper `(SELECT …)`** — état créé par `supabase/migrations/20260508060000_rollback_bo_rls_perf_002_003.sql:33-77` (rollback après incident) ; définition `20260121_003_optimize_rls_policies.sql:166-179` — mesure prod : `user_app_roles` (9 lignes) **255 941 505 seq_scan / 1 318 222 852 tuples lus** ; `user_profiles` (8 lignes) **32 893 282 scans**. `sales_orders` a 6 policies avec cet appel, `linkme_payment_requests` 7 : un SELECT de 180 commandes peut déclencher 1 080 exécutions. Planning time d'un simple `count(*)` : 5,2 ms / 1 972 buffers. → **ne pas re-tenter le wrapping global** (rollbacké le 2026-05-08). Trigger sur `user_app_roles` écrivant un flag dans `raw_app_meta_data`, puis :

```sql
CREATE OR REPLACE FUNCTION is_backoffice_user() RETURNS boolean
  LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'bo_active')::boolean, false);
$$;
```

Signature inchangée → aucune policy modifiée, aucun risque de replanification.

**[GAIN FORT] `force-dynamic` sur le layout racine, 0 `loading.tsx`, 2 `Suspense`** — `apps/back-office/src/app/layout.tsx:23`, `(protected)/layout.tsx:12`, `src/app/force-dynamic.ts:7-8` — la config est héritée par les 168 pages. Conséquences : les 361 `<Link>` ne prefetchent rien (pas de shell `loading.tsx` à prefetcher), `staleTimes.dynamic` vaut 0 par défaut en Next 15 et n'est pas configuré (le Router Cache client ne réutilise jamais un payload, même au bouton retour), et sans `Suspense` l'écran reste figé sur la page précédente. C'est la cause directe du « je clique et rien ne se passe pendant 1-2 s ». → retirer du layout racine, `loading.tsx` par groupe de routes, `experimental.staleTimes: { dynamic: 30, static: 180 }`.

**[GAIN FORT] `AuthWrapper` bloque tout l'arbre derrière un `getSession()` réseau** — `apps/back-office/src/components/layout/auth-wrapper.tsx:64-72`, monté dans `layout.tsx:56` au-dessus de `{children}` — le HTML SSR est remplacé par le splash « VÉRONE » jusqu'à réponse de `getSession()` (~100-400 ms, plus si le token doit être rafraîchi), **avant** que la page ne commence son fetch. `AppSidebar`/`AppHeader` étant enfants, leurs 13 requêtes ne démarrent qu'après. Le rôle est déjà validé côté serveur par `(protected)/layout.tsx` : ce gate est redondant. → rendre le shell immédiatement, ne suspendre que le menu utilisateur, passer `user` en prop depuis le Server Component parent.

**[GAIN FORT] Page de configuration du site internet : 6 maillons cumulés** — `(protected)/canaux-vente/site-internet/components/ConfigurationSection.tsx:109` → `ProductShippingCard.tsx:50,415`

1. RPC `get_site_internet_products()` : **243 ms, 12 709 buffers pour 177 lignes** (`EXPLAIN ANALYZE` prod). Recalcule 9 fois par ligne la même sous-requête `price_list_items ⋈ price_lists` (`20260501030000_add_primary_cloudflare_image_id_to_get_site_internet_products.sql:44-78`, occurrences lignes 45, 55, 56, 57 ×2, 75) + 3 sous-requêtes `product_images`, sans `LIMIT`.
2. Renvoie **497 kB de JSON** (44 colonnes dont `description`, `technical_description`, `image_urls[]`) ; la carte utilise 6 champs (`ProductShippingCard.tsx:36-42`).
3. 177 lignes × (un `Select` Radix à 5 items + un `Input` contrôlé) ≈ 1 000 composants Radix, 300-600 ms de thread principal.
4. `editedValues` vit dans le parent (`:447`) et les callbacks sont des flèches inline (`:428`) : chaque frappe re-render les 177 lignes.
5. La même RPC est appelée par 5 endroits, dont `hooks/use-product-detail.ts:19-22` pour **un seul** produit (`.rpc(...).eq('product_id', id).single()` — PostgREST filtre après exécution complète : 243 ms pour 1 ligne).
6. `hooks/use-site-internet-products.ts:36-41` réactive `refetchOnWindowFocus: true` alors que `react-query-provider.tsx:39` le fixe à `false` globalement.
   → RPC dédiée en `LEFT JOIN LATERAL` avec `p_limit`/`p_offset` et variante « liste » sans les colonnes lourdes ; paramètre `p_product_id`; pagination ou virtualisation ; `memo` sur `ProductShippingRow` + `useCallback` stables ; état d'édition dans la ligne ; retirer la ligne 40.

**[GAIN FORT] La sidebar : 11 `count(*)` + 2 `auth.getUser()` par montage, rejoués à chaque événement Realtime de 7 tables sans debounce** — `packages/@verone/notifications/src/hooks/use-sidebar-counts.ts:123,329` (deux `getUser`), `:137-215` (11 requêtes), `:355-470` (7 canaux dont chaque callback appelle `fetchAllCounts()`) — `getUser()` est un appel réseau GoTrue (~80-250 ms) fait deux fois en série. Aucun cache React Query : tout est refait à chaque remount. `useDatabaseNotifications` et `useMediaAssetsPendingCount` montés à côté (`app-sidebar/index.tsx:36-38`) refont chacun un `getUser()`. Sur une écriture de commande : rafales de 22-33 requêtes. → RPC `get_sidebar_counts()` unique en `useQuery` avec `staleTime: 60_000`, supprimer les `getUser()`, debounce 1 s sur Realtime.

**[GAIN FORT] `exceljs` dans le barrel `@verone/utils`, tiré par 213 fichiers** — `packages/@verone/utils/src/index.ts:36` → `excel-utils.ts:1` — aucun package `@verone/*` n'a `"sideEffects": false`, donc Webpack ne peut pas élaguer : `import { cn } from '@verone/utils'` fait entrer `exceljs` (~940 kB minifié) dans le graphe client. Même schéma pour `@verone/orders/src/index.ts:9` → `./components/charts` → **recharts** (~450 kB) : `OrdersSection.tsx:18` importe une table depuis le barrel et embarque recharts sans l'afficher. 12 fichiers importent recharts, aucun via `next/dynamic`. → `"sideEffects": false` sur les 24 packages, sous-chemin `@verone/utils/excel` réservé aux routes API, charts hors barrel.

**[GAIN FORT] Aucun `optimizePackageImports` : 1 131 imports depuis un barrel de 160 composants** — `apps/back-office/next.config.js` (zéro clé `experimental`), `packages/@verone/ui/src/index.ts:7-20` — chaque `import { Badge } from '@verone/ui'` fait résoudre et transpiler les 160 modules. → `optimizePackageImports: ['@verone/ui','@verone/utils','@verone/orders','@verone/products','@verone/stock','@verone/finance','lucide-react','date-fns']`.

**[GAIN FORT] 154 pages sur 168 en `'use client'`** — le serveur ne renvoie qu'un squelette, toutes les données partent du navigateur après hydratation. 116 `useQuery` et 142 `useEffect` côté client, **0** `unstable_cache` / `revalidateTag` côté serveur. → convertir au moins les pages « liste » en Server Components préchargeant la première page et passant `initialData` via `HydrationBoundary`.

**[GAIN MOYEN] Le rôle utilisateur est relu 3 fois par requête HTTP** — `(protected)/layout.tsx:18-38` (2 allers-retours séquentiels, sans `cache()`, alors que `packages/@verone/utils/src/supabase/dal.ts:52` expose déjà `verifySession = cache(...)` non utilisé ici) ; `auth-wrapper.tsx` (`getSession`) ; `apps/back-office/src/components/layout/app-header.tsx:121-141` (`useEffect` qui relit `user_app_roles` uniquement pour décider d'afficher deux entrées de menu). Plus `lib/guards/require-backoffice-admin.ts:60-78` qui refait getUser + rôle sur chacun de ses 31 appels, sans cache. → `verifyBackofficeAccess = cache(...)` dans `dal.ts`, rôle en prop depuis le layout, lecture depuis le JWT.

**[GAIN MOYEN] 805 `await supabase` séquentiels pour 60 `Promise.all` ; 66 fichiers avec ≥ 4 awaits sans aucune parallélisation** — pire cas `(protected)/canaux-vente/linkme/hooks/catalog/fetchers-detail.ts:20,81,92,102,112,122,133` — 7 allers-retours strictement séquentiels (~50-90 ms chacun) → 350-630 ms au lieu de ~90 ms ; 15 `await supabase` dans le fichier, zéro `Promise.all`. Les 6 lookups après la ligne 75 sont indépendants. → `Promise.all`, ou mieux un `select()` avec embeds PostgREST pour un unique aller-retour.

**[GAIN MOYEN] 45 boucles contenant un `await supabase` (N+1)** — `(protected)/finance/_shared-comptable/use-cloture-data.ts:216,219`, `app/actions/bank-matching.ts:238`, `(protected)/produits/catalogue/use-bulk-actions.ts:128` (100 UPDATE sérialisés sur une sélection de 100 produits), `contacts-organisations/enseignes/[id]/hooks/use-enseigne-detail.ts:212,217`, `packages/@verone/finance/src/components/RapprochementModal/use-rapprochement-data.ts:60-127` (jusqu'à 3 requêtes par lien, toutes avec `error` non lu). → requêtes ensemblistes `.in()` en lecture, `upsert()` unique en écriture.

**[GAIN MOYEN] Aucune pagination serveur : 0 `.range()` dans 3 169 fichiers, 87 `.limit()` pour 805 requêtes** — `(protected)/canaux-vente/site-internet/hooks/use-site-internet-collections.ts:19-22`, `components/ReviewsSection.tsx:402`, `components/PromoCodesSection.tsx:90`, `src/hooks/core/use-stock-core.ts:56,150`, `(protected)/admin/users/page.tsx:67` — tout le filtrage et le tri sont côté client. → `.range()` avec `{ count: 'exact' }` sur les 6 listes principales, recherche et tri en SQL.

**[GAIN MOYEN] 11 `React.memo` pour ~2 000 composants, 0 librairie de virtualisation** — `ProductsTable.tsx:70-80`, `ProductShippingCard.tsx:415-432`, `SalesOrdersTable.tsx` (décrit dans le code lui-même comme « 3604 lignes sur 9 hooks/sous-composants — de loin la dépendance la plus lourde », `site-internet/page.tsx:37-38`) — 177 lignes × ~9 cellules dont un `<Image>`, un `Switch` et 4 boutons ≈ 2 500 nœuds React montés d'un coup. → `@tanstack/react-virtual` sur les 4 tables > 100 lignes, `memo` sur les lignes.

**[GAIN MOYEN] `count: 'exact'` toutes les 30 s sur toutes les pages et tous les onglets** — `packages/@verone/notifications/src/hooks/use-unread-mails-count.ts:25-46`, monté dans `app-header.tsx:88` — parcours complet de `email_messages` + toutes ses policies RLS, 2 fois par minute par onglet. S'ajoute au polling de secours de `use-sidebar-counts.ts:344`. → Realtime seul, ou 5 min, ou `count: 'planned'`, ou fusion dans `get_sidebar_counts()`.

**[GAIN MOYEN] Un `INSERT` d'activité par navigation, avec un second `getSession()` global** — `apps/back-office/src/components/providers/activity-tracker-provider.tsx:33-53,65-92`, `packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts:82,93,167` — provider monté dans le layout racine. Contribue aux 33 M de scans sur `user_profiles`. → réutiliser l'utilisateur du contexte, batcher les `page_view` via `sendBeacon`.

**[GAIN MOYEN] 37 à 87 `select('*')`, dont sur les chemins d'authentification** — `packages/@verone/utils/src/supabase/dal.ts:139-145` (sur `user_app_roles`, empêche un index couvrant), `components/profile/useProfileLoad.ts:90`, `site-internet/hooks/use-ambassadors.ts:154,170,198,211,230` (sur `individual_customers`, table large, pour afficher 6 colonnes), `contacts-organisations/customers/hooks/use-customers-page.ts:151` (avec un `// TODO: specify columns`), `produits/catalogue/detail/[id]/_components/hooks/use-product-detail.tsx:78-80` (sur `products`, **99 colonnes** dont `search_vector` tsvector et `ai_generated_metadata` jsonb, pour ~30 utilisées). Interdit par `CLAUDE.md`. → colonnes explicites.

**[GAIN MOYEN] Requête dupliquée entre une section et sa carte de stats** — `site-internet/hooks/use-site-internet-collections.ts:20` (clé `site-internet-collections`) et `:382-397` (clé `site-internet-collections-stats`), les deux consommées par `CollectionsSection.tsx:84` — deux `select('*')` sur `collections` sur deux clés React Query distinctes, jamais dédupliquées. `collections` affiche 249 736 `seq_scan` pour 2 lignes et 40 `idx_scan`. `useSiteInternetProductsStats` (`use-site-internet-products.ts:390-417`) rappellerait la RPC complète — actuellement non appelé, à supprimer. → calculer les stats depuis le cache existant.

**[GAIN FAIBLE] 16 sections lazy-loadées avec `loading: () => null`** — `site-internet/page.tsx:44-162` — le lazy loading est justifié (il a résolu un OOM de build, documenté lignes 31-42) mais l'utilisateur voit une zone vide 500 ms à 1,5 s et croit que le clic n'a pas fonctionné. → squelette + prefetch du chunk au `onMouseEnter` du `TabsTrigger`.

**[GAIN FAIBLE] 41 `createClient()` au niveau module, cache Webpack en mémoire en production** — `site-internet/hooks/use-site-internet-config.ts:13` et 40 autres ; `apps/back-office/next.config.js:181-186` (`config.cache = { type: 'memory' }` quand `!dev`) — chaque build repart de zéro. → `useSupabase()` (le provider existe : `supabase-provider.tsx:45`) ; `type: 'filesystem'` en production (le warning « Serializing big strings » est déjà filtré par `ignoreWarnings`).

**[INFO] Index et clés étrangères** — advisors Supabase : **243 index jamais utilisés** (ralentissent les écritures et occupent l'espace), **27 clés étrangères sans index couvrant**, **3 index dupliqués** (dont `gmail_watch_state_email_address_unique` = `gmail_watch_state_pkey`), **251 policies « multiples permissives »** évaluées en série, **3 `auth_rls_initplan`** sur `addresses`. Base : 133 tables, 574 fonctions, 252 triggers, 911 index, 334 policies, 3 vues matérialisées, 287 MB. → traiter après le Lot 4, une fois la charge RLS supprimée : les chiffres d'usage des index changeront.

---

## Lot 5 — Bugs bloquants

### Commandes et contacts

**[CRITIQUE] Aucune commande client standard n'a de contact — 3 causes empilées**

1. `packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts:82-110` — l'INSERT ne contient ni `billing_contact_id`, ni `delivery_contact_id`, ni `responsable_contact_id` ; le type `CreateSalesOrderData` (`hooks/types/sales-order.types.ts:252-277`) ne les déclare même pas ; `grep -i contact` sur `SalesOrderFormModal.tsx` et `sales-order-form/StandardOrderForm.tsx` ne retourne rien. Seul le parcours LinkMe les renseigne (`CreateLinkMeOrderModal/use-create-linkme-order-form.ts:417`, `canaux-vente/linkme/hooks/create-order-form-helpers.ts:194`).
2. `packages/@verone/orders/src/components/modals/order-detail/useOrderDetailData.ts:251-302` — lit `billing_contact` et `delivery_contact`, **ignore `responsable_contact`** (pourtant joint par `use-sales-orders-fetch-list.ts:67` et `use-sales-orders-fetch.ts:75`), ne fait **aucune** requête sur `contacts WHERE organisation_id = order.customer_id`, et retombe sur `organisations.email`, colonne nullable et le plus souvent vide en B2B.
3. `packages/@verone/orders/src/components/modals/SendOrderDocumentsModal.tsx:104-135` — `contacts.length > 1 ? <Select> : <Input>`. Avec 1 contact, aucune liste déroulante n'apparaît. `use-order-documents-email.ts:45` : `defaultEmail = contacts[0]?.email ?? ''`.
   → ajouter les 3 champs au type et à l'INSERT + un sélecteur de contact dans `StandardOrderForm` (réutiliser `useOrganisationContactsBO` de `hooks/linkme/use-organisation-contacts-bo.ts`) ; remplacer le bloc de `useOrderDetailData` par une requête `contacts` fusionnée avec les 3 FK (**modèle correct à copier : `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts:111-188`**) ; condition `> 0` et message explicite « Aucun contact rattaché » quand la liste est vide.

**[MAJEUR] Les 4 autres points d'envoi ne passent pas la prop `contacts`** — `apps/back-office/src/components/orders/QuotesSection.tsx:222-238`, `InvoicesSection.tsx:248-260`, `(protected)/factures/devis/[id]/DevisDialogs.tsx:101-112` — `packages/@verone/finance/src/components/RecipientSelector.tsx:40` rend les puces sous `contacts.length > 0`, et le défaut est `[]` (`SendDocumentEmailModal.tsx:85`). Seul `factures/[id]/page.tsx:227` passe `contacts={detail.orderContacts}`. → hook partagé, prop passée aux 4 appels.

**[MAJEUR] Le modal d'envoi liste les devis supprimés ou périmés** — `useOrderDetailData.ts:219-249` — aucun filtre `deleted_at` ni `quote_status`, alors que la colonne existe et que le reste du code filtre systématiquement (`api/qonto/invoices/_lib/duplicate-guard.ts:20`, `api/quotes/[id]/finalize/route.ts:91`). `status` et `quote_status` sont sélectionnés mais jamais affichés (`OrderDocumentsList.tsx:102-152`). → `.is('deleted_at', null).neq('quote_status', 'superseded')` + badge de statut.

**[MAJEUR] `sentBy` jamais transmis : tous les envois sont anonymes en base** — `use-order-documents-email.ts:220-230`, `send-document-helpers.ts:81-89` — le schéma le prévoit (`send-order-documents/route.ts:44`) et la route écrit `created_by: sentBy ?? null` (`:111`). → déduire l'auteur de la session serveur.

**[MAJEUR] Un e-mail envoyé depuis une commande ne laisse aucune trace consultable** — `api/emails/send-order-documents/route.ts:90-119` écrit dans `sales_order_events`, mais (1) la vue unifiée `20260507210000_bo_msg_018_unified_communications_view.sql` n'agrège que `email_messages`, `document_emails`, `consultation_emails`, `linkme_info_requests` ; (2) seul `useOrderHistory` (`hooks/linkme/use-order-history.ts:231-234`) sait afficher `email_documents_sent`, et il n'est utilisé que par les pages LinkMe ; (3) `OrderCommunicationsCard` n'est monté que dans `canaux-vente/linkme/commandes/[id]/details/page.tsx:427`. → écrire aussi dans `document_emails` (comme `send-document/route.ts:155-190`) et monter `OrderCommunicationsCard` dans `OrderDetailModal`.

**[MAJEUR] Envoi multi-destinataires : raisons d'échec jetées, modal fermé sur échec partiel** — `packages/@verone/finance/src/components/send-document-helpers.ts:76-107` (retourne seulement des compteurs), `SendDocumentEmailModal.tsx:232-248` (`onClose()` inconditionnel) — sur 3 destinataires dont 1 en échec, l'utilisateur ne sait pas lequel, la liste est perdue à la réouverture (`:113`), aucun retry n'existe. → retourner `Array<{ email, error }>`, garder le modal ouvert, bouton « Réessayer les échecs ».

**[MAJEUR] E-mails de suivi d'expédition invisibles dans l'historique** — `api/emails/send-shipping-tracking/route.ts:155-174` — insert dans une promesse flottante juste avant le `return`, et `email_tracking_sent` est absent de la table de correspondance (`use-order-history.ts:210-235`, avec `if (!config) continue;` ligne 239) : filtré même quand l'insert réussit. → `await` avant le `return` + ajouter l'entrée à `eventLabels`.

**[MINEUR] Les PDF ne sont chargés qu'une fois à l'ouverture** — `use-order-documents-email.ts:81-83,130-145` — `linkedDocuments` est chargé de façon asynchrone par le parent ; si le modal s'ouvre avant, `fetchPdfs` boucle sur un tableau vide et `generatingRef` reste `true`, bloquant tout nouveau chargement. Les cases à cocher restent désactivées, le bouton Envoyer grisé sans message. → ajouter `fetchPdfs` aux deps, remplacer le verrou booléen par un `Set` des `doc.id` traités.

**[MINEUR] Aucune borne sur la taille des pièces jointes base64** — `api/emails/send-order-documents/route.ts:45-54` — le base64 gonfle les PDF de 33 %, la limite de corps serverless est de quelques Mo. Échec 413 traduit par « Impossible d'envoyer l'email ». Le motif correct existe dans `api/marketing/images/generate/route.ts:163-171` (`MAX_TOTAL_SIZE_BYTES`). → borne côté client et dans le Zod.

**[MINEUR] Envoi possible sans aucune pièce jointe** — `use-order-documents-email.ts:147-154` (`if (selectedDocIds.size === 0) return true`), `SendOrderDocumentsModal.tsx:183-185`, aucun document pré-coché (`:60`) — un e-mail « Veuillez trouver ci-joint les documents » (`route.ts:48`) part sans pièce. → exiger au moins une pièce, ou pré-cocher le dernier document finalisé.

### Rapprochement bancaire

> **Ajout du 2026-07-30, après-midi.** Le nouveau contrôle
> `pnpm validate:db-usage` (créé au Lot 004) a trouvé **31 écritures en base
> impossibles** dans le dépôt, toutes confirmées une par une contre la base de
> production. La plus coûteuse est dans le rapprochement bancaire et constitue
> une **deuxième** cause au symptôme nº1 de Roméo, indépendante de celle
> décrite juste en dessous : `app/actions/bank-matching.ts:137` et `:339`
> écrivent `financial_documents.payment_status`, colonne qui n'existe pas. Le
> code crée la facture, échoue sur la mise à jour, puis **supprime la facture
> qu'il vient de créer** (ligne 137) ou la laisse orpheline (ligne 339).
> Liste complète et ordre de correction : `ECRITURES-DB-IMPOSSIBLES.md`.

**[CRITIQUE] Le bouton « Rapprocher » de la fiche facture n'écrit rien en base** — `api/qonto/invoices/[id]/reconcile/route.ts:112-124` — appelle `markClientInvoiceAsPaid(id)` chez Qonto et s'arrête. Aucune ligne dans `transaction_document_links`, aucun `bank_transactions.matching_status`/`matched_document_id`, aucun `financial_documents.amount_paid`. `ReconcileTransactionModal.tsx:161` affiche « Rapprochement effectué » puis `window.location.reload()`. Body casté sans Zod (`:38`), et le commentaire « verify it exists and has matching amount » est faux — aucun contrôle de montant. → appeler le RPC `link_transaction_to_document` dans la même route + Zod.

**[CRITIQUE] Une transaction partiellement allouée disparaît définitivement** — `supabase/migrations/20260512120000_fix_v_transactions_unified_matched_status.sql:39-42` (la vue calcule `matched` dès `manual_matched`) + `20260403100000_fix_reconciliation_amount_paid_cap.sql:119-123` (le RPC passe `manual_matched` dès le premier lien) — tous les écrans de candidats filtrent `.in('unified_status', ['to_process','classified'])` : `useRapprochementFetchers.ts:64,72`, `useRapprochementData.ts:135`, `use-invoice-reconciliation-suggestions.ts:157`. Un virement de 5 000 € alloué à une facture de 1 200 € n'apparaît plus jamais ; les 3 800 € sont inaccessibles, alors que c'est le cas d'usage documenté de la table (`20251230_transaction_document_links.sql:8-10`). → inclure `'matched'` quand `reconciliation_remaining > 0.01`, ou statut `partial` calculé depuis `SUM(allocated_amount) < ABS(amount)`.

**[CRITIQUE] La synchro Qonto ignore toute mise à jour après le premier import** — `packages/@verone/finance/src/services/qonto-sync-upsert.ts:48` (`updated_at: new Date().toISOString()`) puis `:71-79` (comparaison de l'`updated_at` Qonto à cette valeur locale toujours postérieure) → `skipped`, toujours. Les `attachment_ids`, libellés corrigés et TVA OCR ne redescendent jamais. C'est pourquoi « Transactions sans facture » reste peuplé après attachement du PDF côté Qonto. → colonne `provider_updated_at` dédiée.

**[CRITIQUE] Auto-classification PCG toujours en 707, y compris sur les débits** — `use-rapprochement-actions.ts:80-85` (idem `:141-147`, `:211-217`) — `amount > 0 ? '707' : '607'`, mais `qonto-sync-upsert.ts:35` écrit `amount: tx.amount` et l'API Qonto renvoie un montant **toujours positif** avec la direction dans `side`. Preuve dans le code d'affichage qui reconstruit le signe : `TransactionList.tsx:284-288`. Chaque facture fournisseur est classée en 707 « ventes de marchandises ». Échec invisible (`void ... .catch(console.warn)`). → `transaction.side === 'debit' ? '607' : '707'`, et normaliser le signe une seule fois à l'import.

**[MAJEUR] Onglet par défaut toujours « Clients », même sur un débit** — `use-rapprochement.ts:96-104` (`if (amount < 0) setActiveTab('purchase_orders')`), `amount` venant de `TransactionModals.tsx:156` — jamais vrai, même cause que ci-dessus. Idem `useRapprochementFetchers.ts:56` (`amountForRange = order.total_ttc` négatif pour un avoir → les `gte/lte` ne renvoient rien). → utiliser `side` partout.

**[MAJEUR] Le panneau de suggestions alloue le montant total du virement** — `InvoiceReconciliationSuggestionsPanel/index.tsx:56-66` et `:103-111` (« Tout valider ») — `allocatedAmount = Math.abs(suggestion.transaction.amount)` alors que le hook calcule `remaining` (`use-invoice-reconciliation-suggestions.ts:283`) et que le scoring compare au reste dû (`scoring.ts:33-36`). Aggravant : `scoring.ts:95-104` court-circuite à `score 100 / priority 'excellent'` dès que le numéro de facture apparaît dans le libellé, **sans contrôle de montant** — et « Tout valider » ne traite que les `excellent`. Un virement de 9 000 € portant la référence d'une facture de 500 € est alloué à 9 000 €, le trigger `update_sales_order_payment_status_v2` (`20260403100000...sql:200-201`) passe la commande en `overpaid`. → `Math.min(Math.abs(tx.amount), invoice.remaining)` et exclure du « Tout valider » tout écart > 0,01 €.

**[MAJEUR] Depuis une commande, aucune saisie de montant partiel possible** — `useRapprochementData.ts:237-257` — `p_allocated_amount: transactionAmount` (montant total du virement). Aucun champ de montant dans `OrderPaymentDialog`, `POPaymentDialog`, `PaymentSection`, contrairement à `RapprochementModal`/`OrdersTab.tsx:209-216`. Un virement de 3 000 € couvrant 3 commandes de 1 000 € marque la première surpayée et bloque les deux autres. → champ pré-rempli à `Math.min(reste transaction, reste commande)`.

**[MAJEUR] Montant à allouer saisi librement, jamais validé** — `use-rapprochement-actions.ts:56-71` — `allocatedAmount` est une chaîne libre ; `"0"` est truthy → allocation de 0 € (lien créé, facture impayée, transaction passée en `manual_matched` donc perdue) ; une valeur non numérique donne `NaN` sérialisé en `null` → le RPC retombe sur `ABS(amount)` sans prévenir. Aucun contrôle `<= remainingAmount`. Le `eslint-disable no-unsafe-call` + `as CallableFunction` masquent le typage. → Zod `z.number().positive().max(remainingAmount)`, bouton désactivé si invalide, client typé `createClient<Database>()`.

**[MAJEUR] Bilan, TVA et grand livre calculés sur les 1 000 premières transactions** — `packages/@verone/finance/src/hooks/use-bank-reconciliation.ts:108-128` — aucun `.limit()`/`.range()`, donc la limite implicite Supabase tronque en silence. Ce hook alimente 8 pages (`finance/documents/bilan`, `tva`, `grand-livre`, `compte-resultat`, `recettes`, `achats`, `annexe`, `resultats`, `admin/cloture`). En prime, `:126` avale l'erreur si le message contient « does not exist » : la page affiche 0 € comme résultat valide. → pagination `.range()` en boucle ou agrégation SQL, et supprimer la branche qui avale.

**[MAJEUR] Exclusion des transactions liées : requête sans filtre ni limite, `error` non lu** — `useRapprochementFetchers.ts:99-111` — passé 1 000 liens, le `Set` est tronqué : des transactions déjà rapprochées réapparaissent et peuvent être re-liées. Si la requête échoue, `linkedTxIds` est vide et **toutes** sont proposées. → `.in('transaction_id', txIds)` sur les transactions affichées + lire `error`.

**[MAJEUR] La TVA écrite ignore le montant alloué et arrondit les taux réduits** — `use-rapprochement-vat.ts:145-176` — (1) `totalHT`/`totalVAT` sont les totaux complets des documents liés, pas le prorata de `allocated_amount` : un acompte de 500 € sur une facture de 1 000 € inscrit 833,33 € de HT et 166,67 € de TVA sur un mouvement de 500 € — la déclaration construite depuis `bank_transactions.amount_vat` est fausse ; (2) `Math.round(rate)` transforme 5,5 % en 6 % et 2,1 % en 2 %. Échec muet (`catch → console.warn` ligne 198). → prorata `allocated_amount / total_ttc`, taux à 2 décimales sans `Math.round`.

**[MAJEUR] Montant de commande reconstruit à 20 % de TVA en dur** — `use-rapprochement-data.ts:264` et `:332` — `const ttc = Number(o.total_ttc) || Number(o.total_ht) * 1.2` : le `||` se déclenche aussi sur `0`. Une commande exonérée dont `total_ttc` vaut 0 se voit attribuer un TTC fantôme. Contraire à la règle R8 de `.claude/rules/finance.md`. → `o.total_ttc != null ? Number(o.total_ttc) : null`, et signaler les commandes sans TTC en anomalie.

**[MAJEUR] La recherche de transaction ne regarde que 50 mouvements** — `api/qonto/transactions/route.ts:38-58` — le filtre montant est appliqué **après** la pagination, sur une seule page. `ReconcileTransactionModal.tsx:95-97` appelle avec `perPage=50` : pour une facture payée il y a plus de 50 mouvements, la modale affiche « Aucune transaction trouvée correspondant au montant de la facture ». → passer `minAmount`/`maxAmount` aux filtres de l'API Qonto, ou boucler sur les pages couvrant la plage de dates.

**[MAJEUR] L'attachement automatique renvoie « succès » sur échec et se rejoue en boucle** — `api/qonto/attachments/auto-attach/route.ts:155` (`idempotencyKey = crypto.randomUUID()` régénérée à chaque appel, neutralisant la protection Qonto — d'où l'existence de `attachments/cleanup-duplicates`), `:193-200` (retour 200 sur erreur) ; déclenché par `use-transaction-enrichment.ts:309-322` pour **chaque** transaction rapprochée à **chaque** chargement de liste. → clé dérivée de `${transactionId}:${documentId}`, code ≥ 400 sur échec, déclenchement uniquement après action.

**[MAJEUR] Prop `order` recréée à chaque rendu → rechargement complet de la liste** — `apps/back-office/src/components/orders/PaymentSection.tsx:510-527` — l'objet littéral est dans les deps de l'effet de `useRapprochementData.ts:85-91` et de 3 `useCallback` (`useRapprochementFetchers.ts:97`) : chaque frappe ou `router.refresh()` relance 3 requêtes et écrase la recherche en cours. Les deux autres appelants mémoïsent explicitement (`useOrderDetailData.ts:322-360`, `use-po-detail-state.ts:190-225`). → `useMemo` avec des deps primitives.

**[MINEUR] L'alerte « Trop-perçu » est du code mort** — `(protected)/finance/transactions/_components/TransactionDetailPanel.tsx:341-352` — un reste de −50 € satisfait déjà `<= 0.01`, la branche `< -0.01` est inatteignable : aucun signal visuel de sur-affectation. → tester `< -0.01` en premier.

**[MINEUR] Aucune piste d'audit sur les rapprochements** — `20251230_transaction_document_links.sql:47` (colonne `created_by` existe), `20260403100000_fix_reconciliation_amount_paid_cap.sql:108-115` (le RPC ne la renseigne jamais) ; policies RLS `USING (true)` pour tout `authenticated` (`:75-85`), sans `is_backoffice_user()`. → `created_by := auth.uid()` dans le RPC + restreindre les policies.

**[MINEUR] Numérotation de facture par comptage → doublons garantis** — `app/actions/bank-matching-helpers.ts:33-43` — deux rapprochements simultanés produisent le même numéro ; une suppression fait régresser le compteur. `error` non lu. → séquence Postgres ou RPC `next_invoice_number()` avec `FOR UPDATE`.

### Produits et fournisseurs

**[CRITIQUE] Le wizard « Nouveau produit complet » ne peut rien enregistrer** — `packages/@verone/products/src/components/wizards/complete-product/useCompleteProductWizard.ts:156-157,181,203,253` — (1) envoie `status: 'coming_soon'` puis `status: 'in_stock'` : la table `products` n'a **aucune** colonne `status` (99 colonnes : `product_status`, `stock_status`, `sourcing_status`, `completion_status` — cf. `docs/current/database/schema/02-produits.md`) → `PGRST204` ; (2) `x ?? undefined` ne filtre pas `''` : `subcategory_id: ''`, `supplier_id: ''`, `assigned_client_id: ''` partent vers des colonnes `uuid` → `22P02`. La page `/produits/catalogue/nouveau` est le seul chemin de création complet. → supprimer les clés `status`, remplacer par `x?.trim() || null`.

**[CRITIQUE] Segments fournisseur `TACTICAL` et `OPERATIONAL` rejetés par la contrainte Postgres** — `packages/@verone/organisations/src/components/forms/supplier-segment-select.tsx:38,45,52,59` + `SupplierFormModal.tsx:127-128` — l'enum `supplier_segment_type` (`packages/@verone/types/src/supabase.ts:15568-15577`) vaut `strategic | preferred | approved | commodity | artisan | goods_supplier | service_provider | logistics | government`. 2 des 4 options du select font échouer tout l'enregistrement, avec `alert('Erreur lors de la sauvegarde. Veuillez réessayer.')` (`:201`) qui ne dit pas pourquoi. → aligner sur les 9 valeurs de l'enum.

**[MAJEUR] Badge de segment invisible pour 5 valeurs valides** — `packages/@verone/organisations/src/components/suppliers/SupplierSegmentBadge.tsx:18-22,73-84` — `SEGMENT_CONFIG` ne connaît que 4 valeurs ; `normalizeSegment` retourne `null` pour `preferred`, `approved`, `artisan`, `goods_supplier`, `service_provider`, `logistics`, `government`. → étendre aux 9 valeurs, fallback en badge neutre.

**[CRITIQUE] Devise et adresse principale du fournisseur : saisies, envoyées, jamais persistées** — `packages/@verone/organisations/src/hooks/use-organisations-crud.ts:92-135` (insert) et `:167-206` (`allowedFields`) — ni `currency`, ni `address_line1/2`, `postal_code`, `city`, `region` n'y figurent, alors que `SupplierFormModal.tsx:123,186` les envoie et que les colonnes existent (`docs/current/database/schema/01-organisations.md`). Le select « Devise » est affiché (`unified-organisation-form/CommercialSection.tsx:52-87`). Même sort pour `delivery_time_days`, `minimum_order_amount`, `preferred_supplier`, `rating`. → ajouter les 10 champs à l'insert **et** à `allowedFields`.

**[CRITIQUE] Sélecteur de fournisseur du wizard : props erronées masquées par `as any`** — `packages/@verone/products/src/components/wizards/sections/SupplierSection.tsx:47-52` — passe `value`/`onChange` là où `SupplierSelector` attend `selectedSupplierId`/`onSupplierChange` (`components/suppliers/SupplierSelector.tsx:14-21`). Résultat : `value={'none'}` en permanence (`:49`) et `TypeError: onSupplierChange is not a function` au clic (`:35-39`). → props correctes, supprimer le `as any` et l'`eslint-disable`.

**[CRITIQUE] ~40 liens produit vers `/catalogue/...` → 404** — il n'existe aucune route `(protected)/catalogue`, seulement `(protected)/produits/catalogue`. Occurrences : `organisations/src/components/sections/OrganisationProductsSection.tsx:138,176`, `products/src/components/cards/ProductCard.tsx:125,132`, `ProductCardV2.tsx:82,89`, `sections/ProductVariantsSection.tsx:139`, `sections/VariantSiblings.tsx:171`, `sections/SupplierEditSection.tsx:259`, `images/ProductDimensionsSection.tsx:119`, `images/ProductFixedCharacteristics.tsx:90,122`, `images/ProductVariantAttributesSection.tsx:98`, `images/ProductCompatibleRoomsSection.tsx:49`, `wizards/ProductCreationWizard.tsx:67`, `stock/src/components/tables/MovementsTable.tsx:314`, `stock/.../MovementDetailsModal.tsx:159`, `stock/.../StockAlertCard.tsx:239,251`, `stocks/inventaire/InventaireTable.tsx:146`, `InventaireMobileCard.tsx:59`, `produits/catalogue/subcategories/[subcategoryId]/page.tsx:137,142,178,191`, `variantes/[groupId]/components/VariantProductCard.tsx:142`, `collections/[collectionId]/components/CollectionProductCard.tsx:79`, `contacts-organisations/enseignes/[id]/components/EnseigneProductsTab.tsx:47`. → helper `productDetailPath(id)` centralisé dans `@verone/utils` + gate `check-internal-links.ts` (Lot 2).

**[CRITIQUE] Deux arbres détail produit dupliqués, le catalogue mène au périmé** — `(protected)/produits/catalogue/[id]/` vs `.../catalogue/detail/[id]/`, 66 fichiers chacun, 6 divergents. `CatalogueListView.tsx:74` route vers `[id]`. Or `detail/[id]/_components/product-publication-tab.tsx` (405 lignes) contient la visibilité catalogue LinkMe, la réservation client, `MarketingEligibilitySection`, `ProductPerformanceSection`, `SupplierAvailabilitySection` — absents de `[id]/_components/product-publication-tab.tsx`. Seuls `canaux-vente/meta/_components/channel-top-products-table.tsx:85` et `site-internet/components/SiteTopProductsSection.tsx:102` visent `detail/`. → supprimer un arbre, rediriger, mettre à jour les liens.

**[CRITIQUE] Compteur « Produits » de la fiche fournisseur calculé sur les 50 derniers produits du catalogue** — `packages/@verone/organisations/src/hooks/use-organisation-tab-counts.ts:46,100-112` — `useProducts()` sans filtre pagine à `PRODUCTS_PER_PAGE = 50`, page 0, tri `created_at desc` (`products-fetcher.ts:8,49-50`), puis filtrage en mémoire. Un fournisseur avec 200 produits anciens affiche « 0 » sur un onglet qui en liste 200. → `count` serveur `head: true`. Idem `contacts`/`orders`.

**[MAJEUR] Option « Rupture temporaire » invalide** — `packages/@verone/products/src/components/wizards/sections/GeneralInfoSection.tsx:177` — `value="backorder"` alors que `availability_type_enum` vaut `normal | preorder | coming_soon | discontinued` (`supabase.ts:15403-15407`). → remplacer par `coming_soon`, typer `availability_type` avec `Database['public']['Enums']['availability_type_enum']` dans `complete-product/types.ts:29`.

**[MAJEUR] Vignette du catalogue : `is_primary` sélectionné mais ignoré** — `packages/@verone/products/src/hooks/products-fetcher.ts:37-40,93-99` — `[0]` pris tel quel, aucun `order` ni filtre. Le bon code existe dans `use-product.ts:87` (`find(img => img.is_primary)`). → même motif + `.order('display_order')`.

**[MAJEUR] 4 filtres déclarés jamais appliqués** — interface `ProductFilters` (`use-products.ts:89-100`) déclare `category_id`, `family_id`, `min_price`, `max_price` ; `products-fetcher.ts:52-79` n'applique que `search`, `status`, `supplier_id`, `subcategory_id`, `in_stock_only`, `is_published_online`. → implémenter ou retirer de l'interface.

**[MAJEUR] Édition inline produit : les champs vidés enregistrés comme `''` au lieu de `NULL`** — `packages/@verone/common/src/hooks/use-inline-edit.ts:240-247` (branche produits) vs `:285-290`, `:331-335`, `:370-374`, `:405-409` (les 4 autres branches nettoient `'' → null`). Vider « Référence fournisseur » ou « URL page produit fournisseur » (`SupplierEditSection.tsx:170,195`) écrit `''` ; sur une colonne `uuid` → `22P02`. → déplacer le nettoyage avant le `if (productId)` (ligne 203) et supprimer les 4 copies.

**[MAJEUR] Lien « Site internet fournisseur » jamais affiché** — `packages/@verone/products/src/components/sections/SupplierEditSection.tsx:279-289` teste `product.supplier?.website`, mais `use-product.ts:58-63` ne sélectionne pas `website` dans la relation `supplier:organisations!supplier_id`. Le type local le déclare pourtant (`:26`). → ajouter `website` au `select`.

**[MAJEUR] `.single()` sur une requête qui retourne normalement 0 ligne** — `(protected)/contacts-organisations/suppliers/[supplierId]/page.tsx:82-96` — `linkme_affiliates` avec `.single()` : chaque ouverture de fiche fournisseur non affiliée déclenche un `PGRST116` masqué (`error` non lu). Le code fonctionne par accident ; toute autre erreur est confondue avec « pas d'affilié ». Idem `use-variant-group-products.ts:159,172`, `use-product-variants.ts:44,89`. → `.maybeSingle()` + lire `error`.

**[MINEUR] Un simple sélecteur de fournisseur charge tous les fournisseurs (~85 colonnes) + scanne `products`** — `SupplierSelector.tsx:31` (`useSuppliers()` sans `lightweight`), `use-organisations.ts:117-140` (`.in('supplier_id', supplierIds)` sur toutes les lignes `products` juste pour compter). Le mode `lightweight` existe (`organisations.constants.ts:20-22`) et est utilisé par le catalogue (`use-catalogue-page.ts:58-65`) mais pas ici, ni par `QuickSupplierModal.tsx:30`, ni par `suppliers/[supplierId]/page.tsx:71-72`. → `useSuppliers({ lightweight: true, is_active: true })`, comptage par RPC d'agrégation.

**[MINEUR] Code mort exporté avec colonnes et statuts inexistants** — `packages/@verone/products/src/components/modals/ProductCreationModal.tsx:106-125` (415 lignes, exporté par `modals/index.ts:3`, aucun consommateur ; envoie `price_ht`, `price_ttc`, `category`, `status` — 4 colonnes inexistantes — masqués par `as any` ligne 125) ; `selectors/ProductStatusSelector.tsx:135-141` (propose `sourcing`, `pret_a_commander`, `echantillon_a_commander` alors que `product_status_type` vaut `active | preorder | discontinued | draft`) ; `apps/back-office/src/components/forms/simple-product-form.tsx` (369 lignes, formulaire dans `apps/`, interdit par `CLAUDE.md`, sans consommateur). → supprimer les trois et leurs exports.

### Marketing

**[MAJEUR] Le cross-posting n'est branché nulle part** — `packages/@verone/marketing/src/components/CrossPostModal/CrossPostModal.tsx` (286 lignes, mutation fonctionnelle) — seule référence hors du dossier : `components/index.ts:5`. Aucun `<CrossPostModal` dans `apps/`. Or `(protected)/marketing/calendrier/page.tsx:204-207` affiche « Programme une publication depuis la bibliothèque images via le bouton "Publier" » ; le seul bouton de la bibliothèque est « Marquer comme publié » (`MediaAssetPublicationsSection.tsx:114`), un enregistrement a posteriori. Le Calendrier est structurellement vide. → câbler depuis `MediaAssetDetailModal`, ou retirer la page et le texte.

**[MAJEUR] La publication automatique est morte : les cron jobs appellent des Edge Functions absentes du dépôt** — `supabase/migrations/20260510201400_bo_mkt_pub_auto_001_cron_jobs.sql:80-88` (`invoke_edge_function('run-scheduled-publications')`) — aucun dossier `supabase/functions/`, aucun `Deno.serve` dans le repo. `docs/scratchpad/prompt-next-session-marketing-2026-05-10.md` le confirme (« implémenter la logique des 2 Edge Functions squelettes »). L'UI l'admet (`calendrier/page.tsx:208-214`) mais **uniquement dans l'état vide** : l'avertissement disparaît dès qu'une ligne existe. Une publication « programmée » garde son badge indéfiniment, sans timeout ni passage en `failed`. → implémenter et versionner, ou afficher le bandeau en permanence et bloquer la création.

**[MAJEUR] « Sauvegarder » après un aperçu relance une génération Gemini** — `packages/@verone/marketing/src/hooks/use-generate-marketing-image.ts:81,103-107` — `mutationFn` appelle `callGenerateApi({ ...input, saveImmediately: true })` ; le schéma (`types.ts:71-82`) n'a aucun champ pour transmettre l'image déjà générée, et la route exécute Gemini avant de brancher sur `saveImmediately` (`api/marketing/images/generate/route.ts:193-233` puis `:236`). L'image enregistrée n'est pas celle validée à l'écran, et chaque sauvegarde est facturée deux fois. En prime `savePreview` fait `void ... .catch(() => {})`. → ajouter `imageBase64`/`mimeType`/`modelUsed` au schéma et sauter l'étape 7 quand ils sont fournis.

**[MAJEUR] Les marques sont hardcodées dans le package** — `packages/@verone/marketing/src/types.ts:3` (`type BrandSlug = 'verone' | 'bohemia' | 'solar' | 'flos' | 'linkme'`), `data/brands.ts:3-66` (palettes, mots-clés, `avoid` en dur), `MarketingStudio.tsx:39,62-65` (filtre sur `ALL_SLUGS`), Zod côté API rejetant tout autre slug (`types.ts:77`, `route.ts:143-148` → 422 « Marque inconnue »). Or la table `brands` est éditable via `/parametres/marques` (`BrandEditModal.tsx:102`) et le menu Marketing y renvoie (`sidebar-nav-items.ts:369`). Une 6ᵉ marque est invisible dans le Studio, sans message. → colonnes en base, validation contre la base, supprimer `data/brands.ts`.

**[MAJEUR] La page Performance ignore la période pour Meta et Google** — `(protected)/marketing/performance/page.tsx:156-162` — `useMetaCommerceProducts()` (`packages/@verone/channels/src/hooks/use-meta-commerce-products.ts:47-75`) et `useGoogleMerchantProducts()` (`use-google-merchant-products.ts:60-81`) ne prennent aucun paramètre de période : ce sont des cumuls depuis toujours. Ces valeurs alimentent les colonnes `meta_revenue`/`google_revenue` du pivot (`:190-209`) et l'export CSV (`:60-69`), alors que les 4 cartes KPI au-dessus sont bien filtrées (`useChannelStatsAggregated`, `:119-128`) — deux chiffres contradictoires sur le même écran. `useChannelStatsProductHistory` (`packages/@verone/marketing/src/hooks/use-channel-stats-product-history.ts`) résoudrait le problème et n'est appelé par personne. → le brancher.

**[MINEUR] Pagination non branchée dans la bibliothèque média** — `MediaLibrary/MediaLibraryView.tsx:77-78,89` — `hasMore`/`loadMore` préfixés `_` donc jamais utilisés, `pageSize: 1000` : au-delà de 1 000 visuels les plus anciens sont inatteignables et le compteur est faux. → « Charger plus » ou scroll infini.

**[MINEUR] Code mort exporté** — `packages/@verone/marketing/src/components/index.ts:1` → `PromptBuilder.tsx` (207 l.), `PromptPreview.tsx` (121 l.), `ProductInput.tsx` : aucun consommateur, la page `/marketing/prompts` monte `MarketingStudio` (`page.tsx:18`). `PromptBuilder` crée en prime un client Supabase au niveau module (`:25`). Idem `useChannelStatsProductHistory` (`hooks/index.ts:8`), zéro consommateur. → supprimer, garder `BrandSelector`/`PresetSelector`.

### Code mort armé (à supprimer, pas à corriger)

**[MAJEUR] `app/actions/bank-matching.ts` — 380 lignes sans aucun appelant** — `:130-148` — `matchTransactionToOrder` crée une facture et la marque payée mais n'écrit ni `transaction_document_links`, ni `bank_transactions.matching_status` : la transaction resterait re-matchable indéfiniment. Aucun `revalidatePath`, aucune idempotence, et le contrôle `matching_status !== 'unmatched'` (`:84`) est un TOCTOU par rapport à l'insert (`:98`). Diverge de la logique réelle (RPC `link_transaction_to_document`) et sera reprise par erreur. → supprimer `bank-matching.ts` et `bank-matching-helpers.ts`.

**[MINEUR] `matchTransaction` est un stub qui retourne toujours `{ success: true }`** — `packages/@verone/finance/src/hooks/use-bank-reconciliation.ts:456-464`, exporté ligne 485 — tout appelant futur affichera un succès sans rapprochement. → retirer de l'objet retourné.

**[MINEUR] Injection de filtre PostgREST via les champs de recherche** — `packages/@verone/products/src/hooks/sourcing/use-supplier-search.ts:37`, `site-internet/components/ActivateExistingForm.tsx:69`, `use-variant-products.ts:348` — `.or(\`trade_name.ilike.%${q}%\`)`avec`q`non échappé : saisir`x,archived_at.not.is.null`ajoute une clause OR arbitraire. Borné par la RLS aujourd'hui, critique dès que le motif est copié dans une route service-role. Le bon motif existe dans`use-media-assets.ts:120`. → échapper ou passer par un RPC paramétré.

**[MINEUR] Validation d'upload uniquement côté client** — `canaux-vente/linkme/hooks/use-document-upload.ts:83-121`, `packages/@verone/utils/src/upload/supabase-utils.ts:267` (`contentType: file.type` propagé tel quel) — `file.type` est déclaratif. Un client HTTP direct envoie un `.html` ou `.svg` en déclarant `image/png` ; si le bucket est public, XSS stockée sur le domaine Supabase. Chemin partiellement devinable (`${category}/${orderId}/${Date.now()}-${6 caractères aléatoires}`). Le motif correct existe dans `api/qonto/attachments/upload/route.ts:28-80`. → route API validant les magic bytes, `crypto.randomUUID()` pour le chemin, buckets privés + URL signées.

---

## Lot 6 — Socle de test

**[CRITIQUE] Le schéma n'est pas reconstructible depuis les migrations** — 770 fichiers, 93 `CREATE TABLE` pour **133 tables réelles** : **59 tables sont `ALTER`ées mais jamais `CREATE`ées**, dont `products`, `organisations`, `sales_orders`, `stock_movements`, `categories`, `collections`, `contacts`. Aucun baseline SQL, aucun dump, aucun `config.toml` (`supabase/` ne contient que `migrations/`). Conséquence directe : **aucun environnement de test reproductible**. → `pg_dump --schema-only` committé comme `00000000000000_baseline.sql`. Résout aussi partiellement le blocage `supabase db push` noté dans `ACTIVE.md`.

**[CRITIQUE] Lancer les tests peut écrire dans la production** — `tests/database/stock-alerts-migrations.spec.ts` et `tests/fixtures/` (`seedStockAlertsTestData`/`cleanupStockAlertsTestData`) écrivent dans la base pointée par `NEXT_PUBLIC_SUPABASE_URL` ; `turbo.json` expose `SUPABASE_SERVICE_ROLE_KEY` à la tâche `test:e2e`. → `assertTestEnvironment()` en `globalSetup`, refus de démarrer si l'URL n'est pas celle de la branche de test.

**[MAJEUR] 35 fichiers de test pour 3 169 fichiers source (1,1 %), 5 931 lignes (1,0 %)** — 16/35 n'assertent que « la page charge » ; **0 test sur les 151 route handlers** ; 6 tests unitaires seulement, et **aucun `vitest.config`/`jest.config` committé** — rien ne prouve qu'ils tournent. 20 fichiers interagissent (`.click()`), 11 déclenchent une écriture. Modules critiques sans aucun test fonctionnel : `finance/tva`, `bilan`, `grand-livre`, `echeancier`, `immobilisations`, `tresorerie`, `cloture`, le moteur `apply_matching_rule` (recréé 6× en migration), `depenses`, **l'intégration Qonto** (`packages/@verone/integrations/src/qonto/client.ts`, 1 654 lignes, le plus gros fichier écrit à la main du repo), Revolut, Packlink + webhook, Gmail inbound, messagerie, Pinterest, Meta, Google Merchant, journal, marques, `admin/users` + rôles, notifications, roadmap, **commission et rétrocession LinkMe** (39 migrations correctives), les 496 policies RLS, les 18 server actions, les 30 routes service-role. → `@verone/domain` pour les calculs purs, couverture 80 % de branches ; modèle : `packages/@verone/finance/src/lib/finance-totals/__tests__/compute.test.ts` (598 lignes, de bonne qualité).

---

## Lot 8 — Architecture

**[CRITIQUE] Quatre copies divergentes des types Supabase** — `packages/@verone/types/src/supabase.ts` (15 974 l., **133 tables**, 29 vues, 325 fonctions, 45 enums) ; `apps/back-office/src/types/supabase.d.ts` (15 048 l., 123 tables — et **code mort type-checké**, car `@/types/supabase` résout vers `supabase.ts` que TypeScript préfère au `.d.ts`) ; `packages/@verone/types/packages/@verone/types/src/supabase.ts` et `packages/@verone/types/apps/back-office/src/types/supabase.ts` (10 435 l., 83 tables, **189 entités de retard**). Plus un 5ᵉ manifeste `@verone/types` dans `packages/@verone/ui/packages/@verone/types/package.json` avec un `exports` map différent. Total 51 892 lignes, 8,8 % du repo. 25 entités présentes dans la référence et absentes du back-office : `articles`, `linkme_payments`, `scheduled_publications`, `media_asset_analytics`, `pinterest_pin_syncs`, `channel_stats_snapshots`… → `git rm` les 3 copies et les répertoires imbriqués, un seul générateur, check CI bloquant sur le nombre de copies.

**[CRITIQUE] 13 cycles mutuels entre packages, 105 cycles élémentaires ≤ 4** — `collections↔common`, `common↔finance`, `common↔orders`, `common↔organisations`, `common↔products`, `consultations↔products`, `customers↔organisations`, `dashboard↔stock`, `finance↔orders`, `orders↔organisations`, `organisations↔products`, `products↔stock`, `products↔ui-business`. Exemples vérifiés : `finance/src/components/InvoiceCreateServiceModal.tsx:20` importe `@verone/orders/...`, `orders/src/components/sales-orders-table/SalesOrderModals.tsx:5` importe `@verone/finance/components` ; `common/src/components/collections/CollectionGrid.tsx:8` importe `@verone/products`, `products/src/components/sections/SupplierEditSection.tsx:13` importe `@verone/common/hooks/use-inline-edit`. `common`, couche basse, importe `finance`, `orders`, `organisations` et `products`. `orders`+`finance`+`products`+`common` = 146 399 lignes indivisibles. Aucun de ces packages n'a de script `build`, ce qui masque le problème : dès qu'on en ajoute un, `dependsOn: ["^build"]` boucle. En plus, `madge` détecte 14 cycles au niveau fichier (dont `use-products.ts ↔ products-fetcher.ts`, `RecipientSelector.tsx ↔ SendDocumentEmailModal.tsx`). → `dependency-cruiser` bloquant (déjà en dépendance).

**[CRITIQUE] 41 % des dépendances inter-packages non déclarées** — 41 arêtes sur 101 absentes des `package.json` ; 21 packages sur 24 ont des dépendances **externes** non déclarées. Résolution par hoisting pnpm : casse à la première montée de version ou en mode `strict`. `back-office` déclare 5 des 21 packages qu'il utilise. → déclarer, puis vérifier en CI.

**[CRITIQUE] Deux conventions de nommage de migrations, 415 fichiers en collision de préfixe** — `YYYYMMDD_NNN_` (418 fichiers) vs `YYYYMMDDHHMMSS_` (352) ; 76 préfixes dupliqués couvrant 415 fichiers (max : `20251222` = 22 fichiers) ; 19 jours mélangeant les deux. L'ordre d'application n'est pas déterministe. → convention unique, et le baseline du Lot 6 permet de repartir propre.

**[MAJEUR] 227 migrations sur 770 (29,5 %) ont `fix` dans le nom ; 92 (12 %) sont des correctifs de données pures ; 26 portent le nom d'un enregistrement métier** (`pokawa`, `link_230009`, `dco_0003`, `opjet`, `separateur_terrasse`) — signe que chaque problème client se résout par une écriture SQL manuelle plutôt qu'une correction de logique. Churn : `create_affiliate_order` recréée 16 fois, `get_public_selection` 13, `get_public_selection_by_slug` 10, `create_public_linkme_order` 10. 496 `CREATE POLICY` / 360 `DROP POLICY`, 198/178 triggers, 142 fonctions droppées.

**[MAJEUR] 94 % des types sont écrits à la main** — 4 928 déclarations (3 740 `interface` + 1 188 `type`), dont **291 (5,9 %)** dérivées de `Database[...]['Row']`. `Product` redéclaré **34 fois**, `Organisation` 27, `ProductImage` 29, `StockMovement` 10, `OrderItem` 8, `SalesOrder` 7. → dériver de la base, un type par entité.

**[MAJEUR] Aucune couche d'accès aux données** — **9 façons** distinctes de créer un client Supabase ; 2 103 appels `.from(...)` dispersés sur 136 tables ; mécanismes coexistants : react-query 205 `useQuery` / 181 `useMutation`, SWR 4, `useEffect`+supabase 238 fichiers, hook maison `useSupabaseQuery` 9, 18 server actions, 151 route handlers ; **187 racines de `queryKey` distinctes**, aucune key factory. Formulaires : `react-hook-form` 14 fichiers vs `handleSubmit` manuel 83.

**[MAJEUR] Une route API exécute du DDL via un RPC `exec_sql` arbitraire** — chemin d'écriture au schéma **hors migrations**, invisible du `db-drift-check`. → fermer.

**[MAJEUR] `@verone/types` a une dépendance runtime sur `lucide-react`, non déclarée** — `packages/@verone/types/src/variant-groups.ts:296` importe des **valeurs** (`Minimize`, `Building2`, `Rocket`…) pour `DECORATIVE_STYLES`, et `src/index.ts:14` fait `export * from './variant-groups'` (pas `export type *`). `package.json` : `"dependencies": {}`. Le package censé être la feuille du graphe est un module React, chargé par ses 231 consommateurs dont les 151 route handlers et les 18 server actions — poids de bundle inutile, et erreur potentielle en Edge Runtime ou script Node pur. → déplacer les constantes porteuses d'icônes vers `@verone/ui`, passer les `export *` en `export type *` (3 le sont déjà).

**[MAJEUR] Répertoires de packages dupliqués récursivement** — `packages/@verone/types/packages/@verone/types/`, `packages/@verone/types/apps/back-office/src/types/`, `packages/@verone/ui/packages/@verone/types/`. → supprimer, et `pnpm-workspace.yaml` avec `!**/packages/**/packages/**`.

**[MAJEUR] 222 fichiers > 400 lignes, seuil documenté jamais outillé** — `CLAUDE.md` dit « > 400 lignes = refactoring obligatoire », la règle ESLint réelle est `max-lines: ['warn', 500]` (`docs/current/AUDIT-MAX-LINES-2026-04-14.md:3`). État : 222 > 400, 51 > 500, 2 > 800, 1 > 1 200. Progrès réel sur 500 (95 → 51 depuis avril). Répartition des 222 : back-office 99, orders 21, finance 19, stock 14, products 14, consultations 7, organisations 6, linkme 6. Priorité aux 5 fichiers > 600 lignes des packages partagés (impact multi-app) : `qonto/client.ts` (1 654, sans aucun test, 3,3× le plafond), `use-consultations.ts` (1 098), `VariantGroupCreationWizard.tsx` (755), `use-stock-movements.ts` (734), `CommercialEditSection.tsx` (612). → un seul seuil, en `error`, avec ratchet (`docs/current/eslint-progressive-ratchet.md` existe déjà).

**[MINEUR] 66 groupes de fichiers byte-identiques (132 fichiers)** · **5 alias `tsconfig` vers des packages inexistants** (`@verone/kpi`, `config`, `suppliers`, `testing`, `admin`) · **packages sans consommateur** : `logistics` 0, `tokens` 0 (via `themes` uniquement), `eslint-config` et `prettier-config` vides · **5 packages sur 24 ont un script `build`** alors que `turbo.json` a `dependsOn: ["^build"]`.

**[MINEUR] Documentation désynchronisée** — `INDEX-PAGES-BACK-OFFICE.md` : 146 routes documentées, 2 obsolètes, **24 réelles non documentées**, « dernière mise à jour 2026-04-16 » (3,5 mois). Deux fichiers déclarés « source de vérité » dans `CLAUDE.md` sont **absents** de `docs/current/` : `INDEX-COMPOSANTS-FORMULAIRES.md` et `DEPENDANCES-PACKAGES.md`. Dernier ADR : ADR-033 du 2026-05-09, soit 2,7 mois de décisions non tracées alors que les migrations vont jusqu'au 2026-07-23.

---

## Annexe — mesures de référence

À relever à nouveau après chaque lot pour mesurer le progrès.

| Mesure                         | 2026-07-30                       | Source                |
| ------------------------------ | -------------------------------- | --------------------- |
| `user_app_roles.seq_scan`      | 255 941 505                      | `pg_stat_user_tables` |
| `user_app_roles` tuples lus    | 1 318 222 852                    | idem                  |
| `user_profiles.seq_scan`       | 32 893 282                       | idem                  |
| Planning time d'un `count(*)`  | 5,2 ms / 1 972 buffers           | `EXPLAIN`             |
| `get_site_internet_products()` | 243 ms / 12 709 buffers / 497 kB | `EXPLAIN ANALYZE`     |
| Routes API sans auth           | 86 / 151                         | grep                  |
| Routes de mutation sans auth   | 62 / 115                         | grep                  |
| Routes avec Zod                | 36 / 151                         | grep                  |
| Advisors sécurité              | 682 (4 ERROR, 678 WARN)          | MCP Supabase          |
| Advisors performance           | 527                              | idem                  |
| Index inutilisés               | 243 / 911                        | idem                  |
| FK sans index                  | 27                               | idem                  |
| Fichiers de test               | 35 / 3 169 (1,1 %)               | find                  |
| LOC de test                    | 5 931 / 588 068 (1,0 %)          | wc                    |
| Pages couvertes par le smoke   | 106 / 168                        | grep                  |
| `tsc --noEmit`                 | 0 erreur                         | `pnpm type-check`     |
| Cycles madge (niveau fichier)  | 14                               | `pnpm audit:cycles`   |
| `any`                          | 96                               | grep                  |
| `@ts-ignore`                   | 0                                | grep                  |
| `eslint-disable`               | 354                              | grep                  |
| Fichiers > 400 lignes          | 222                              | awk                   |
