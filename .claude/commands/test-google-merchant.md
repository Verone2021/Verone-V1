# 🧪 Test Google Merchant - Validation Automatisée MCP Playwright

**Objectif** : Valider connexion Google Merchant Center avec tests automatisés
**Durée** : ~5 minutes
**Méthode** : MCP Playwright Browser (pas de scripts *.js/mjs/ts)

---

## 🎯 Workflow Automatique

Je vais effectuer les tests suivants via MCP Playwright :

### Test 1 : Navigation et Console Errors
1. Naviguer vers http://localhost:3000/canaux-vente/google-merchant
2. Vérifier **0 erreur console** (règle sacrée Vérone)
3. Capturer screenshot preuve visuelle

### Test 2 : Test Connexion API
4. Cliquer bouton "Tester Connexion"
5. Attendre message succès "Connexion réussie"
6. Vérifier statut authentication + apiConnection

### Test 3 : Validation Interface
7. Vérifier affichage Account ID (5495521926)
8. Vérifier affichage Data Source ID (10571293810)
9. Screenshot final validation

---

## 🚀 Exécution Automatique

Lancer automatiquement :
- Navigation visible dans browser
- Console checking en temps réel
- Screenshots preuve
- Rapport validation complet

**IMPORTANT** : Le browser s'ouvre devant vous (transparence totale 2025)
