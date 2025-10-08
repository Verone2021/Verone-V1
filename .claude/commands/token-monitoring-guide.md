# 📊 GUIDE COMPLET - MONITORING TOKENS CLAUDE CODE

**Système installé et configuré pour Vérone Back Office**

---

## 🚀 QUICK START - Commandes Essentielles

### **0️⃣ StatusLine Permanente (NOUVEAU - ACTIVÉE!)**
**Affichage permanent en bas de fenêtre Claude Code** (temps réel, 300ms refresh)

```
🤖 Sonnet-4.5 | 💰 $0.15 session / $17.17 today / $8.45 block (1h 32m) | 🔥 $3.45/hr
```

**Configuration active :** `ccusage statusline` dans `.claude/settings.json`
**Action requise :** Redémarrer Claude Code pour voir la statusline

📖 **Guide complet :** [statusline-setup.md](./statusline-setup.md)

---

### **1️⃣ Résumé Rapide (Inline)**
```bash
/token-stats --quick
```
**Usage :** Affichage rapide tokens/coût aujourd'hui + commandes disponibles
**Quand :** À tout moment pour check rapide

### **2️⃣ Dashboard Temps Réel (Terminal)**
```bash
claude-monitor
```
**Usage :** Dashboard interactif avec prédictions ML
**Quand :** Pendant sessions longues de développement
**Features :** Burn rate, alerts, predictions limites

### **3️⃣ Rapport Détaillé (Terminal)**
```bash
npx ccusage daily
```
**Usage :** Rapport visuel complet avec breakdown par modèle
**Quand :** Fin de journée pour analyse détaillée

### **4️⃣ Monitoring Live Sessions (Terminal)**
```bash
npx ccusage blocks --live
```
**Usage :** Dashboard temps réel fenêtres 5h (sessions Claude)
**Quand :** Sessions critiques, monitoring continu

---

## 📊 RAPPORTS DISPONIBLES

### **Script Custom Token Calculator**

#### **Mode Quick**
```bash
/token-stats --quick
.claude/scripts/token-cost-calculator.sh --quick
```
Output exemple :
```
═══════════════════════════════════════════════════════════════════
  📊 CLAUDE CODE TOKEN DASHBOARD - VÉRONE PROFESSIONAL
═══════════════════════════════════════════════════════════════════

📊 Aujourd'hui:
  Tokens: 29,606,884
  Coût:   $17.17
  Budget: 🔴 CRITIQUE (343.40%) / $5.0000

🎯 Commandes Disponibles:
  claude-monitor              # Dashboard temps réel
  npx ccusage daily           # Rapport détaillé aujourd'hui
  ...
```

#### **Mode Journalier Détaillé**
```bash
/token-stats --today
.claude/scripts/token-cost-calculator.sh --today
```
Output :
```
▶ 📅 RAPPORT JOURNALIER - 2025-10-07
─────────────────────────────────────────────────────────────────

Tokens Consommés:
  Input:          17,826 tokens
  Output:         29,231 tokens
  Cache Write:    2,264,976 tokens
  Cache Read:     27,294,851 tokens
  Total:          29,606,884 tokens

Coûts:
  Input:          $0.0535
  Output:         $0.4385
  Cache Write:    $8.4937
  Cache Read:     $8.1885
  Total:          $17.1742

Métriques:
  Efficiency:     100%
  Budget Daily:   🔴 CRITIQUE (343.48%) / $5.0000

⚠ ALERTE: Budget journalier presque atteint!
💡 Conseil: Réduire sessions ou optimiser prompts
```

#### **Mode Hebdomadaire**
```bash
/token-stats --week
.claude/scripts/token-cost-calculator.sh --week
```
Output :
```
▶ 📊 RAPPORT HEBDOMADAIRE - Derniers 7 jours
─────────────────────────────────────────────────────────────────

Tokens Consommés (7 jours):
  Total:          29,606,884 tokens
  Moyenne/jour:   4,229,555 tokens

Coûts (7 jours):
  Total:          $17.1742
  Moyenne/jour:   $2.4535
  Budget Weekly:  🟢 OK (57.25%) / $30.0000

Projection:
  Mensuel:        $73.61
  ✅ Budget mensuel respecté
```

#### **Mode Sessions**
```bash
/token-stats --session
.claude/scripts/token-cost-calculator.sh --session
```
Liste top 5 sessions par coût avec détails tokens.

---

### **ccusage CLI - Rapports Avancés**

#### **Rapport Daily (Visuel)**
```bash
npx ccusage daily
```
Table formatée avec breakdown par modèle, cache, coûts.

#### **Rapport Monthly**
```bash
npx ccusage monthly
```
Agrégation mensuelle complète.

#### **Rapport Sessions**
```bash
npx ccusage session
```
Détail par conversation/session.

#### **Rapport Blocks (5h windows)**
```bash
npx ccusage blocks
```
Fenêtres de facturation 5h (système Claude).

#### **Live Monitoring**
```bash
npx ccusage blocks --live
```
Dashboard temps réel actualisé automatiquement.

#### **Filtres Avancés**
```bash
# Depuis date spécifique
npx ccusage daily --since 20251001

# Jusqu'à date
npx ccusage daily --until 20251007

# Par projet
npx ccusage daily --project verone

# Export JSON
npx ccusage daily --json

# Breakdown par modèle
npx ccusage daily --breakdown

# Compact mode
npx ccusage daily --compact
```

---

### **Claude Monitor - Dashboard Interactif**

#### **Lancement Standard**
```bash
claude-monitor
```
Dashboard terminal avec refresh auto.

#### **Plans Disponibles**
```bash
claude-monitor --plan custom    # Défaut (limites personnalisées)
claude-monitor --plan pro       # Claude Pro
claude-monitor --plan max5      # Claude Max (5h)
claude-monitor --plan max20     # Claude Max (20h)
```

#### **Options Avancées**
```bash
# Vue daily
claude-monitor --view daily

# Timezone custom
claude-monitor --timezone America/New_York

# Thème
claude-monitor --theme dark
claude-monitor --theme light
```

#### **Aliases Disponibles**
```bash
cmonitor     # Alias court
ccmonitor    # Alias court
ccm          # Alias ultra-court
```

---

## 🤖 HOOKS AUTOMATIQUES

### **Fin de Session (Auto)**

À chaque arrêt de Claude Code, le hook `session-token-report.sh` s'exécute automatiquement :

Output exemple :
```
═══════════════════════════════════════════════════════════════════
  📊 RAPPORT FIN DE SESSION - 2025-10-07 14:32
═══════════════════════════════════════════════════════════════════

Session Courante:
  Tokens:  15,247
  Coût:    $0.0847

─────────────────────────────────────────────────────────────────

Aujourd'hui (Total):
  Tokens:  29,606,884
  Coût:    $17.1742
  Status:  ⚠ Budget journalier proche limite

─────────────────────────────────────────────────────────────────

💡 RECOMMANDATIONS:
  ▸ Session longue détectée (15,247 tokens)
    → Diviser en sessions plus courtes (<10k tokens)

🎯 COMMANDES UTILES:
  claude-monitor              # Dashboard temps réel
  npx ccusage daily           # Rapport détaillé
  /token-stats --quick        # Résumé rapide

═══════════════════════════════════════════════════════════════════
```

Logs sauvegardés dans :
- `.claude/reports/tokens/sessions.jsonl` (historique)
- `.claude/reports/tokens/daily-YYYY-MM-DD.json` (rapports daily)

---

## 💰 PRICING RÉFÉRENCE (2025)

### **Claude Sonnet 4.5**
```
Input:          $3.00 / million tokens
Output:         $15.00 / million tokens
Cache Read:     $0.30 / million tokens
Cache Write:    $3.75 / million tokens
```

### **Budgets Vérone (Configurables)**
```
Daily:    $5.00
Weekly:   $30.00
Monthly:  $100.00
Session:  $1.00 (max recommandé)
```

**Configuration :** `.claude/settings.json` → `token_monitoring.budgets`

---

## 🎯 WORKFLOW RECOMMANDÉ

### **Développement Quotidien**

#### **Matin**
```bash
# Check budget semaine
npx ccusage daily --since $(date -v-7d +%Y%m%d)

# ou
/token-stats --week
```

#### **Pendant Dev**
```bash
# Terminal 1: Claude Code
claude

# Terminal 2: Monitoring live
claude-monitor

# Check rapide inline
/token-stats --quick
```

#### **Fin Journée**
```bash
# Rapport complet aujourd'hui
npx ccusage daily

# ou script custom
/token-stats --today
```

---

### **Sessions Critiques/Longues**

```bash
# Terminal 1: Dev
claude

# Terminal 2: Live dashboard
claude-monitor --plan custom

# Terminal 3: Blocks monitoring
npx ccusage blocks --live
```

**Avantage :** Visibilité complète temps réel, prédictions ML, alerts automatiques.

---

## 🚨 ALERTS & SEUILS

### **Alerts Automatiques Configurées**

Dans `.claude/settings.json` → `token_monitoring.alerts` :

- **Budget threshold** : 90% budget journalier
- **Efficiency threshold** : <70% score
- **Session duration max** : 1800s (30min)
- **MCP calls max** : 50/session
- **Cost alerts** : activées

### **Codes Couleur**

```
🟢 OK        : <70% budget
🟡 ATTENTION : 70-89% budget
🔴 CRITIQUE  : ≥90% budget
```

---

## 📈 MÉTRIQUES EXCELLENCE

### **Targets Vérone**
```json
{
  "tokens_per_session": 10000,      // <10k = excellent
  "efficiency_score": 80,            // >80% = bon
  "cache_hit_rate": 70,              // >70% = optimal
  "cost_per_feature": 2.0,           // <$2 = excellent
  "session_optimization": 85         // >85% = très bon
}
```

### **Calcul Efficiency Score**

```typescript
// Basé sur :
1. Cache hit rate (70%+ = +30 points)
2. Output/Input ratio (<2 = +20 points)
3. Session duration (optimal 15-30min)
4. MCP calls efficiency (<30 calls)

Score final : 0-100%
```

---

## 💡 TIPS OPTIMISATION

### **Réduire Consommation**

1. **Sessions courtes** : <10k tokens idéal
   - Diviser tâches complexes
   - Sessions focus 15-30min

2. **Prompts précis** : éviter verbosité
   - Aller droit au but
   - Contexte minimal nécessaire

3. **Cache intelligent** : réutiliser contexte
   - Lire fichiers une fois
   - Référencer au lieu de re-fetch

4. **MCP optimisé** : limiter appels
   - Batch operations
   - Déduplication automatique

5. **Workflows batch** : grouper similaires
   - Tests groupés
   - Validations en parallèle

### **Exemples Concrets**

#### ❌ **NON Optimal**
```
"Peux-tu lire ce fichier, l'analyser, me dire ce qu'il fait,
puis me suggérer des améliorations détaillées avec exemples
complets et explications pour chaque ligne..."
```
**Résultat :** 5,000+ tokens, coût $0.50+

#### ✅ **Optimal**
```
"Analyse src/components/Button.tsx :
1. Bugs potentiels
2. Suggestions optimisation (3 max)
Réponse concise."
```
**Résultat :** 1,500 tokens, coût $0.12

---

## 📁 FICHIERS & CONFIGURATION

### **Scripts Créés**
```
.claude/scripts/
├── token-cost-calculator.sh      # Script principal calculs
└── session-token-report.sh       # Hook auto fin session
```

### **Commandes Créées**
```
.claude/commands/
├── token-stats.md               # Commande /token-stats
└── token-monitoring-guide.md    # Ce guide
```

### **Configuration**
```
.claude/settings.json
└── token_monitoring              # Section complète monitoring
    ├── enabled: true
    ├── tracking
    ├── budgets
    ├── alerts
    ├── optimization
    ├── reporting
    ├── tools
    └── excellence_targets
```

### **Logs & Rapports**
```
.claude/reports/tokens/
├── sessions.jsonl               # Historique sessions
└── daily-YYYY-MM-DD.json       # Rapports quotidiens
```

---

## 🏆 RÉSUMÉ - COMMANDES CLÉS

### **Check Rapide**
```bash
/token-stats --quick             # Inline résumé
```

### **Rapports Détaillés**
```bash
/token-stats --today            # Aujourd'hui complet
/token-stats --week             # Hebdo complet
npx ccusage daily              # Visuel table
```

### **Monitoring Live**
```bash
claude-monitor                  # Dashboard ML predictions
npx ccusage blocks --live      # Sessions 5h live
```

### **Analyse Avancée**
```bash
npx ccusage session            # Par session
npx ccusage monthly            # Mensuel
npx ccusage daily --json       # Export JSON
```

---

## 🎓 EXEMPLES RÉELS

### **Aujourd'hui (2025-10-07)**
```
Tokens: 29,606,884
Coût:   $17.17
Budget: 🔴 343% (dépassé!)

Breakdown:
- Cache Read: 92% (excellent réutilisation!)
- Cache Write: 8%
- Input/Output: <0.1% (très efficace)

Efficiency: 100% ✅
```

**Analyse :** Cache hit rate exceptionnel (92%), mais budget dépassé. Recommandation : sessions plus courtes demain.

---

## ✅ SYSTÈME OPÉRATIONNEL

**Installation complète :**
- ✅ `claude-monitor` (dashboard ML)
- ✅ `ccusage` (rapports CLI)
- ✅ Script custom (calculs inline)
- ✅ Commande `/token-stats`
- ✅ Hooks automatiques (fin session)
- ✅ Configuration `.claude/settings.json`

**Prêt à l'emploi :** Toutes commandes fonctionnelles immédiatement.

---

*Token Monitoring Guide - Vérone Back Office Professional Excellence*
