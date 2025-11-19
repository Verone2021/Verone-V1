-- Migration: Ajouter statut 'validated' au workflow commandes fournisseurs
-- Date: 2025-11-19
-- Context: Workflow fournisseurs = Brouillon → Validation → Réception (3 étapes)
--          Système alertes stock : Rouge (draft) → Vert (validated) → Disparaît (received)

-- ============================================================
-- AJOUTER 'validated' AU TYPE ENUM purchase_order_status
-- ============================================================

-- Note: ALTER TYPE ... ADD VALUE ne peut pas être exécuté dans un bloc de transaction
-- Mais Supabase migrations s'exécutent automatiquement sans transaction explicite
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'validated' AFTER 'draft';

-- ============================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================

COMMENT ON TYPE purchase_order_status IS
'Statuts workflow commandes fournisseurs:
- draft: Brouillon (alerte stock ROUGE 🔴)
- validated: Validée par utilisateur (alerte stock VERTE 🟢) - commande en cours
- sent: Envoyée fournisseur (legacy - utilisé pour clients)
- confirmed: Confirmée par fournisseur (legacy)
- partially_received: Partiellement reçue
- received: Réceptionnée (alerte stock DISPARAÎT ✅)
- cancelled: Annulée (retour alerte ROUGE 🔴)

Workflow principal FOURNISSEURS (3 étapes):
  draft → validated → received

Workflow CLIENTS (3 étapes):
  draft → validated → sent';

-- ============================================================
-- VALIDATION CONTRAINTE EXISTANTE (déjà compatible)
-- ============================================================

-- La contrainte valid_workflow_timestamps existante est déjà compatible:
-- (status = 'draft' OR validated_at IS NOT NULL)
-- → 'validated' nécessite validated_at ✅

-- Pas besoin de modification de contrainte.
