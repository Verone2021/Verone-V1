# 🚨 RÈGLES DE TEST ABSOLUES - Vérone Back Office

## ❌ INTERDICTIONS PERMANENTES

### **JAMAIS utiliser :**
- Tests automatisés Playwright
- `npx playwright test`
- Chromium (le navigateur automatisé)
- Tous les navigateurs automatisés
- Tests headless

### **JAMAIS mentionner :**
- Chromium (mot interdit définitivement)
- Tests automatisés E2E
- Playwright CLI

## ✅ OBLIGATOIRE UNIQUEMENT

### **Tests manuels avec Chrome**
- Utiliser uniquement Chrome extension
- Tests manuels supervisés par l'utilisateur
- Validation visuelle directe
- Interaction humaine requise

## 📝 Workflow Test Manuel

1. **Ouvrir Chrome**
2. **Naviguer manuellement vers http://localhost:3002**
3. **Tester les workflows à la main**
4. **Validation visuelle directe**
5. **Documentation des résultats**

## 🎯 Application aux Tests

- **Workflow image principale** : Test manuel uniquement
- **Catalogue produits** : Navigation manuelle
- **Wizard création** : Validation manuelle étape par étape

---

**RÈGLE ABSOLUE** : Tout test doit être manuel avec Chrome extension sous supervision humaine directe.