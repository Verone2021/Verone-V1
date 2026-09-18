# Session 5 — Mesure au navigateur

Durée : 1 h. Touche la base : **non**. Ex-« Session 6 » + question Q16 du prompt Cowork.

**Prérequis Roméo** : le back-office local lancé (il n'était pas lancé le 2026-09-11 à 18 h : seul le
port 3000 écoutait), ta session ouverte dans la fenêtre de test Playwright, et le port donné à la session.

Attention : le back-office local interroge **la base de production**. La session ne fait qu'ouvrir des pages.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine | Correction                                                                          | Pourquoi                                                                  |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 5 pages          | 5 pages **+ tableau de bord + une fiche produit**, 3 chargements chacune            | demandé par le prompt Cowork (Q16)                                        |
| —                | **3 minutes onglet ouvert sans action** sur le tableau de bord : compter les appels | vérifie directement la cause 2 du rapport (interrogation toutes les 30 s) |
| lane-2           | lane-2 (session déjà connectée)                                                     | la connexion a été faite dans lane-2                                      |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.
Mon back-office tourne sur le port <PORT>. Vérifie-le avec une requête HTTP avant
d'ouvrir le navigateur. S'il ne répond pas, ARRÊTE-TOI et dis-le-moi.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-5-mesure-navigateur.md
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 2, § 7)
  .claude/rules/playwright.md

## Mission : mesurer, en LECTURE SEULE

MCP Playwright lane-2, sur http://localhost:<PORT>, session déjà connectée.

Pages : Tableau de bord · Inventaire · Catalogue · une fiche produit ·
Commandes clients · Rapprochement bancaire · Configuration du site internet.

Pour chacune, 3 chargements : nombre de requêtes vers Supabase (/rest, /auth,
/realtime), nombre de requêtes /api/*, nombre total, temps jusqu'au premier rendu,
temps jusqu'au repos réseau, requête la plus longue, erreurs console.
Puis : onglet ouvert 3 minutes sur le tableau de bord, sans aucune action ;
compte les appels émis et leur cadence.

RÈGLES : tu ouvres et tu comptes. Tu ne cliques sur AUCUN bouton qui enregistre,
envoie, valide, synchronise ou supprime. Tu n'ouvres pas /finance/admin/reset ni
/finance/admin/cloture. Aucune donnée de test créée, nulle part. Ne dépasse pas
1440 px de largeur. Captures dans .playwright-mcp/screenshots/YYYYMMDD/.

Sortie : docs/scratchpad/audit-2026-09-11/mesures-navigateur.md, avec pour chaque
chiffre la façon dont il a été obtenu.
```
