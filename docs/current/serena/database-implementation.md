# Verone DB Foundation - Reference Architecture

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- supabase/migrations/
- packages/@verone/types/src/supabase.ts
  Owner: Romeo Dos Santos
  Created: 2025-11-01
  Updated: 2026-01-10

---

## Statut

**Implementation complete** - Architecture DB stable.

---

## Architecture Actuelle (~78 tables)

### Tables Core

| Domaine       | Tables                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| **Auth**      | organisations, user_profiles, user_organisation_assignments, user_app_roles |
| **Catalogue** | products, categories, subcategories, collections, product_images            |
| **Stock**     | stock_movements, stock_alert_tracking, stock_reservations                   |
| **Orders**    | purchase_orders, sales_orders, _\_items, _\_receptions, \*\_shipments       |
| **Finance**   | invoices, payments, bank_transactions                                       |
| **LinkMe**    | linkme_affiliates, linkme_commissions, linkme_selections                    |

### Helper Functions RLS (critiques)

```sql
get_user_role()                 -- RLS role utilisateur
get_user_organisation_id()      -- RLS organisation utilisateur
has_scope(text)                 -- Verification permissions granulaires
update_updated_at()             -- Trigger timestamps automatiques
```

### Roles & Permissions

| Role      | Acces                                          |
| --------- | ---------------------------------------------- |
| **Owner** | Acces complet + gestion securite/utilisateurs  |
| **Admin** | Metier complet (catalogue, clients, commandes) |
| **Sales** | Commandes, clients (lecture)                   |

---

## Patterns Securite

### Multi-tenant RLS

- Isolation complete par `organisation_id`
- Helper functions `SECURITY DEFINER`
- Policies testees pour tous roles

### Convention Triggers

- Tous triggers stock : `SECURITY DEFINER` + `SET search_path`
- Evite boucles infinies entre triggers

---

## Performance SLO

| Metrique           | Objectif |
| ------------------ | -------- |
| Dashboard          | < 2s LCP |
| Requetes catalogue | < 200ms  |

### Index Critiques

- Index JSONB sur `variant_attributes`
- Index partiels sur statuts actifs
- Index FK sur toutes relations

---

## Regles Absolues

1. **JAMAIS** modifier un trigger sans comprendre la cascade
2. **TOUJOURS** tester RLS avec differents roles
3. **JAMAIS** bypasser RLS avec `service_role` sauf necessaire

---

## References

- `supabase/migrations/` - Source de verite schema
- `docs/current/database.md` - Documentation complete
- `docs/current/serena/database-schema-mappings.md` - Mappings colonnes
