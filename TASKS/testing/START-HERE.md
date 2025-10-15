# 🎯 TESTS GROUPE 2 - START HERE

**1 Commande → Tests Lancés** | **Support Debugger Actif**

---

## ⚡ QUICK START (3 ÉTAPES, 2 MINUTES)

### 1️⃣ Validation Automatique
```bash
cd /Users/romeodossantos/verone-back-office-V1/TASKS/testing
./validate-pre-tests.sh
```
**✅ Attendu**: "SYSTÈME 100% PRÊT - GO POUR TESTS GROUPE 2 !"

---

### 2️⃣ Démarrer Serveur (Si non actif)
```bash
cd /Users/romeodossantos/verone-back-office-V1
npm run dev
```
**✅ Attendu**: "Ready in X.Xs - Local: http://localhost:3000"

---

### 3️⃣ Lancer Tests
```bash
open http://localhost:3000
# 1. Appuyer F12 (DevTools)
# 2. Onglet Console
# 3. Menu Gauche → Catalogue Produits
# 4. Tests 2.1-2.5 (voir GROUPE-2-GUIDE-MANUEL-FINAL.md)
```

---

## 🚨 TOP 3 ERREURS (90% CAS)

### ❌ Serveur dev OFF
**Symptôme**: "This site can't be reached"
**Fix**: `npm run dev` → 30s

### ⚠️ Activity warnings (IGNORER)
**Symptôme**: Console `[Warn] ⚠️ Activity tracking...`
**Fix**: **AUCUN** - workflow continue normalement

### 🔄 Duplicate 23505
**Symptôme**: Toast "nom existe déjà"
**Fix**: Changer nom → `test-2025-01` → 10s

**Autres erreurs** → `GROUPE-2-QUICK-REFERENCE.md`

---

## 📚 DOCUMENTATION (PAR BESOIN)

### 🚀 Démarrage
- **README-GROUPE-2.md** - Point d'entrée complet
- **GROUPE-2-QUICK-REFERENCE.md** - Aide-mémoire 1 page

### 🧪 Tests
- **GROUPE-2-GUIDE-MANUEL-FINAL.md** - Tests 2.1-2.5 détaillés

### 🔧 Diagnostic
- **GROUPE-2-DIAGNOSTIC-ERREURS.md** - Guide complet 8 types
- **GROUPE-2-TOP-5-SCENARIOS.md** - Top 5 erreurs probables

### 📞 Support
- **Format signalement**: Test 2.X | Erreur console | Screenshot
- **Réponse**: <2 min (erreurs bloquantes)

---

## ✅ CHECKLIST

- [ ] `./validate-pre-tests.sh` → 100% PASS
- [ ] `npm run dev` → Ready
- [ ] http://localhost:3000 → Accessible
- [ ] DevTools Console → Ouvert (F12)
- [ ] `GROUPE-2-QUICK-REFERENCE.md` → Lu (2 min)

**Si toutes ✅** → **GO !** 🚀

---

## 📊 OBJECTIFS

**Tests**: 2.1-2.5 (5 tests)
**Succès**: 95%+ (≥475/500 points)
**Temps**: <30 min
**Console**: 0 errors

---

## 🛠️ COMMANDES UTILES

### Vérifier DB
```bash
source GROUPE-2-COMMANDES-RAPIDES.sh
psql-verone -c "SELECT NOW();"
```

### Lister Familles
```bash
psql-verone -c "SELECT id, name, display_order FROM families ORDER BY display_order LIMIT 5;"
```

### Nettoyer Tests
```bash
psql-verone -c "DELETE FROM families WHERE name LIKE 'test-%';"
```

---

## 📁 TOUS LES FICHIERS (18 DISPONIBLES)

```
START-HERE.md (CE FICHIER) ⭐⭐⭐
├── README-GROUPE-2.md ⭐⭐⭐
├── GROUPE-2-INDEX.md ⭐⭐
└── GROUPE-2-QUICK-REFERENCE.md ⭐⭐⭐

GUIDES TESTS:
├── GROUPE-2-GUIDE-MANUEL-FINAL.md
└── GROUPE-2-TESTS-MANUELS-VALIDATION.md

DIAGNOSTIC:
├── GROUPE-2-DIAGNOSTIC-ERREURS.md ⭐⭐
├── GROUPE-2-TOP-5-SCENARIOS.md ⭐⭐
└── GROUPE-2-TEMPLATE-RAPPORT-ERREUR.md

SCRIPTS:
├── validate-pre-tests.sh ⭐⭐⭐
└── GROUPE-2-COMMANDES-RAPIDES.sh ⭐⭐

RAPPORTS DEBUGGER:
├── DEBUGGER-LIVRABLE-FINAL.md
└── DEBUGGER-RAPPORT-MISSION.md

HISTORIQUE:
├── GROUPE-2-ANALYSE-PRE-TESTS.md
├── GROUPE-2-CHECKLIST-DECISION.md
├── GROUPE-2-CORRECTIONS-VERIFICATION.md
├── GROUPE-2-RE-TEST-GUIDE.md
├── GROUPE-2-RE-TEST-RAPPORT-FINAL.md
└── GROUPE-2-STATUT-TESTS.md
```

**⭐⭐⭐ = Essentiel** | **⭐⭐ = Recommandé** | **⭐ = Si besoin**

---

## 🎯 WORKFLOW 5 MINUTES

```
./validate-pre-tests.sh (30s)
     ↓
npm run dev (30s)
     ↓
open http://localhost:3000 (10s)
     ↓
F12 → Console (5s)
     ↓
Lire QUICK-REFERENCE.md (2 min)
     ↓
READY ! 🚀
```

---

## 📞 SUPPORT DEBUGGER

**Actif**: Temps réel pendant tests
**Réponse**: <2 min (erreurs P0/P1)
**Format**: Test 2.X | Console error | Screenshot

---

## 🏆 ÉTAT SYSTÈME

✅ **Database**: PRÊTE (display_order 4/4 tables)
✅ **Code**: PRÊT (0 sort_order résiduel)
✅ **Scripts**: PRÊTS (testés, exécutables)
✅ **Docs**: COMPLÈTES (18 fichiers, 127K)
⚠️ **Serveur**: À DÉMARRER (npm run dev)

**Confiance Success**: **95%+**

---

**PRÊT POUR TESTS GROUPE 2** 🚀

**Bon courage !** 💪

---

**Version**: 1.0 | **Créé**: 2025-10-16
**Support**: Debugger Vérone | **Temps Réel**: Actif
