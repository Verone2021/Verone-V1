# 🔒 Guide Sécurité Token Sentry - Permissions Minimales

**Guide professionnel pour créer un token Sentry sécurisé**
*Vérone Back Office - Monitoring Production*

---

## 🎯 **OBJECTIF**

Créer un token Sentry avec **permissions minimales** pour le monitoring de production, respectant les bonnes pratiques de sécurité.

---

## 📋 **PERMISSIONS MINIMALES REQUISES**

### **Niveau Organisation**
- ✅ `org:read` - Lecture informations organisation
- ❌ `org:write` - Écriture (NON REQUIS)
- ❌ `org:admin` - Administration (NON REQUIS)

### **Niveau Projet**
- ✅ `project:read` - Lecture projets
- ✅ `event:read` - Lecture événements/erreurs
- ❌ `project:write` - Écriture projets (NON REQUIS)
- ❌ `project:admin` - Administration projets (NON REQUIS)

### **Niveau Issues**
- ✅ `event:read` - Lecture issues/erreurs
- ✅ `project:read` - Accès liste issues
- ⚠️ `project:write` - **OPTIONNEL** pour actions rapides (résoudre/assigner)

---

## 🚀 **PROCÉDURE CRÉATION TOKEN**

### **Étape 1 : Accès Sentry**
```bash
# Aller sur Sentry.io
https://sentry.io/settings/auth-tokens/
```

### **Étape 2 : Créer nouveau token**
```yaml
Nom: "Vérone Back Office - Monitoring Read-Only"
Type: "User Auth Token"
Scopes:
  - org:read
  - project:read
  - event:read
  - member:read  # Pour récupérer infos utilisateurs
Organisation: "verone"
Expiration: 1 an (renouveler annuellement)
```

### **Étape 3 : Configuration environnement**
```bash
# Remplacer dans .env.local
SENTRY_AUTH_TOKEN=sntryu_NOUVEAU_TOKEN_ICI

# Garder les autres variables
SENTRY_ORG=verone
SENTRY_REGION_URL=https://de.sentry.io
```

---

## 🛡️ **VALIDATION SÉCURITÉ**

### **Test Token (Terminal)**
```bash
# Test 1: Vérifier permissions organisation
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  "https://de.sentry.io/api/0/organizations/verone/"

# Test 2: Vérifier accès issues
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  "https://de.sentry.io/api/0/organizations/verone/issues/?limit=1"

# Test 3: Vérifier rejet écriture (doit retourner 403)
curl -X PUT -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}' \
  "https://de.sentry.io/api/0/organizations/verone/issues/FAKE_ID/"
```

### **Tests Vérone API**
```bash
# Test API locale après config
curl "http://localhost:3000/api/monitoring/sentry-issues"

# Doit retourner JSON avec issues sans erreurs 4xx
```

---

## ⚡ **ACTIONS RAPIDES OPTIONNELLES**

Si vous souhaitez activer les **actions rapides** (résoudre/assigner issues depuis le dashboard) :

### **Permissions Additionnelles**
- ✅ `project:write` - Écriture limitée aux issues
- ❌ `project:admin` - Administration complète (NON REQUIS)

### **Avantages/Inconvénients**
```yaml
Avantages:
  - Résolution directe depuis dashboard Vérone
  - Actions batch sur multiple issues
  - Assignation automatique

Inconvénients:
  - Permissions plus larges
  - Risque sécurité accru
  - Token plus sensible
```

---

## 🔄 **ROTATION TOKEN**

### **Fréquence Recommandée**
- **Production** : 12 mois
- **Développement** : 6 mois
- **En cas de compromission** : Immédiatement

### **Procédure Rotation**
1. Créer nouveau token avec mêmes permissions
2. Tester en dev avec nouveau token
3. Déployer en production
4. Révoquer ancien token
5. Mettre à jour documentation

---

## 📊 **MONITORING UTILISATION**

### **Surveillance Recommandée**
```yaml
Métriques:
  - Nombre requêtes API/jour
  - Taux d'erreur 4xx/5xx
  - Latence moyenne API
  - Alertes échecs authentification

Logs à surveiller:
  - "❌ [API] SENTRY_AUTH_TOKEN manquant"
  - "❌ [API] Erreur Sentry: 401"
  - "❌ [API] Erreur Sentry: 403"
```

---

## 🚨 **SÉCURITÉ CRITIQUE**

### **Règles Absolues**
- ❌ **JAMAIS** committer le token dans git
- ❌ **JAMAIS** partager le token en plain text
- ❌ **JAMAIS** utiliser le token admin en production
- ✅ **TOUJOURS** utiliser variables d'environnement
- ✅ **TOUJOURS** permissions minimales
- ✅ **TOUJOURS** rotation régulière

### **En Cas de Compromission**
```bash
# 1. Révoquer immédiatement
# 2. Créer nouveau token
# 3. Auditer logs d'accès
# 4. Notifier équipe sécurité
# 5. Mettre à jour procédures
```

---

## 📝 **VALIDATION FINALE**

- [ ] Token créé avec permissions minimales
- [ ] Tests API réussis (lecture seule)
- [ ] Échec contrôlé écriture (403 attendu)
- [ ] Documentation équipe mise à jour
- [ ] Ancien token révoqué
- [ ] Monitoring en place

---

*Guide créé pour Vérone Back Office - Monitoring Professionnel*
*Dernière mise à jour : 2025-09-29*