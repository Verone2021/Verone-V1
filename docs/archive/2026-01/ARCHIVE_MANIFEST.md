# Archive Manifest - Janvier 2026

**Date d'archivage:** 2026-01-09
**Raison:** Consolidation documentation - reduction de 102 fichiers a 9 fichiers source de verite

---

## Regles d'Archivage

1. **Source de verite unique:** Seul `docs/current/` fait foi
2. **Archive = Reference historique:** Utile pour retrouver des details specifiques
3. **Code > Docs:** En cas de conflit, le code source gagne toujours
4. **Pas de modification:** Ces fichiers ne doivent pas etre modifies

---

## Comment Retrouver une Info

| Sujet                    | Ancienne doc                                                  | Nouvelle doc                                                       |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Quickstart, workflow dev | `01-quickstart.md`, `02-development/*`                        | [dev-workflow.md](../../current/dev-workflow.md)                   |
| Architecture monorepo    | `02-architecture.md`, `architecture/*`                        | [architecture.md](../../current/architecture.md)                   |
| Database, migrations     | `03-database.md`, `database/*`                                | [database.md](../../current/database.md)                           |
| Auth, roles, RLS         | `04-auth.md`, `auth/*`                                        | [security-auth.md](../../current/security-auth.md)                 |
| API, endpoints           | `05-api.md`                                                   | [architecture.md](../../current/architecture.md)                   |
| Business rules           | `06-business-rules.md`, `business-rules/*`                    | [business-rules-linkme.md](../../current/business-rules-linkme.md) |
| Deployment, CI/CD        | `07-deployment.md`, `guides/04-deployment/*`                  | [deploy-runbooks.md](../../current/deploy-runbooks.md)             |
| Integrations             | `08-integrations.md`, `finance/*`, `guides/03-integrations/*` | [integrations.md](../../current/integrations.md)                   |
| Design system            | `09-design-system.md`                                         | Voir 21st.dev directement                                          |
| Testing                  | `10-testing.md`, `guides/02-development/testing-guide.md`     | [dev-workflow.md](../../current/dev-workflow.md)                   |
| Monitoring               | `11-monitoring.md`, `monitoring/*`                            | [integrations.md](../../current/integrations.md) (Sentry)          |
| Security                 | `12-security.md`, `security/*`                                | [security-auth.md](../../current/security-auth.md)                 |
| Tech stack               | N/A                                                           | [stack.md](../../current/stack.md)                                 |

---

## Contenu Archive

### architecture/

- ADRs (Architecture Decision Records)
- Recommandations integrations bancaires
- Navigation finance best practices

### auth/

- Flows authentification detailles
- Matrice roles/permissions complete
- Policies RLS detaillees
- Profils utilisateurs

### business-rules/

- **13-canaux-vente/** - Audits LinkMe complets (reference historique)
- Regles produits, pricing, stocks, commandes
- Workflows consultations, notifications

### database/

- Best practices migrations
- Guide applying changes

### finance/

- Documentation Qonto
- FINANCE_V2 (consolidation comptable)
- Categories PCG

### guides/

- Onboarding
- Development
- Integrations (Google Merchant, Qonto, Webhooks)
- Deployment (GitHub, Vercel)
- Database
- UI/UX
- Troubleshooting
- Best practices

### workflows/

- Workflows quotidiens admin/owner
- Guide Git/GitHub/Vercel
- Rapprochement bancaire
- Validation sourcing

### Autres

- `design-resources/` - Catalogue 21st.dev
- `legal/` - RGPD, tracking
- `monitoring/` - Sentry analysis
- `ops/` - Deployments, comptabilite
- `security/` - Rapport upgrade XLSX
- `troubleshooting/` - Debugging, erreurs communes

---

## Fichiers Notables a Consulter

| Fichier                                                            | Quand le consulter                         |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `business-rules/13-canaux-vente/AUDIT-LINKME-WORKFLOWS-2026-01.md` | Workflows LinkMe detailles avec diagrammes |
| `business-rules/13-canaux-vente/AUDIT-COMPLET-LINKME-2025-12.md`   | Architecture LinkMe complete               |
| `auth/roles-permissions-matrix.md`                                 | Matrice permissions complete               |
| `auth/rls-policies.md`                                             | Toutes les policies RLS                    |
| `architecture/decisions/`                                          | Decisions architecturales historiques      |

---

## Integration Obsolete

**Abby** (facturation) a ete remplacee par **Qonto** en decembre 2025.
Les fichiers Abby sont archives a titre historique uniquement:

- `architecture/ABBY-API-INTEGRATION-COMPLETE-OPTIMISEE.md`
- `architecture/WORKFLOW-FACTURATION-ABBY-BEST-PRACTICES.md`
- `integration-facturation/ABBY-API-SETUP-GUIDE.md`

---

## Statistiques

| Metrique                 | Avant | Apres                        |
| ------------------------ | ----- | ---------------------------- |
| Fichiers docs/current/   | 12    | 9                            |
| Total fichiers .md docs/ | 102   | ~80 (archives) + 9 (current) |
| Dossiers racine docs/    | 18    | 3 (current, archive, assets) |

---

_Archive creee le 2026-01-09 - Ne pas modifier ce fichier_
