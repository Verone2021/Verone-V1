# Règles Serveurs de Développement

## Ports Assignés (NE PAS CHANGER)

| Application | Port |
|-------------|------|
| back-office | 3000 |
| site-internet | 3001 |
| linkme | 3002 |

## Gestion des conflits de port

### Interdit

- Laisser Next.js utiliser un port alternatif (ex: 3005)
- Forcer un autre port avec `-p XXXX`
- Lancer plusieurs instances sur differents ports

### Obligatoire

Quand un port est occupe :

1. **Option 1** : Demander a l'utilisateur de tuer les processus existants
   ```bash
   pkill -f "next dev"
   # ou
   lsof -ti:3000 | xargs kill -9
   ```

2. **Option 2** : Proposer un rebuild (si le port est occupe par une session stale)
   ```bash
   pnpm build
   ```

3. **JAMAIS** : Ne jamais accepter silencieusement un port alternatif

## Commande pour relancer proprement

```bash
# Tuer tous les serveurs Next.js
pkill -f "next dev"

# Attendre 2 secondes
sleep 2

# Relancer
pnpm dev
```
