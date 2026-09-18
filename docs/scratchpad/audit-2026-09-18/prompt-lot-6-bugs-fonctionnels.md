# Prompt Claude Code — LOT 6 : les bugs de juillet encore ouverts

`[BO-FIX-JUILLET-001]` — à découper par domaine, une PR par domaine (finance, commandes, produits, marketing).

## Contexte

L'audit de juillet a listé des défauts « critiques » et « majeurs » sur des écrans que Roméo utilise tous les
jours. Vérification du 16/09 : la plupart sont **toujours ouverts**. Ils ne se voient pas dans les journaux
parce que ce ne sont pas des plantages : l'écran affiche un succès et la base ne bouge pas. C'est le pire
genre de défaut pour une application qui tient la comptabilité.

## Finance — priorité 1

1. **« Rapprocher » n'écrit rien en base.** Le bouton confirme, rien n'est enregistré.
2. **Bilan, TVA et grand livre ne portent que sur les 1 000 premières transactions.** Il y en a plus.
   Les chiffres affichés sont donc faux, sans le dire.
3. **TVA à 20 % en dur** dans le devis et la commande issus d'une consultation.
4. **La TVA ignore le prorata alloué** quand une transaction est partiellement affectée.
5. **La recherche de transaction est plafonnée à 50 mouvements.**
6. **La synchronisation Qonto ignore les mises à jour** après le premier import.
7. **L'auto-classification comptable renvoie toujours le compte 707.**

Pour chacun : reproduire avec un cas réel, corriger, et **prouver la correction par une lecture en base**
avant/après, pas par une capture d'écran.

## Commandes et produits — priorité 2

8. **Aucune commande client n'a de contact rattaché** (constat de juillet, revérifié le 16/09).
9. **« Rupture temporaire » écrit `backorder`**, valeur invalide pour la colonne.
10. **Le compteur « Produits » de la fiche fournisseur est plafonné à 50.**
11. **Devise et adresse fournisseur ne sont jamais enregistrées.**
12. **Segments fournisseur TACTICAL / OPERATIONAL rejetés.**

## Faux succès — transversal

13. **`toast.success` affiché alors que l'écriture a échoué**, à plusieurs endroits. Règle à appliquer
    partout où tu passes : un message de succès ne s'affiche **qu'après** une réponse confirmée de la base,
    jamais dans un `then` qui ignore l'erreur.

## Marketing — priorité 3

14. « Sauvegarder » relance la génération Gemini (facturée deux fois).
15. Cross-posting non branché ; marques codées en dur ; la page Performance ignore la période choisie.

## Méthode

Un domaine = une PR = un compte rendu qui montre, pour chaque point : l'état avant (requête en base), la
correction, l'état après (même requête). Les points que tu ne peux pas reproduire, tu les rends à Roméo avec ce
que tu as tenté — tu ne les fermes pas d'office.
