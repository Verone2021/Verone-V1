# Session 3 — Menu de gauche + en-tête : arrêter l'interrogation permanente · Bloc C

Durée : 3-4 h. Touche la base : **étape 2 seulement, accord écrit**. Ex-« Session 3 ».

## Ce qui est déjà mesuré (rapport § 2 cause 2, § 3 C, [C8] [C16] [C22] [C24] [C31])

- `packages/@verone/notifications/src/hooks/use-sidebar-counts.ts` : 11 requêtes (l.144-216), 7 canaux
  temps réel (l.376-468) sur `sales_orders`, `client_consultations`, `bank_transactions`, `products`,
  `form_submissions`, `linkme_info_requests`, **`stock_alerts_unified_view` (une vue)**.
- La base ne publie en temps réel que **`products` et `sales_orders`** ⇒ 5 canaux + la vue échouent
  (`CHANNEL_ERROR`) ⇒ bascule en **interrogation toutes les 30 000 ms** (l.89, 95, 356-366).
- `packages/@verone/notifications/src/hooks/use-unread-mails-count.ts` : comptage `email_messages` toutes les 30 s.
- Heures de travail du 11/09 : **13 004 appels de comptage sur 14 464 (90 %)**, \*\*1 556 des 1 698 appels
  > 2 s (92 %)\*\*, un tour toutes les ~32 s, 2 sessions seulement.
- Coût unitaire : `get_stock_alerts_count` 141 ms en moyenne (≈ 10 ms à chaud), comptages `sales_orders`
  plancher ≈ 7 ms dû aux règles de sécurité.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine                                                     | Correction                                                                                         | Pourquoi                                                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Commencer par « UNE fonction en base qui renvoie les 11 nombres »    | **Étape 1 d'abord dans le code, sans base** : supprimer la bascule permanente toutes les 30 s      | c'est elle qui produit 90 % du trafic ; une fonction unique appelée toutes les 30 s resterait une charge permanente |
| « relancés à chaque changement de commande, produit ou transaction » | seuls `products` et `sales_orders` peuvent déclencher ; les autres canaux ne reçoivent jamais rien | publication limitée à 2 tables [C16]                                                                                |
| En-tête non mentionné                                                | inclure `use-unread-mails-count.ts`                                                                | même mécanique, 1 003 appels en 9 h                                                                                 |
| « Ne pas ajouter de tables à la publication » (implicite)            | **explicite** : ne pas publier les 5 tables manquantes                                             | le temps réel occupe déjà 63 % du temps de la base (cause 1)                                                        |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-3-menu-de-gauche.md
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 2, § 3 C, § 6)
  .claude/rules/data-fetching.md, .claude/rules/code-standards.md, .claude/rules/non-regression.md

## Mission : Bloc C — le menu de gauche et l'en-tête

Mesuré : 90 % des appels à la base pendant les heures de travail sont les
compteurs du menu et de l'en-tête, relancés toutes les ~32 s sans action de
personne. Cause : 5 canaux temps réel sur des tables non publiées et 1 sur une vue
échouent, et le hook bascule alors en interrogation toutes les 30 s. Seules
products et sales_orders sont publiées.

ÉTAPE 1 — lecture seule. Mesure « avant » :
  a) query_logs edge_logs, 24 h, heures de travail : nombre d'appels HEAD par
     chemin et part des appels > 2 s (commande exacte) ;
  b) confirme dans le navigateur de test (si mon back-office local tourne,
     demande-moi le port) ou par lecture du code que les canaux passent en
     CHANNEL_ERROR ;
  c) relève les 11 nombres affichés aujourd'hui (SELECT avec les mêmes filtres que
     le code, en lecture seule) : ce sont les valeurs de référence.

ÉTAPE 2 — code seulement, propose-moi le changement AVANT de l'écrire :
  - ne s'abonner qu'à products et sales_orders ; supprimer les autres canaux ;
  - regrouper les rafales d'événements (délai ≥ 1 s) ;
  - aucune interrogation quand l'onglet est masqué (document.visibilityState),
    un rafraîchissement au retour sur l'onglet ;
  - si une interrogation de secours reste nécessaire : intervalle long (≥ 5 min) ;
  - même traitement pour use-unread-mails-count.ts.
  Liste les appelants de ces deux hooks (grep) et ce qui change pour chacun.

ÉTAPE 3 — seulement après mon accord sur l'étape 2 et si les chiffres le
justifient : UNE fonction get_sidebar_counts() qui renvoie les 11 nombres en un
appel. Montre-moi le SQL AVANT de l'appliquer. Migration + régénération des types
dans la même PR. Attends mon accord écrit.

Contrôle obligatoire : les 11 nombres doivent être identiques à ceux de l'étape 1c,
nombre pour nombre. Si un compteur diffère, ARRÊTE-TOI et dis-le-moi : c'est
peut-être l'ancien qui était faux.

Mesure « après » : la même requête query_logs qu'en 1a, une journée de travail
après la mise en ligne. Objectif : appels HEAD de travail 13 004 → moins de 1 500,
part > 2 s 11,7 % → moins de 2 %.

Livraison : branche depuis staging, un seul push à la fin, PR vers staging sans
fusion automatique, 4 contrôles vérifiés à la main.

INTERDITS : ne pas ajouter de tables à la publication temps réel ; aucune écriture
en base sans mon accord écrit ; aucune donnée de test ; aucun commit ni push sans
mon ordre ; `supabase db push` interdit.
```

## Retour arrière

Étape 2 : revert de la PR (code seul). Étape 3 : `DROP FUNCTION get_sidebar_counts()` + revert du hook.

## Preuve de gain

`edge_logs` heures de travail : appels de comptage et part > 2 s ; `pg_stat_statements` par différence
de relevés (calls des 11 requêtes).
