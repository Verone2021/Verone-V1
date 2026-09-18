# Prompt à copier-coller en début de prochaine session

> Pour reprendre le système marketing après merge de la PR #992.
> Date : 2026-05-10. Auteur : Roméo Dos Santos.

---

## PROMPT (à copier-coller en bloc dans une nouvelle session Claude Code)

```
Tu reprends le chantier marketing Verone après le merge de la PR #992
(branche feat/BO-MKT-METRICS-001-stats-history → staging au 2026-05-10,
14 commits, 11 sprints livrés).

═══════════════════════════════════════════════════════════════════════
LECTURE OBLIGATOIRE AVANT TOUTE ACTION (dans cet ordre)
═══════════════════════════════════════════════════════════════════════

1. docs/scratchpad/handoff-2026-05-10-marketing-system.md
   → état complet, credentials, fichiers critiques, procédure activation

2. docs/scratchpad/audit-2026-05-10-marketing-system-gaps.md
   → plan complet 11 sprints + benchmark industrie (8 outils leaders)

3. .claude/local/CREDENTIALS-VAULT.md (gitignored)
   → Meta Business Manager IDs, System User VeroneCatalog,
     credentials Vercel, Supabase, etc.

4. CLAUDE.md racine + .claude/rules/ pour règles projet

═══════════════════════════════════════════════════════════════════════
OBJECTIFS DE LA SESSION (2 phases, dans l'ordre)
═══════════════════════════════════════════════════════════════════════

PHASE 1 — Activer la lecture des stats Meta Insights (priorité Roméo)
─────────────────────────────────────────────────────────────────────
[BO-MKT-META-TOKEN] dans .claude/work/ACTIVE.md

L'Edge Function sync-meta-image-insights est entièrement codée (cf.
supabase/functions/sync-meta-image-insights/index.ts), il manque juste
les bons droits côté Meta. Procédure dans handoff section "Activation
finale Meta Insights" :

1. Via MCP Playwright sur business.facebook.com, assigner la Page
   Facebook Vérone (461826940345802) au System User VeroneCatalog
   (ID 61577061585498), portefeuille business 222452897164348.
   Permission : Contrôle total.

2. Régénérer un token sur ce System User avec les scopes :
   - catalog_management (déjà)
   - business_management (déjà)
   - pages_read_engagement (NOUVEAU)
   - instagram_basic (NOUVEAU)
   - instagram_manage_insights (NOUVEAU)

3. Mettre à jour META_ACCESS_TOKEN dans Vercel pour les 3 envs
   du projet verone-back-office (production, preview, development)
   ET pour le projet veronecollections-fr (site-internet).

4. Mettre le même token dans Supabase Edge Functions secrets
   (Dashboard > Edge Functions > Manage secrets) sous la clé
   META_ACCESS_TOKEN.

5. Déployer l'Edge Function (si pas déjà fait via le merge PR #992) :
   supabase functions deploy sync-meta-image-insights

6. Tester :
   curl -X POST https://aorroydfjsrygmosnzrl.supabase.co/functions/v1/sync-meta-image-insights \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
   Réponse attendue : { ok: true, ig_user_id: "17841...",
   posts_fetched: N, posts_matched: M, upserted: M, errors: [] }

7. Programmer l'Edge Function en cron quotidien 04:00 UTC via
   pg_cron.schedule(...) (ajouter une migration dédiée, cf. pattern
   du Sprint 0 pour pg_cron.schedule de snapshot_channel_stats).

8. Vérifier dans le back-office que /marketing/performance >
   onglet "Top images" affiche les images avec les KPIs réels.

PHASE 2 — Coder la publication automatique multi-canal (3-4h dev)
─────────────────────────────────────────────────────────────────
[BO-MKT-PUB-AUTO] dans .claude/work/ACTIVE.md

Note : Roméo a dit que ce n'est pas primordial — il préfère continuer
à publier manuellement depuis l'app Meta. Mais il accepte qu'on fasse
les deux phases d'un coup tant qu'on est dans le sujet. Confirme avec
lui en 1 phrase au début de session si tu enchaînes Phase 2 ou si tu
t'arrêtes après Phase 1.

Si Phase 2 : implémenter la logique des 2 Edge Functions squelettes :

1. supabase/functions/run-scheduled-publications/index.ts
   - SELECT scheduled_publications WHERE status='pending'
     AND scheduled_at <= now() ORDER BY scheduled_at ASC LIMIT 50
   - UPDATE status='publishing' (atomique)
   - Selon channel_code :
     * meta/instagram : POST /{ig-user-id}/media (créer container)
       puis POST /{ig-user-id}/media_publish (publier)
     * pinterest : POST /v5/pins (Phase 2.b)
     * site_internet : INSERT dans table CMS interne (à définir)
   - UPDATE status='published', external_url=permalink IG retourné,
     published_at=now()
   - Si erreur : UPDATE status='failed', error_message, retry_count++.
     Si retry_count<3 : remettre status='pending' (re-essai au cycle
     suivant).

2. supabase/functions/sync-pinterest-pins/index.ts
   - Pré-requis : créer compte Pinterest Business Account + générer
     PINTEREST_ACCESS_TOKEN (out-of-scope cette session, déléguer
     à Roméo si pas encore fait)
   - Logique similaire à sync-meta-image-insights mais avec
     Pinterest API v5 (/v5/pins/{id}/analytics)

3. Programmer les 2 Edge Functions en cron via pg_cron :
   - run-scheduled-publications : */5 * * * * (toutes les 5 min)
   - sync-pinterest-pins : 0 4 * * * (quotidien 04:00 UTC)

4. Tester le flow complet :
   - Bibliothèque images : sélectionner image approuvée
   - Bouton "Publier sur N canaux" → CrossPostModal
   - Programmer pour dans 1 minute
   - Attendre que run-scheduled-publications l'exécute
   - Vérifier que la publication apparaît bien sur IG
   - Vérifier que /marketing/calendrier affiche le statut "published"
     avec external_url cliquable

═══════════════════════════════════════════════════════════════════════
RÈGLES STRICTES (déjà violées dans la session précédente — à respecter)
═══════════════════════════════════════════════════════════════════════

1. ZÉRO PUSH ENTRE SOUS-TÂCHES : 1 chantier multi-phases = 1 SEULE PR
   à la toute fin avec tous les commits. Pas de PR par bloc.
   Cf. .claude/rules/workflow.md ADR-031 + memory feedback_one_pr_for_whole_chantier.md.

2. ESLint error/warning bloque commit → INVOKER /fix-warnings
   IMMÉDIATEMENT, pas de fix manuel. Cf. memory feedback_eslint_use_fix_warnings.md.

3. Plan macro validé par Roméo = autorisation pour TOUTES les
   migrations DB internes au plan. Ne pas redemander confirmation
   avant chaque migration. Cf. memory feedback_no_re_ask_after_macro_plan.md.

4. Anti-paralysie de choix : agent décide seul sur git/CI/sous-agents/
   ordre tâches. Roméo sollicité QUE sur DB nouvelle, irréversible,
   business, financier. Cf. .claude/rules/communication-style.md règle 6.

5. Communication français simple, pas de jargon technique, pas de
   commande shell dans les messages à Roméo. Cf. .claude/rules/
   communication-style.md.

6. JAMAIS git worktree add. JAMAIS pnpm dev. JAMAIS --no-verify.
   Cf. CLAUDE.md INTERDICTIONS ABSOLUES.

7. Avant toute migration DB : lire docs/current/database/schema/
   du domaine concerné. Toute colonne JSONB doit avoir CHECK
   jsonb_typeof = 'object'. Cf. .claude/rules/database.md R-JSONB.

8. Régénération types Supabase obligatoire dans la même PR si la
   migration touche un RPC, fonction DB ou colonne. Cf. .claude/rules/
   workflow.md checklist question 4.

═══════════════════════════════════════════════════════════════════════
CRITÈRES DE FIN DE SESSION (Phase 1 minimum)
═══════════════════════════════════════════════════════════════════════

- [ ] Token VeroneCatalog régénéré avec scopes IG (étapes 1-2)
- [ ] META_ACCESS_TOKEN mis à jour dans Vercel + Supabase secrets
- [ ] Edge Function sync-meta-image-insights testée manuellement,
      retourne ok=true et upserted > 0 si publications IG existent
      avec external_url renseigné dans media_asset_publications
- [ ] Cron pg_cron quotidien programmé pour sync-meta-image-insights
- [ ] Page /marketing/performance onglet Top images affiche des
      données réelles (pas l'empty state)

Phase 2 (optionnelle) :

- [ ] run-scheduled-publications publie réellement sur IG
- [ ] CrossPostModal fonctionne end-to-end (programmation → publication)
- [ ] /marketing/calendrier affiche les statuts à jour

═══════════════════════════════════════════════════════════════════════
SI BLOCAGE
═══════════════════════════════════════════════════════════════════════

Cas 1 : token Meta refuse les scopes IG
- Vérifier que la Page Vérone est bien assignée au System User
- Vérifier que l'app Meta a le produit "Instagram Graph API" activé
  (via developers.facebook.com/apps/{app_id}/dashboard)
- Vérifier que le compte IG @veronecollections est bien un Business
  Account (pas Personal/Creator), via app Instagram > Settings >
  Account type

Cas 2 : posts_matched: 0 dans le test sync
- Les media_asset_publications n'ont pas d'external_url IG renseignée
- Soit ajouter une route POST /api/marketing/publications/{id}/link
  pour permettre à Roméo de coller l'URL IG manuellement après chaque
  publication (workaround court-terme)
- Soit attendre Phase 2 où run-scheduled-publications remplira
  automatiquement external_url à la publication via API

Cas 3 : Edge Function timeout
- Timeout par défaut Supabase = 60s. Si > 50 publications IG :
  paginer la pull en batches de 25 + commit progressif.

Cas 4 : autre blocage technique
- Documenter dans docs/scratchpad/blocked-{date}-{topic}.md
- Demander à Roméo UNIQUEMENT si ça touche les 4 cas règle 6
  (DB nouvelle, irréversible, business, financier)
- Sinon : décider seul + tracer la décision dans le commit

Bon courage. Tout le contexte est dans handoff-2026-05-10-marketing-system.md.
```

---

## Fichiers que l'agent doit lire en début de session

Ordre de priorité :

1. **`docs/scratchpad/handoff-2026-05-10-marketing-system.md`** — état complet
2. **`docs/scratchpad/audit-2026-05-10-marketing-system-gaps.md`** — plan + benchmark
3. **`.claude/local/CREDENTIALS-VAULT.md`** — credentials Meta (gitignored)
4. **`CLAUDE.md`** racine — règles projet
5. **`.claude/rules/workflow.md`** — règle ZÉRO PUSH ENTRE SOUS-TÂCHES
6. **`.claude/rules/communication-style.md`** — règle 6 anti-paralysie
7. **`.claude/work/ACTIVE.md`** — file de tâches active

## Fichiers code à connaître (référence)

### Edge Functions Meta

- `supabase/functions/sync-meta-image-insights/index.ts` — Phase 1 (entièrement codé, à activer)
- `supabase/functions/run-scheduled-publications/index.ts` — Phase 2 (squelette à compléter)
- `supabase/functions/sync-pinterest-pins/index.ts` — Phase 2.b (squelette à compléter)

### Code applicatif

- `apps/site-internet/src/components/analytics/MetaPixel.tsx` — Pixel + helpers track\*()
- `apps/site-internet/src/lib/meta-capi.ts` — server CAPI
- `apps/site-internet/src/app/api/marketing/capi/event/route.ts` — endpoint CAPI

### Hooks marketing

- `packages/@verone/marketing/src/hooks/use-top-images.ts`
- `packages/@verone/marketing/src/hooks/use-scheduled-publications.ts`
- `packages/@verone/marketing/src/hooks/use-ai-usage.ts`

### Migrations DB

- `supabase/migrations/20260510130000_*` à `20260510180000_*` (6 migrations marketing)

### Pages back-office

- `apps/back-office/src/app/(protected)/marketing/performance/page.tsx`
- `apps/back-office/src/app/(protected)/marketing/calendrier/page.tsx`
- `apps/back-office/src/app/(protected)/parametres/ia-usage/page.tsx`
- `apps/back-office/src/app/(protected)/canaux-vente/pinterest/page.tsx`
