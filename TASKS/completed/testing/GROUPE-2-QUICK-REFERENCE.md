# ⚡ GROUPE 2 - QUICK REFERENCE (1 PAGE)

**Tests Manuels** | **Support Debugger Actif**

---

## 🚀 DÉMARRAGE RAPIDE (30s)

```bash
# 1. Démarrer serveur
npm run dev

# 2. Ouvrir navigateur + DevTools
open http://localhost:3000
# Puis: F12 (DevTools) → Console tab

# 3. Naviguer vers Catalogue
# Dashboard → Menu Gauche → Catalogue Produits
```

---

## 🎯 TOP 5 ERREURS ATTENDUES

| Erreur | Probabilité | Fix (<2 min) |
|--------|-------------|--------------|
| **Serveur dev OFF** | 🔴 ÉLEVÉE | `npm run dev` |
| **Activity warnings** | 🔴 ÉLEVÉE | IGNORER (non-bloquant) |
| **Duplicate 23505** | 🟡 MOYENNE | Noms uniques test-2025-XX |
| **CORS images** | 🟡 MOYENNE | Supabase Dashboard CORS |
| **PGRST204 cache** | 🟢 FAIBLE | Hard refresh (Ctrl+Shift+R) |

---

## 🧪 COMMANDES DIAGNOSTIC EXPRESS

### Vérifier DB
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "\d families"
```

### Tester Connexion
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"
```

### Créer Famille Test SQL
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "INSERT INTO families (name, slug, description, display_order) VALUES ('test-$(date +%s)', 'test-$(date +%s)', 'Debug test', 0) RETURNING *;"
```

---

## 🔧 FIXES INSTANTANÉS

### Cache Corrompu
```
DevTools (F12) → Application → Clear site data
Hard Refresh: Ctrl+Shift+R (ou Cmd+Shift+R Mac)
```

### Migration Display_order
```bash
cd /Users/romeodossantos/verone-back-office-V1
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -f supabase/migrations/20251016_fix_display_order_columns.sql
```

### Serveur Crash
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 📞 SIGNALER ERREUR

**Format minimal**:
```
Test: 2.X
Erreur: [copier message console]
Screenshot: [capture DevTools]
Déjà tenté: Hard refresh / Clear cache / Autre
```

---

## ✅ VALIDATION SUCCESS

**Console**: 0 errors ✅
**Network**: 200/201 status ✅
**UI**: Toast succès + liste rafraîchie ✅
**DB**: `SELECT * FROM families ORDER BY display_order` → Données présentes ✅

---

**Doc Complète**: `GROUPE-2-DIAGNOSTIC-ERREURS.md`
**Support**: Temps réel | **Réponse**: <2 min (P0/P1)
