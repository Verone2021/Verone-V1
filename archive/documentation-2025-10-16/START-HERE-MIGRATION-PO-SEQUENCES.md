# 🚀 START HERE - Migration Séquences PO (Action Immédiate)

**⏱️ Temps estimé:** 5 minutes
**🎯 Objectif:** Débloquer création commandes fournisseurs
**⚠️ Statut:** Action manuelle requise MAINTENANT

---

## 🔥 Problème Actuel

**Erreur lors de création commande:**
```
Error 409: duplicate key violates unique constraint "purchase_orders_po_number_key"
```

**Impact:**
- ❌ Impossible créer nouvelles commandes fournisseurs
- ❌ Tests E2E bloqués
- ❌ Workflow approvisionnement non validé

---

## ✅ Solution (5 minutes)

### Étape 1: Ouvrir Supabase Studio (30 secondes)

1. Navigateur → https://supabase.com/dashboard
2. Projet: **Vérone Back Office**
3. Menu latéral → **SQL Editor**
4. Bouton **New Query**

---

### Étape 2: Copier-Coller ce SQL (1 minute)

```sql
-- =============================================
-- FIX: Séquences PostgreSQL Thread-Safe PO
-- =============================================

-- 1. Créer séquence
CREATE SEQUENCE IF NOT EXISTS purchase_orders_sequence
  START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- 2. Fonction génération numéro
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  sequence_num := nextval('purchase_orders_sequence');
  RETURN 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
END;
$$;

-- 3. Fonction reset synchronisation
CREATE OR REPLACE FUNCTION reset_po_sequence_to_max()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  max_sequence INTEGER;
  new_start INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
    THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
    ELSE 0 END
  ), 0) INTO max_sequence FROM purchase_orders;

  new_start := max_sequence + 1;
  PERFORM setval('purchase_orders_sequence', new_start, false);
  RETURN new_start;
END;
$$;

-- 4. Permissions
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;

-- 5. Synchroniser avec commandes existantes
SELECT reset_po_sequence_to_max();
-- Devrait afficher: 2 (car commandes existantes: 0 et 1)

-- 6. Test génération
SELECT generate_po_number();
-- Devrait afficher: PO-2025-00002
```

---

### Étape 3: Exécuter (10 secondes)

1. Cliquer **Run** (ou `Ctrl+Enter`)
2. Vérifier messages de succès dans output

**Messages attendus:**
```
✅ reset_po_sequence_to_max: 2
✅ generate_po_number: PO-2025-00002
```

---

### Étape 4: Vérifier Application (1 minute)

**Ouvrir console browser** (http://localhost:3001) et exécuter:

```javascript
fetch('/api/apply-po-migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

**Réponse attendue:**
```json
{
  "success": true,
  "nextNumber": "PO-2025-00002",
  "message": "✅ Migration PO complète! ..."
}
```

Si `success: false` → Reprendre depuis Étape 2

---

### Étape 5: Tester Création Commande (2 minutes)

1. **Naviguer:** http://localhost:3001/commandes/fournisseurs
2. **Cliquer:** Bouton "+ NOUVELLE COMMANDE"
3. **Sélectionner fournisseur:** DSA Menuiserie
4. **Ajouter produit:** Fauteuil Milo - Bleu
5. **Quantité:** 10
6. **Créer:** Bouton "Créer la commande"

**Résultat attendu:**
- ✅ Commande créée: **PO-2025-00002**
- ✅ Statut: Brouillon
- ✅ Montant: 1 090,00€ HT
- ✅ **AUCUNE erreur 409**

---

## 🎉 C'est Tout!

**Si tout fonctionne:**
- ✅ Migration appliquée avec succès
- ✅ Séquences synchronisées
- ✅ Création commandes débloquée
- ✅ Tests E2E peuvent continuer

---

## 🚨 Dépannage Rapide

### Problème: "Could not find function reset_po_sequence_to_max"

**Cause:** SQL non exécuté ou erreur de syntaxe

**Solution:**
1. Vérifier que TOUT le SQL a été copié (pas de coupure)
2. Re-exécuter dans SQL Editor
3. Vérifier output pour erreurs

---

### Problème: Erreur 409 persiste après migration

**Diagnostic rapide dans Supabase SQL Editor:**

```sql
-- Voir séquence actuelle
SELECT last_value FROM purchase_orders_sequence;

-- Voir max commandes
SELECT MAX(
  CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
) FROM purchase_orders;
```

**Si last_value < max:**
```sql
-- Forcer reset
SELECT reset_po_sequence_to_max();
```

---

### Problème: Permission denied

```sql
-- Re-grant permissions
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;
```

---

## 📚 Documentation Complète

**Pour plus de détails:**
- Guide complet: `docs/migrations/GUIDE-MIGRATION-PO-SEQUENCES-2025.md`
- Rapport technique: `MEMORY-BANK/sessions/RAPPORT-BLOCAGE-MIGRATION-PO-2025-10-12.md`
- Rapport session: `MEMORY-BANK/sessions/RAPPORT-SESSION-E2E-CONTINUATION-2025-10-12.md`

---

## ⏭️ Après Migration

**Tests E2E à poursuivre:**

1. ✅ Créer commande PO-2025-00002
2. Tester workflow: Draft → Sent → Received
3. Vérifier impact stocks réel/prévisionnel
4. Valider création stock_movements
5. Vérifier disparition alertes stocks

**Commande pour continuer:**
```bash
# Si Claude Code actif, simplement dire:
"La migration est appliquée, continuons les tests E2E"
```

---

## 🎯 Indicateurs de Succès

- ✅ API retourne `success: true`
- ✅ Génération retourne `PO-2025-00002`
- ✅ Création commande UI réussit
- ✅ Console browser reste clean (0 erreurs)

---

*Action immédiate requise - 5 minutes*
*Vérone Back Office - 12 octobre 2025*
