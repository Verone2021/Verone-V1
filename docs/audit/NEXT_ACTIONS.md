# NEXT_ACTIONS.md - Actions Prioritaires Post-Audit

**Date** : 2025-12-15
**Scope** : Vérone V1 Monorepo
**Mode** : READ-ONLY Synthèse

---

## Verdict Final

### GO / STOP ?

## **GO CONDITIONNEL**

**Prêt pour data entry ?** : **OUI**, avec les 3 actions P0 réalisées en préalable.

**Blocants immédiats** (P0) :

1. Merger les PRs docs pour état propre
2. Valider RLS sur tables sensibles LinkMe
3. Exécuter seed minimal (10 lignes SQL)

**Risques acceptables** :

- Les `as any` (110) sont une dette technique, pas un blocant fonctionnel
- Le pre-push hook timeout est contournable (`--no-verify` pour docs-only)
- Les GitHub Actions FAILURE sont informatifs (Vercel checks passent)

---

## 10 Actions Prioritaires

### P0 - BLOQUANT (Avant Data Entry)

| #   | Action                                                         | Effort | Justification                                            |
| --- | -------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| 1   | **Merger PRs docs** (#17, #18, #19, #20, #21)                  | 15 min | État propre avant data. Docs alignées avec réalité.      |
| 2   | **Audit RLS complet** (linkme_commissions, channel_pricing)    | 30 min | RISQUE ÉLEVÉ - Isolation données affiliés non confirmée. |
| 3   | **Seed minimal** (organisation + 3 produits + channel_pricing) | 15 min | Prérequis pour tester flows E2E.                         |

**Temps total P0** : ~1 heure

### P1 - IMPORTANT (Sprint Suivant)

| #   | Action                                                                 | Effort | Justification                                       |
| --- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| 4   | **Déplacer check-console-errors en CI**                                | 1h     | Issue #22 - Débloquer pre-push pour tous.           |
| 5   | **Ajouter RLS channel_pricing** (SELECT par enseigne)                  | 2h     | Remplacer filtrage client-side par serveur-side.    |
| 6   | **Implémenter HMAC webhook Revolut**                                   | 2h     | Sécurité paiements - pas de signature actuellement. |
| 7   | **Écrire 3 tests E2E** (Back-office CRUD, LinkMe sélection, Cross-app) | 4h     | Coverage minimum parcours critiques.                |

**Temps total P1** : ~9 heures

### P2 - SOUHAITABLE (Backlog)

| #   | Action                                  | Effort | Justification                                              |
| --- | --------------------------------------- | ------ | ---------------------------------------------------------- |
| 8   | **Éliminer `as any`** (110 occurrences) | 8h     | Type safety compromise - refactor progressif.              |
| 9   | **Refactor fichiers > 600 lignes**      | 6h     | Maintenabilité - contact-form-modal-wrapper (1592 lignes). |
| 10  | **Cleanup branches + pages demo**       | 1h     | 7 branches locales + 5 pages /demo-\* à archiver.          |

**Temps total P2** : ~15 heures

---

## Definition of Ready (Data Entry)

### Checklist Pré-Data Entry

| #   | Item                       | Status | Action Requise                     |
| --- | -------------------------- | ------ | ---------------------------------- |
| 1   | PRs docs mergées           | ⏳     | Merger #17, #18, #19, #20, #21     |
| 2   | RLS validé tables LinkMe   | ⏳     | Query `pg_policies` sur linkme\_\* |
| 3   | Seed organisation test     | ⏳     | INSERT 1 row organisations         |
| 4   | Seed produits test         | ⏳     | INSERT 3 rows products             |
| 5   | Seed channel_pricing       | ⏳     | INSERT 3 rows (LINKME channel)     |
| 6   | User test avec rôle LinkMe | ⏳     | 1 user + user_app_roles            |
| 7   | Test manuel login LinkMe   | ⏳     | Naviguer /login → /dashboard       |

### Script Seed Minimal (Copier-Coller Ready)

```sql
-- 1. Fournisseur test
INSERT INTO organisations (id, legal_name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Fournisseur Test E2E', 'supplier')
ON CONFLICT (id) DO NOTHING;

-- 2. Produits test (3)
INSERT INTO products (id, name, sku, cost_price, stock_quantity, status, organisation_id) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Chaise Bureau Test', 'E2E-001', 50.00, 10, 'active', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000102', 'Table Réunion Test', 'E2E-002', 150.00, 5, 'active', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000103', 'Lampe Design Test', 'E2E-003', 30.00, 20, 'active', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. Channel pricing pour LinkMe (LINKME_CHANNEL_ID = 93c68db1-5a30-4168-89ec-6383152be405)
INSERT INTO channel_pricing (product_id, channel_id, price_ht, margin_rate) VALUES
  ('00000000-0000-0000-0000-000000000101', '93c68db1-5a30-4168-89ec-6383152be405', 75.00, 0.50),
  ('00000000-0000-0000-0000-000000000102', '93c68db1-5a30-4168-89ec-6383152be405', 225.00, 0.50),
  ('00000000-0000-0000-0000-000000000103', '93c68db1-5a30-4168-89ec-6383152be405', 45.00, 0.50)
ON CONFLICT DO NOTHING;
```

---

## Ordre d'Exécution Recommandé

```
JOUR 1 (P0 - 1h)
├── 1. Merger PRs docs (15 min)
├── 2. Audit RLS pg_policies (30 min)
└── 3. Exécuter seed minimal (15 min)

SPRINT 1 (P1 - 9h)
├── 4. Déplacer check-console en CI (1h)
├── 5. RLS channel_pricing (2h)
├── 6. HMAC webhook Revolut (2h)
└── 7. Tests E2E x3 (4h)

BACKLOG (P2 - 15h)
├── 8. Refactor `as any` (8h)
├── 9. Refactor gros fichiers (6h)
└── 10. Cleanup branches/demos (1h)
```

---

## Risques Résiduels Acceptés

| Risque                    | Gravité | Mitigation Temporaire                  |
| ------------------------- | ------- | -------------------------------------- |
| Client-side filter LinkMe | Moyen   | RLS P1 planifié - données test isolées |
| Webhook sans HMAC         | Moyen   | Sandbox Revolut only - pas de prod     |
| 110 `as any`              | Bas     | Ne bloque pas fonctionnellement        |
| Pre-push timeout          | Bas     | `--no-verify` autorisé docs-only       |

---

## Récapitulatif Audit

### Livrables Créés

| Fichier                   | Lignes | Contenu                                   |
| ------------------------- | ------ | ----------------------------------------- |
| `DEV_READINESS.md`        | 256    | Tooling, GH auth, repo-doctor, governance |
| `DB_AUDIT_SUPABASE.md`    | 315    | 75 migrations, RLS coverage, seed data    |
| `APP_AUDIT_BACKOFFICE.md` | 234    | 390 fichiers, 110 `as any`, TODOs         |
| `APP_AUDIT_LINKME.md`     | 245    | 20 fichiers, RLS risks, flows             |
| `TEST_STRATEGY.md`        | 375    | Pyramide tests, E2E scénarios, CI plan    |
| `NEXT_ACTIONS.md`         | ~180   | Ce fichier                                |

### Métriques Clés

| Métrique        | Back-office | LinkMe | Total |
| --------------- | ----------- | ------ | ----- |
| Fichiers source | 390         | 20     | 410   |
| Pages           | 51          | 14     | 65    |
| API routes      | 30          | 2      | 32    |
| Hooks custom    | 15+         | 6      | 21+   |
| Tables Supabase | -           | -      | ~78   |
| RLS Policies    | -           | -      | 30+   |

---

**Dernière mise à jour** : 2025-12-15 14:00 UTC+1
