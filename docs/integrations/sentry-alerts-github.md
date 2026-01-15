# Configuration Alertes Sentry → GitHub Issues

**Date** : 2026-01-15
**Objectif** : Créer automatiquement des GitHub Issues depuis les erreurs Sentry

---

## 🎯 Vue d'ensemble

Ce guide configure l'intégration Sentry → GitHub pour:

1. **Créer automatiquement** des GitHub Issues depuis les erreurs
2. **Déduplication intelligente** (éviter les doublons)
3. **Enrichissement** avec contexte (app, release, replay link)
4. **Alertes email/Slack** pour erreurs critiques

---

## 📋 Étape 1: Installer l'Intégration GitHub

### Dans Sentry

1. Aller sur https://verone-4q.sentry.io/settings/integrations/
2. Chercher **"GitHub"** dans la liste
3. Cliquer **Install** ou **Configure** si déjà installé
4. Autoriser Sentry à accéder au repository `verone-back-office-V1`
5. Sélectionner le repository dans la liste
6. Confirmer l'installation

**Résultat** : Sentry peut maintenant créer des Issues sur le repo.

---

## 📋 Étape 2: Créer les Issue Alert Rules

### Back-Office Alerts

1. Aller sur https://verone-4q.sentry.io/settings/projects/back-office-nextjs/alerts/
2. Cliquer **Create Alert**
3. **Alert Type** : Issue Alert
4. Configuration:

**Conditions:**
```
When an event is captured by Sentry
AND matches ALL of these filters:
  - event.level equals "error" OR "fatal"
  - event.environment equals "production"
  - event.tags.app equals "back-office"
```

**Actions:**
```
THEN perform these actions:
  1. Create a GitHub issue in verone2021/verone-back-office-V1 with:
     - Title: [BO] {title}
     - Description: (template ci-dessous)
     - Labels: bug, sentry, back-office
     - Assignees: (optionnel)

  2. Send a notification to #verone-alerts (Slack)

  3. Send a notification via email to: admin@verone.com
```

**Template GitHub Issue:**
```markdown
## 🐛 Erreur détectée par Sentry

**App**: Back-Office
**Environment**: {environment}
**Release**: {release}
**Timestamp**: {timestamp}

### Erreur
{title}

### Stack Trace
{stacktrace}

### Contexte
- **User ID**: {user.id}
- **URL**: {url}
- **Browser**: {browser}

### Liens Sentry
- [Voir l'erreur dans Sentry]({url})
- [Session Replay]({replay_url})

---
_Auto-créé par Sentry_
```

**Action Frequency:**
- First time issue is seen
- Issue changes state from resolved to unresolved

**Alert Name**: `[Back-Office] Errors in Production`

5. Cliquer **Save Rule**

---

### LinkMe Alerts

**Répéter la même procédure** avec ces différences:

**Conditions:**
```
When an event is captured by Sentry
AND matches ALL of these filters:
  - event.level equals "error" OR "fatal"
  - event.environment equals "production"
  - event.tags.app equals "linkme"
```

**GitHub Issue:**
- Title: [LM] {title}
- Labels: bug, sentry, linkme

**Alert Name**: `[LinkMe] Errors in Production`

---

## 📋 Étape 3: Configurer la Déduplication

### Dans chaque Alert Rule

1. Aller dans **Alert Settings** (après création)
2. Section **Issue Grouping**:
   ```
   Group similar errors together using:
   - Stack trace fingerprint
   - Error message similarity
   ```
3. Section **Frequency**:
   ```
   - First time issue is seen
   - Issue changes state from resolved to unresolved
   - Issue happens more than 10 times in 1 hour (spike)
   ```

**Résultat** : Évite 100 Issues GitHub pour la même erreur.

---

## 📋 Étape 4: Alertes Critiques (Optionnel)

Pour les erreurs bloquantes (checkout, paiement, etc.):

### Créer une Alert Rule "Critical"

**Conditions:**
```
When an event is captured by Sentry
AND matches ALL of these filters:
  - event.level equals "fatal"
  - event.environment equals "production"
  - event.url matches "*checkout*" OR "*payment*" OR "*order*"
```

**Actions:**
```
1. Create GitHub issue (Priority: HIGH)
2. Send Slack notification to #verone-critical
3. Send email to: admin@verone.com, dev-team@verone.com
4. Page on-call engineer (si PagerDuty configuré)
```

**Action Frequency:**
- Every time issue is seen (pas de déduplication)

---

## 📋 Étape 5: Configurer Slack (Optionnel)

### Installer l'intégration Slack

1. Aller sur https://verone-4q.sentry.io/settings/integrations/
2. Chercher **"Slack"**
3. Cliquer **Install**
4. Autoriser Sentry à accéder au workspace Slack
5. Choisir le canal par défaut: `#verone-alerts`

### Tester l'intégration

1. Aller dans **Alert Rule** → **Test Rule**
2. Vérifier que le message arrive dans Slack
3. Format du message:
   ```
   🔴 [Back-Office] TypeError: Cannot read property 'id' of undefined

   Environment: production
   Release: abc123
   User: 550e8400-e29b-41d4-a716-446655440000

   View in Sentry | View Replay
   ```

---

## 📋 Étape 6: MCP Sentry (pour Claude Code)

### Installer MCP Sentry

MCP Sentry permet à Claude Code de lire directement les erreurs depuis Sentry.

**Installation** (dans le projet):
```bash
# Ajouter dans claude_desktop_config.json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_ORG": "verone-4q",
        "SENTRY_AUTH_TOKEN": "<TOKEN>"
      }
    }
  }
}
```

**Utilisation**:
```
Claude Code peut maintenant:
- Lister les erreurs récentes: "Show me recent errors in back-office"
- Lire les détails d'une erreur: "Analyze error #123"
- Voir le contexte utilisateur: "What was the user doing?"
```

---

## ✅ Vérification

### Checklist de validation

- [ ] Intégration GitHub installée et autorisée
- [ ] Alert Rule Back-Office créée et active
- [ ] Alert Rule LinkMe créée et active
- [ ] Template GitHub Issue configuré avec replay link
- [ ] Déduplication configurée (pas de doublons)
- [ ] Slack intégration testée (optionnel)
- [ ] Email notifications testées

### Test End-to-End

1. **Déclencher une erreur de test:**
   ```typescript
   // Dans une page back-office
   'use client';
   import * as Sentry from '@sentry/nextjs';

   export default function TestPage() {
     const triggerError = () => {
       Sentry.captureException(new Error('Test Sentry Alert'));
     };

     return <button onClick={triggerError}>Test Sentry</button>;
   }
   ```

2. **Vérifier dans Sentry:**
   - L'erreur apparaît dans le projet `back-office-nextjs`
   - Tags: `app: back-office`, `environment: production`

3. **Vérifier GitHub:**
   - Une Issue est créée automatiquement
   - Titre: `[BO] Test Sentry Alert`
   - Labels: `bug`, `sentry`, `back-office`
   - Description contient le replay link

4. **Vérifier Slack/Email:**
   - Notification reçue dans `#verone-alerts`
   - Email reçu sur admin@verone.com

---

## 🔗 Liens Utiles

- [Sentry Alerts](https://verone-4q.sentry.io/alerts/)
- [Sentry Integrations](https://verone-4q.sentry.io/settings/integrations/)
- [GitHub Issues](https://github.com/verone2021/verone-back-office-V1/issues?q=label%3Asentry)
- [Sentry Docs - GitHub Integration](https://docs.sentry.io/product/integrations/source-code-mgmt/github/)
- [Sentry Docs - Alert Rules](https://docs.sentry.io/product/alerts/)

---

**Note** : Les Alert Rules doivent être créées **manuellement** dans l'UI Sentry. Il n'existe pas d'API pour créer des Alert Rules de manière automatique.
