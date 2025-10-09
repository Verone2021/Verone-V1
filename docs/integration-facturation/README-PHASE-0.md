# 🚀 Phase 0 : Validation API Abby.fr - Guide Interactif

**Date**: 2025-10-10
**Objectif**: Valider que l'API Abby.fr fonctionne AVANT de créer les migrations database
**Durée estimée**: 30 minutes

---

## 📋 Vue d'Ensemble

Cette phase est **CRITIQUE** pour éviter de perdre du temps :

- ✅ **Scénario idéal** : API Abby fonctionne → Sprint 1-5 (10 jours)
- ❌ **Scénario bloquant** : Endpoint factures manquant → Pivot Pennylane (1 jour adaptation)

**Principe** : Valider l'API AVANT de coder quoi que ce soit.

---

## 🎯 Checklist Phase 0

### ✅ Étape 1 : Configuration Compte Abby (10 min)

**Actions** :
1. Vérifier que vous avez un compte **Abby Professionnel**
2. Se connecter : https://app.abby.fr/
3. Naviguer : **Paramètres** → **Intégrations & API**
4. Activer **"Accès API"**
5. Générer une clé API : `Vérone Back Office Integration`
6. Copier la clé (format : `abby_sk_live_xxxxx`)

**Documentation détaillée** : Voir `ABBY-API-SETUP-GUIDE.md`

**Validation** :
```bash
# Vous devez avoir une clé qui ressemble à :
abby_sk_live_aBcD1234efGH5678ijKL9012mnOP3456qrST7890
```

---

### ✅ Étape 2 : Configuration .env.local (5 min)

**Action** : Ajouter la clé API dans `.env.local`

1. Ouvrir le fichier `.env.local` à la racine du projet
2. Ajouter ces lignes à la fin :

```bash
# ---------- ABBY FACTURATION API ----------
ABBY_API_KEY=abby_sk_live_VOTRE_CLE_ICI
ABBY_API_BASE_URL=https://api.abby.fr/v1
```

3. Remplacer `VOTRE_CLE_ICI` par votre vraie clé
4. Sauvegarder

**Validation** :
```bash
# Vérifier que la clé est bien ajoutée
grep "ABBY_API_KEY" .env.local
# Résultat attendu : ABBY_API_KEY=abby_sk_live_xxxxx
```

---

### ✅ Étape 3 : Test Automatisé API (10 min)

**Script prêt à l'emploi** : `test-abby-api.sh`

**Exécution** :
```bash
cd /Users/romeodossantos/verone-back-office-V1/docs/integration-facturation
./test-abby-api.sh
```

**Ce que le script teste** :
1. ✅ **GET /me** → Authentification (récupère Organization ID)
2. ✅ **POST /invoices** → Création facture draft
3. ✅ **GET /invoices** → Récupération liste factures

**Résultat attendu** :
```
============================================
🧪 Test API Abby.fr - Validation Endpoints
============================================

📋 Étape 1 : Vérification configuration...
✅ Configuration trouvée
   Clé API : abby_sk_live_...3456

📡 Étape 2 : Test authentification (GET /me)...
   HTTP Code : 200
✅ Authentification réussie
📋 Organization ID : org_abc123xyz

📄 Étape 3 : Test création facture draft (POST /invoices)...
   HTTP Code : 201
✅ Création facture réussie
📋 Facture créée : FA-2025-00001 (ID: inv_xyz789)

📋 Étape 4 : Test récupération liste factures (GET /invoices)...
   HTTP Code : 200
✅ Récupération liste réussie
Nombre de factures : 1

============================================
📊 RÉSUMÉ VALIDATION API ABBY.FR
============================================

✅ Tests réussis :
   - Authentification (GET /me)
   - Création facture draft (POST /invoices)
   - Récupération liste (GET /invoices)

🚀 API Abby.fr est prête pour l'intégration !
```

---

### ⚠️ Cas d'Erreur Possibles

#### Erreur 1 : HTTP 401 Unauthorized

**Symptôme** :
```
❌ Erreur 401 : Clé API invalide ou expirée
```

**Solutions** :
1. Vérifier que la clé commence par `abby_sk_live_`
2. Vérifier copier-coller (pas d'espace avant/après)
3. Générer une nouvelle clé dans Abby Dashboard
4. Mettre à jour `.env.local`

---

#### Erreur 2 : HTTP 404 Endpoint /invoices

**Symptôme** :
```
❌ Erreur 404 : Endpoint POST /invoices n'existe pas
⚠️  ALERTE CRITIQUE : Endpoint facturation manquant dans API Abby
```

**Impact** : **BLOQUANT** pour l'intégration Abby

**Solutions** :

**Option 1 : Contacter Support Abby** (Recommandé en priorité)
- Email : support@abby.fr
- Question : "L'endpoint POST /invoices est-il disponible dans l'API ?"
- Délai réponse : 24-48h généralement

**Option 2 : Pivot Pennylane** (Si Abby bloqué)
- Pennylane = Alternative mature avec API complète documentée
- Architecture identique (5 tables, mêmes RPC)
- Migration : 1 jour adaptation (vs 10 jours Abby)
- Documentation : https://pennylane.readme.io/reference/getting-started

**Je recommande** :
1. Envoyer email à Abby immédiatement
2. Si pas de réponse sous 48h → Pivot Pennylane
3. L'architecture est **agnostique** (facile de switcher)

---

#### Erreur 3 : Commande curl non trouvée

**Symptôme** :
```
bash: curl: command not found
```

**Solution** : Installer curl
```bash
# macOS
brew install curl

# Linux
sudo apt-get install curl
```

---

### ✅ Étape 4 : Récupérer Organization ID (2 min)

Le script automatique affiche l'Organization ID :
```
📋 Organization ID : org_abc123xyz
   → Ajoutez dans .env.local : ABBY_ORGANIZATION_ID=org_abc123xyz
```

**Action** : Copier cette ligne et l'ajouter dans `.env.local`

**Résultat final dans .env.local** :
```bash
# ---------- ABBY FACTURATION API ----------
ABBY_API_KEY=abby_sk_live_xxxxx
ABBY_API_BASE_URL=https://api.abby.fr/v1
ABBY_ORGANIZATION_ID=org_abc123xyz
```

---

## 🎯 Critères de Succès Phase 0

**Validation COMPLÈTE** si tous ces critères sont remplis :

- [x] Compte Abby Professionnel actif
- [x] Clé API générée et ajoutée dans .env.local
- [x] Test `GET /me` retourne **HTTP 200** avec Organization ID
- [x] Test `POST /invoices` retourne **HTTP 201** avec facture créée
- [x] Test `GET /invoices` retourne **HTTP 200** avec liste factures
- [x] Organization ID ajouté dans .env.local

**Si tous validés** → ✅ Passer au **Sprint 1 : Migrations Database**

**Si POST /invoices retourne 404** → ⚠️ **STOP** → Contacter support Abby ou pivot Pennylane

---

## 🚀 Prochaine Étape : Sprint 1

Une fois Phase 0 validée :

**Sprint 1 : Database Foundation** (Jours 1-3)
- Exécution migrations 20251011_010 à 20251011_014
- Création tables : invoices, payments, abby_sync_queue, abby_webhook_events
- Création RPC functions : generate_invoice_from_order(), handle_abby_webhook_invoice_paid()
- Tests isolation RPC

**Fichier** : `2025-10-10-migrations-abby-facturation-sql.md` (prêt à exécuter)

---

## 📞 Support

**Abby.fr** :
- Documentation : https://docs.abby.fr/api
- Email : support@abby.fr
- Chat : Disponible dans app.abby.fr

**Vérone (moi)** :
- Si questions techniques sur script ou tests
- Si besoin aide pour interpréter erreurs API
- Si besoin architecture Pennylane en fallback

---

## 📊 Temps Estimés

| Étape | Durée | Status |
|-------|-------|--------|
| Config compte Abby | 10 min | ⏳ En attente |
| Config .env.local | 5 min | ⏳ En attente |
| Exécution script test | 10 min | ⏳ En attente |
| Ajout Organization ID | 2 min | ⏳ En attente |
| **TOTAL PHASE 0** | **~30 min** | ⏳ **En attente** |

---

*Phase 0 - Validation API Abby.fr - Vérone Back Office 2025*
