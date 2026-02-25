-- Migration: Créer les allocations stockage pour les 2 produits Pokawa
-- Contexte: Les 2 produits Pokawa (store_at_verone = true) doivent apparaître
-- dans la page Stockage LinkMe. Le trigger auto-allocation ne s'est pas déclenché
-- car aucune commande n'a été livrée pour ces produits.
-- Enseigne Pokawa: de1bcbd7-0086-4632-aedb-ece0a5b3d358
--
-- NOTE: 2 tables existent (affiliate_storage_allocations et storage_allocations).
-- Les RPCs (get_affiliate_storage_summary, get_storage_details) utilisent storage_allocations.
-- On insère dans les deux pour cohérence.

-- Table principale utilisée par les RPCs
INSERT INTO storage_allocations (
  product_id, owner_enseigne_id, owner_organisation_id,
  stock_quantity, billable_in_storage, allocated_at
)
VALUES
  ('37f00f14-ce2d-48bf-ba4a-832d37978a74', 'de1bcbd7-0086-4632-aedb-ece0a5b3d358', NULL, 1, true, '2025-12-16 10:00:00+00'),
  ('4779f34a-ee9c-4429-b74a-bb4861fa6eba', 'de1bcbd7-0086-4632-aedb-ece0a5b3d358', NULL, 1, true, '2025-12-16 10:00:00+00');

-- Table legacy (cohérence)
INSERT INTO affiliate_storage_allocations (
  product_id, owner_enseigne_id, owner_organisation_id,
  stock_quantity, billable_in_storage, allocated_at
)
VALUES
  ('37f00f14-ce2d-48bf-ba4a-832d37978a74', 'de1bcbd7-0086-4632-aedb-ece0a5b3d358', NULL, 1, true, '2025-12-16 10:00:00+00'),
  ('4779f34a-ee9c-4429-b74a-bb4861fa6eba', 'de1bcbd7-0086-4632-aedb-ece0a5b3d358', NULL, 1, true, '2025-12-16 10:00:00+00');
