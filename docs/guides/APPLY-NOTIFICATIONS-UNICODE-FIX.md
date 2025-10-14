# 🔧 APPLICATION FIX UNICODE NOTIFICATIONS

**Date** : 2025-10-14
**Problème** : Codes Unicode échappés dans titres notifications
**Script** : `/scripts/fix-notifications-unicode.sql`

---

## 🎯 SYMPTÔMES

**Affichage actuel (ILLISIBLE)** :
- `\u2705 Commande Valid\u00e9e`
- `\ud83d\udea8 Stock Critique`

**Affichage attendu (LISIBLE)** :
- `✅ Commande Validée`
- `🚨 Stock Critique`

**Screenshot preuve** : `.playwright-mcp/notifications-unicode-escape-bug.png`

---

## 📋 INSTRUCTIONS APPLICATION (Supabase Studio)

### Méthode 1 : Via Supabase Studio SQL Editor (RECOMMANDÉ)

1. **Ouvrir Supabase Studio**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner projet Vérone Back Office

2. **Accéder SQL Editor**
   - Menu gauche → "SQL Editor"
   - Cliquer "New Query"

3. **Copier Script Complet**
   - Ouvrir `/scripts/fix-notifications-unicode.sql`
   - Copier TOUT le contenu (180 lignes)
   - Coller dans SQL Editor

4. **Exécuter Script**
   - Cliquer bouton "Run" (ou Cmd+Enter)
   - Attendre exécution complète (~5-10 secondes)

5. **Vérifier Résultats**
   - Scroll vers le bas des résultats
   - Vérifier tables de vérification affichées
   - Confirmer "Notifications avec codes Unicode restants: 0"

### Méthode 2 : Via psql CLI (si connexion possible)

```bash
# Depuis terminal, à la racine du projet
PGPASSWORD="VOTRE_PASSWORD" psql \
  -h VOTRE_HOST.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.VOTRE_PROJECT \
  -f scripts/fix-notifications-unicode.sql
```

---

## ✅ VALIDATION POST-FIX

### Test 1 : Vérifier Base de Données

**Query SQL dans Supabase Studio** :
```sql
-- Afficher 10 dernières notifications
SELECT id, title, message, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Compter codes Unicode restants
SELECT COUNT(*) as remaining_unicode_codes
FROM notifications
WHERE title LIKE '%\u%' OR message LIKE '%\u%';
```

**Résultat attendu** :
- Titres affichent emojis : `✅`, `🚨`
- `remaining_unicode_codes` = **0**

### Test 2 : Vérifier Application Web (MCP Browser)

1. **Recharger Dashboard**
   ```typescript
   mcp__playwright__browser_navigate({ url: 'http://localhost:3000/dashboard' })
   ```

2. **Cliquer Badge Notifications**
   ```typescript
   mcp__playwright__browser_click({ element: 'notifications button', ref: 'e166' })
   ```

3. **Vérifier Titres Lisibles**
   - ✅ "✅ Commande Validée" (au lieu de `\u2705 Commande Valid\u00e9e`)
   - ✅ "🚨 Stock Critique" (au lieu de `\ud83d\udea8 Stock Critique`)

4. **Screenshot Preuve**
   ```typescript
   mcp__playwright__browser_take_screenshot({ filename: 'notifications-fixed-unicode.png' })
   ```

5. **Console Error Checking**
   ```typescript
   mcp__playwright__browser_console_messages({ onlyErrors: true })
   ```
   **Résultat attendu** : [] (ZÉRO erreur)

---

## 🔄 ROLLBACK (SI NÉCESSAIRE)

Si le fix cause des problèmes :

```sql
-- Restaurer backup automatique
DELETE FROM notifications;
INSERT INTO notifications
SELECT * FROM notifications_backup_20251014;

-- Supprimer backup
DROP TABLE notifications_backup_20251014;
```

---

## 📊 SCRIPT DÉTAILS

### Corrections Appliquées

| Code Unicode | Caractère | Usage |
|--------------|-----------|-------|
| `\u2705` | ✅ | Check mark (commandes validées) |
| `\ud83d\udea8` | 🚨 | Police light (alertes urgentes) |
| `\u00e9` | é | Accent aigu français |
| `\u00e0` | à | Accent grave français |
| `\u00e8` | è | Accent grave français |
| `\u26a0\ufe0f` | ⚠️ | Warning sign |
| `\u2139\ufe0f` | ℹ️ | Information |
| `\ud83d\udce6` | 📦 | Package |
| `\ud83d\udcbc` | 💼 | Briefcase |

### Tables Modifiées

- **`notifications.title`** : Titres affichés dans dropdown
- **`notifications.message`** : Messages détails notifications
- **Backup créé** : `notifications_backup_20251014` (sécurité)

---

## 🚨 IMPORTANT

**Permissions requises** :
- Accès Supabase Studio avec droits UPDATE sur table `notifications`
- OU credentials psql avec accès direct base

**Temps exécution estimé** : 5-10 secondes

**Nombre updates attendu** : ~13 notifications (selon environnement)

---

## 📞 SUPPORT

**Problème persiste ?**

1. Vérifier script appliqué complètement (pas d'erreur SQL)
2. Recharger page dashboard (hard refresh : Cmd+Shift+R)
3. Vider cache navigateur
4. Vérifier query vérification retourne 0 codes restants

**Fichiers référence** :
- Script SQL : `/scripts/fix-notifications-unicode.sql`
- Screenshot bug : `.playwright-mcp/notifications-unicode-escape-bug.png`
- Rapport session : `/MEMORY-BANK/sessions/RAPPORT-SESSION-FEATURE5-NOTIFICATIONS-2025-10-14.md`

---

*Guide créé automatiquement - 2025-10-14*
*Feature 5 : Fix Unicode Notifications*
