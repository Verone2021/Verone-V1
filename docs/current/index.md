# Documentation Verone - Source de Verite

**Derniere mise a jour:** 2026-01-30

Cette documentation est la **source unique de verite** pour le projet Verone.
Toute autre documentation doit etre consideree comme archive.

---

## Table des Matieres

| Doc                                                    | Description                      | Usage               |
| ------------------------------------------------------ | -------------------------------- | ------------------- |
| [stack.md](./stack.md)                                 | Technologies et outils actifs    | Reference tech      |
| [dev-workflow.md](./dev-workflow.md)                   | Workflow developpement quotidien | Onboarding, daily   |
| [architecture.md](./architecture.md)                   | Structure monorepo Turborepo     | Comprendre le code  |
| [database.md](./database.md)                           | Supabase, migrations, RLS        | Queries, migrations |
| [security-auth.md](./security-auth.md)                 | Auth, roles, permissions, RLS    | Securite            |
| [integrations.md](./integrations.md)                   | Qonto, Google OAuth, Supabase    | APIs externes       |
| [deploy-runbooks.md](./deploy-runbooks.md)             | Vercel, GitHub CI/CD, rollback   | Deploiement         |
| [business-rules-linkme.md](./business-rules-linkme.md) | Workflows LinkMe B2B             | Business logic      |
| [linkme/routes-index.md](./linkme/routes-index.md)     | Index routes LinkMe + audit 404  | Debugging LinkMe    |

### Serena Memories (CRITICAL)

| Doc                                           | Description                      | Usage              |
| --------------------------------------------- | -------------------------------- | ------------------ |
| [serena/INDEX.md](./serena/INDEX.md)          | Index des 15 memories CRITICAL   | Reference memoires |
| [serena/\_TEMPLATE.md](./serena/_TEMPLATE.md) | Template pour nouvelles memories | Creation memory    |

> **Note**: Les memories CRITICAL sont versionnees ici. Les memories REFERENCE/TEMP restent dans `.serena/memories/` (gitignored).

---

## Conventions

### Statut documents

```
CURRENT  = A jour, source de verite
ARCHIVED = Deplace vers docs/archive/
```

### Mise a jour

1. Modifier le fichier concerne
2. Mettre a jour la date en haut du fichier
3. Commit: `docs: update [fichier] - [description]`

### Ajouter une doc

Avant de creer un nouveau fichier:

1. Verifier si l'info peut aller dans un fichier existant
2. Si nouveau fichier necessaire: max 10 fichiers dans docs/current/
3. Archiver l'ancien contenu si remplacement

---

## Ancienne documentation

Voir `docs/archive/` pour la documentation archivee.
Le manifest `docs/archive/2026-01/ARCHIVE_MANIFEST.md` explique ou retrouver les anciennes infos.

---

## Liens rapides

- **CLAUDE.md** - Instructions Claude Code (racine projet)
- **README.md** - Presentation projet (racine projet)
- **supabase/migrations/** - Source de verite DB

---

_Version 1.1.0 - 2026-01-10 - Ajout section Serena memories_
