# 🔔 Configuration Hooks Claude Code - Vérone Back Office

**Date de mise à jour** : 2025-11-04
**Version** : 1.0.0
**Mainteneur** : Romeo Dos Santos

---

## 📋 Vue d'Ensemble

Ce document décrit la configuration des **hooks Claude Code** pour les notifications sonores et visuelles lors des événements importants du workflow de développement.

---

## 🎯 Objectifs

Les hooks permettent de recevoir des **alertes sonores et notifications macOS** pour :

1. **Validation requise** : Quand Claude attend votre permission pour utiliser un outil ou nécessite votre input
2. **Tâche terminée** : Quand Claude a fini de répondre à votre requête
3. **Agent terminé** : Quand un sous-agent spécialisé (Serena, Playwright, etc.) termine son exécution

---

## 🔧 Configuration Actuelle

### Fichier : `.claude/settings.json` (lignes 146-184)

```json
"hooks": {
  "Notification": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/validation-required.sh"
        }
      ]
    }
  ],
  "Stop": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/task-completed.sh"
        },
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/session-token-report.sh"
        }
      ]
    }
  ],
  "SubagentStop": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/agent-finished.sh"
        }
      ]
    }
  ]
}
```

---

## 🎵 Types de Hooks et Sons Associés

### 1. Hook `Notification` 🔔

**Quand** : Claude attend votre permission ou input (inactivité 60+ secondes)

**Script** : `.claude/scripts/validation-required.sh`

**Son** : `Sosumi.aiff` (son système macOS distinctif)

**Notification macOS** :

- **Titre** : "🔔 Validation Requise - Claude Code"
- **Message** : "Claude attend votre permission ou votre input"
- **Action** : Clic ouvre Terminal

**Use cases** :

- Demande permission pour tool dangereux (git push, rm, etc.)
- Attente réponse utilisateur à une question
- Timeout inactivité (>60s sans input)

---

### 2. Hook `Stop` 🎉

**Quand** : Claude termine sa réponse

**Scripts** :

1. `.claude/scripts/task-completed.sh` (notification)
2. `.claude/scripts/session-token-report.sh` (rapport tokens)

**Son** : `Hero.aiff` (son triomphal macOS)

**Notification macOS** :

- **Titre** : "✅ Tâche Terminée - Claude Code"
- **Message** : "Claude a terminé la tâche demandée"
- **Action** : Clic ouvre Terminal

**Use cases** :

- Fin d'exécution tâche longue (build, tests, migrations)
- Fin d'analyse complexe (audit, refactoring)
- Fin de génération code/documentation

---

### 3. Hook `SubagentStop` 📋

**Quand** : Un sous-agent (Serena, Playwright, Task) termine

**Script** : `.claude/scripts/agent-finished.sh`

**Son** : Aucun (notification silencieuse)

**Notification macOS** :

- **Titre** : "📋 Agent Terminé - Claude Code"
- **Message** : "Un agent spécialisé a terminé son exécution"
- **Action** : Clic ouvre Terminal

**Use cases** :

- Agent Serena termine exploration code
- Agent Playwright termine tests browser
- Agent Task termine recherche documentaire

---

## 📂 Scripts Hooks

### Localisation

Tous les scripts sont dans `.claude/scripts/` :

```bash
.claude/scripts/
├── validation-required.sh  # Hook Notification
├── task-completed.sh       # Hook Stop (principal)
├── session-token-report.sh # Hook Stop (rapport)
└── agent-finished.sh       # Hook SubagentStop
```

### Permissions

Tous les scripts doivent être **exécutables** :

```bash
chmod +x .claude/scripts/*.sh
```

**Vérification** :

```bash
ls -la .claude/scripts/
# Doit afficher : -rwxr-xr-x (755)
```

---

## 🧪 Tests

### Test Manuel des Scripts

```bash
# Test validation requise
./.claude/scripts/validation-required.sh
# Son : Sosumi.aiff + notification macOS

# Test tâche terminée
./.claude/scripts/task-completed.sh
# Son : Hero.aiff + notification macOS

# Test agent terminé
./.claude/scripts/agent-finished.sh
# Notification macOS (sans son)
```

### Test des Hooks en Session Claude Code

**Hook Notification** :

1. Lancer tâche nécessitant permission (ex: `git push`)
2. Attendre popup permission Claude Code
3. Vérifier : Son Sosumi + Notification macOS

**Hook Stop** :

1. Lancer tâche simple (ex: "Explique-moi la structure du projet")
2. Attendre fin réponse Claude
3. Vérifier : Son Hero + Notification macOS

**Hook SubagentStop** :

1. Lancer tâche avec agent (ex: "Use Serena to explore...")
2. Attendre fin agent
3. Vérifier : Notification macOS (sans son)

---

## 🐛 Troubleshooting

### Les sons ne fonctionnent pas

**Vérifier sons système macOS** :

```bash
# Tester son Sosumi
afplay /System/Library/Sounds/Sosumi.aiff

# Tester son Hero
afplay /System/Library/Sounds/Hero.aiff
```

Si aucun son → Vérifier préférences macOS "Sons"

### Les notifications ne s'affichent pas

**Vérifier permissions notifications Terminal** :

1. Ouvrir "Réglages Système" macOS
2. Aller dans "Notifications"
3. Chercher "Terminal" ou "Script Editor"
4. Activer "Autoriser les notifications"

### Hook Notification ne se déclenche pas

**Vérifier configuration** :

```bash
# Vérifier JSON syntax
cat .claude/settings.json | python3 -m json.tool > /dev/null

# Vérifier hook Notification existe
grep -A 10 '"Notification"' .claude/settings.json
```

**Vérifier logs hooks** :

```bash
# Consulter logs
cat .claude/logs/hooks.log

# Surveiller logs en temps réel
tail -f .claude/logs/hooks.log
```

---

## 📚 Références

### Documentation Officielle

- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [Claude Code Settings Reference](https://docs.claude.com/en/docs/claude-code/settings)

### Articles & Guides

- [Claude Code Hooks for macOS Notifications](https://khromov.se/claude-code-hooks-for-simple-macos-notifications/) (Robert Khromov, 2025)
- [macOS Terminal Notifications](https://support.apple.com/fr-fr/guide/terminal/welcome/mac)

### Ressources Internes

- Configuration : `.claude/settings.json`
- Scripts : `.claude/scripts/`
- Logs : `.claude/logs/hooks.log`

---

## 📝 Changelog

### v1.0.0 - 2025-11-04

**Ajouté** :

- ✅ Hook `Notification` (était manquant)
- ✅ Paramètre `matcher: ""` sur tous les hooks (conformité doc officielle)
- ✅ Documentation complète hooks configuration

**Corrigé** :

- ❌ Script `validation-required.sh` n'était jamais appelé
- ❌ Structure hooks non conforme à documentation officielle

**Résultat** :

- ✅ Notifications sonores fonctionnelles pour tous les événements
- ✅ Configuration conforme best practices Anthropic 2025

---

**Maintenance** : Vérifier cette configuration après chaque mise à jour Claude Code majeure
