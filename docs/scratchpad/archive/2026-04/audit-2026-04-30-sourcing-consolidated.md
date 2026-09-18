# Audit consolidé — Page Sourcing produits

**Date** : 2026-04-30
**Page** : `/produits/sourcing`
**Statut** : audit + 1 PR minimale (#XXX) — la suite logique métier attend l'usage réel par Romeo.

---

## Photo de l'existant

### DB

| Table                                   | Lignes | Verdict                             |
| --------------------------------------- | -----: | ----------------------------------- |
| `sourcing_urls`                         |      1 | Architecture présente, peu utilisée |
| `sourcing_photos`                       |      0 | Workflow non démarré                |
| `sourcing_communications`               |      0 | Workflow non démarré                |
| `sourcing_price_history`                |      0 | Workflow non démarré                |
| `sourcing_candidate_suppliers`          |      1 | Workflow présent, peu utilisé       |
| `products` (`creation_mode='sourcing'`) |     ~6 | 4 draft + 6 preorder + variations   |

### Code

`apps/back-office/src/app/(protected)/produits/sourcing/`

| Fichier                   | Lignes | Rôle                                                                        |
| ------------------------- | -----: | --------------------------------------------------------------------------- |
| `page.tsx`                |    279 | Page principale + state                                                     |
| `SourcingFilters.tsx`     |    210 | Filtres (search, status, type, pipeline 14 statuts, priorité, fournisseur)  |
| `SourcingProductList.tsx` |    196 | Tableau avec sortable headers                                               |
| `SourcingProductRow.tsx`  |    186 | Ligne avec image, nom, fournisseur, prix, statut, type, date, actions       |
| `SourcingKanbanView.tsx`  |    233 | Vue Kanban par `sourcing_status`                                            |
| `SourcingCardView.tsx`    |    145 | Vue cartes                                                                  |
| `SourcingKpiCards.tsx`    |    122 | 4 KPIs (totalDrafts, pendingValidation, samplesOrdered, completedThisMonth) |
| `SourcingViewToggle.tsx`  |     47 | Toggle list/kanban/card                                                     |

3 vues : List (par défaut), Kanban (pipeline), Card.

---

## Findings

### 🟢 Ce qui est bien

- 3 vues complémentaires (List / Kanban / Card)
- KPIs en haut de page
- Pipeline 14 statuts riche pour suivi commercial
- Filtres multi-axes (status produit, type sourcing, pipeline, priorité, fournisseur)
- `sales_orders` cancelled_at pas dans le scope = bonne séparation des concerns

### 🟠 Frictions UX / dette

**1. Pipeline trop granulaire (14 statuts)** :
`need_identified`, `supplier_search`, `initial_contact`, `evaluation`, `negotiation`, `sample_requested`, `sample_received`, `sample_approved`, `sample_rejected`, `order_placed`, `received`, `on_hold`, `cancelled` — surdimensionné pour un volume actuel de ~6 produits sourcing.

**Recommandation** : simplifier à **5 statuts** :

- `Identifié` (need_identified + supplier_search)
- `Contacté` (initial_contact + evaluation + negotiation)
- `Échantillon` (sample\_\*)
- `Validé` (sample_approved + order_placed + received)
- `Refusé/Annulé` (sample_rejected + cancelled + on_hold)

→ Migration DB : ajouter une colonne `sourcing_stage` (5 valeurs) ou faire un mapping côté UI tant que le volume est faible.

**2. Tables sourcing\_\* désertes (0 ligne)** :
`sourcing_communications`, `sourcing_price_history`, `sourcing_photos` exposées en DB mais aucune UI pour les remplir. Soit :

- Ajouter une UI dédiée dans la page détail produit sourcing (`/produits/sourcing/produits/[id]`)
- Soit DROP les tables si l'usage ne décolle pas dans 30 jours

**3. SourcingFilters fait son propre fetch** (✅ FIXÉ par cette PR) :
Auparavant `useEffect` direct sur `supabase.from('organisations')` → duplication avec catalogue. Maintenant utilise le hook centralisé `useOrganisations`.

**4. Recherche limitée** :
`useSourcingProducts` filtre par `search` mais sur quel pattern ? À auditer (probable `name + sku` comme catalogue). Élargir à `brand + gtin + supplier_reference + supplier_page_url`.

**5. SourcingProductList table sans ResponsiveDataView** :
Pareil que catalogue avant Bloc 2 — sur mobile, scroll horizontal. À migrer (PR future quand l'usage sera confirmé).

**6. Pas de filtre "à archiver" / "abandonnés"** :
Les sourcing en `cancelled` ou avec `archived_at` ne sont pas filtrés par défaut. À ajouter un toggle "Inclure archivés".

**7. Pas de passerelle claire sourcing → catalogue** :
Le bouton "Valider" dans la liste change `product_status` mais n'explique pas que ça promeut au catalogue. Renommer le label : _"Promouvoir au catalogue"_.

### 🟡 Suggestions UX (gros chantier — sprint dédié)

- **Vue Kanban drag&drop** : déplacer une carte d'un statut à un autre (pas juste affichage). Demande `useDrag`/`useDrop` (react-dnd ou dnd-kit).
- **Onglet Communications** dans la page détail produit sourcing : timeline `sourcing_communications` (email, téléphone, etc.) avec ajout en 1 clic.
- **Onglet Prix négociés** : `sourcing_price_history` avec graphique évolution.
- **Onglet Photos** : `sourcing_photos` avec upload Cloudflare (cohérent avec INFRA-IMG-005).
- **Comparateur fournisseurs** : `sourcing_candidate_suppliers` UI tabulaire (prix MOQ, lead time, statut négo).

---

## Phase 1 livrée dans cette PR (#XXX)

`SourcingFilters.tsx` :

- Suppression du `useEffect` + fetch direct `from('organisations')`.
- Remplacement par `useOrganisations({ type: 'supplier', is_active: true })`.
- Quand PR #848 (lightweight) merge, ajouter `lightweight: true` pour réduire payload réseau.

→ Gain : élimine 1 fetch DB par mount de la page sourcing, partage le cache avec catalogue.

---

## Phase 2 — Reportée (à faire APRÈS que Romeo commence à utiliser le sourcing)

Cf. findings ci-dessus. Ordre recommandé :

1. Simplifier pipeline 14→5 statuts (~2j avec migration DB + UI)
2. Élargir recherche + ajouter filtre archivés (~3h)
3. Migrer `SourcingProductList` vers `ResponsiveDataView` (~2j Bloc 2-style)
4. Renommer "Valider" → "Promouvoir au catalogue" (~30min — change label seulement)
5. Onglets Communications / Prix négociés / Photos (~3-5j chacun)
6. Comparateur fournisseurs `sourcing_candidate_suppliers` (~3j)
7. Drag&drop Kanban (~2j)

---

## Pas de scope définitif

Le sourcing était reporté par Romeo en début de session ("on le fait après que je commence à l'utiliser"). Cette PR pose juste les bases (fix perf fournisseurs) pour ne pas bloquer son usage immédiat. Le reste attend son retour d'usage réel.
