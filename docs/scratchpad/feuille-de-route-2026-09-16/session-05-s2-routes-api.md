# Session 05 — S2 : contrôle central des routes API, en trois temps (90 routes sur 152 sans garde)

Aucune base. Trois PR successives, jamais d'un bloc. Le commit de juillet `cc10edae` n'est pas repris tel quel : il mélange
middleware et routes Qonto et contient un `console.log` interdit (`middleware.ts:87`). Détail de départ :
`docs/scratchpad/audit-2026-09-11/sessions/session-2-controle-central-acces.md`.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, partie 3.1 (tableau des 152 routes)
  docs/scratchpad/audit-2026-09-11/sessions/session-2-controle-central-acces.md
  git show cc10edae -- apps/back-office/src/middleware.ts (lecture, ne pas cherry-pick en bloc)
  docs/current/security-auth.md (périmé : affirme un middleware qui n'existe pas — à corriger dans le temps 3)
  OWASP API2:2023 Broken Authentication, API5:2023 Broken Function Level Authorization

═══ TEMPS 1 — gardes sur les routes sensibles (1 PR) ═══
T1. Depuis le tableau 3.1 : toutes les routes qui ÉCRIVENT en base ou touchent l'argent (Qonto, Revolut, paiements,
    finance, webhooks) sans garde → ajouter la garde standard `getUser()` + rôle back-office actif + app, en respectant
    les exceptions : plugin Chrome en Bearer (`/api/brands`, `/api/sourcing/*`), webhooks signés (vérification de
    signature au lieu de session), flux Want It Now (Bearer propre). Interdit : modifier la logique des routes Qonto
    (règle du dépôt) — seule la garde en tête change. Tests : chaque route sans session → 401 ; plugin 200/409 inchangé ;
    webhooks avec signature 200.

═══ TEMPS 2 — middleware en observation (1 PR) ═══
T2. `apps/back-office/src/middleware.ts` neuf : vérifie jeton + rôle + app sur `/(protected)` et `/api/*` sauf liste
    d'exceptions explicite (plugin, webhooks, flux WIN, `/api/logs` si public) ; **mode observation** : ne bloque rien,
    journalise (pas `console.log` : logger du dépôt) `route, méthode, décision`. 2 à 3 jours ouvrés d'observation en
    production → liste des appelants légitimes non prévus. Corrige aussi le plantage « session expirée = erreur au lieu
    de redirection vers /login ».

═══ TEMPS 3 — activation (1 PR) ═══
T3. Après lecture des journaux d'observation avec Roméo : passage en blocage, exceptions figées dans un fichier de
    configuration, `security-auth.md` réécrit pour dire la vérité. Preuve : 0 route sans garde dans le tableau 3.1
    rejoué, extension Chrome fonctionnelle, LinkMe et site publics 200, salariés OK une journée.
Compte rendu à chaque temps, ACTIVE.md.
```
