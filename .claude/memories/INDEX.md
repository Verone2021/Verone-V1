# Index des Memories

**IMPORTANT** : Les memories sont maintenant gerees par **Serena MCP**.

---

## Utilisation

### Lister toutes les memories
```bash
mcp__serena__list_memories
```

### Lire une memory
```bash
mcp__serena__read_memory("memory-name")
```

### Creer une memory
```bash
mcp__serena__write_memory("memory-name", "content...")
```

---

## Memories Critiques a Charger

| Memory | Description |
|--------|-------------|
| `workflow-strict-rules` | Regles de modification de fichiers |
| `auth-paths-immutable` | Chemins auth immuables |
| `database-migrations-convention` | Conventions migrations Supabase |
| `playwright-login-first-mandatory` | Tests E2E login obligatoire |
| `agents-restauration-2026-01-16` | Lecons restauration agents |
| `statusline-fix-solution-hybride-2026-01` | Fix statusline |

---

## Regles

1. **NE JAMAIS** creer de fichiers `.md` dans ce dossier
2. **TOUJOURS** utiliser `mcp__serena__write_memory` pour nouvelles memories
3. **TOUJOURS** consulter memories via `mcp__serena__read_memory`

---

**Derniere mise a jour**: 2026-01-26 (Migration vers Serena MCP)
