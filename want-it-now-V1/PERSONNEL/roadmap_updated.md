# Want It Now - Roadmap de Développement (MVP)

## Vue d’ensemble
Application SaaS de gestion immobilière (master-lease et conciergerie) avec :
- Propriétés reliées à des organisations (sociétés)
- Propriétaires indépendants reliés aux propriétés via des quotités
- Unités optionnelles dans les propriétés
- Bookings et transactions liés soit à une propriété (si pas d’unités), soit à une unité (si unités)

---

## Phases et Dépendances

### Phase 0 – Boot (Pas de dépendance)
- Repo GitHub + Turborepo
- Supabase initialisé (vide)
- Next.js 15, Tailwind, shadcn/ui
- CI/CD GitHub Actions + Vercel
- **Création d’un Guide Visuel (bibliothèque de composants UI)** :
  - Tous les boutons, formulaires, cartes et éléments réutilisables
  - Accessible dans le dashboard pour guider les développements

---

### Phase 1 – Base de données (ordre strict)
1. `organizations`
2. `profiles` (FK vers `auth.users` et `organizations`)
3. `owners`
4. `shareholders` (co-actionnaires d’un owner société)
5. `properties` (liées à `organizations`)
6. `units` (optionnelles)
7. `property_ownership` (owners ↔ properties, SUM(ownership)=100%)
8. `seasonal_bookings` et `transactions`
   - `property_id` ou `unit_id` mais jamais les deux (trigger)
   - Si unités → bookings forcés sur `unit_id`
9. `lease_contracts` (lié à propriétés ou unités, génère transactions)
10. Triggers globaux : validation quotités, règles exclusives, synchro `profiles` ↔ `auth.users`

---

### Phase 2 – UI + Auth
- Pages login/register/forgot
- Layout `<AppShell>` (Header, Sidebar)
- Connexion Supabase Auth
- Thème dark/light
- **Intégration du Guide Visuel dans le dashboard**

---

### Phase 3 – Vertical Slices (fonctionnalités clés)
1. CRUD Owners (API, UI, tests)
2. CRUD Properties & Units (UI + Map view + wizard)
3. Bookings & Calendar (gestion `property_id` vs `unit_id`, import CSV, conflits)

---

### Phase 4 – Fonctions transversales
- Dashboard KPIs (RevPAR, taux d’occupation)
- RLS avancée (RBAC + tenants)
- Internationalisation (FR/EN/PT)
- Audit a11y complet

---

### Phase 5 – Finances & Opérations
- Contrats fixes/variables et calculs automatiques
- Payouts mensuels
- Inventaire et inspections (photos)
- Export Excel/PDF

---

### Phase 6 – Optimisation et Finition
- Optimisation SQL (pg_stat_statements)
- Widgets personnalisables dans le dashboard
- PWA (mode offline)
- Version multilingue finale
- **Utilisation complète du Guide Visuel** pour cohérence UI

---

Chaque étape suit l’approche **Vertical Slice** : DB → API → UI → Tests avant de passer à la suivante.
Toutes les migrations sont **idempotentes**, testées par **pgTAP**.
