# Prompt Claude Code — reprise de la feuille de route 2026-09-16 (à coller dans une NOUVELLE discussion)

```
Dossier : ~/verone-back-office-V1

═══ VÉRIFICATIONS D'OUVERTURE — LECTURE SEULE, RÉSULTATS EN TÊTE DU COMPTE RENDU ═══
V1. `pwd` = ~/verone-back-office-V1 et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
V2. `git branch --show-current`, `git status --short | wc -l`, `git log --oneline -3 origin/main origin/staging`. Note, ne touche à rien.
V3. `gh auth status` : compte actif `Verone2021`, sinon préfixe chaque écriture GitHub par
    GH_TOKEN="$(env -u GITHUB_TOKEN gh auth token -u Verone2021)" et dis-le.
V4. MCP Supabase : `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
V5. Un appel trivial par MCP déclaré, tableau OK / KO.
V6. `ls -l docs/scratchpad/feuille-de-route-2026-09-16/` : 12 fichiers attendus (README + session-00 → session-10 +
    ce prompt). `ls -l .claude/work/ACTIVE.md` et `grep -n "FEUILLE DE ROUTE 2026-09-16" .claude/work/ACTIVE.md`.
    Fichier manquant = signalé, jamais recréé de mémoire.
V7. Base = PRODUCTION, deux salariés dessus. LECTURE SEULE dans cette session. Aucune migration, aucune donnée modifiée,
    aucun commit de code, aucun push, aucune fusion. Ne jamais lancer ni couper les serveurs de Roméo.
V8. Aucune requête lourde sur `pg_stat_statements` / `information_schema` entre 07 h et 17 h UTC un jour ouvré.

═══ MISSION 1 — PRENDRE LA FEUILLE DE ROUTE EN CHARGE ═══
1. Lis dans l'ordre : `docs/scratchpad/feuille-de-route-2026-09-16/README.md`, puis les 11 fichiers `session-*.md`,
   puis la section « FEUILLE DE ROUTE 2026-09-16 » en tête de `.claude/work/ACTIVE.md`, puis
   `~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/compte-rendu-etat-back-office-2026-09-15.md`.
   Claude Cowork a écrit ces fichiers le 15/09 au soir à partir de ses mesures et de tes comptes rendus.
2. Confronte-les à ce que TU sais (ACTIVE.md complet, `docs/scratchpad/prompt-2026-09-15-BO-SOURCING-VALIDATION-001.md`,
   `dev-plan-2026-09-16-*.md`, `reste-a-faire-2026-09-15.md`, `bloc-S-drafts-2026-09-15/`) et à l'état réel du dépôt et
   de la base. Pour chaque écart (une tâche déjà faite, un chiffre faux, une session qui en doublonne une autre, un ordre
   discutable) : écris-le, propose la correction, **ne modifie pas les fichiers de session** — Roméo tranche.
3. ACTIVE.md : fais de la section « FEUILLE DE ROUTE 2026-09-16 » la seule liste d'ordre et d'état. Les anciennes
   sections « PRIORITÉ SUIVANTE », « À reprendre », « SESSIONS PLANIFIÉES », « 0. [BO-AUDIT] » ne doivent plus contredire
   le tableau : soit tu les résumes en une ligne qui renvoie au tableau, soit tu déplaces leur contenu utile dans la
   colonne État. Rien de supprimé sans être reporté. `PROGRAMME-2026-09-12.md` reste marqué périmé.
4. Applique la règle de maintenance `.claude/rules/active-md-maintenance.md` ; montre le diff d'ACTIVE.md dans le compte
   rendu (avant/après en nombre de lignes et titres).

═══ MISSION 2 — SESSION 00, SI L'HEURE LE PERMET ═══
Si tu es après 17 h UTC un jour ouvré, ou un week-end : exécute `session-00-mesure-et-equerre.md` tel quel (lecture
seule + PR de règle B4). Sinon : ne fais que la partie C (remise d'équerre) et dis à Roméo à quelle heure relancer.

═══ COMPTE RENDU ═══
`~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-reprise-feuille-de-route.md`, français simple : V1→V8 ;
la liste des écarts trouvés en mission 1 avec ta proposition pour chacun ; le diff ACTIVE.md ; le résultat de la session 00
si faite ; puis cinq lignes pour Roméo : ce qu'il doit décider, ce qu'il doit tester lui-même (Want It Now), et quel
fichier coller à la prochaine session.
```
