# Plan Sprint SI-CLIENT-ORDER-001 — Clients & Commandes Site Internet

Date: 2026-05-02
Branche: feat/SI-CLIENT-ORDER-001-clients-commandes
Worktree: /Users/romeodossantos/verone-client-order

## Résumé

Enrichissement de la section Site Internet du back-office :
1. Onglet Clients : KPIs, pagination+tri, notes internes
2. Onglet Commandes : export CSV + notes internes timeline

## Étapes

### Étape 1 — KPIs Clients
- Créer `hooks/use-site-customers-kpis.ts`
- 4 KPIs : totalCustomers, activeCustomers, averageLtv, averageOrderValue
- Grid 2x2 mobile / 4 col desktop dans ClientsSection.tsx

### Étape 2 — Pagination + tri table clients
- Extraire query vers `hooks/use-site-customers.ts`
- État pagination : pageSize=20, page, slice
- État tri : sortKey + sortDir, click header toggle
- Colonnes triables : last_name, email, city, created_at
- UI : boutons Précédent/Suivant + "Page X / Y"

### Étape 3 — Notes internes client
- Section "Notes internes" dans CustomerDetailModal.tsx
- Hook `hooks/use-update-customer-notes.ts` (useMutation + invalidate)
- Auto-save sur blur ou bouton Sauvegarder
- Vérifier que use-customer-detail.ts sélectionne la colonne `notes`

### Étape 4 — Filtres avancés commandes
- Inspecter SalesOrderFilters.tsx (filtres Statut, Année, Période déjà présents)
- SalesOrdersTable a déjà showKPIs, enablePagination → suffisant
- Vérifier si `renderHeaderRight` peut servir pour le bouton CSV
- Aucune modification de @verone/orders nécessaire (filtres existants ok)

### Étape 5 — Notes internes timeline commande
- Créer `components/order-detail/OrderInternalNotesTimeline.tsx`
- Créer `hooks/use-order-internal-notes.ts`
- Lecture : `sales_order_events WHERE sales_order_id=? AND event_type='internal_note' ORDER BY created_at DESC`
- Écriture : insert event_type='internal_note', metadata={content: '...'}
- Intégrer dans OrderDetailModal.tsx (nouvel onglet ou section en bas)
- Note : sales_order_events a RLS staff_full_access → OK pour back-office

### Étape 6 — Export CSV commandes
- Créer `utils/export-orders-csv.ts`
- Fetch sales_orders JOIN individual_customers côté client
- Utiliser arrayToCSV + downloadCSV de @verone/utils/export/csv
- Bouton "Exporter CSV" dans OrdersSection.tsx via renderHeaderRight prop

### Étape 7 — Validations
- type-check back-office
- lint back-office
- Corriger toute erreur TS

## Décisions techniques
- `sales_order_events` utilisé pour timeline notes commande (pas de migration)
  → Table existe déjà avec les bonnes colonnes + RLS staff_full_access
- Export CSV côté client (données filtrées par channelId) avec limit 5000
- Pagination client-side pour les clients (< 1000 clients attendus)
- KPIs via useQuery séparée (staleTime 5min) pour ne pas bloquer la table
