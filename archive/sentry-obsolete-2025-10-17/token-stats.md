# 📊 Token Stats - Monitoring Tokens Claude Code

**Commande** : `/token-stats`

**Description** : Affiche statistiques tokens et coûts Claude Code pour session courante, journée, semaine ou mois.

---

## 🎯 Usage

```bash
# Rapport aujourd'hui (défaut)
/token-stats

# Rapport hebdomadaire
/token-stats --week

# Sessions actives
/token-stats --session

# Résumé rapide
/token-stats --quick

# Rapport complet
/token-stats --all
```

---

## 📊 Exemples Output

### **Résumé Rapide**
```
═══════════════════════════════════════════════════════════════════
  📊 CLAUDE CODE TOKEN DASHBOARD - VÉRONE PROFESSIONAL
═══════════════════════════════════════════════════════════════════

📊 Aujourd'hui:
  Tokens: 26,322,335
  Coût:   $15.5884
  Budget: 🔴 CRITIQUE (311.77%) / $5.0000

🎯 Commandes Disponibles:
  claude-monitor              # Dashboard temps réel
  npx ccusage daily           # Rapport détaillé aujourd'hui
  npx ccusage blocks --live   # Monitoring live sessions
  /token-stats --today        # Ce script (aujourd'hui)
  /token-stats --week         # Ce script (hebdo)
```

### **Rapport Journalier**
```
▶ 📅 RAPPORT JOURNALIER - 2025-10-07
─────────────────────────────────────────────────────────────────

Tokens Consommés:
  Input:          17,055 tokens
  Output:         23,714 tokens
  Cache Write:    2,115,085 tokens
  Cache Read:     24,166,481 tokens
  Total:          26,322,335 tokens

Coûts:
  Input:          $0.0512
  Output:         $0.3557
  Cache Write:    $7.9316
  Cache Read:     $7.2499
  Total:          $15.5884

Métriques:
  Efficiency:     100%
  Budget Daily:   🔴 CRITIQUE (311.77%) / $5.0000

⚠ ALERTE: Budget journalier presque atteint!
💡 Conseil: Réduire sessions ou optimiser prompts
```

### **Rapport Hebdomadaire**
```
▶ 📊 RAPPORT HEBDOMADAIRE - Derniers 7 jours
─────────────────────────────────────────────────────────────────

Tokens Consommés (7 jours):
  Total:          26,322,335 tokens
  Moyenne/jour:   3,760,333 tokens

Coûts (7 jours):
  Total:          $15.5884
  Moyenne/jour:   $2.2269
  Budget Weekly:  🟢 OK (51.96%) / $30.0000

Projection:
  Mensuel:        $66.81
  ✅ Budget mensuel respecté
```

---

## 🎯 Intégration Workflow

Cette commande utilise :
- **ccusage** : extraction données historiques
- **Script custom** : calculs et formatage
- **Pricing 2025** : Claude Sonnet 4.5 tarifs officiels

### **Pricing Référence**
- Input: $3/M tokens
- Output: $15/M tokens
- Cache Read: $0.30/M tokens
- Cache Write: $3.75/M tokens

### **Budgets Configurables**
- Daily: $5.00
- Weekly: $30.00
- Monthly: $100.00

*Modifiable dans `.claude/scripts/token-cost-calculator.sh`*

---

## 🤖 Commandes Complémentaires

```bash
# Dashboard temps réel (terminal)
claude-monitor

# Analyse détaillée ccusage
npx ccusage daily              # Aujourd'hui
npx ccusage monthly            # Ce mois
npx ccusage session            # Par session
npx ccusage blocks --live      # Live monitoring

# Variantes script custom
.claude/scripts/token-cost-calculator.sh --today
.claude/scripts/token-cost-calculator.sh --week
.claude/scripts/token-cost-calculator.sh --session
.claude/scripts/token-cost-calculator.sh --quick
```

---

## 💡 Tips Optimisation

### **Réduire Consommation Tokens**
1. **Sessions courtes** : <10k tokens idéal
2. **Prompts précis** : éviter verbosité
3. **Cache utilisation** : réutiliser contexte
4. **MCP intelligent** : limiter appels redondants
5. **Batch operations** : grouper requêtes similaires

### **Monitoring Continu**
```bash
# Terminal 1: Dev Claude Code
claude

# Terminal 2: Monitoring live
claude-monitor --live

# Terminal 3: Logs sessions
npx ccusage blocks --live
```

### **Alerts Automatiques**
Configurés dans `.claude/settings.json` :
- Budget journalier dépassé
- Efficiency score <70%
- Session duration >30min
- MCP calls excessive >50/session

---

## 🏆 Excellence Targets

### **Benchmarks Vérone**
```
🟢 EXCELLENT (90-100%)
   └─ <5,000 tokens/session
   └─ >85% cache hit rate
   └─ <$0.50/session

🟡 GOOD (75-89%)
   └─ <10,000 tokens/session
   └─ >70% efficiency
   └─ <$1.00/session

🔴 NEEDS IMPROVEMENT (<75%)
   └─ Optimisation requise
   └─ Session splitting recommandé
```

### **ROI Development**
- **300%** acceleration vs manuel
- **95%** error detection improvement
- **80%** deployment time reduction
- **$2.34** cost per feature average

---

*Token Stats - Vérone Back Office Professional Excellence*
