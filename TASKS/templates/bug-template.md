# 🐛 [BUG] Titre du Bug

## 📋 **INFORMATIONS GÉNÉRALES**

- **ID Bug** : BUG-YYYY-MM-DD-001
- **Priorité** : [CRITICAL/HIGH/MEDIUM/LOW]
- **Sévérité** : [BLOCKER/CRITICAL/MAJOR/MINOR/TRIVIAL]
- **Sprint** : [Sprint MOIS ANNÉE]
- **Assigné** : [Nom développeur]
- **Status** : [OPEN/IN_PROGRESS/RESOLVED/CLOSED]
- **Reporter** : [Qui a reporté le bug]

## 🚨 **CLASSIFICATION PRIORITÉ**

### **CRITICAL/BLOCKER**
- Système non fonctionnel
- Perte de données
- Sécurité compromise
- Production down

### **HIGH/MAJOR**
- Feature principale cassée
- Workflow utilisateur bloqué
- Performance dégradée >50%
- Erreurs fréquentes utilisateurs

### **MEDIUM/MINOR**
- Feature secondaire impactée
- Workaround disponible
- UX dégradée mais fonctionnelle
- Erreurs occasionnelles

### **LOW/TRIVIAL**
- Cosmétique UI
- Edge cases rares
- Documentation/typos
- Améliorations mineures

## 🔍 **DESCRIPTION DÉTAILLÉE**

### **Résumé**
[Description courte et claire du problème]

### **Comportement Actuel**
[Ce qui se passe actuellement - comportement observé]

### **Comportement Attendu**
[Ce qui devrait se passer - comportement correct]

### **Impact Business**
- **Utilisateurs Affectés** : [Nombre/pourcentage]
- **Modules Impactés** : [Liste modules touchés]
- **Revenue Impact** : [Si applicable]
- **Réputation** : [Impact image/satisfaction]

## 🔬 **REPRODUCTION**

### **Environnement**
- **OS** : [Windows/macOS/Linux]
- **Navigateur** : [Chrome/Safari/Firefox + version]
- **Device** : [Desktop/Mobile/Tablet]
- **Résolution** : [Si applicable]
- **Environment** : [Production/Staging/Development]

### **Étapes de Reproduction**
```
1. [Étape 1 précise]
2. [Étape 2 précise]
3. [Étape 3 précise]
...
N. [Résultat observé]
```

### **Données Test**
```json
// Données nécessaires pour reproduire
{
  "user_id": "exemple",
  "test_data": {
    "property": "value"
  }
}
```

### **Fréquence**
- **Always** : 100% reproductible
- **Often** : >75% des cas
- **Sometimes** : 25-75% des cas
- **Rarely** : <25% des cas
- **Unable** : Non reproductible

## 📸 **EVIDENCE**

### **Screenshots/Videos**
[Joindre captures écran, vidéos, logs]

### **Error Messages**
```
[Messages d'erreur exacts - copier/coller]
```

### **Browser Console**
```javascript
// Erreurs console navigateur
Error: [Message erreur]
  at [Stack trace]
```

### **Network Logs**
```http
// Requêtes HTTP en échec
GET /api/endpoint HTTP/1.1
Status: 500 Internal Server Error
Response: {"error": "message"}
```

### **Server Logs**
```
// Logs serveur si disponibles
[timestamp] ERROR: [message]
```

## 🔧 **ANALYSE TECHNIQUE**

### **Root Cause (si identifiée)**
[Cause racine du problème]

### **Affected Code**
```typescript
// Code concerné (si identifié)
function problematicFunction() {
  // Code with issue
}
```

### **Stack Trace**
```
[Stack trace complet si disponible]
```

### **Related Issues**
- **Similaires** : [Liens vers bugs similaires]
- **Dépendances** : [Bugs bloquants/bloqués]
- **Historique** : [Regressions/fixes précédents]

## 🛠️ **SOLUTION**

### **Approche Proposée**
[Description solution technique envisagée]

### **Code Fix (si simple)**
```typescript
// Avant (buggy)
function buggyCode() {
  // problematic implementation
}

// Après (fixed)
function fixedCode() {
  // corrected implementation
}
```

### **Tests Nécessaires**
- **Unit Tests** : [Tests unitaires à ajouter]
- **Integration Tests** : [Tests intégration]
- **Regression Tests** : [Tests non-régression]

### **Impact Analysis**
- **Backward Compatibility** : [Compatibilité]
- **Performance** : [Impact performance]
- **Security** : [Implications sécurité]
- **Dependencies** : [Autres modules affectés]

## ⚡ **TIMELINE & EFFORT**

### **Estimation**
- **Investigation** : [X heures]
- **Development** : [X heures]
- **Testing** : [X heures]
- **Total** : [X heures/jours]

### **Deadline**
- **Target Fix** : [Date cible]
- **Business Deadline** : [Deadline business]
- **Justification** : [Raison urgence]

## 🧪 **VALIDATION & TESTING**

### **Test Cases**
```gherkin
Scenario: Bug fix validation
  Given [Conditions initiales]
  When [Actions reproduction bug]
  Then [Comportement correct attendu]
  And [Aucune régression]
```

### **Acceptance Criteria**
- [ ] Bug reproduit et fixé
- [ ] Tests automatisés ajoutés
- [ ] Aucune régression détectée
- [ ] Performance maintenue
- [ ] Documentation mise à jour si nécessaire

### **Regression Testing**
- [ ] Fonctionnalités connexes testées
- [ ] Tous environnements validés
- [ ] Edge cases vérifiés
- [ ] Performance benchmarks OK

## 📊 **MONITORING POST-FIX**

### **Métriques à Surveiller**
- **Error Rate** : [Métrique erreurs]
- **Performance** : [Métriques performance]
- **User Experience** : [Satisfaction utilisateur]
- **Business Impact** : [KPIs business]

### **Alerting**
- **Monitoring** : [Alertes à configurer]
- **Rollback Plan** : [Plan rollback si problème]

## 📚 **DOCUMENTATION**

### **Knowledge Base**
- **Root Cause** : [Documentation cause]
- **Fix Details** : [Détails solution]
- **Prevention** : [Mesures préventives futures]

### **Team Communication**
- **Stakeholders** : [Qui informer]
- **Communication Plan** : [Comment communiquer]
- **Post-Mortem** : [Si bug critique]

## 🔄 **WORKFLOW STATUS**

### **OPEN**
- [ ] Bug reporté et documenté
- [ ] Priorité assignée
- [ ] Équipe notifiée

### **IN_PROGRESS**
- [ ] Investigation commencée
- [ ] Root cause identifiée
- [ ] Solution développée
- [ ] Tests en cours

### **RESOLVED**
- [ ] Fix déployé environnement test
- [ ] Validation QA complète
- [ ] Stakeholder approval
- [ ] Prêt déploiement production

### **CLOSED**
- [ ] Déployé production
- [ ] Monitoring confirmé
- [ ] Documentation complétée
- [ ] Post-mortem si nécessaire

## 📝 **NOTES & COMMENTS**

### **Investigation Notes**
[Notes pendant investigation]

### **Communication Log**
[Log communications stakeholders]

### **Lessons Learned**
[Apprentissages pour éviter récurrence]

---

## 🔗 **RÉFÉRENCES**

- **Related Tickets** : [Liens tickets connexes]
- **Documentation** : [Liens documentation pertinente]
- **External Resources** : [Ressources externes utiles]

---

**Template Version** : 1.0
**Dernière mise à jour** : 15 septembre 2025