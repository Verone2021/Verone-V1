# Archive avril 2026

## Fichiers archives

- `export-claude-config-complet.md` : Export de la configuration Claude
  genere le 2026-04-09. Decrit une ancienne architecture (7 agents
  incluant back-office-expert, linkme-expert qui n'existent plus).
  Archive pour reference historique.
- `diagnostic-verone.md` : Diagnostic du 2026-04-09 decrivant l'ancienne
  structure `.claude/rules/` (backend/, database/, dev/, frontend/).
  Structure actuelle (flat) dans `.claude/rules/` directement.

## Raison de l'archivage

Ces fichiers polluaient le contexte de l'orchestrateur qui pouvait croire
que les anciens agents existaient encore. Deplaces hors de la racine pour
eviter la confusion, conserves ici pour reference historique.
