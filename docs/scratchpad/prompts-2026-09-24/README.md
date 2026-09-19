# Deux prompts prêts à coller — jeudi 24 septembre 2026

Écrits le 19/09 au petit matin, après la mise en ligne des serrures de lecture, de
l'observabilité et de la fermeture de la boutique.

| Ordre | Fichier                                   | Sujet                                                 | Pourquoi maintenant                                                                                              |
| ----- | ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **1** | `prompt-1-rouvrir-la-boutique.md`         | Le prix payé doit venir de la base, pas du navigateur | **La boutique est fermée. Chaque jour coûte du chiffre d'affaires.** C'est le seul verrou qui empêche de rouvrir |
| **2** | `prompt-2-fermer-les-portes-decriture.md` | Verrou général sur les routes du back-office          | ~15 routes qui écrivent des factures et 7 routes d'envoi d'e-mail répondent encore **sans connexion**            |

## Pourquoi cet ordre

Le premier **rapporte** : il rouvre la boutique. Le second **protège** : il ferme ce qui reste
ouvert. Les deux sont indépendants — si le jeudi est court, fais le premier.

## Ce que ces deux prompts ne couvrent pas

Un troisième sujet mérite son tour, mais plus tard : **la base de données travaille pour rien**.
Au 18/09, 93,5 % de son temps ne sert pas l'application (61,5 % de temps réel sur deux pastilles,
21,8 % de contrôles automatiques qui interrogent la production). C'est la cause de fond des
saturations qui ont contribué à l'incident du 17/09. Ça demande l'accord de Roméo (ça touche la
base) et une heure creuse. Le prompt existe déjà :
`docs/scratchpad/audit-2026-09-18/prompt-lot-2-base-saturation.md`.

## Rappel valable pour les deux

- Une demande vers `staging`, jamais vers `main`. Aucune fusion sans l'ordre de Roméo.
- Aucune migration, aucune écriture en base.
- Rien en production entre 07 h et 17 h UTC un jour ouvré (ADR-041).
- Si tu découvres un défaut plus grave que ceux listés : **tu t'arrêtes et tu le dis**, tu ne
  l'embarques pas dans la demande.
