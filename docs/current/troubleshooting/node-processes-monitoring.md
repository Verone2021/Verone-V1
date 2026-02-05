# Monitoring et Nettoyage Processus Node

## Contexte

Ce document explique comment surveiller et nettoyer les processus Node.js orphelins qui peuvent s'accumuler lors du développement.

## Problème Historique : ccusage

**Symptôme** : 30-50+ processus Node dans Activity Monitor
**Cause** : `ccusage statusline` exécuté via `bun x` toutes les 1-2 secondes
**Impact** : 3-5 GB RAM + 100-200% CPU + ralentissements système

**Solution appliquée** : Statusline bash native (`.claude/scripts/statusline.sh`)

## Vérifier les Processus Node Actifs

### Lister tous les processus Node

```bash
# Lister tous les processus node
ps aux | grep node

# Compter les processus node
ps aux | grep node | grep -v grep | wc -l
```

### État Sain vs Problématique

**État SAIN** (après correction) :

```bash
$ ps aux | grep node | grep -v grep | wc -l
0-3
```

- `0` : Aucun serveur dev actif
- `1-3` : `pnpm dev` actif (1 processus par app)

**État PROBLÉMATIQUE** :

```bash
$ ps aux | grep node | grep -v grep | wc -l
30-50+
```

- Si > 10 processus Node et aucun serveur dev → **Problème détecté !**

## Nettoyer les Processus Orphelins

### Option 1 : Script dev-stop (Recommandé)

```bash
pnpm dev:stop
```

Arrête proprement les serveurs Next.js et libère les ports 3000-3002.

### Option 2 : Tuer ccusage Spécifiquement

```bash
pkill -f "bun x ccusage"
```

Cible uniquement les processus ccusage orphelins.

### Option 3 : Tuer Tous les Processus Node

```bash
pkill -f node
```

⚠️ **Attention** : Tue TOUS les processus Node (y compris VSCode si Node-based).

### Option 4 : Tuer par PID (Le Plus Sûr)

```bash
# Lister les PID des processus node suspects
ps aux | grep "bun x ccusage" | awk '{print $2}'

# Tuer un par un (remplacer <PID> par le numéro)
kill -9 <PID>
```

## Monitoring en Temps Réel

### Surveiller les Processus Node

```bash
# Afficher le nombre de processus node toutes les 1 seconde
watch -n 1 'ps aux | grep node | grep -v grep | wc -l'
```

Tu devrais voir **0-3 normalement** (si serveurs dev actifs).

### Script d'Alerte Automatique (Optionnel)

Créer `scripts/monitor-node-processes.sh` :

```bash
#!/bin/bash
# Alerte si trop de processus node
NODE_COUNT=$(ps aux | grep node | grep -v grep | wc -l)
if [ $NODE_COUNT -gt 10 ]; then
  echo "⚠️  ALERTE : $NODE_COUNT processus node détectés !"
  echo "Commande de nettoyage : pnpm dev:stop"
fi
```

Utilisation :

```bash
bash scripts/monitor-node-processes.sh
```

## Scripts de Nettoyage Disponibles

```
scripts/
├── dev-stop.sh          # Arrête serveurs + libère ports 3000-3002
├── dev-clean.sh         # Nettoyage complet + relance
└── turbo-cleanup.sh     # Nettoie cache Turbo + redémarre daemon
```

### Utilisation

```bash
pnpm dev:stop   # Arrête tout proprement
pnpm dev:clean  # Nettoyage complet + relance
```

## Prévention

### Protection Automatique

Les hooks dans `.claude/settings.json` empêchent Claude de lancer des serveurs multiples :

```json
{
  "matcher": "Bash(*)",
  "hooks": [
    {
      "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -qE \"(pnpm|npm)\\s+(dev|start)\"; then echo \"❌ INTERDIT: Seul utilisateur peut lancer serveurs\"; exit 1; fi'"
    }
  ]
}
```

### Règles Strictes

1. **Statusline** : Bash natif uniquement (pas de Node/bun)
2. **Serveurs dev** : Hooks bloquent lancement multiple (`.claude/rules/dev/servers.md`)
3. **Scripts nettoyage** : Disponibles dans `scripts/`

## Résumé : Problème → Solution

### Problème Identifié

1. **Symptôme** : Beaucoup de processus "node" dans Activity Monitor (30-50+)
2. **Cause** : `ccusage` exécuté toutes les 1-2 secondes via `bun x`
3. **Impact** : 3-5 GB RAM + 100-200% CPU + ralentissements système

### Solution Appliquée

1. ✅ **Remplacer ccusage par script bash natif** (statusline.sh)
2. ✅ **Scripts de nettoyage disponibles** (dev-stop.sh, dev-clean.sh)
3. ✅ **Hooks protection** (empêchent lancement serveurs multiples)
4. ✅ **Monitoring simple** (commandes ps/pkill documentées)

### Garanties

- ❌ **Plus de ccusage** → Plus de processus Node multiples
- ❌ **Plus de memory leak** → RAM stable
- ✅ **Statusline ultra-légère** → < 1ms, 0 dépendance
- ✅ **Système réactif** → CPU/RAM disponibles pour dev

## En Cas de Problème Futur

```bash
# 1. Vérifier processus node
ps aux | grep node | wc -l

# 2. Si > 10 processus, nettoyer
pnpm dev:stop

# 3. Si persiste, tuer ccusage spécifiquement
pkill -f "bun x ccusage"

# 4. En dernier recours
pkill -f node
```

Tu ne devrais **jamais** avoir à faire ça avec la nouvelle statusline, mais ces commandes sont là au cas où.

## Voir Aussi

- `.claude/rules/dev/servers.md` - Règles serveurs de développement
- `scripts/dev-stop.sh` - Script d'arrêt propre
- `scripts/dev-clean.sh` - Script de nettoyage complet
