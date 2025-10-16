# 🚀 GUIDE RAPIDE - TESTS FIXES #2 ET #3

**⏱️ Temps estimé:** 10-15 minutes
**📍 Serveur:** http://localhost:3000
**👤 Login:** veronebyromeo@gmail.com / Abc123456

---

## ⚡ DÉMARRAGE

```bash
# Terminal 1: Lancer serveur
npm run dev

# Terminal 2: Vérifier status
curl http://localhost:3000/api/health || echo "Server ready"
```

**Browser Setup:**
1. Ouvrir Chrome/Firefox
2. **F12** → DevTools
3. Activer tabs: **Console** + **Network**

---

## 🧪 TEST #1: ORGANISATIONS (5 min)

### Objectif
✅ Fournisseur créé **sans erreur 400** (slug auto-généré)

### Actions Rapides

```
1. http://localhost:3000/organisation
2. Clic "Nouveau fournisseur"
3. Remplir:
   - Nom: TEST - Validation Fix #3 Nordic
   - Type: Fournisseur
   - Email: fix3-test@nordic.com
   - Pays: France
4. Vérifier preview slug: test-validation-fix-3-nordic
5. Clic "Créer"
6. CHECK Console: 0 erreur 400 ✅
7. CHECK Liste: Fournisseur visible ✅
```

### ✅ Success Criteria

| Vérification | Attendu |
|--------------|---------|
| Preview slug | `test-validation-fix-3-nordic` |
| Toast succès | "Organisation créée" |
| HTTP Status | 200/201 |
| Console 400 | 0 |

### 📸 Screenshot

Capturer:
- Formulaire + preview slug
- Liste organisations (fournisseur visible)

---

## 🧪 TEST #2: SOURCING RAPIDE (5 min)

### Objectif
✅ Produit créé **sans image** (pas d'erreur validation)

### Actions Rapides

```
1. http://localhost:3000/catalogue/create
2. Clic "Sourcing Rapide"
3. Remplir:
   - Image: LAISSER VIDE ⚠️ CRITICAL
   - Nom: TEST - Validation Fix #2 Canapé
   - URL: https://example.com/canape-fix2
   - Client: Vide
4. Vérifier label: "Image du produit (facultatif)"
5. Clic "Enregistrer en brouillon"
6. CHECK Console: 0 erreur validation ✅
7. /sourcing/produits → Produit visible ✅
```

### ✅ Success Criteria

| Vérification | Attendu |
|--------------|---------|
| Label image | "(facultatif)" |
| Toast succès | "Sourcing enregistré" |
| HTTP Status | 200/201 |
| Console errors | 0 validation |

### 📸 Screenshot

Capturer:
- Formulaire sans image (label facultatif)
- Liste sourcing (produit visible)

---

## 📊 CHECKLIST FINALE

### Fix #3 Organisations
- [ ] Preview slug auto-généré
- [ ] Soumission réussie (HTTP 200/201)
- [ ] Toast succès affiché
- [ ] 0 erreur 400 console
- [ ] Fournisseur dans liste

**Résultat:** ☐ VALIDÉ ✅ / ☐ ÉCHOUÉ ❌

---

### Fix #2 Sourcing Rapide
- [ ] Label "(facultatif)" visible
- [ ] Formulaire accepte sans image
- [ ] Soumission réussie (HTTP 200/201)
- [ ] Toast succès affiché
- [ ] 0 erreur validation
- [ ] Produit dans liste sourcing

**Résultat:** ☐ VALIDÉ ✅ / ☐ ÉCHOUÉ ❌

---

### Console Error Checking
- [ ] /organisation: ≤ 3 erreurs mineures
- [ ] /catalogue/create: ≤ 3 erreurs mineures
- [ ] /sourcing/produits: ≤ 3 erreurs mineures
- [ ] 0 erreur critique 400/500

**Résultat:** ☐ PROPRE ✅ / ☐ ERREURS ❌

---

## 🎯 STATUT GLOBAL

```
TESTS VALIDÉS:  ___/2
CONSOLE PROPRE: ☐ OUI / ☐ NON
SYSTÈME OPÉRATIONNEL: ☐ OUI / ☐ NON
```

---

## 🔧 CLEANUP (Après tests)

```sql
-- Supprimer données test
DELETE FROM organisations WHERE name LIKE 'TEST - Validation Fix #3%';
DELETE FROM product_drafts WHERE name LIKE 'TEST - Validation Fix #2%';
```

---

## 🚨 SI ERREUR

### Fix #3 Erreur 400
```bash
# Vérifier migration slug appliquée
grep -r "slug VARCHAR" supabase/migrations/
# Devrait retourner: organisations.slug
```

### Fix #2 Erreur Validation
```bash
# Vérifier code fix appliqué
grep -A3 "FIX: Image facultative" src/components/business/sourcing-quick-form.tsx
# Devrait retourner: commentaires lignes 101-105
```

---

## 📞 SUPPORT

**Erreur bloquante ?**
1. Screenshot console complète
2. Network tab (requête échouée)
3. Étape exacte échec
4. Partager diagnostic

---

**⚡ TEMPS TOTAL:** ~15 min max

**📄 RAPPORT COMPLET:** `/TASKS/testing/RAPPORT_VALIDATION_FIXES_2_3.md`
