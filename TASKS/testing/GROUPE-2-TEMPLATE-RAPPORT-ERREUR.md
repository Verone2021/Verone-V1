# 🚨 RAPPORT ERREUR - GROUPE 2

**Date**: [Auto: Date/Heure]
**Test**: GROUPE 2 - Test 2.X
**Testeur**: [Nom]

---

## 📋 INFORMATIONS ERREUR

### Identification

**Test en cours**:
- [ ] Test 2.1 - Création Famille
- [ ] Test 2.2 - Création Catégorie
- [ ] Test 2.3 - Création Sous-catégorie
- [ ] Test 2.4 - Création Collection
- [ ] Test 2.5 - Tri/Ordre Display_order
- [ ] Autre: _______________

**Étape exacte**: [Ex: Clic bouton "Créer famille" après remplir formulaire]

### Symptômes Observés

**Console Browser (Copier message exact)**:
```
[Error/Warn] ...
Message: ...
Code: ...
```

**UI/Toast affiché**:
```
[Décrire message toast ou comportement UI]
```

**Screenshot**:
- [ ] Screenshot console DevTools attaché
- [ ] Screenshot UI/formulaire attaché

---

## 🔍 DIAGNOSTIC INITIAL

### Environnement

**Serveur Dev**:
```bash
curl http://localhost:3000
# Résultat: [HTTP 200 / Erreur connexion / Autre]
```

**Connexion DB**:
```bash
psql-verone -c "SELECT NOW();"
# Résultat: [Timestamp affiché / Timeout / Erreur]
```

**Browser**: [Chrome / Firefox / Safari / Edge] - Version: _____

### Actions Déjà Tentées

Cocher ce qui a été essayé:
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear cache navigateur
- [ ] Vérification schéma DB (psql \d families)
- [ ] Test création SQL directe
- [ ] Restart serveur dev
- [ ] Autre: _______________

---

## 📊 CATÉGORISATION

### Type d'Erreur (Cocher 1)

- [ ] **Scénario #1** - Serveur dev non démarré
- [ ] **Scénario #2** - Activity tracking warnings
- [ ] **Scénario #3** - Duplicate key 23505
- [ ] **Scénario #4** - PGRST204 display_order
- [ ] **Scénario #5** - Network timeout Supabase
- [ ] **Autre** - Non répertorié (DÉTAILLER ci-dessous)

### Priorité

- [ ] 🔴 P0 - BLOQUANT (impossible continuer tests)
- [ ] 🟠 P1 - CRITIQUE (test actuel échoue, autres OK)
- [ ] 🟡 P2 - MAJEUR (workaround possible)
- [ ] 🟢 P3 - MINEUR (cosmétique, non-bloquant)

### Impact

**Tests affectés**: [2.1 / 2.1-2.3 / Tous GROUPE 2 / Autre]

**Reproductibilité**:
- [ ] 100% (à chaque fois)
- [ ] Intermittent (~50%)
- [ ] Rare (<20%)
- [ ] Une seule fois

---

## 💡 CONTEXTE ADDITIONNEL

### Données Utilisées

**Formulaire rempli avec**:
```
Nom: _______________
Slug: _______________ (si applicable)
Description: _______________
Display_order: _____ (si applicable)
Autres champs: _______________
```

### État DB Avant Erreur

```bash
# Nombre familles existantes
psql-verone -c "SELECT COUNT(*) FROM families;"
# Résultat: _____ familles

# Dernière famille créée
psql-verone -c "SELECT name, display_order FROM families ORDER BY created_at DESC LIMIT 1;"
# Résultat: _______________
```

---

## 🔧 TENTATIVES FIX

### Fix #1 - [Nom fix]

**Commande exécutée**:
```bash
[Copier commande exacte]
```

**Résultat**:
- [ ] ✅ Succès - Erreur résolue
- [ ] ❌ Échec - Erreur persiste
- [ ] ⚠️ Partiel - Amélioration mais pas résolu

**Détails**: _______________

### Fix #2 - [Nom fix]

**Commande exécutée**:
```bash
[Copier commande exacte]
```

**Résultat**:
- [ ] ✅ Succès - Erreur résolue
- [ ] ❌ Échec - Erreur persiste
- [ ] ⚠️ Partiel - Amélioration mais pas résolu

**Détails**: _______________

---

## ✅ RÉSOLUTION

### Statut Final

- [ ] ✅ RÉSOLU - Tests peuvent continuer
- [ ] ⏸️ WORKAROUND - Contournement temporaire trouvé
- [ ] ❌ BLOQUÉ - Escalade debugger requise

### Solution Appliquée

**Fix final**:
```bash
[Commande ou action qui a résolu]
```

**Temps résolution**: _____ minutes (depuis détection)

**Validation**:
```bash
# Commande validation
[Ex: psql-verone -c "SELECT * FROM families WHERE name = 'test-xxx';"]

# Résultat attendu
[Décrire résultat]

# Résultat obtenu
[Copier résultat réel]
```

### Tests Post-Fix

- [ ] Console browser 100% clean (0 errors)
- [ ] Network tab: requêtes 200/201 success
- [ ] UI: Toast succès affiché
- [ ] DB: Données créées visibles (SELECT)
- [ ] Workflow complet réussi (création → liste → édition)

---

## 📝 NOTES & OBSERVATIONS

### Remarques

[Observations additionnelles, comportements étranges, suggestions]

### Prévention Future

[Si applicable: comment éviter cette erreur à l'avenir]

---

## 📎 PIÈCES JOINTES

- [ ] Screenshot console DevTools
- [ ] Screenshot UI/formulaire
- [ ] Export logs Supabase (si applicable)
- [ ] Vidéo reproduction (si comportement complexe)

---

## 🔄 ESCALATION

**Si erreur NON résolue après 10 min**, remplir:

### Demande Support Debugger

**Résumé 1 ligne**: [Ex: PGRST204 display_order persiste après hard refresh + migration réappliquée]

**Fixes tentés**: [Lister tous fixes essayés]

**Urgence**:
- [ ] 🔴 IMMÉDIATE (<2 min) - Production down / Tests bloqués
- [ ] 🟠 HAUTE (<5 min) - Test actuel impossible
- [ ] 🟡 NORMALE (<15 min) - Workaround possible

**Disponibilité testeur**: [Ex: Disponible 30 min pour debug synchrone / Async OK]

---

**FIN DU RAPPORT**

---

## 📋 CHECKLIST REMPLISSAGE

Avant envoyer rapport, vérifier:
- [ ] Section "Symptômes" complète (console + UI)
- [ ] Screenshot console attaché
- [ ] Actions tentées documentées
- [ ] Catégorisation remplie (Type + Priorité)
- [ ] Contexte données fourni (formulaire + état DB)
- [ ] Au moins 1 fix tenté (ou justification si impossible)

**Si toutes ✅** → Rapport complet, envoi OK

---

**Template Version**: 1.0 | **Créé**: 2025-10-16
**Usage**: Tests GROUPE 2 manuels
