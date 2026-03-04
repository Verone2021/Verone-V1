# Hooks Bloquants (settings.json)

Les hooks BLOQUENT automatiquement :

- `--no-verify` sur commit/push
- `any`/`as any`/`any[]`/`eslint-disable no-explicit-any` dans Edit/Write
- Commit direct sur main (feature branch obligatoire)
- Push direct sur main (PR obligatoire)
- Lancement serveurs dev (reserve a l'utilisateur)
