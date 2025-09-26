# 🔒 YOLO Secure Mode Command

**Commande avancée** pour développement accéléré avec sécurité maximale

---

## 🎯 **Utilisation**

```bash
/yolo-secure <action> [options]
```

### **Actions Disponibles**

#### **Start** - Démarrer Mode YOLO Sécurisé
```bash
/yolo-secure start
```
- Initialise container Docker isolé
- Configure protection filesystem
- Active monitoring sécurité temps réel
- Lance serveur développement sécurisé

#### **Stop** - Arrêter Mode YOLO
```bash
/yolo-secure stop
```
- Arrêt propre du container
- Sauvegarde état développement
- Nettoyage ressources sécurisé

#### **Status** - Statut Sécurité
```bash
/yolo-secure status
```
- État container et protection
- Métriques sécurité temps réel
- Alertes et recommandations

#### **Scan** - Scanner Sécurité
```bash
/yolo-secure scan
```
- Analyse code malveillant
- Détection vulnérabilités
- Rapport sécurité complet

#### **Emergency** - Arrêt d'Urgence
```bash
/yolo-secure emergency
```
- Destruction immédiate container
- Reset complet environnement
- Procédure breach de sécurité

---

## 🔧 **Workflow Intégré**

### **1. Démarrage Sécurisé**
```bash
# Commande
/yolo-secure start

# Actions automatiques
1. Vérification Docker installation
2. Configuration réseau isolé
3. Lancement container sécurisé
4. Activation monitoring temps réel
5. Health check application
```

### **2. Développement Protégé**
```bash
# Accès sécurisé
http://localhost:3000  # Application
http://localhost:3000/api/health  # Health check

# Console error checking (RÈGLE SACRÉE)
/error-check  # Toujours avant validation
```

### **3. Tests & Validation**
```bash
# Tests critiques en mode YOLO
/test-critical  # 20 tests essentiels

# Scanning sécurité
/yolo-secure scan  # Détection menaces
```

### **4. Arrêt Sécurisé**
```bash
# Arrêt normal
/yolo-secure stop

# Ou arrêt d'urgence si breach
/yolo-secure emergency
```

---

## 🛡️ **Sécurité Guarantees**

### **Container Isolation**
- ✅ **Network Bridge Mode** : Isolation réseau complète
- ✅ **Filesystem Protection** : Read-only + tmpfs sécurisé
- ✅ **Resource Limits** : CPU 2 cores + Memory 4GB max
- ✅ **No Privilege Escalation** : Sécurité AppArmor

### **Real-Time Monitoring**
- ✅ **Threat Detection** : Scanner automatique code malveillant
- ✅ **File Access Control** : Surveillance filesystem temps réel
- ✅ **Network Monitoring** : Contrôle requêtes sortantes
- ✅ **Auto-Quarantine** : Isolation automatique menaces

### **Data Protection**
- ✅ **Credential Isolation** : Jamais exposé dans container
- ✅ **Sensitive Path Blocking** : ~/.ssh, ~/.aws, /etc bloqués
- ✅ **Auto-Classification** : Files catégorisés automatiquement
- ✅ **Audit Trail** : Log complet toutes opérations

---

## 📊 **Monitoring Dashboard**

### **Security Metrics**
```typescript
interface YoloSecurityStatus {
  container: {
    status: 'running' | 'stopped' | 'error';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };

  security: {
    threatsDetected: number;
    threatsBlocked: number;
    riskLevel: 'low' | 'medium' | 'high';
    lastScanTime: Date;
  };

  filesystem: {
    filesScanned: number;
    blockedOperations: number;
    quarantinedFiles: number;
  };

  network: {
    requestsMonitored: number;
    suspiciousActivity: number;
    isolationActive: boolean;
  };
}
```

### **Console Output Example**
```bash
🔒 YOLO SECURE STATUS REPORT
=====================================
🐳 Container: verone-yolo-secure
   Status: RUNNING ✅
   Uptime: 02:34:15
   Memory: 1.2GB / 4GB (30%)
   CPU: 15% / 200%

🛡️ Security Status: PROTECTED ✅
   Threats Detected: 0
   Files Scanned: 1,247
   Risk Level: LOW
   Last Scan: 30s ago

🌐 Network: ISOLATED ✅
   Requests: 156 monitored
   Suspicious: 0 blocked
   Isolation: ACTIVE

📋 Recommendations: NONE
=====================================
```

---

## ⚡ **Performance Impact**

### **Overhead Minimal**
- ✅ **Startup Time** : <30 seconds container ready
- ✅ **Performance Impact** : <10% vs mode normal
- ✅ **Memory Overhead** : ~500MB for sécurité
- ✅ **CPU Overhead** : <5% for monitoring

### **Development Speed**
- ✅ **Hot Reload** : Preserved (fichiers src/ mappés)
- ✅ **Debug Access** : Port 9229 disponible si nécessaire
- ✅ **Tool Integration** : Compatible tous outils dev
- ✅ **Rapid Iteration** : YOLO benefits maintenus

---

## 🚨 **Emergency Procedures**

### **Security Breach Detection**
```bash
# Automatic Response (immediate)
1. Container isolation: <1 second
2. Network disconnection: <1 second
3. File quarantine: <1 second
4. Admin alert: <5 seconds

# Manual Investigation
/yolo-secure emergency  # Nuclear option
```

### **Recovery Protocol**
```bash
# After breach investigation
1. Analyze logs: docker logs verone-yolo-secure
2. Check quarantined files: .claude/security/quarantine/
3. Review threat signatures
4. Update security rules
5. Restart: /yolo-secure start
```

---

## 🎯 **Best Practices**

### **Usage Patterns**
```bash
# ✅ RECOMMANDÉ
/yolo-secure start     # Début session dev
/error-check          # Console errors (RÈGLE SACRÉE)
/test-critical        # Tests essentiels
/yolo-secure scan     # Scan sécurité périodique
/yolo-secure stop     # Fin session

# ❌ ÉVITER
# Jamais laisser tourner en continue
# Jamais bypasser security scans
# Jamais ignorer alertes sécurité
```

### **Integration Commands**
```bash
# Workflow complet sécurisé
/feature-start "new-feature"  # Planning avec Sequential Thinking
/yolo-secure start           # Mode développement sécurisé
/error-check                 # Console clean mandatory
/test-critical               # Tests rapides
/deploy-check               # Validation finale
/yolo-secure stop           # Nettoyage sécurisé
```

---

## 📚 **Troubleshooting**

### **Common Issues**
| Problème | Cause | Solution |
|----------|-------|----------|
| Container ne démarre pas | Docker non installé | `docker --version` puis installer |
| Port 3000 occupé | Autre process | `lsof -i :3000` puis kill |
| Performance lente | Limites ressources | Ajuster limits container |
| Alerts sécurité | Code suspect | `/yolo-secure scan` puis fix |

### **Debug Commands**
```bash
# Diagnostic container
docker ps                           # Status containers
docker logs verone-yolo-secure      # Logs application
docker exec -it verone-yolo-secure sh  # Shell access

# Diagnostic réseau
docker network ls                   # Networks actifs
netstat -tulpn | grep :3000        # Port listeners

# Diagnostic filesystem
df -h                              # Disk usage
ls -la .claude/security/           # Security files
```

---

## 🎭 **Advanced Usage**

### **Custom Security Rules**
```typescript
// .claude/security/custom-rules.ts
interface CustomSecurityRule {
  name: string;
  pattern: RegExp;
  action: 'log' | 'warn' | 'block' | 'quarantine';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Example: Block eval usage
const noEvalRule: CustomSecurityRule = {
  name: 'no-eval-usage',
  pattern: /eval\s*\(/gi,
  action: 'block',
  severity: 'high'
};
```

### **Monitoring Extensions**
```bash
# Future: Sentry MCP integration
/yolo-secure scan --sentry      # Send to Sentry
/yolo-secure status --detailed   # Extended metrics
/yolo-secure logs --follow       # Real-time monitoring
```

---

**🔒 Mode YOLO Sécurisé - Speed WITH Security**
*Développement rapide sans compromis sécuritaire selon best practices 2025*