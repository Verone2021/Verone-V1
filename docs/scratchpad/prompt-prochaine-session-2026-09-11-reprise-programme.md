# Prompt de reprise — programme back-office Vérone (préparé le 2026-09-11, 21 h 35)

À coller **tel quel** dans une nouvelle conversation Claude Code ouverte dans `~/verone-back-office-V1`.

---

```
Dossier : ~/verone-back-office-V1

## Règle de conduite de cette conversation (demandée par Roméo)
Au moindre doute, sur quoi que ce soit, tu poses la question avec AskUserQuestion
AVANT d'agir. Tu ne supposes rien. Toute écriture en base = accord écrit de Roméo.
Communication : français simple, pas de jargon (cf. .claude/rules/communication-style.md).

## 0. Vérifications d'ouverture (lecture seule, à écrire en tête de ta première réponse)
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis l'état, ne touche à rien.
4. GitHub : le compte actif du poste est WantitNow. Pour tout accès au dépôt Vérone
   (fetch, push, gh), préfixer GH_TOKEN="$(gh auth token -u Verone2021)". Ne pas changer le compte actif.
5. Shell : utiliser /usr/bin/grep (le grep du poste ignore les fichiers gitignorés) ;
   zsh ne découpe pas `for x in $VAR` (utiliser des tableaux).
6. Back-office local : port 3000 (LinkMe 3002, site 3001). Ne jamais lancer `pnpm dev`.

## 1. Lire, dans cet ordre
  .claude/work/ACTIVE.md — section « ▶ SESSIONS À FAIRE, DANS L'ORDRE »
  docs/scratchpad/audit-2026-09-11/SESSIONS-2026-09-11.md — ordre complet et état
  docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md — programme P1-P13,
    décisions Roméo (§ 7), modèle cible (§ 8), contrat du plugin Chrome (§ 5), prompt modèle (§ 11)
  docs/scratchpad/dev-report-2026-09-11-S1-fonctions-anon-etape1.md — sécurité S1 (lots 1 à 6)
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md — performance (causes mesurées)
Règles : CLAUDE.md, .claude/rules/workflow.md, database.md, database-modeling-patterns.md,
stock-triggers-protected.md, finance.md, non-regression.md, no-phantom-data.md.

## 2. État exact au 2026-09-11 21 h 35

### Fait
- P1 Want It Now : 3 corrections de revue commitées en local sur
  feat/VER-CANAL-WIN-001-flux-want-it-now (commit f20c73d4), 16/16 tests, re-revue PASS.
  La branche a 7 commits locaux NON poussés ; la migration Want It Now est déjà en production.
- S1 lot 1 (accord écrit de Roméo) APPLIQUÉ en production le 2026-09-11 vers 21 h 33 :
  13 signatures fermées au public (invoke_edge_function, set_closed_fiscal_year,
  reset_po/so_sequence_to_max, resync_all_product_stocks, cleanup_auto_suppliers,
  test_custom_access_token_hook, debug_auth_uid → postgres/service_role seulement ;
  delete_organisation_safe, mark_payment_received, mark_po_payment_received ×2,
  reset_finance_auto_data → authenticated + service_role). Inscrit au carnet :
  20260911213000 bo_audit_sec_s1_lot1_revoke_public_dangerous_functions.
  Vérifié : anon refusé (42501), RPC publiques du site et de LinkMe toujours ouvertes,
  compteur SECURITY DEFINER exécutables par anon 332 → 319.
  ⚠️ Le fichier supabase/migrations/20260911213000_bo_audit_sec_s1_lot1_revoke_public_dangerous_functions.sql
  est NON SUIVI par git dans l'arbre de la branche Want It Now : NE PAS l'ajouter à cette branche.

### À faire, dans l'ordre (demander confirmation à Roméo avant chaque étape qui écrit)
1. Déjà vérifié le 2026-09-11 : le cron `run-scheduled-publications-every-5min` a tourné avec succès
   à 19:35 UTC, après le lot 1. Contrôle rapide à refaire (cron.job_run_details, dernières exécutions
   `succeeded`) ; en cas d'échec : retour arrière du lot 1 pour invoke_edge_function (GRANT listé en
   tête du fichier de migration) et prévenir Roméo.
2. Want It Now : demander à Roméo s'il donne le « go » pour UN push de la branche et une PR vers
   staging SANS fusion automatique (dépôt privé offre Free : vérifier les 4 contrôles requis à la main).
   Release staging → main = Roméo seul.
3. S1 suite :
   a) branche fix/BO-AUDIT-SEC-S1-fonctions-anon depuis staging à jour ; y committer le fichier de
      migration du lot 1 + le fichier local manquant de 20260731075651 bo_audit_003_guard_reset_finance_auto_data
      (reconstruit depuis pg_get_functiondef, SANS le rejouer).
   b) Lot 2 : garde de rôle (utilisateur back-office actif, sinon 42501) dans delete_organisation_safe,
      mark_payment_received, mark_po_payment_received ×2. Roméo veut : seuls les utilisateurs connectés
      au back-office (admin/owner) peuvent faire ces actions, jamais un non-connecté ni un affilié LinkMe.
      Montrer le SQL complet, accord écrit, types régénérés.
   c) Lots 3 à 6 (F4, F3, F1 après démonstration sur copie, ALTER DEFAULT PRIVILEGES + contrôle CI),
      un par un, SQL montré, accord écrit.
4. S2 contrôle central d'accès (sessions/session-2-controle-central-acces.md), mode observation.
5. S3 menu de gauche + en-tête, S4 contrôle CI de dérive (fichiers sessions/).
6. Programme P2a → P13 (rapport sourcing § 10) : consultations (bugs de données) puis sourcing puis
   consultation projet + produits similaires. Chaque phase : ÉTAPE 1 lecture, ÉTAPE 2 proposition
   (+ accord si base), ÉTAPE 3 implémentation + vérifications + reviewer-agent, ÉTAPE 4 un push, PR.

### Décisions déjà prises par Roméo (ne pas redemander)
4 étapes sur la fiche sourcing · échantillon suivi automatiquement depuis la commande fournisseur ·
refus après catalogue = retrait avec motif, restaurable, retour sur les canaux d'avant · « Validé au
catalogue » non publié par défaut · consultation = projet (1 client, plusieurs fournisseurs, plusieurs
options par besoin présentées au client, fournisseurs jamais visibles) · marge par consultation =
coefficient sur prix de revient (achat + livraison + douane), 40 % ⇒ × 1,40 · transport et douane
saisis par projet et répartis au prorata · ménage autorisé à prévoir (tables sample_orders vides,
5 fonctions SQL mortes, produit TEST), chaque suppression remontrée avant · ordre Want It Now →
sécurité → consultations → sourcing → projet + similaires · plugin Chrome à ne jamais casser.

## 3. Interdits permanents
Aucun trigger stock modifié · aucune route Qonto modifiée · `supabase db push` interdit (execute_sql
après accord) · aucune donnée de test · aucune suppression de ligne sans accord · jamais d'envelopper
is_backoffice_user() en (select …) dans une policy · jamais --no-verify · jamais `git add -A`
(des rapports archivés et des fichiers non suivis traînent dans l'arbre : ajouter fichier par fichier) ·
aucun commit ni push sans ordre de Roméo.

## 4. Ta première réponse
Les vérifications d'ouverture, puis en 5 lignes : ce que tu as compris de l'état et la première action
que tu proposes. Puis AskUserQuestion pour confirmer avant d'agir.
```
