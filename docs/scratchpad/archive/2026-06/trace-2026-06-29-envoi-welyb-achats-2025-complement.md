# TRACE — Envoi réel Welyb : Achats 2025 (complément, 9 pièces)

**Date** : 2026-06-29 · Destinataire : `compta+verone@welyb.com` · Scope : achats · Year 2025
**Contexte** : après synchro Qonto (32 transactions + 153 justificatifs rapatriés), 9 achats 2025
sont devenus prêts. GO Roméo : envoyer tout 2025 disponible (ventes 2025 = 0 pièce).
**Fix appliqué** : borne de fin d'année de la route corrigée (`.lt(year+1-01-01)`) pour inclure
le 31/12 avec heures (sinon « Dos Santos Roméo » du 31/12 06:24 était raté).

Les 9 pièces (date · libellé · montant) :

| #   | Date       | Libellé                 | Montant € |
| --- | ---------- | ----------------------- | --------- |
| 1   | 2025-09-11 | Qonto                   | 16,01     |
| 2   | 2025-09-11 | Qonto                   | 7,20      |
| 3   | 2025-11-02 | GOOGLE\*GSUITE VERONECO | 1,98      |
| 4   | 2025-11-04 | GROUPE H2O BORDEAUX     | 225,25    |
| 5   | 2025-11-07 | Rodobrass SA            | 180,00    |
| 6   | 2025-11-19 | madrir                  | 522,00    |
| 7   | 2025-12-02 | GOOGLE\*WORKSPACE VERON | 6,12      |
| 8   | 2025-12-05 | POKAWA                  | 9107,17   |
| 9   | 2025-12-31 | Dos Santos Roméo        | 500,00    |

## Résultat ✅ (2026-06-29 18:37 UTC)

- **9 pièces envoyées en 1 lot** depuis l'écran (bouton « Confirmer l'envoi (9) »).
- Resend `0cb27c37-ed1e-4971-b1b4-1f2bb11bfbf9` — **delivered** ✅ vers `compta+verone@welyb.com`.
- Base : achats 2025 transférées = **46** (37 + 9) → **0 achat 2025 restant à envoyer**.
- Total achats 2025 transmis au comptable : **46 pièces**.

## Bonus : synchro Qonto testée le 2026-06-29 (fonctionne)

- Connexion Qonto « healthy » (5 comptes). Sync transactions : 32 nouvelles. Sync justificatifs : 153 téléchargés (0 échec).
- Correctif borne fin d'année appliqué dans `send-to-accountant/route.ts` (`.lt(year+1-01-01)`).
