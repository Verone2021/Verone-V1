---
description: DEV-RUNNER - Dev server lifecycle management
argument-hint: [start|stop|status|logs] [--app=<app-name>]
allowed-tools: [Bash, Read]
---

# /dev — DEV-RUNNER (gestion serveur développement)

## Rôle

Tu es en **mode DEV-RUNNER**.

- Tu peux lancer/arrêter `pnpm dev` sur les bons ports.
- Tu peux lire les logs console.
- Tu peux vérifier les ports.
- **ZÉRO** modification de code.
- **ZÉRO** commit.
- **ZÉRO** migrations.

## Ports fixes (selon CLAUDE.md)

| Port | Application |
|------|-------------|
| 3000 | back-office |
| 3001 | site-internet |
| 3002 | linkme |

## Commandes disponibles

### `start [--app=<app-name>]`

Démarre le serveur de développement.

**Workflow** :
1. Identifier l'app :
   - Si `--app=back-office` → utiliser port 3000
   - Si `--app=site-internet` → utiliser port 3001
   - Si `--app=linkme` → utiliser port 3002
   - Si pas d'argument → utiliser `back-office` par défaut

2. Vérifier que le port n'est pas occupé :
   ```bash
   lsof -ti:PORT
   ```
   - Si PID retourné → **ERREUR** : "Port PORT déjà utilisé par PID XXX. Utiliser `/dev stop` d'abord."
   - Sinon → continuer

3. Démarrer le serveur :
   ```bash
   pnpm --filter @verone/<app-name> dev
   ```

**Sortie attendue** :
- Status : `✅ Dev server démarré`
- App : `back-office`
- URL : `http://localhost:3000`
- PID : `12345`

### `stop`

Arrête le serveur de développement en cours.

**Workflow** :
1. Identifier le(s) PID(s) des ports 3000, 3001, 3002 :
   ```bash
   lsof -ti:3000,3001,3002
   ```

2. Si aucun PID → **INFO** : "Aucun serveur en cours."

3. Sinon, arrêter proprement :
   ```bash
   kill -TERM <PID>
   ```

4. Attendre 2 secondes, vérifier si le processus est bien terminé :
   ```bash
   lsof -ti:PORT
   ```
   - Si toujours actif → force kill : `kill -9 <PID>`

**Sortie attendue** :
- `✅ Dev server arrêté (PID 12345 sur port 3000)`

### `status`

Affiche l'état du serveur de développement.

**Workflow** :
1. Vérifier les ports 3000, 3001, 3002 :
   ```bash
   lsof -ti:3000 -ti:3001 -ti:3002
   ```

2. Pour chaque port actif, afficher :
   - Port
   - PID
   - App (inférer depuis le port)
   - URL

**Sortie attendue** :
```
Dev Server Status:
- Port 3000 (back-office): ✅ Running (PID 12345) - http://localhost:3000
- Port 3001 (site-internet): ❌ Stopped
- Port 3002 (linkme): ❌ Stopped
```

### `logs`

Affiche les derniers logs du serveur en cours (si running).

**Workflow** :
1. Identifier le port actif via `lsof`
2. Si aucun serveur → **ERREUR** : "Aucun serveur en cours. Utiliser `/dev start` d'abord."
3. Sinon → **INFO** : "Les logs sont visibles dans la session qui a lancé `pnpm dev`. Cette commande ne peut pas capturer les logs d'un processus existant."

**Alternative** : Suggérer à l'utilisateur de lancer `pnpm dev` directement dans un terminal pour voir les logs en temps réel.

## Contrainte ONE SESSION

**Important** : Une seule session DEV-RUNNER peut tourner à la fois. Si une autre session a déjà lancé le serveur :
- La commande `start` détectera le conflit via `lsof`
- Affichera une erreur claire avec le PID existant
- L'utilisateur devra soit utiliser `/dev stop` soit travailler avec le serveur existant

## Notes importantes

- **Pas de capture logs** : Les logs de `pnpm dev` ne peuvent pas être capturés facilement après démarrage. Recommander à l'utilisateur de lancer `pnpm dev` dans un terminal dédié s'il veut voir les logs en continu.

- **Port mapping** :
  - `back-office` = port 3000
  - `site-internet` = port 3001
  - `linkme` = port 3002

- **Process management** : Utiliser `kill -TERM` pour arrêt propre, `kill -9` seulement si le processus ne répond pas après 2 secondes.

## Interdits (strict)

- Ne jamais modifier du code
- Ne jamais commit
- Ne jamais lancer de migrations
- Ne jamais changer les ports (fixés dans CLAUDE.md)

---

User: $ARGUMENTS
