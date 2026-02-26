# Daily Workflows by Role

## Role Comparison Summary

| Capability                          | Owner | Admin |
| ----------------------------------- | ----- | ----- |
| Business KPIs dashboard             | Yes   | Yes   |
| Team metrics dashboard              | Yes   | No    |
| User management (CRUD)              | Yes   | No    |
| User activity logs                  | Yes   | No    |
| Products CRUD                       | Yes   | Yes   |
| Sales orders CRUD                   | Yes   | Yes   |
| Purchase orders CRUD                | Yes   | Yes   |
| Stock movements CRUD (incl. DELETE) | Yes   | Yes   |
| Price lists CRUD (incl. DELETE)     | Yes   | Yes   |
| Organisations CRUD                  | Yes   | Yes   |
| Customers/Contacts CRUD             | Yes   | Yes   |
| Consultations CRUD                  | Yes   | Yes   |
| Business exports (CSV/PDF)          | Yes   | Yes   |
| Team activity export                | Yes   | No    |
| Modify own profile                  | Yes   | Yes   |
| Modify other profiles               | Yes   | No    |

**Admin has 95% of Owner capabilities.** The 5% difference is user management and team visibility.

---

## Owner Daily Workflow

### Morning (9h-12h)

**9h00 - Dashboard** (`/dashboard`)

- Review business KPIs: monthly revenue, order count, catalog size, stock value
- Review team metrics (Owner-only): active users, orders/consultations created per user, last activity
- Check alerts: low stock, pending validations, new sourcing products

**9h15 - Team Activity** (`/admin/activite-utilisateurs`)

- Review user activity over last 7 days
- Identify inactive users or performance drops
- Export team activity report if needed

**10h00 - User Management** (`/admin/users`)

- Create new users: set name, email, role (admin/sales), auto-generated password with invitation email
- Modify user roles: change admin <--> sales as needed
- Deactivate departing employees (soft delete, audit trail preserved)
- Protection: last Owner cannot be deleted (trigger blocks)

### Afternoon (14h-18h)

**14h00 - Business Operations** (same as Admin, see below)

- Catalogue management, orders, stock, CRM

**17h30 - Team Activity Export** (`/admin/activite-utilisateurs` --> Export CSV)

- Owner-only export of user activity metrics

**18h00 - End of Day Review**

- Check daily KPIs vs targets
- Review team activity summary
- Plan next day priorities including any Owner-only validations needed

### Owner-Only Pages

| Route                          | Purpose            |
| ------------------------------ | ------------------ |
| `/admin/users`                 | User CRUD          |
| `/admin/activite-utilisateurs` | Team activity logs |

### Owner-Only DB Access (RLS)

| Table                           | Owner             | Admin            |
| ------------------------------- | ----------------- | ---------------- |
| `user_activity_logs`            | SELECT all tenant | No access        |
| `user_profiles` INSERT/DELETE   | Full CRUD         | Blocked          |
| `user_profiles` UPDATE          | All profiles      | Own profile only |
| `user_organisation_assignments` | Full CRUD         | No access        |

---

## Admin Daily Workflow

### Morning (9h-12h)

**9h00 - Dashboard** (`/dashboard`)

- Review business KPIs: monthly revenue, order count, catalog size, stock value
- Check alerts: low stock, pending validations, new sourcing products
- Note: Team metrics section is NOT visible to Admin

**9h15 - Profile Management** (`/settings/profile`)

- Admin can modify own profile only (name, phone, position, password)
- Cannot access `/admin/users` (redirects to dashboard with 403)

**10h00 - Sourcing** (`/catalogue/produits` or `/produits/sourcing/produits`)

- Create new products via quick sourcing (3 fields) or full wizard (4 steps)
- Link suppliers, set pricing, manage images
- Validate sourcing products to catalogue when ready

**11h00 - Price Lists** (`/catalogue/listes-prix`)

- Create, edit, duplicate, delete price lists
- Admin has full CRUD including DELETE (same as Owner)

### Afternoon (14h-18h)

**14h00 - Sales Orders** (`/ventes/commandes`)

- Create client orders: select client, channel, add products, set quantities
- Track order status through lifecycle

**15h00 - Purchase Orders** (`/achats/commandes`)

- Create supplier orders: select supplier, add products, set delivery date
- Generate and send PDF to supplier

**16h00 - Stock Management** (`/stock/mouvements`)

- Record stock entries (reception) and exits (shipments)
- Adjust stock for inventory counts or damage
- Delete erroneous movements (with stock auto-adjustment)

**17h00 - CRM** (`/clients/particuliers`, `/consultations`)

- Create and manage individual clients
- Create and track consultations (project type, budget, products of interest)

**18h00 - Exports & End of Day**

- Export catalogue, price lists, orders, stock data as CSV/PDF
- Review daily KPIs on dashboard
- Plan next day priorities
- Note: Cannot export team activity report (Owner-only)

### Admin Restrictions

| Restricted Action                     | What Happens                 |
| ------------------------------------- | ---------------------------- |
| Access `/admin/users`                 | Redirect to /dashboard (403) |
| Access `/admin/activite-utilisateurs` | Redirect to /dashboard (403) |
| INSERT into user_profiles             | RLS policy violation error   |
| UPDATE other user's profile           | RLS blocks (only auth.uid()) |
| View user_activity_logs               | RLS blocks SELECT            |

When Admin needs user management actions, they must ask Owner.

---

## Morning Checklist (Both Roles)

```
[ ] Check dashboard KPIs and alerts
[ ] Review low stock alerts (reorder if needed)
[ ] Check pending orders requiring attention
[ ] Review new sourcing products to validate
[ ] Check finance/reconciliation for pending transactions (5 min)
```

### Owner Additional Morning Tasks

```
[ ] Review team activity metrics
[ ] Check for inactive users
[ ] Process any pending user creation requests
```

---

## Key Pages Quick Reference

| Task                | Route                          | Owner | Admin |
| ------------------- | ------------------------------ | ----- | ----- |
| Dashboard           | `/dashboard`                   | Yes   | Yes   |
| User management     | `/admin/users`                 | Yes   | No    |
| Team activity       | `/admin/activite-utilisateurs` | Yes   | No    |
| Own profile         | `/settings/profile`            | Yes   | Yes   |
| Products catalogue  | `/catalogue/produits`          | Yes   | Yes   |
| Sourcing            | `/produits/sourcing/produits`  | Yes   | Yes   |
| Price lists         | `/catalogue/listes-prix`       | Yes   | Yes   |
| Sales orders        | `/ventes/commandes`            | Yes   | Yes   |
| Purchase orders     | `/achats/commandes`            | Yes   | Yes   |
| Stock movements     | `/stock/mouvements`            | Yes   | Yes   |
| Clients             | `/clients/particuliers`        | Yes   | Yes   |
| Consultations       | `/consultations`               | Yes   | Yes   |
| Bank reconciliation | `/finance/rapprochement`       | Yes   | Yes   |
| Transactions        | `/finance/transactions`        | Yes   | Yes   |
| Expenses            | `/finance/depenses`            | Yes   | Yes   |
