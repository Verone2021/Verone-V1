# Session 01 — AUDIT COMPLET : performance à 100 %, sécurité, scalabilité

Lecture seule intégrale. Aucune écriture en base, aucun commit de code. Sortie = un rapport avec commandes + notes sur 100
sur la grille de juillet (sécurité 25, stabilité 25, performance 20, scalabilité 15, tests 15 ; cible 80) + un plan chiffré.
À lancer **après la session 00**, hors heures ouvrées pour la partie base (V8).

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/feuille-de-route-2026-09-16/README.md
  docs/audit-2026-07-30/FINDINGS.md et PLAN-CORRECTION.md (référence de juillet)
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (mesures du 11/09, 38 commandes)
  ~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/audit-perf-scalabilite-2026-09-11.md (Cowork)
  ~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/compte-rendu-etat-back-office-2026-09-15.md
  ~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-session-00.md
Référentiels à citer : OWASP API Security Top 10 (2023) ; Supabase « RLS Performance and Best Practices » ; Supabase
Database Advisors ; Next.js 15 docs (rendering, caching, bundle analysis) ; Web Vitals.
Règle de méthode : un chiffre sans sa commande n'entre pas dans le rapport ; ce qui contredit juillet ou septembre se dit.

═══ PARTIE 1 — PERFORMANCE BASE (rôle réel, jour ouvré neuf) ═══
1.1 `pg_stat_statements` : demande à Roméo l'accord pour `select pg_stat_statements_reset()` (statistiques seulement,
    aucune donnée) pour repartir sur une fenêtre propre depuis le 15/09 14 h ; sinon travaille sur `edge_logs` +
    `queryid` apparus après cette date. Top 25 par temps total, par appels, par temps moyen ; part Realtime, part
    `get_sidebar_counts`, part `get_site_internet_products`, part CI (`information_schema`), part Studio.
1.2 Les 10 requêtes les plus lentes au p95 des logs passerelle du 16/09 : pour chacune `EXPLAIN (ANALYZE, BUFFERS)`
    sous `authenticated` (ou `anon` pour le site) avec un vrai jwt, planning vs exécution, index manquants, sous-plans
    exécutés N fois, vues imbriquées. Obligatoires : `linkme_orders_enriched`, `get_site_internet_products`,
    `get_stock_alerts_count` / `stock_alerts_unified_view`, `products` avec relations, `notifications`.
1.3 Realtime : `pg_publication_tables`, canaux restants dans le code (`grep "\.channel("`), part du temps base, ce que
    chaque canal apporte réellement aux salariés. Recommandation : garder / réduire / couper, avec le gain attendu.
1.4 Advisors performance : compte par type, 27 FK non indexées à trier (utiles / inutiles à 236 produits), 238 index
    inutilisés (poids en écriture), 3 dupliqués.
1.5 Instance : `shared_buffers`, `work_mem`, `max_connections`, `statement_timeout` par rôle ; CPU et mémoire sur 7 jours
    (tableau Supabase, capture) ; nombre de connexions pic ; verdict : l'instance actuelle suffit-elle une fois le
    polling retiré, ou non — avec les chiffres.
1.6 Volume : taille base, `user_activity_logs` / `audit_logs` (62 %), proposition de rétention chiffrée (décision Roméo).

═══ PARTIE 2 — PERFORMANCE APPLICATION (navigateur, serveur local de Roméo, lane-1, session connectée) ═══
2.1 8 pages × 3 chargements à 1440 px : tableau de bord, catalogue, fiche produit, Inventaire, sourcing liste, sourcing
    fiche, consultation, commandes clients. Pour chaque : requêtes réseau (Supabase / `/api/*` / statiques), temps
    jusqu'au repos réseau, poids transféré, boucles requête-par-élément (fichier:ligne), erreurs console.
2.2 3 minutes sans action sur tableau de bord et sur catalogue : 0 appel attendu.
2.3 Bundles : `ANALYZE=true pnpm --filter @verone/back-office build` (ou l'analyseur configuré) : 10 pages les plus
    lourdes, dépendances lourdes (`lucide` complet, `date-fns` locale, `recharts`…), composants client qui pourraient
    être serveur, `sideEffects`, `optimizePackageImports`.
2.4 Lighthouse sur 4 pages (tableau de bord, catalogue, fiche produit, consultation) : LCP, INP, CLS, TBT — rendu seul,
    ne pas confondre avec la note globale.
2.5 Images : formats servis, tailles, `next/image` utilisé ou non, `imagedelivery.net` variants.
2.6 Démarrage à froid : 10 appels espacés de 10 min sur une route `/api/*` de prod (`server-timing`, `x-vercel-cache`),
    région Vercel vs région base (eu-west-3).

═══ PARTIE 3 — SÉCURITÉ (OWASP API 2023) ═══
3.1 Routes API : 152 `route.ts` — pour chacune : garde présente (getUser / rôle / app / Bearer plugin) oui/non, méthode,
    écrit-elle en base. Tableau complet, compte des routes sans garde (juillet : 90).
3.2 Base : fonctions exécutables par `anon` (SECURITY DEFINER et INVOKER), tables avec grants `anon`
    (`role_table_grants`), policies `TO public`, vues sans `security_invoker`, `reset_*` et `delete_*` accessibles à
    `authenticated` sans garde owner/admin. Advisors sécurité : compte par type.
3.3 Secrets : `gitleaks` sur l'historique depuis le 2026-01-15 (dépôt privé mais historique conservé), fichiers `.env*`
    suivis, jetons dans `docs/`.
3.4 Auth partagée : cookie commun aux 3 apps, vérification jeton + rôle + app sur le back-office, plugin Chrome Bearer.

═══ PARTIE 4 — SCALABILITÉ ET STABILITÉ ═══
4.1 Schéma : 133 tables vs `CREATE TABLE` dans `supabase/` (62 manquantes le 11/09) ; migrations anciennes 418 ;
    faisabilité d'une baseline SQL reconstructible (branche Supabase qui démarre).
4.2 Types : fichiers `export type Database`, lesquels sont importés, plan « une seule copie ».
4.3 Packages : cycles (madge), fichiers > 400 lignes (compte), `select('*')` restants.
4.4 Tests : couverture réelle (fichiers de test / fichiers source), E2E réels verts depuis #1164, ce qui n'est couvert
    par rien (12 bugs bloquants de juillet : lesquels restent).
4.5 Observabilité : Sentry (DSN présent, zéro code), journal des requêtes lentes Postgres (`log_min_duration_statement`),
    alertes.
4.6 CI : durée des jobs, le build à 20 min, contrôle de dérive sur la prod, secrets manquants.

═══ PARTIE 5 — SYNTHÈSE ═══
5.1 Notes sur 100 par axe, sur la grille de juillet, avec pour chaque note les 3 mesures qui la fixent. Comparaison
    30/07 → 11/09 → 16/09.
5.2 Plan chiffré : 8 à 12 corrections max, chacune avec gain attendu (ms, appels, % de temps base), preuve de
    vérification, base oui/non, durée. Ordre par rentabilité.
5.3 Trois listes séparées : code / migration ou droits (accord) / données existantes (constat pour Roméo).
5.4 Ce que tu n'as pas pu mesurer et pourquoi.

═══ SORTIE ═══
`docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md` (commandes en annexe) + copie dans
`~/Documents/Workspace/verone/_inbox/`. ACTIVE.md : session 01 → « fait », notes reportées. Les sessions 02 à 10 de la
feuille de route sont ajustées d'après 5.2 : écris les ajustements dans le compte rendu, ne modifie pas leurs fichiers.
```
