# Database Modeling Patterns — Verone

**Source de vérité unique** pour les choix de modélisation DB côté Verone. Lue à
chaque session par tout agent qui s'apprête à : (a) créer une nouvelle table,
(b) ajouter une colonne « status » / « type » / « kind », (c) modéliser un
workflow avec plusieurs sous-types d'une même entité.

Créée le 2026-05-27 après incident d'auto-critique : l'agent a proposé à Roméo
de créer une table dédiée `sample_orders` pour gérer les commandes d'échantillon
de sourcing. Roméo a immédiatement refusé : « une commande d'échantillon EST
une commande fournisseur avec un statut particulier ». La recherche web 2026
(Crunchy Data, Brightpearl, Tradogram, Ramp, Cybertec) a confirmé que la
pratique standard ERP est le Single Table Inheritance avec colonne discriminator,
pas la création de tables séparées par cas d'usage.

---

## Règle 1 — Ne PAS créer une table par cas d'usage

**Avant de créer une nouvelle table `xxx_orders` / `xxx_invoices` / `xxx_documents`
pour un cas particulier, l'agent se pose 4 questions :**

1. Est-ce que cette « nouvelle entité » partage la majorité des attributs avec
   une entité existante (fournisseur, client, prix, dates, statut, paiement) ?
2. Est-ce que le workflow métier traite ces deux entités de façon similaire
   (mêmes triggers stock, mêmes routes API, mêmes rapports comptables) ?
3. Est-ce qu'on aurait besoin de joindre les deux entités pour répondre à une
   question business courante (« toutes les commandes du fournisseur X, échantillons
   inclus ») ?
4. Est-ce que les utilisateurs (Roméo, équipe) les perçoivent comme une seule
   famille (« mes commandes fournisseurs ») ou comme deux choses séparées ?

**Si 3 réponses sur 4 sont OUI → c'est le même type d'entité.**
→ Ajouter une colonne **discriminator** (`xxx_type`, `kind`, `category`) à la table
existante (Single Table Inheritance), pas une nouvelle table.

**Si 3 réponses sur 4 sont NON → c'est une entité réellement différente.**
→ Nouvelle table justifiée (Concrete Table Inheritance).

### Exemple concret — incident 2026-05-27

**Mauvais réflexe** : « les commandes d'échantillon sont différentes, on crée
`sample_orders` + `sample_order_items` ».

**Bon réflexe** : « une commande d'échantillon utilise le même fournisseur, le
même prix, la même livraison, le même paiement, le même fichier comptable
qu'une commande normale. Seule la **finalité métier** diffère (tester avant
d'acheter en gros). On ajoute `purchase_orders.po_type` ('standard' | 'sample')
et on filtre dans l'UI ».

### Pourquoi ce réflexe est piège

- **Sur-ingénierie immédiate** : duplication des routes API, des triggers stock,
  des composants UI, des rapports comptables.
- **Désynchronisation à terme** : 2 ans plus tard, on modifie `purchase_orders`
  pour ajouter une colonne « numéro de suivi transporteur » et on oublie de
  mettre à jour `sample_orders`. Bug invisible.
- **Pollution du schéma** : Verone est un ERP, pas un microservice. La table
  `purchase_orders` doit rester la source de vérité de toutes les commandes
  fournisseurs.
- **Anti-pattern ORM bien documenté** : c'est l'opposé de Single Table
  Inheritance, ce qu'utilisent Rails, Django, Hibernate et Spring depuis 20 ans
  pour ce genre de cas.

---

## Règle 2 — CHECK constraint sur TEXT > ENUM pour les workflows évolutifs

**Pour toute colonne « status » / « state » / « stage » qui représente un
workflow métier susceptible d'évoluer (ajout/retrait de statuts), utiliser
TEXT + CHECK constraint, pas un type ENUM PostgreSQL.**

### Pourquoi pas ENUM

- **Rigide** : impossible de retirer une valeur d'un ENUM existant sans
  recréer le type ET migrer toutes les colonnes qui l'utilisent (DROP TYPE
  CASCADE = perte de données potentielle).
- **Ordering imposé** : l'ordre des valeurs ENUM est fixe (création), ajouter
  une valeur au milieu nécessite `ALTER TYPE ... ADD VALUE ... BEFORE ...`.
- **Verrouille la migration** : impossible d'ajouter une valeur ENUM dans une
  transaction qui l'utilise immédiatement (transaction boundary).
- **Pas de logique conditionnelle** : un ENUM = juste une liste de valeurs.
  Une CHECK constraint peut exprimer des règles complexes (`CHECK (status = 'shipped' AND tracking_id IS NOT NULL OR status != 'shipped')`).

### Pattern correct

```sql
-- ÉVITER
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'shipped', 'delivered');
ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'draft';

-- PRÉFÉRER
ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'draft';
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered'));
```

### Évolution facile

```sql
-- Ajouter un statut = 1 ligne, instantané, pas de migration de données
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'partially_shipped'));
```

### Sources 2026

- Crunchy Data Blog — _Enums vs Check Constraints in Postgres_
- Cybertec PostgreSQL — _Lookup table or enum type ?_
- Close.com Engineering — _Native enums or CHECK constraints in PostgreSQL_

Tous trois convergent : pour un workflow status, CHECK > ENUM.

### Exception — quand ENUM reste pertinent

- Catégorie 100 % stable, jamais étendue (`'M' | 'F' | 'X'` pour un sexe, `'celcius' | 'fahrenheit'` pour une unité).
- Performance critique sur des millions de rows avec besoin de tri natif sur
  l'ordre métier (un ENUM est plus rapide qu'une CHECK + ORDER BY CASE WHEN).
  → Très rare chez Verone (volumétrie raisonnable).

---

## Règle 3 — Lookup table : 3e option, rare chez Verone

Une lookup table (table de référence `xxx_statuses` avec FK depuis la table
métier) est justifiée si :

- Les statuts ont des **métadonnées riches** : label i18n, icône, couleur,
  ordre d'affichage, description longue, group parent.
- Les statuts sont **gérés par les utilisateurs** (admin peut créer/modifier
  via UI).
- Les statuts sont **liés à d'autres entités** (rôles, permissions, workflow
  approval).

Sinon, CHECK constraint sur TEXT suffit. Chez Verone, les libellés métier des
statuts sont aujourd'hui hardcodés dans le frontend (`statusOptions`, `getStatusLabel()`)
ce qui est acceptable tant que Roméo seul gère le workflow.

---

## Règle 4 — Migration safe pour ajouter une colonne discriminator

Si on ajoute une colonne `xxx_type` à une table existante avec données réelles :

1. Ajouter la colonne **NULLABLE** d'abord avec un default explicite :
   ```sql
   ALTER TABLE purchase_orders
     ADD COLUMN po_type TEXT DEFAULT 'standard';
   ```
2. Backfill les rows existantes (ici, toutes les PO existantes sont 'standard') :
   ```sql
   UPDATE purchase_orders SET po_type = 'standard' WHERE po_type IS NULL;
   ```
3. Ajouter la contrainte NOT NULL **après** le backfill :
   ```sql
   ALTER TABLE purchase_orders
     ALTER COLUMN po_type SET NOT NULL,
     ADD CONSTRAINT purchase_orders_po_type_check
       CHECK (po_type IN ('standard', 'sample'));
   ```
4. Index si on filtre dessus souvent :
   ```sql
   CREATE INDEX purchase_orders_po_type_idx ON purchase_orders (po_type);
   ```
5. Régénérer les types TS :
   ```bash
   python3 scripts/generate-docs.py --db
   pnpm run generate:types
   ```

Pour les volumes Verone (< 100k rows par table métier), tout ça est instantané
et safe.

---

## Anti-patterns interdits

- ❌ Créer une table par cas d'usage métier sans poser les 4 questions de la
  Règle 1.
- ❌ Utiliser ENUM pour un workflow statut qui peut évoluer (Règle 2).
- ❌ Mélanger 2 informations métier dans une seule colonne (ex: incident 2026-05-27
  bouton « Commander échantillon » qui modifiait `requires_sample` ET
  `product_status` ET créait une PO — chacun de ces 3 effets devrait être
  isolé).
- ❌ Créer une lookup table pour 5 valeurs hardcodées dans le frontend (Règle 3
  exception).
- ❌ Modifier l'ordre d'une ENUM existante sans plan de rollback (changement
  destructif).

---

## Référence

Fichier référencé par :

- `CLAUDE.md` racine (section SOURCES DE VERITE + section INTERDICTIONS)
- `.claude/INDEX.md`
- `.claude/rules/database.md` (complémentaire — règles RLS, migrations)

Complémentaire de :

- `.claude/rules/no-phantom-data.md` (interdiction d'écrire des données qui ne
  correspondent à aucun workflow réel — sample_orders aurait été ce cas).
- `.claude/rules/stock-triggers-protected.md` (les triggers stock sont protégés
  car ils sont la conséquence de cette modélisation : 1 PO = 1 commande, qu'elle
  soit standard ou échantillon).
