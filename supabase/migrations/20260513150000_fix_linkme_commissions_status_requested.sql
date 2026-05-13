-- Fix: autoriser le statut 'requested' sur linkme_commissions
--
-- La valeur 'requested' (commission incluse dans une demande de paiement pas encore réglée)
-- est utilisée par le code depuis longtemps : flux de création de demande côté back-office,
-- triggers (mark_commission_requested_on_item_insert, sync_commissions_on_payment_request_paid),
-- et l'onglet "En cours de règlement" de la page Rémunération (filtre status = 'requested').
-- Or la contrainte CHECK ne l'a jamais autorisée → toute création de demande de paiement
-- échouait avec "violates check constraint linkme_commissions_status_check".
-- On ajoute 'requested' à la liste. ('payable' conservé : alias historique de 'validated'.)

ALTER TABLE linkme_commissions
  DROP CONSTRAINT IF EXISTS linkme_commissions_status_check;

ALTER TABLE linkme_commissions
  ADD CONSTRAINT linkme_commissions_status_check
  CHECK (status IN ('pending', 'validated', 'payable', 'requested', 'paid', 'cancelled'));
