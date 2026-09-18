# Compte rendu — 15 septembre 2026

## Ce qui change pour toi

- **Nouveau produit** : le fournisseur se choisit (le clic ne faisait rien), la sous-catégorie est demandée, le produit
  s'enregistre.
- **Marges** :
  - pourcentage **et** coefficient partout ;
  - le prix de revient est **figé au moment de chaque vente** : une vente passée ne bouge plus quand un nouvel achat
    arrive ;
  - **tout l'historique LinkMe** est repris (prix de revient = achats reçus avant la vente, sinon coût actuel, avec
    la source indiquée ligne par ligne).
- **Page statistiques LinkMe** : carte « Marge nette Vérone ».
  - Sur tout l'historique : **56 600 €** de marge sur 167 199 € encaissés, soit **33,9 %** et un coefficient **×1,51**.
  - Commissions des affiliés exclues : 24 936 €.
  - Filtre par année : 2025 = 17 799 € (33,2 %).
- **Fiche produit** :
  - carte « Rentabilité LinkMe » (Plateau bois : 16 449 € de marge, 44,3 %, ×1,80) ;
  - ventes par canal ;
  - bouton **« Utiliser ce prix »** (prix du site ou prix cible, toujours avec confirmation) ;
  - filtres période / client / canal sur l'historique des ventes.
- **Une seule fiche produit du catalogue** : la copie inutilisée est supprimée, les contrôles de publication (poids,
  dimensions, description Google) sont gardés.
- **Téléphone** : catalogue et fiche produit lisibles sans défilement de côté, les tableaux deviennent des cartes.
- **Connexion** : une page protégée ouverte sans être connecté renvoie vers la page de connexion (plus d'écran
  d'erreur).
- **Menu** : les 11 compteurs arrivent en un seul appel au lieu de 11 ; le tableau de bord lit les bonnes données.
- **Ménage** : code inutile supprimé, fichiers trop longs découpés.

## Ce qui a été vérifié

- **Écrans testés sur ton back-office local, sans rien enregistrer** :
  - catalogue et fiche produit aux 5 tailles d'écran (téléphone → grand écran) ;
  - cartes de marges ;
  - « Utiliser ce prix » ouvert puis annulé ;
  - formulaire nouveau produit (fournisseur choisi, pas d'enregistrement) ;
  - redirection sans connexion.
- **Base** : 0 produit créé ou modifié, 0 prix écrit pendant les tests.
- **Contrôles automatiques** : types et règles de code au vert, tests de calcul des marges OK.
- **Relectures indépendantes** : validées ; les remarques ont été corrigées.
- **Production** depuis les changements de cet après-midi : 0 erreur serveur, site, LinkMe et sélections partagées
  normaux.

## Bloc sécurité de la base : reporté (ta décision)

- **Lots 8 à 11 : rien n'a été appliqué.**
- **Pourquoi c'est reporté** : le brouillon préparé par un assistant contenait :
  - des fonctions de facturation et de rapprochement bancaire tronquées ;
  - un test « rien ne bouge côté stock » insuffisant.
- **Pendant la préparation** : un essai de ce brouillon a probablement ralenti une fois les compteurs du menu, vers
  18 h 10 heure de Paris. Aucune donnée n'a été touchée.
- **À refaire dans une session dédiée**, avec le vrai test : validation / dévalidation de commande client,
  expédition, commande fournisseur et réception, alertes.

## Sauvegardes : point important

- La base est sur l'**offre gratuite de Supabase** : il n'y a **pas** de sauvegarde quotidienne restaurable.
- La protection repose donc sur une copie exacte de ce qu'on modifie et sur un retour arrière préparé et testé pour
  chaque changement.
- Une offre payante donnerait des sauvegardes quotidiennes : c'est une décision de dépense qui te revient.

## Mise en ligne

- **Demandes ouvertes vers la version d'équipe** (rien de fusionné) :
  - **#1160** : tout le travail ci-dessus ;
  - **#1161** : règle de travail des agents (plus de fusion automatique tant que le dépôt est privé).
- **Sur ton accord** : fusion dans la version d'équipe, puis passage en version live (production).

## Ce qui reste (hors de cette mise en ligne)

1. **Bloc sécurité de la base, lots 8 à 11** : session dédiée.
2. **Les 5 fonctions du stock prévisionnel** et `mark_warehouse_exit` : non touchées (ta consigne).
3. **Droits de lecture / écriture des visiteurs non connectés** sur certaines tables sensibles : aujourd'hui
   protégées par les règles d'accès seulement.
4. **Adresses** : règle « qui peut modifier quelle adresse » à définir.
5. **Chantier BO-AUDIT-003** : protection des routes Qonto et du contrôle d'accès central.
6. **Compteur d'alertes stock** : parfois lent (jusqu'à 7,7 s mesurés), à optimiser.
7. **Mesure de vitesse du menu** avant / après la mise en ligne.
