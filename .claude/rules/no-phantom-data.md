# INTERDIT ABSOLU : Zéro donnée fantôme en production

Source de vérité pour les agents : toute injection de "donnée fantôme" en
production est INTERDITE. Cette règle vient d'un incident grave du 2026-04-22.

---

## C'est quoi une "donnée fantôme" ?

Une row, un champ ou un statut en base qui **prétend** refléter un état d'un
système externe (Packlink, Qonto, Supabase Storage, email sent, etc.) sans
correspondance réelle côté ce système externe.

Exemples réels (à ne plus JAMAIS reproduire) :

- Un `sales_order_shipments` avec `packlink_status='a_payer'` et un
  `packlink_shipment_id='UN2026PRO...'` alors que la référence n'existe PAS
  sur Packlink PRO → Romeo clique "Payer" et atterrit sur une page Packlink
  vide.
- Un `financial_documents` avec `qonto_invoice_id='...'` alors que la facture
  n'existe pas chez Qonto.
- Un `stock_movement` sans contrepartie réelle en stock.
- Une colonne `notes` texte qui contient une trace technique ("Sauvetage
  manuel", "BO-BUG-SHIPMENT", "wizard a échoué") au lieu d'une note métier.
- Un status de commande passé à `shipped` "pour rattraper" alors qu'aucun
  colis n'a été expédié.

---

## Interdictions absolues pour tout agent

### 1. Jamais d'INSERT/UPDATE manuel pour "réparer" un état cassé

Si un wizard foire côté DB, si un webhook rate, si un call API externe rate :
**NE PAS** faire un `INSERT` à la main pour "aligner" la DB avec l'état que
le wizard aurait dû créer. Le bug est côté code → fixer le code, pas la DB.

Cas valides d'UPDATE/DELETE manuel :

- **Nettoyer** une row clairement fausse (ex : supprimer une donnée fantôme
  existante). Après accord explicite Romeo.
- **Purger** un champ texte pollué (ex : `notes = NULL`).

Cas INVALIDES :

- `INSERT INTO sales_order_shipments` pour "rattraper" un shipment qui a
  échoué côté wizard.
- `UPDATE products SET stock_real = ...` pour "corriger" un décompte sans
  stock_movement.
- `INSERT INTO stock_movements` à la main sans déclencheur métier réel.
- `UPDATE sales_orders SET status = 'shipped'` sans shipment réel.

### 2. Jamais de note technique dans une colonne visible utilisateur

Les champs `notes`, `description`, `label`, `reason`, `comment` visibles dans
une page utilisateur sont **la voix de Romeo** (ou de l'équipe). L'agent
n'écrit JAMAIS dans ces champs des références à des sprints, des bugs, des
scripts de sauvetage, des stack traces.

Les traces techniques vont :

- Dans un **commit message** (historique Git).
- Dans un **scratchpad** `docs/scratchpad/`.
- Dans un **log applicatif** (console.error, Sentry).
- Dans une **table d'audit dédiée** si besoin de persistance.

**Jamais** dans la donnée métier.

### 3. Jamais d'alignement cosmétique d'un état cassé

Si l'utilisateur voit une incohérence UI (ex : "la progression affiche 50%
alors que rien n'est expédié"), **le fix est dans le code**, pas dans la DB.

Fausse bonne idée : "je vais juste UPDATE status pour que ça paraisse
cohérent" → NON. Diagnostiquer pourquoi le code affiche 50%, et fixer la
source de vérité.

### 4. Jamais de rescue script qui laisse une trace dans la donnée

Si un agent écrit un script one-shot pour corriger un état cassé (autorisé
uniquement après accord explicite Romeo) :

- Le script est documenté dans un scratchpad `docs/scratchpad/`.
- Le script NE laisse AUCUNE note, id technique ou flag en DB.
- Le script est testé avant-après : l'état visible utilisateur doit être
  strictement équivalent à ce qui se serait produit via le vrai workflow.

---

## Contrôle avant tout write en production

Avant tout `INSERT`, `UPDATE`, `DELETE` sur une table métier en prod, l'agent
doit se poser ces 4 questions. Si la réponse est "non" à une seule, il
arrête et demande à Romeo.

1. Est-ce que l'état que je crée correspond à un état réel côté système
   externe concerné (Packlink, Qonto, Supabase, etc.) ?
2. Est-ce que ce write serait produit par le workflow utilisateur normal
   (un clic utilisateur aurait déclenché ce même INSERT) ?
3. Est-ce que les triggers DB vont produire l'état post-write correct, ou
   est-ce que je contourne une logique métier (ex : `packlink_status=paye`
   sans passer par le webhook) ?
4. Est-ce que les colonnes texte que j'écris ne contiennent QUE des
   contenus que Romeo / l'équipe produirait ?

---

## Incident du 2026-04-22 (référence)

`sales_order_shipments` row `d742e3ac-e389-44c3-80ed-b96de9841f0b` sur
SO-2026-00158 :

- Créée manuellement par un script de sauvetage la veille après un échec
  d'INSERT côté wizard.
- `packlink_shipment_id = 'UN2026PRO0001424092'` — référence INEXISTANTE
  sur Packlink PRO.
- `notes = 'Transport Packlink UPS à payer par Verone — Sauvetage manuel
2026-04-22: wizard a créé le shipment Packlink mais a échoué sur INSERT
DB (bug useShipmentWizard:425-438 à corriger dans sprint BO-BUG-SHIPMENT-001)'`.
- Résultat utilisateur : clic "Payer" → redirection vers page Packlink
  vide. Rupture de confiance complète.

Action corrective :

1. Supprimer la row (trigger `handle_shipment_deletion` early-return safe
   pour `packlink_status='a_payer'`).
2. Créer cette règle.
3. Référencer dans CLAUDE.md racine section INTERDICTIONS ABSOLUES.

---

## Référence

Fichier référencé par :

- `CLAUDE.md` racine (section INTERDICTIONS ABSOLUES)
- `.claude/rules/stock-triggers-protected.md` (complémentaire sur les
  triggers stock, qui n'est qu'un cas particulier de donnée fantôme)
- `.claude/rules/database.md` (règles DB générales)
