Absolument, je comprends parfaitement votre fonctionnement. Votre logique est très claire, cohérente et correspond aux meilleures pratiques des systèmes ERP modernes pour la gestion des stocks prévisionnels et des alertes.
Votre assistant Claude Code a fait une analyse très détaillée de la situation, et la liste des 10 triggers à restaurer est tout à fait pertinente et adresse l'ensemble de vos règles métier.
Je vais valider les 10 triggers proposés en insistant sur la logique métier spécifique de chacun, pour que votre assistant puisse les implémenter avec succès.


🎯 Validation des Logiques Métier et des Triggers

Voici la décomposition de chaque règle métier et le trigger associé qui garantit son respect. L'approche en 10 triggers proposée par votre assistant est la bonne pour la reconstruction.

1. Gestion des Alertes de Stock (Calcul du Prévisionnel)

Règle Métier	Logique de Calcul	Trigger Associé	Objectif
Stock Prévisionnel	Stock Réel + Entrées Prévisionnelles - Sorties Prévisionnelles	TRIGGER 1 : Sync Stock Alerts (trigger_sync_stock_alert_tracking_v2 sur products)	Ce trigger central doit être déclenché après chaque modification de Stock Réel, forecasted_in, forecasted_out ou min_stock d'un produit.
Alerte "Stock Négatif Critique"	Si Stock Prévisionnel < 0	Inclus dans TRIGGER 1	Créer une alerte de gravité ÉLEVÉE.
Alerte "Alerte Stock"	Si Stock Prévisionnel < Stock Minimum (et $\ge 0$)	Inclus dans TRIGGER 1	Créer une alerte de gravité MOYENNE.
2. Gestion des Commandes Fournisseurs (Entrées Prévisionnelles)

Règle Métier	Étape de Commande	Trigger(s) Associé(s)	Impact sur Stock & Alerte
Brouillon	draft	Aucun impact	Aucun Stock Prévisionnel n'est considéré.
Validée	validated	TRIGGER 3 : PO Validation → Forecasted In + TRIGGER 2 : Validate Alerts on PO	Augmente stock_forecasted_in. Le TRIGGER 1 se déclenche et recalcule les alertes. TRIGGER 2 marque les alertes comme potentiellement "validées/résolues" (passant du 🔴 RED → 🟢 GREEN) grâce à cette entrée prévisionnelle.
Annulée	cancelled	TRIGGER 4 : PO Cancellation Rollback	Si non (partiellement) reçue, Diminue stock_forecasted_in (rollback). Le TRIGGER 1 se déclenche et recalcule les alertes (elles peuvent réapparaître si le stock prévisionnel redevient bas).
Réceptionnée (Partielle/Complète)	received / partially_received	TRIGGER 5 : Reception → Stock Real	Augmente stock_real. Diminue stock_forecasted_in de la quantité reçue. Le TRIGGER 1 se déclenche pour mettre à jour les alertes.
Règle clé (Annulation) : Le contenu de la commande peut changer (quantités/suppression d'articles) même si la commande est validée. Le trigger_sync_stock_alert_tracking_v2 (T1) doit être capable de se déclencher lors de la modification des lignes de commande (purchase_order_items/sales_order_items) qui mettront à jour les totaux forecasted_in/forecasted_out sur la table products. Le TRIGGER 4/7 est là pour le changement de statut de la commande.

3. Gestion des Commandes Clients (Sorties Prévisionnelles)

Règle Métier	Étape de Commande	Trigger(s) Associé(s)	Impact sur Stock & Alerte
Brouillon	draft	Aucun impact	Aucun Stock Prévisionnel n'est considéré.
Validée	validated	TRIGGER 6 : SO Validation → Forecasted Out	Augmente stock_forecasted_out. Le TRIGGER 1 se déclenche immédiatement et recalcule les alertes (ce qui peut créer une alerte "Stock Négatif Critique").
Annulée	cancelled	TRIGGER 7 : SO Cancellation Rollback	Si non (partiellement) expédiée, Diminue stock_forecasted_out (rollback). Le TRIGGER 1 se déclenche pour mettre à jour les alertes.
Expédiée (Partielle/Complète)	shipped / partially_shipped	TRIGGER 8 : Shipment → Stock Real	Diminue stock_real. Diminue stock_forecasted_out de la quantité expédiée. Le TRIGGER 1 se déclenche pour mettre à jour les alertes.

✅ Validation du Plan de Reconstruction

J'approuve entièrement le plan de votre assistant Claude. L'ordre d'implémentation est logique, car il commence par le cœur du système (les alertes) avant d'y connecter les flux de commandes.

1. Approuves-tu la liste de 10 triggers à restaurer ?

OUI, j'approuve. C'est la liste minimale et nécessaire pour rétablir une gestion de stock et d'alerte fonctionnelle selon vos règles.

2. Approuves-tu l'ordre d'implémentation (Phases 0-4) ?

OUI, j'approuve. L'ordre est CRITIQUE :
1. Phase 1 (Alerte) : Rétablir la fonction centrale de calcul (TRIGGER 1). C'est la base.
2. Phase 2 & 3 (PO/SO) : Rétablir les mouvements de stock prévisionnel (TRIGGER 3, 6) et la transition vers le réel (TRIGGER 5, 8), puis la gestion des annulations (TRIGGER 4, 7).
3. Phase 4 (Notification) : Rétablir l'UI/UX (TRIGGER 9-10) une fois que la logique de stock est stable.

3. & 4. Vérification de quantity_shipped

⚠️ Procédez immédiatement à la vérification de la colonne quantity_shipped sur la table sales_order_items (dans la Migration 012) dès que Supabase est accessible. L'absence de cette colonne rend impossible la gestion des expéditions partielles de commandes clients (qui est une règle métier essentielle pour vous).
En résumé, l'analyse et le plan de reconstruction sont excellents. La clé du succès sera dans l'implémentation précise du TRIGGER 1 et sa fonction associée, qui est le seul à contenir la logique complexe de calcul du stock prévisionnel et des deux niveaux d'alerte.
  Oui, la compréhension de Claude Code est correcte et très détaillée sur l'ensemble de la logique métier que vous avez décrite. Il a parfaitement saisi les nuances entre les alertes, les transitions de statut, et la distinction cruciale entre stock réel et stock prévisionnel.
Voici une validation de ses points clés :


✅ Validation de la Compréhension de Claude Code

Claude Code a capturé les concepts essentiels, ce qui est très rassurant pour la suite de l'implémentation.

1. Gestion des Alertes (Points 1, 2, 3)

Concept	Compréhension de Claude Code	Validation
Coexistence	Un produit peut avoir low_stock (P2) et out_of_stock (P3) simultanément.	Correct.
Alertes ROUGES	low_stock : $\text{Stock réel} < \text{min\_stock}$. out\_of\_stock : $\text{Prévisionnel} < 0$.	Correct. La distinction entre $\text{Stock Réel}$ (pour low_stock) et $\text{Prévisionnel}$ (pour out_of_stock) dans la logique de déclenchement est essentielle.
Alertes VERTES	L'alerte devient $\text{validated} = \text{true}$ si une commande fournisseur confirmée couvre le besoin.	Correct. Le statut VERT signale que la résolution est en cours (Entrée Prévisionnelle).
Alertes DISPARUES	Alerte supprimée si $\text{Stock Réel} \ge \text{min\_stock}$ ET $\text{Prévisionnel} \ge 0$.	Correct. La disparition nécessite la satisfaction des deux conditions de stock (physique et futur).
Transitions	Capacité à passer d'une alerte à l'autre (ex : de négatif à low_stock), et à afficher les données dynamiques ("manque encore X unités").	Correct. Cela dépendra de la finesse d'implémentation du TRIGGER 1 (Migration 020).
2. Gestion des Stocks (Points 4, 5, 6)

Concept	Compréhension de Claude Code	Validation
Stock Réel	Mis à jour UNIQUEMENT lors de la réception (PO) ou de l'expédition (SO).	Correct. C'est la base de la comptabilité stock.
Stock Prévisionnel	Mis à jour lors de la validation (augmentation) et lors de la réception/expédition (diminution/consommation).	Correct. forecasted_in (PO) et forecasted_out (SO) sont les compteurs de flux futurs.
Partiel & Rollback	Gestion des quantités restantes attendues après une réception/expédition partielle, et rollback des quantités lors de l'annulation d'une commande validée.	Correct. Ceci est crucial pour éviter les stocks fantômes prévisionnels.

🎯 Architecture Base de Données pour le Partiel (Question 6)

L'analyse des options pour gérer les réceptions/expéditions partielles est très pertinente.
Option	Description	Recommandation
Option A	Colonne quantity_received dans purchase_order_items.	Déconseillée pour les ERP.
Option B	Table séparée (purchase_order_receptions/sales_order_shipments).	Recommandée.
Ma recommandation est de choisir l'Option B (table séparée) pour la traçabilité et l'historique.
Votre assistant a d'ailleurs déjà identifié la création d'une table sales_order_shipments (mentionnée dans l'audit initial, Migration 011), ce qui confirme qu'il s'oriente vers cette solution robuste. C'est la bonne pratique ERP.


🔨 Validation du Plan de Reconstruction (Phase 0, 2, 3)

Le plan de reconstruction est méthodologique et prudent.
Phase/Migration	Action	Validation
PHASE 0 : Nettoyage	TRUNCATE et réinitialisation de TOUTES les tables de stock/commandes.	Approuvée. C'est la seule façon de garantir une base propre avant la reconstruction des triggers.
PHASE 2 : Garder/Supprimer	Décision de conserver les triggers stock_movements (cohérence, snapshot, cleanup, etc.) et de supprimer les triggers obsolètes/redondants.	Approuvée. La logique de centraliser le stock sur la table stock_movements comme source de vérité est la meilleure approche (et évite de réécrire toute la logique de mouvement).
PHASE 3 : Migrations 018-021	018/019 (Correction PO/SO) ; 020 (Nouveau Trigger Alerte) ; 021 (Trigger Alerte Verte).	Approuvée. L'ordre est parfait, car l'alerte (020) dépend des mouvements de stock (018/019).
Le pseudocode proposé pour la Migration 020 (sync_stock_alert_tracking_v2) est la clé :
SQL

Condition 1 : Stock Minimum (stock physique)
IF NEW.stock_real < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
  v_alert_type := 'low_stock';
  -- ...

Condition 2 : Prévisionnel Négatif (commandes)
ELSIF (NEW.stock_real + NEW.stock_forecasted_in - NEW.stock_forecasted_out) < 0 THEN
  v_alert_type := 'out_of_stock';
  -- ...

Suppression alerte
ELSE
  -- Supprimer alerte si stock_real >= min_stock ET prévisionnel >= 0
  DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
Ceci implémente correctement les deux conditions que vous avez définies.

Conclusion : Le plan est solide, les migrations sont bien décomposées, et la compréhension de la logique métier par votre assistant est excellente.
Voulez-vous que je confirme à Claude Code que son plan est validé et qu'il peut procéder à la suite de la PHASE 3 (Migrations 018-021) ?
 🔎 Analyse et Plan d'Action (FEEDBACK À CLAUDE CODE)

Le problème que vous avez testé (Alerte reste ROUGE / KPI = 0) est maintenant clairement attribué à un problème de synchronisation/affichage côté Frontend/Backend, et non à la logique des triggers de stock.

1. Diagnostic de l'Échec de Test

Attendu	Réel	Cause Factuelle
Alerte passe au VERT (validated=true)	Alerte reste ROUGE (validated=false)	❌ FAUX : L'audit prouve que l'alerte est bien validated=TRUE dans la DB (Produit FMIL-VERT-01). Le problème est l'affichage Frontend qui ne lit pas/n'interprète pas correctement le champ validated.
KPIs "Entrées Prévues" > 0	KPIs "Entrées Prévues" = 0	❌ FAUX : L'audit prouve que stock_forecasted_in est bien mis à jour à 10 (Produit FMIL-VERT-01). Le problème est le Hook/Composant Frontend qui calcule/affiche les KPIs de la page /stocks/previsionnel qui ne fonctionne pas.
products.stock_forecasted_in mis à jour	NON mis à jour	❌ FAUX : L'audit prouve qu'il est bien mis à jour à 10 par la fonction update_po_forecasted_in().
2. Consignes de Correction pour Claude Code

L'objectif n'est plus la reconstruction des triggers, mais la correction des points de contact Backend et Frontend.
Message à adresser à Claude Code :
"Audit reçu. Les données réelles confirment que la logique de stock via les triggers fonctionne (update_po_forecasted_in met bien à jour le stock, et validate_stock_alerts_on_po met bien l'alerte à validated=TRUE en DB).
Le problème est la désynchronisation entre la base de données (DB) et les affichages Frontend/Backend.
Nous annulons le Plan de Reconstruction initial (Migrations 017-021) car les triggers fondamentaux existent. Concentrons-nous sur les quatre problèmes critiques identifiés pour garantir la fiabilité de l'application :"


🔨 Plan de Fiabilisation (4 étapes)


1. 🟢 Suppression des Conflits de Triggers (P0)

"Bien que la logique v2 semble active, il reste des fonctions de l'ancien système (auto_validate_alerts_on_order_confirmed) et un trigger trigger_reception_update_stock qui référence la fonction update_stock_on_reception() alors que la table purchase_order_receptions existe (contrairement à l'analyse statique initiale).
Action :
1. Supprimer les anciens triggers redondants de l'ancien système de la Migration 102 si on les retrouve (le nouveau système doit être le seul actif).
2. Vérifier que le trigger trigger_reception_update_stock (et sa fonction) utilise bien la table purchase_order_receptions et qu'il fonctionne (créer un test pour lui).
3. Confirmer que la fonction auto_validate_alerts_on_order_confirmed() est inactive et la supprimer si elle l'est."

2. 🔀 Correction de la Logique de Mouvement (P0)

"Les Routes API pour les réceptions/expéditions pointent vers des fonctions de trigger qui n'existent pas (handle_purchase_order_forecast et handle_sales_order_stock).
Action :
1. Modifier les fichiers route.ts du backend (/api/purchase-receptions/validate/route.ts et /api/sales-shipments/validate/route.ts) pour qu'ils cessent d'attendre ces triggers inexistants et fassent confiance aux triggers existants (update_po_forecasted_in et update_so_forecasted_out) qui se déclenchent lors de la mise à jour des statuts de commande. Le backend ne doit pas déclencher ces fonctions à la main, mais faire confiance à l'UPDATE de la DB."

3. 🎨 Correction de l'Affichage Frontend (P1)

"Les alertes sont VERTES en DB mais ROUGES à l'écran, et les KPIs sont faux.
Action :
1. Auditer et corriger le Hook use-stock-dashboard.ts pour garantir que les KPIs (Entrées Prévues, Stock Prévisionnel total) sont calculés correctement à partir des données de products (ou de la DB).
2. Auditer et corriger le composant d'affichage des alertes pour qu'il utilise le champ validated: true de la table stock_alert_tracking pour afficher le badge VERT."

4. 📝 Migration pour purchase_order_receptions (P1)

"Même si la table purchase_order_receptions existe (selon l'audit réel), nous devons confirmer que sa structure est correcte pour la réception partielle.
Action :
1. Créer une nouvelle migration (017 ou similaire) pour confirmer le schéma exact de la table purchase_order_receptions et son lien avec purchase_order_items, comme la table sales_order_shipments a été créée."

Nous devons maintenant demander à Claude Code de commencer par la correction la plus facile : la suppression du trigger obsolète qui cause un potentiel conflit.
Qu'est-ce qu'on doit lui dire ?
"Ton analyse est excellente. Le problème est l'affichage (Frontend) et les noms de fonctions (Backend). Annulons le Plan de Reconstruction initial.
Première action : Supprimer le trigger redondant trigger_auto_validate_alerts_on_order_confirmed et sa fonction associée, car le trigger trigger_validate_stock_alerts_on_po fait déjà ce travail.
Fais une requête de suppression (DROP TRIGGER et DROP FUNCTION) et confirme qu'elle est exécutée
 C'est noté. Tu as raison, nous allons reprendre le contrôle total de la situation. Pour éviter l'effet "usine à gaz", nous allons arrêter de laisser Claude Code deviner et nous allons lui donner des instructions d'architecture strictes, étape par étape.
J'ai déjà les informations de l'audit précédent (liste des triggers, tables), donc pas besoin de lui redemander. Nous allons utiliser ces informations pour nettoyer et reconstruire proprement.
Voici le PLAN DIRECTEUR DE RECONSTRUCTION (Master Plan). C'est la feuille de route que nous allons suivre rigoureusement.


🗺️ LE PLAN DIRECTEUR : De l'Alerte au Stock Réel

Nous allons valider ces 5 phases une par une. On ne passe pas à la suivante tant que la précédente n'est pas testée et validée par toi.

🧹 PHASE 1 : ASSAINISSEMENT (Cleaning)

Objectif : Supprimer les conflits et garantir qu'on travaille sur une base saine.
* Problème actuel : Deux systèmes de triggers se marchent dessus (V1 obsolète vs V2 actuel).
* Action : Supprimer impérativement les vieux triggers (auto_validate...) et vérifier qu'il n'y a pas de doublons sur la table products.
* Résultat attendu : Plus d'erreurs silencieuses ou de doubles mises à jour.

🔮 PHASE 2 : LOGIQUE PRÉVISIONNELLE (Validation Commande)

Objectif : Quand je valide une commande, mes compteurs prévisionnels doivent bouger.
* Problème actuel : Tu valides une commande, mais rien ne change dans le tableau de bord ou sur la fiche produit.
* Correction Technique :
    1. Aligner les noms de fonctions appelées par l'API (Backend) avec les noms réels en base de données (update_po_forecasted_in).
    2. Vérifier que le trigger validated met bien à jour stock_forecasted_in (Entrée) et stock_forecasted_out (Sortie).
* Test : Créer une commande fournisseur de 10 unités $\to$ Valider $\to$ Vérifier que le champ "Entrées Prévues" passe à 10.

🚦 PHASE 3 : GESTION VISUELLE DES ALERTES (Frontend)

Objectif : Une alerte résolue par une commande doit passer au VERT.
* Problème actuel : L'alerte reste rouge même si on a commandé, et les KPIs affichent 0.
* Correction Technique :
    1. Corriger le code React (StockAlertCard) : Si validated=true ET stock_previsionnel >= min_stock ALORS couleur = Vert.
    2. Corriger le calcul des KPIs (use-stock-dashboard) pour qu'il fasse la somme correcte des colonnes de la base de données.
* Test : La commande validée en Phase 2 doit faire passer la carte alerte au vert immédiatement.

📦 PHASE 4 : MOUVEMENTS PHYSIQUES (Réel & Partiel)

Objectif : Transformer le prévisionnel en réel (Réception/Expédition).
* Problème actuel : Risque que le stock réel ne bouge pas ou que le prévisionnel ne diminue pas.
* Logique à implémenter :
    * Lors de la réception de X unités :
        * Stock Réel = Stock Réel + X
        * Stock Prévisionnel = Stock Prévisionnel - X
    * Gestion du Partiel : Si je commande 10 et reçois 4, le prévisionnel doit rester à 6.
* Test : Recevoir partiellement une commande et vérifier les 2 compteurs.

↩️ PHASE 5 : FILETS DE SÉCURITÉ (Annulations & Rollback)

Objectif : Si j'annule, tout doit revenir comme avant.
* Logique :
    * Annuler une commande validée (non reçue) $\to$ Soustraire le prévisionnel.
    * Interdire l'annulation d'une commande déjà totalement reçue/expédiée.
* Test : Valider une commande, vérifier le stock, l'annuler, vérifier que le stock revient à 0.


🚀 ACTION IMMÉDIATE : Démarrage de la Phase 1 & 2

Nous allons combiner le nettoyage et la réparation du lien "Validation $\to$ Prévisionnel" car c'est ton blocage principal.
Copie-colle exactement ce prompt à Claude Code pour commencer le travail :

Prompt pour Claude Code :
"Nous reprenons tout depuis le début avec une méthode stricte. Oublie tes suppositions, suis ce plan d'architecture.
CONTEXTE ACTUEL (Basé sur l'audit réalisé) :
1. Les triggers existent en base de données (PostgreSQL) mais le Frontend et l'API ne sont pas synchronisés avec eux.
2. Il y a des conflits entre d'anciens triggers (V1) et les nouveaux (V2).
3. Le résultat : Quand je valide une commande, les stocks prévisionnels ne s'affichent pas et les alertes restent rouges.
TACHE 1 : NETTOYAGE (Priorité Absolue)
Tu vas exécuter ces actions SQL pour assainir la base :
1. DROP TRIGGER IF EXISTS trigger_auto_validate_alerts_on_order_confirmed ON purchase_orders; (C'est un doublon obsolète).
2. DROP FUNCTION IF EXISTS auto_validate_alerts_on_order_confirmed();
3. Confirme-moi que SEUL le trigger trigger_validate_stock_alerts_on_po reste actif sur la table purchase_orders pour la validation.
TACHE 2 : CORRECTION DU LIEN API <-> DB (Le Prévisionnel)
Actuellement, l'API cherche des fonctions qui n'existent pas ou ont le mauvais nom.
1. Ouvre le fichier /apps/back-office/src/app/api/purchase-receptions/validate/route.ts.
2. Arrête d'essayer d'appeler manuellement des triggers dans le code TypeScript. Le trigger SQL trigger_po_update_forecasted_in s'occupe DÉJÀ de la mise à jour quand le statut passe à 'validated'.
3. Vérifie simplement que le UPDATE purchase_orders SET status = 'validated' est bien fait.
TACHE 3 : CORRECTION DE L'AFFICHAGE (Les Alertes)
Le trigger met bien validated = true en base, mais l'écran affiche rouge.
1. Va dans packages/@verone/orders/src/components/alerts/StockAlertCard.tsx.
2. Modifie la condition d'affichage de la couleur.
    * Règle Métier : L'alerte doit être VERTE si alert.validated === true ET que le calcul (stock_real + forecasted_in - forecasted_out) >= min_stock.
    * Sinon, elle reste ROUGE.
3. Modifie le bouton "Commander" : Il doit être disabled si l'alerte est validée (verte).
Exécute ces 3 tâches maintenant et confirme-moi quand c'est fait. Ne fais RIEN D'AUTRE (pas de création de nouvelles tables pour l'instant)."
 C'est parfait. Cet audit technique est une mine d'or.
Grâce à cela, nous avons les noms exacts des variables (alert.validated, stock_forecasted_in, etc.) et la confirmation que la base de données est saine à 90%, mais qu'il manque la "fin de vie" de l'alerte (l'archivage).
Voici le Plan d'Action Chirurgical basé sur ces faits réels. Nous n'allons pas demander à Claude Code de "réfléchir", nous allons lui donner le code à écrire.

🗺️ LE PLAN DE BATAILLE (Basé sur l'Audit)

Nous allons procéder en 3 Étapes Techniques pour régler définitivement le problème :
1. FRONTEND (L'Urgence Visuelle) : Corriger StockAlertCard.tsx pour qu'il lise correctement les données qui existent DÉJÀ en base.
2. DASHBOARD (Les Chiffres) : Corriger use-stock-dashboard.ts pour qu'il additionne enfin les colonnes stock_forecasted_in.
3. BACKEND (Le Chainon Manquant) : Modifier le trigger sync_stock_alert_tracking_v2 pour qu'il SUPPRIME l'alerte quand le stock redevient suffisant (ce que l'audit a identifié comme manquant).


🚀 ACTION À LANCER (Prompt pour Claude Code)

Copie-colle ce prompt intégralement. Il contient les instructions techniques précises basées sur son propre audit.

Prompt pour Claude Code :
"Analyse terminée. L'audit confirme que les triggers de mouvement fonctionnent, mais que le Frontend est faux et qu'il manque la logique d'archivage.
Voici le plan d'exécution strict. Utilise les noms exacts trouvés dans ton audit.
TACHE 1 : CORRECTION VISUELLE (StockAlertCard.tsx) Fichier : packages/@verone/stock/src/components/cards/StockAlertCard.tsx
1. Corrige la couleur (getSeverityColor) : Remplace la logique actuelle par celle-ci (respecte tes noms de variables) : TypeScript  // Calcul du prévisionnel (déjà existant, garde-le)
2. const stock_previsionnel = alert.stock_real + (alert.stock_forecasted_in || 0) - (alert.stock_forecasted_out || 0);
3. 
4. // 1. Condition VERT (Validé ET Suffisant)
5. if (alert.validated && stock_previsionnel >= alert.min_stock) {
6.    return 'border-green-600 !bg-green-50';
7. }
8. // 2. Condition ROUGE (Brouillon OU Insuffisant)
9. // Note : On enlève la vérification is_in_draft ici car si c'est validé mais insuffisant, ça doit rester rouge/orange
10. if (stock_previsionnel < alert.min_stock) {
11.    return 'border-red-600 !bg-red-50';
12. }
13.    
14. Corrige le bouton "Commander" : Ligne 151 (environ), change la condition disabled : TypeScript  disabled={alert.is_in_draft || alert.validated}
15.     Logique : On ne peut pas recommander si c'est déjà en brouillon OU si c'est déjà validé (en attente de réception).
TACHE 2 : CORRECTION DES KPIs (use-stock-dashboard.ts) Fichier : packages/@verone/stock/src/hooks/use-stock-dashboard.ts
Le KPI "Entrées Prévues" affiche 0.
* Action : Dans la fonction qui récupère les métriques, ajoute une requête rpc ou une agrégation sum sur la table products.
* Colonne cible : stock_forecasted_in.
* Ne te base pas uniquement sur les commandes, base-toi sur la somme de la colonne products.stock_forecasted_in qui est la source de vérité mise à jour par tes triggers.
TACHE 3 : LE CHAINON MANQUANT (Archivage Automatique) L'audit indique : "Action attendue : PAS DE TRIGGER ARCHIVAGE". Nous allons corriger cela.
Ne crée pas un nouveau trigger séparé. Modifie la fonction existante sync_stock_alert_tracking_v2 (celle qui gère déjà les updates sur products).
Ajoute ce bloc logique à la fin de la fonction (PL/pgSQL) :
SQL

-- LOGIQUE DE NETTOYAGE / ARCHIVAGE
-- Si le stock réel est repassé au-dessus du min_stock, l'alerte n'a plus lieu d'être.
IF NEW.stock_real >= NEW.min_stock THEN
    -- Option A : Suppression pure (comme demandé par l'audit pour l'instant)
    DELETE FROM stock_alert_tracking
    WHERE product_id = NEW.id;
    
    -- (Optionnel : Tu pourrais insérer dans une table d'historique ici si elle existait, mais on fait simple pour l'instant).
END IF;
Exécute ces 3 tâches maintenant et confirme-moi UNIQUEMENT quand c'est déployé."


💡 Ce que nous faisons ici :

1. On utilise ses noms de variables (alert.validated, stock_forecasted_in).
2. On lui donne le code if pour le frontend pour éviter qu'il s'embrouille dans les conditions.
3. On règle le problème des "alertes fantômes" qui ne disparaissent jamais en ajoutant la condition DELETE directement dans le trigger principal du produit.
Dès qu'il a fini, nous pourrons faire le test complet : Commander → Valider (Devient Vert) → Recevoir (Disparaît).
 C'est très clair. Tu as tout à fait raison d'être prudent. Pour éviter de se perdre, nous allons considérer que rien n'est acquis tant que nous ne l'avons pas testé ensemble.
Voici le Plan de Bataille Complet (Roadmap). C'est notre carte pour traverser le champ de mines. Nous sommes actuellement à la fin de la Phase 1.
Je t'ai préparé le plan, et juste après, la consigne exacte à lui donner dès qu'il aura fini les corrections visuelles en cours.


🗺️ LE MASTER PLAN : De l'Alerte au Réel

Nous allons valider ces 5 phases séquentiellement. Si une phase échoue, on ne passe pas à la suivante.

✅ PHASE 1 : COHÉRENCE VISUELLE (En cours)

* Objectif : Que l'écran reflète la réalité de la base de données.
* Test : Une commande validée passe l'alerte au VERT. Le KPI affiche les bons chiffres.
* État : En cours de correction via le prompt que tu viens d'envoyer.

🔄 PHASE 2 : LE "CRASH TEST" (Annulation & Rollback)

* C'est ta demande spécifique.
* Objectif : Vérifier que le système sait "faire marche arrière".
* Scénario :
    1. J'ai une alerte VERT (Commande validée).
    2. J'ANNULE la commande.
    3. Le stock prévisionnel doit redescendre instantanément.
    4. L'alerte doit redevenir ROUGE (et le bouton "Commander" redevenir actif).
* Risque Technique : Que le trigger d'annulation (rollback) n'existe pas ou ne soustraie pas la bonne quantité.

📦 PHASE 3 : L'ENTRÉE EN STOCK (Réception Totale)

* Objectif : Transformer du vent (prévisionnel) en matière (réel).
* Scénario :
    1. Je reçois tout (10/10).
    2. Le Stock Réel augmente (+10).
    3. Le Stock Prévisionnel diminue (-10).
    4. L'alerte DISPARAÎT (suppression/archivage).
* Risque Technique : Que le prévisionnel reste coincé à 10 alors que le réel est à 10 (doublon comptable).

🧩 PHASE 4 : LA GESTION DU PARTIEL (Complexité Max)

* Objectif : Gérer les reliquats.
* Scénario :
    1. Je commande 10. Je reçois 4.
    2. Réel = +4.
    3. Prévisionnel = Reste 6.
    4. L'alerte reste VERT (car on attend encore la suite).
* Risque Technique : Que le système considère la commande comme "finie" et supprime tout le prévisionnel.

🚚 PHASE 5 : LES SORTIES (Expéditions Clients)

* Objectif : La symétrie pour les clients.
* Scénario : Validation commande client -> Stock réservé -> Expédition -> Déstockage réel.


⏭️ PROCHAINE ÉTAPE : Instructions pour la Phase 2

Une fois que Claude Code t'aura confirmé qu'il a corrigé le Frontend (Couleurs) et le Dashboard (KPIs), nous devons immédiatement vérifier la solidité des Annulations.
Ne lui pose pas de questions ouvertes. Dis-lui de vérifier et créer le filet de sécurité.
Voici le prompt à lui envoyer dès qu'il a fini la tâche actuelle :

Prompt pour Claude Code (À envoyer APRES la correction visuelle) :
"Merci, les corrections d'affichage sont notées. Passons maintenant à la PHASE 2 : TEST DE ROBUSTESSE & ANNULATIONS.
Je veux m'assurer que le système gère correctement le retour en arrière (Rollback). Si j'annule une commande validée, le stock prévisionnel doit être retiré et l'alerte doit redevenir ROUGE.
TACHE TECHNIQUE : VÉRIFICATION DU ROLLBACK
1. Vérifie le trigger trigger_po_cancellation_rollback sur la table purchase_orders.
2. Assure-toi que sa fonction associée (rollback_po_forecasted) contient bien la logique suivante :
    * Déclenchement : Quand status passe à cancelled.
    * Action : UPDATE products SET stock_forecasted_in = stock_forecasted_in - quantity.
    * Sécurité : Vérifie qu'il ne soustrait QUE ce qui n'a pas déjà été reçu (si on annule le reste d'une commande partielle).
3. Si cette logique de sécurité (gestion du partiel lors de l'annulation) est absente, réécris la fonction maintenant.
PROTOCOLE DE TEST (Ce que je vais faire) Je vais effectuer ce test dans l'interface. Confirme-moi que ton code est prêt pour ça :
1. Je prends un produit en alerte ROUGE.
2. Je crée une commande de 10 unités et je la VALIDE -> L'alerte doit passer au VERT (KPI +10).
3. J'ANNULE cette même commande -> L'alerte doit repasser au ROUGE immédiatement (KPI -10).
Confirme-moi que les triggers en place gèrent ce cycle sans erreur."

Pourquoi ce prompt ? Il force Claude à vérifier le code "sous le capot" avant que tu ne cliques sur le bouton "Annuler". S'il a oublié de gérer le cas où on annule une commande, il va le corriger maintenant avant que tu ne rencontres le bug.
