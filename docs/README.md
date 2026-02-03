# Documentation Verone Back Office

**Version** : 6.0 - Post-cleanup 2026-01
**Date** : 2026-01-09

---

## Documentation Canonique (Source of Truth)

**Commencer ici** - Ces docs sont verifiees et a jour :

| Doc                                                         | Description               |
| ----------------------------------------------------------- | ------------------------- |
| [index](./current/index.md)                                 | Table des matieres        |
| [stack](./current/stack.md)                                 | Technologies actives      |
| [dev-workflow](./current/dev-workflow.md)                   | Workflow developpement    |
| [architecture](./current/architecture.md)                   | Turborepo, apps, packages |
| [database](./current/database.md)                           | Supabase, migrations, RLS |
| [security-auth](./current/security-auth.md)                 | Auth, roles, permissions  |
| [integrations](./current/integrations.md)                   | Qonto, Google OAuth, etc. |
| [deploy-runbooks](./current/deploy-runbooks.md)             | Vercel, CI/CD             |
| [business-rules-linkme](./current/business-rules-linkme.md) | Workflows LinkMe          |

---

## Structure

```
docs/
├── current/          # Source de verite (9 fichiers)
├── archive/2026-01/  # Documentation archivee
└── assets/           # Images, schemas
```

---

## Regles

- **Source de verite** : `docs/current/*.md` uniquement
- **Code > Docs** : En cas de conflit, le code gagne
- **Pas de duplication** : 1 sujet = 1 doc
- **Max 10 fichiers** dans docs/current/

---

## Archives

Documentation archivée disponible dans `docs/archive/2026-01/`.

---

_Verone Back Office 2026 - Turborepo Monorepo_
