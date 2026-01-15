# Sentry - Runbook Opérationnel

**Date** : 2026-01-15
**Objectif** : Guide opérationnel pour utiliser Sentry au quotidien

---

## 🎯 Vue d'ensemble

Ce runbook explique comment:

1. **Signaler un bug** (utilisateurs)
2. **Trier les erreurs** (équipe)
3. **Investiguer avec Replay** (dev)
4. **Utiliser MCP Sentry** (Claude Code)

---

## 📱 1. Signaler un Bug (Utilisateurs)

### Bouton "Signaler un bug"

**Où ?** En bas à droite de l'écran (floating button)

**Quand ?** Dès qu'un comportement anormal est observé

**Comment ?**

1. Cliquer sur le bouton **"Signaler un bug"** (icône 🐛)
2. Remplir le formulaire:
   - **Titre** : Court et descriptif (ex: "Impossible de valider la commande")
   - **Description** : Étapes pour reproduire + comportement attendu vs réel
   - **Capture d'écran** (optionnel mais recommandé)
3. Cliquer **Envoyer**

**Ce qui se passe:**
- Le rapport est envoyé à Sentry
- L'équipe reçoit une notification
- Un ticket GitHub est créé automatiquement
- Le Replay de session est attaché (10 secondes avant l'erreur)

**Résultat:**
- ID du rapport affiché: `SENT-1234567890`
- Message de confirmation: "Merci pour votre retour !"

---

## 🔍 2. Trier les Erreurs (Équipe)

### Dashboard Sentry

**URL** : https://verone-4q.sentry.io/

**Vue par défaut** : Issues triées par priorité

### Filtres Utiles

**Par Application:**
```
is:unresolved tag:app:back-office
is:unresolved tag:app:linkme
```

**Par Environment:**
```
is:unresolved environment:production
is:unresolved environment:preview
```

**Par User:**
```
is:unresolved user.id:550e8400-*
```

**Erreurs récurrentes:**
```
is:unresolved timesSeen:>10
```

### Workflow de Triage

1. **Ouvrir le dashboard** Sentry
2. **Identifier les erreurs critiques** (niveau `fatal` ou `error`)
3. **Vérifier le contexte**:
   - App: back-office ou linkme?
   - Environment: production ou preview?
   - Release: quelle version?
   - User: combien d'utilisateurs affectés?
4. **Assigner** l'Issue à un développeur
5. **Créer un ticket GitHub** (si pas déjà fait automatiquement)
6. **Commenter** avec les premières observations

---

## 🎥 3. Investiguer avec Replay (Dev)

### Accéder au Replay

1. **Ouvrir l'Issue** dans Sentry
2. **Cliquer sur "Replay"** dans la sidebar droite
3. **Lancer la vidéo** de la session

### Contrôles Replay

- **Play/Pause** : Contrôler la lecture
- **Timeline** : Naviguer dans la session (10s avant → 10s après l'erreur)
- **Events** : Voir tous les events (clicks, inputs, navigations)
- **Console** : Logs console de la session
- **Network** : Requêtes HTTP de la session
- **Speed** : Accélérer/ralentir la lecture (0.5x, 1x, 2x, 4x)

### Ce qui est masqué (RGPD)

✅ **Visible:**
- Structure de la page (layout, composants)
- Boutons cliqués
- Navigation (URLs)
- Messages d'erreur

❌ **Masqué:**
- Texte des inputs (email, téléphone, etc.)
- Données personnelles (noms, adresses)
- Images/médias

### Exemple d'investigation

**Erreur** : `TypeError: Cannot read property 'id' of undefined`

**Étapes:**
1. Ouvrir le Replay
2. Observer ce que l'utilisateur faisait **avant** l'erreur:
   - Navigation: `/commandes` → `/commandes/123`
   - Click: Bouton "Valider"
   - Erreur: Survient au moment du click
3. Regarder la **Console**:
   - `GET /api/orders/123` → 200 OK
   - `POST /api/orders/123/validate` → **ERROR**
   - Stack trace: `OrderForm.tsx:45`
4. Regarder le **Network**:
   - Request: `POST /api/orders/123/validate`
   - Response: `{ order: null }` ← **Problème ici!**
5. **Conclusion**: L'API retourne `null` au lieu d'un objet `order`
6. **Fix**: Ajouter une validation dans `OrderForm.tsx:45`

---

## 🤖 4. Utiliser MCP Sentry (Claude Code)

### Installation

MCP Sentry est déjà configuré dans le projet.

### Commandes Disponibles

**Lister les erreurs récentes:**
```
User: Show me recent errors in back-office
Claude: *Utilise MCP Sentry pour lister les 10 dernières erreurs*
```

**Analyser une erreur spécifique:**
```
User: Analyze error #123
Claude: *Lit les détails, le contexte, et le replay*
```

**Filtrer par user:**
```
User: Show errors for user 550e8400-*
Claude: *Liste les erreurs pour cet utilisateur*
```

**Statistiques:**
```
User: How many errors in the last 24h?
Claude: *Compte les erreurs par app, environment, level*
```

### Workflow avec Claude Code

**Scénario:** Investiguer une erreur signalée par un utilisateur

1. **User signale** via le bouton "Signaler un bug"
2. **Notification** GitHub Issue créée automatiquement
3. **Developer** lance Claude Code:
   ```
   /implement Fix GitHub Issue #789
   ```
4. **Claude Code**:
   - Lit l'Issue GitHub (#789)
   - Utilise MCP Sentry pour lire l'erreur
   - Analyse le Replay automatiquement
   - Propose un fix
   - Crée une PR avec le fix

**Résultat:** Issue résolue en < 10 min

---

## 📊 5. Métriques et KPIs

### Dashboard Recommandé

**Créer un dashboard personnalisé** dans Sentry:

1. Aller sur https://verone-4q.sentry.io/dashboards/
2. Cliquer **Create Dashboard**
3. Ajouter les widgets:

**Widget 1: Erreurs par App**
```
Query: count() group by app
Visualization: Bar Chart
Timeframe: Last 7 days
```

**Widget 2: Erreurs par Environment**
```
Query: count() group by environment
Visualization: Pie Chart
Timeframe: Last 7 days
```

**Widget 3: Top 10 Erreurs**
```
Query: count() group by issue.title
Visualization: Table
Timeframe: Last 7 days
Order: Descending
```

**Widget 4: Release Impact**
```
Query: count() group by release
Visualization: Line Chart
Timeframe: Last 30 days
```

### KPIs à Surveiller

**Quotidien:**
- Nombre d'erreurs nouvelles (< 10/jour)
- Taux de résolution (> 80%)
- Temps moyen de résolution (< 24h)

**Hebdomadaire:**
- Erreurs récurrentes (identifier les patterns)
- Impact par release (détecter les régressions)
- Satisfaction utilisateurs (via feedback)

---

## 🚨 6. Incidents et Escalade

### Niveau 1: Erreur Mineure

**Critères:**
- Pas d'impact utilisateur majeur
- < 5 utilisateurs affectés
- Workaround possible

**Action:**
- Créer un ticket GitHub
- Assigner à un dev
- Fix dans le prochain sprint

### Niveau 2: Erreur Majeure

**Critères:**
- Impact utilisateur significatif
- 5-50 utilisateurs affectés
- Pas de workaround facile

**Action:**
- Notification Slack `#verone-alerts`
- Assigner en priorité
- Fix dans les 24h
- Post-mortem si nécessaire

### Niveau 3: Incident Critique

**Critères:**
- Application down ou bloquante
- > 50 utilisateurs affectés
- Impact business majeur (checkout, paiement)

**Action:**
- **IMMÉDIAT**: Notification Slack `#verone-critical`
- **IMMÉDIAT**: Email à admin@verone.com
- Rollback de la release si nécessaire
- Fix en urgence (< 2h)
- Post-mortem OBLIGATOIRE

---

## 🔗 Liens Utiles

- [Sentry Dashboard](https://verone-4q.sentry.io/)
- [Back-Office Project](https://verone-4q.sentry.io/projects/back-office-nextjs/)
- [LinkMe Project](https://verone-4q.sentry.io/projects/linkme-nextjs/)
- [GitHub Issues (Sentry)](https://github.com/verone2021/verone-back-office-V1/issues?q=label%3Asentry)
- [Sentry Docs](https://docs.sentry.io/)

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-15 | 1.0.0 | Version initiale - Setup Sentry Pro |

---

**Note** : Ce runbook est un living document. Mettre à jour après chaque incident majeur ou changement de process.
