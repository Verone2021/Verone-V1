/**
 * 🔧 FIX: Notifications Titles - Unicode Escape Codes → Emojis Réels
 *
 * Problème: Les titres notifications affichent des codes échappés illisibles
 * - ❌ "\u2705 Commande Valid\u00e9e"
 * - ❌ "\ud83d\udea8 Stock Critique"
 *
 * Solution: Remplacer codes Unicode par emojis/caractères réels
 * - ✅ "✅ Commande Validée"
 * - ✅ "🚨 Stock Critique"
 *
 * Date: 2025-10-14
 * Context: Feature 5 - Système Notifications In-App
 */

-- ============ BACKUP TABLE (SÉCURITÉ) ============
-- Créer backup avant modifications
CREATE TABLE IF NOT EXISTS notifications_backup_20251014 AS
SELECT * FROM notifications;

-- ============ NETTOYAGE TITRES NOTIFICATIONS ============

-- Fix 1: Remplacer emoji ✅ (Check Mark) - Code \u2705
UPDATE notifications
SET title = REPLACE(title, '\u2705', '✅')
WHERE title LIKE '%\u2705%';

-- Fix 2: Remplacer emoji 🚨 (Police Car Light) - Code \ud83d\udea8
UPDATE notifications
SET title = REPLACE(title, '\ud83d\udea8', '🚨')
WHERE title LIKE '%\ud83d\udea8%';

-- Fix 3: Remplacer caractères accentués français
-- é (e accent aigu) - Code \u00e9
UPDATE notifications
SET title = REPLACE(title, '\u00e9', 'é')
WHERE title LIKE '%\u00e9%';

-- à (a accent grave) - Code \u00e0
UPDATE notifications
SET title = REPLACE(title, '\u00e0', 'à')
WHERE title LIKE '%\u00e0%';

-- è (e accent grave) - Code \u00e8
UPDATE notifications
SET title = REPLACE(title, '\u00e8', 'è')
WHERE title LIKE '%\u00e8%';

-- ù (u accent grave) - Code \u00f9
UPDATE notifications
SET title = REPLACE(title, '\u00f9', 'ù')
WHERE title LIKE '%\u00f9%';

-- ê (e circonflexe) - Code \u00ea
UPDATE notifications
SET title = REPLACE(title, '\u00ea', 'ê')
WHERE title LIKE '%\u00ea%';

-- ô (o circonflexe) - Code \u00f4
UPDATE notifications
SET title = REPLACE(title, '\u00f4', 'ô')
WHERE title LIKE '%\u00f4%';

-- î (i circonflexe) - Code \u00ee
UPDATE notifications
SET title = REPLACE(title, '\u00ee', 'î')
WHERE title LIKE '%\u00ee%';

-- ç (c cédille) - Code \u00e7
UPDATE notifications
SET title = REPLACE(title, '\u00e7', 'ç')
WHERE title LIKE '%\u00e7%';

-- Fix 4: Autres emojis courants notifications
-- ⚠️ (Warning Sign) - Code \u26a0\ufe0f
UPDATE notifications
SET title = REPLACE(title, '\u26a0\ufe0f', '⚠️')
WHERE title LIKE '%\u26a0\ufe0f%';

-- ℹ️ (Information) - Code \u2139\ufe0f
UPDATE notifications
SET title = REPLACE(title, '\u2139\ufe0f', 'ℹ️')
WHERE title LIKE '%\u2139\ufe0f%';

-- 📦 (Package) - Code \ud83d\udce6
UPDATE notifications
SET title = REPLACE(title, '\ud83d\udce6', '📦')
WHERE title LIKE '%\ud83d\udce6%';

-- 💼 (Briefcase) - Code \ud83d\udcbc
UPDATE notifications
SET title = REPLACE(title, '\ud83d\udcbc', '💼')
WHERE title LIKE '%\ud83d\udcbc%';

-- Fix 5: Nettoyer messages (même traitement)
-- Messages peuvent aussi contenir codes échappés

-- Emoji ✅
UPDATE notifications
SET message = REPLACE(message, '\u2705', '✅')
WHERE message LIKE '%\u2705%';

-- Emoji 🚨
UPDATE notifications
SET message = REPLACE(message, '\ud83d\udea8', '🚨')
WHERE message LIKE '%\ud83d\udea8%';

-- Caractères accentués dans messages
UPDATE notifications
SET message = REPLACE(message, '\u00e9', 'é')
WHERE message LIKE '%\u00e9%';

UPDATE notifications
SET message = REPLACE(message, '\u00e0', 'à')
WHERE message LIKE '%\u00e0%';

UPDATE notifications
SET message = REPLACE(message, '\u00e8', 'è')
WHERE message LIKE '%\u00e8%';

-- ============ VÉRIFICATION POST-FIX ============

-- Query 1: Compter notifications modifiées
SELECT
  'Notifications avec codes Unicode restants' as check_type,
  COUNT(*) as count
FROM notifications
WHERE
  title LIKE '%\u%'
  OR message LIKE '%\u%';

-- Query 2: Afficher exemples titres après fix
SELECT
  id,
  title,
  message,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Query 3: Comparer backup vs actuel
SELECT
  'Backup' as source,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT title) as unique_titles
FROM notifications_backup_20251014

UNION ALL

SELECT
  'Current' as source,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT title) as unique_titles
FROM notifications;

-- ============ ROLLBACK (SI NÉCESSAIRE) ============
-- En cas de problème, restaurer backup:
--
-- DELETE FROM notifications;
-- INSERT INTO notifications SELECT * FROM notifications_backup_20251014;
-- DROP TABLE notifications_backup_20251014;

-- ============ LOGS ============
DO $$
BEGIN
  RAISE NOTICE '✅ Fix Unicode Notifications terminé';
  RAISE NOTICE '📊 Vérifier résultats avec queries ci-dessus';
  RAISE NOTICE '⚠️ Backup créé: notifications_backup_20251014';
  RAISE NOTICE '🔄 Rollback disponible si nécessaire';
END $$;
