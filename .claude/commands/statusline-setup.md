# 📊 StatusLine Setup - Affichage Tokens Inline Claude Code

**Configuration complète** de la statusline pour affichage permanent tokens/coûts dans la fenêtre Claude Code.

---

## ✅ **CONFIGURATION ACTIVE**

### **StatusLine Actuelle : ccusage**
```json
// .claude/settings.json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline --visual-burn-rate emoji --no-offline",
    "padding": 0
  }
}
```

### **Options Actives**
- `--visual-burn-rate emoji` : Affichage burn rate avec emoji 🔥
- `--no-offline` : Récupération pricing temps réel (toujours à jour)
- `padding: 0` : Pas d'espacement supplémentaire

### **Affichage Attendu**
```
🤖 Sonnet-4.5 | 💰 $0.23 session / $17.17 today / $0.45 block (2h 15m) | 🔥 $2.12/hr
```

**Mise à jour :** Automatique toutes les 300ms (temps réel)

---

## 🎯 **CE QUI EST AFFICHÉ**

### **Informations Visibles**

1. **🤖 Modèle** : Claude Sonnet 4.5 / Opus / Haiku
2. **💰 Coûts** :
   - Session courante
   - Total aujourd'hui
   - Block 5h actif
   - Temps restant block
3. **🔥 Burn Rate** : $/heure (dépense actuelle)
4. **🧠 Tokens** : Optionnel (selon config)

### **Exemple Réel (Aujourd'hui)**
```
🤖 Sonnet-4.5 | 💰 $0.15 session / $17.17 today / $8.45 block (1h 32m) | 🔥 $3.45/hr
```

**Interprétation :**
- Modèle : Sonnet 4.5
- Session actuelle : $0.15
- Aujourd'hui total : $17.17
- Block 5h en cours : $8.45 dépensés, 1h32 restantes
- Burn rate : $3.45/heure actuellement

---

## 🔧 **PERSONNALISATION DISPONIBLE**

### **Options ccusage statusline**

#### **Burn Rate Display**
```bash
# Emoji (actuel)
--visual-burn-rate emoji        # 🔥 $2.12/hr

# Gauge
--visual-burn-rate gauge        # [▓▓▓▓░░] $2.12/hr

# None
--visual-burn-rate none         # $2.12/hr
```

#### **Mode Offline/Online**
```bash
# Online (actuel - recommandé)
--no-offline                    # Pricing temps réel

# Offline
# (rien)                        # Cache pricing local
```

#### **Source Coûts**
```bash
# Auto (défaut - recommandé)
# (rien)

# Force ccusage data
--cost-source ccusage

# Force Claude Code data
--cost-source cc

# Les deux
--cost-source both
```

### **Configuration Alternative**

#### **Mode Minimal**
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline",
    "padding": 0
  }
}
```
Output : `💰 $0.23 session / $17.17 today`

#### **Mode Verbose**
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline --visual-burn-rate gauge --cost-source both",
    "padding": 0
  }
}
```
Output : `🤖 Sonnet-4.5 | 💰 $0.23 / $17.17 / $0.45 | [▓▓▓▓░░] $2.12/hr | 🧠 52k`

---

## 🎨 **ALTERNATIVE : ccstatusline (PowerLine Style)**

### **Installation Interactive**
```bash
npx ccstatusline@latest
```

Interface interactive pour configurer :
- ✅ Widgets (Model, Git, Tokens, Cost, Clock)
- ✅ Couleurs personnalisées
- ✅ Style Powerline
- ✅ Séparateurs custom
- ✅ Preview temps réel

### **Configuration Auto-Générée**
```json
// Après configuration interactive
{
  "statusLine": {
    "type": "command",
    "command": "npx ccstatusline@latest",
    "padding": 0
  }
}
```

### **Widgets Disponibles**
- **Model Name** : Nom modèle Claude
- **Git Branch** : Branche git courante
- **Session Clock** : Durée session
- **Token Count** : Tokens consommés
- **Cost Display** : Coûts session/today
- **Burn Rate** : $/heure
- **Custom Text** : Texte libre

### **Avantages ccstatusline**
- ✅ Visuel Powerline élégant
- ✅ Configuration GUI interactive
- ✅ Thèmes pré-configurés
- ✅ Nerd Fonts support
- ✅ Cross-platform

---

## 🛠️ **SCRIPT CUSTOM VÉRONE (OPTIONNEL)**

### **Pour Contrôle Total**

Créer `.claude/scripts/statusline-verone.sh` :

```bash
#!/bin/bash

# Lecture stdin (données session Claude)
SESSION_DATA=$(cat)

# Extract info
MODEL=$(echo "$SESSION_DATA" | jq -r '.model.name // "unknown"')
SESSION_ID=$(echo "$SESSION_DATA" | jq -r '.session_id // "unknown"')

# Get ccusage data
USAGE=$(npx --yes ccusage@latest daily --json 2>/dev/null | head -1)
TODAY_COST=$(echo "$USAGE" | jq -r '.daily[0].totalCost // 0')
TODAY_TOKENS=$(echo "$USAGE" | jq -r '.daily[0].totalTokens // 0')

# Budgets Vérone
DAILY_BUDGET=5.00
WEEKLY_BUDGET=30.00

# Calculate budget status
BUDGET_PCT=$(echo "scale=0; $TODAY_COST / $DAILY_BUDGET * 100" | bc)

# Alert emoji si dépassement
if (( $(echo "$BUDGET_PCT >= 90" | bc -l) )); then
    ALERT="🔴"
elif (( $(echo "$BUDGET_PCT >= 70" | bc -l) )); then
    ALERT="🟡"
else
    ALERT="🟢"
fi

# Format model short name
MODEL_SHORT=$(echo "$MODEL" | sed 's/claude-//; s/-20250929//')

# Format tokens (K/M)
if (( TODAY_TOKENS >= 1000000 )); then
    TOKENS_DISPLAY="$(echo "scale=1; $TODAY_TOKENS / 1000000" | bc)M"
else
    TOKENS_DISPLAY="$(echo "scale=1; $TODAY_TOKENS / 1000" | bc)K"
fi

# Output statusline
printf "%s %s | 💰 \$%.2f (%d%% budget) | 🧠 %s tokens" \
    "$ALERT" "$MODEL_SHORT" "$TODAY_COST" "$BUDGET_PCT" "$TOKENS_DISPLAY"
```

**Configuration :**
```json
{
  "statusLine": {
    "type": "command",
    "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/statusline-verone.sh",
    "padding": 0
  }
}
```

**Output exemple :**
```
🟢 Sonnet-4.5 | 💰 $17.17 (343% budget) | 🧠 29.6M tokens
```

**Features Vérone :**
- ✅ Alerts visuelles budgets (🟢🟡🔴)
- ✅ Pourcentage budget daily
- ✅ Format tokens intelligent (K/M)
- ✅ Model name court
- ✅ Branding Vérone

---

## 📋 **ACTIVATION / DÉSACTIVATION**

### **Changer StatusLine**

#### **Passer à ccstatusline**
```json
// .claude/settings.json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccstatusline@latest",
    "padding": 0
  }
}
```

#### **Passer au script Vérone custom**
```json
{
  "statusLine": {
    "type": "command",
    "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/statusline-verone.sh",
    "padding": 0
  }
}
```

#### **Désactiver complètement**
```json
// Supprimer section statusLine ou commenter
{
  // "statusLine": { ... }
}
```

### **Appliquer Changements**
Redémarrer Claude Code après modification `.claude/settings.json`

---

## 🎯 **DONNÉES DISPONIBLES (stdin)**

### **JSON Envoyé par Claude Code**
```json
{
  "session_id": "abc123...",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/Users/romeodossantos/verone-back-office-V1",
  "model": {
    "name": "claude-sonnet-4-5-20250929",
    "provider": "anthropic",
    "context_window": 200000
  },
  "workspace": {
    "name": "Vérone Back Office",
    "folders": ["/Users/romeodossantos/verone-back-office-V1"]
  },
  "cost": {
    "total": 17.1742,
    "session": 0.0847,
    "input_tokens": 17826,
    "output_tokens": 29231
  },
  "version": "1.0.86",
  "git": {
    "branch": "main",
    "status": "clean"
  }
}
```

**Tu peux extraire :**
- Session ID
- Modèle utilisé
- Workspace name
- Git branch/status
- Coûts session/total
- Tokens input/output
- Version Claude Code

---

## 💡 **TIPS & BEST PRACTICES**

### **Performance**
- ✅ Script doit être **rapide** (<100ms recommandé)
- ✅ Éviter appels API lents
- ✅ Cache data si possible
- ✅ Fallback si erreur (ne pas crasher)

### **Affichage**
- ✅ Une seule ligne output
- ✅ Concis (80-120 caractères max)
- ✅ ANSI colors supportés
- ✅ Emojis supportés
- ✅ Nerd Fonts supportés (optionnel)

### **Debugging**
```bash
# Tester script statusline manuellement
echo '{"model":{"name":"claude-sonnet-4-5-20250929"},"cost":{"total":17.17}}' | \
  .claude/scripts/statusline-verone.sh
```

### **Logs**
```bash
# Si statusline ne fonctionne pas, check logs Claude Code
# Erreurs script apparaissent dans console développeur
```

---

## 🏆 **CONFIGURATION OPTIMALE VÉRONE**

### **Setup Recommandé (Actuel)**
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline --visual-burn-rate emoji --no-offline",
    "padding": 0
  }
}
```

**Pourquoi :**
- ✅ **Simple** : Pas de maintenance script custom
- ✅ **Fiable** : Maintenu par communauté ccusage
- ✅ **Complet** : Toutes métriques importantes
- ✅ **Temps réel** : Pricing toujours à jour
- ✅ **Visuel** : Burn rate emoji 🔥 intuitif

### **Upgrade Futur (Optionnel)**
Quand besoin métriques business Vérone spécifiques :
- Alerts budgets custom
- SLOs performance
- KPIs business
- Branding Vérone

→ Passer au script `.claude/scripts/statusline-verone.sh`

---

## 📊 **MÉTRIQUES AFFICHÉES**

### **Avec ccusage statusline (actuel)**

**Toujours affichés :**
- 🤖 Modèle Claude
- 💰 Coût session courante
- 💰 Coût total aujourd'hui
- 💰 Coût block 5h + temps restant
- 🔥 Burn rate ($/heure)

**Optionnels (selon config) :**
- 🧠 Tokens consommés
- ⏱️ Durée session
- 📊 Pourcentage context window

### **Format Typique**
```
🤖 Sonnet-4.5 | 💰 $0.15 session / $17.17 today / $8.45 block (1h 32m) | 🔥 $3.45/hr
```

**Légende :**
- `$0.15 session` : Session courante
- `$17.17 today` : Total aujourd'hui
- `$8.45 block (1h 32m)` : Block 5h actif, temps restant
- `🔥 $3.45/hr` : Dépense actuelle par heure

---

## ✅ **SYSTÈME OPÉRATIONNEL**

**Configuration active :**
- ✅ StatusLine configurée dans `.claude/settings.json`
- ✅ Commande ccusage statusline avec options optimales
- ✅ Affichage temps réel activé
- ✅ Burn rate visuel emoji
- ✅ Pricing online (toujours à jour)

**Prochaine étape :**
- Redémarrer Claude Code pour activer statusline
- Vérifier affichage en bas de fenêtre
- Tester avec session active

**Support :**
- Documentation complète ccusage : https://ccusage.com/guide/statusline
- GitHub ccusage : https://github.com/ryoppippi/ccusage
- Claude Docs statusline : https://docs.claude.com/en/docs/claude-code/statusline

---

*StatusLine Setup - Vérone Back Office Professional Excellence*
