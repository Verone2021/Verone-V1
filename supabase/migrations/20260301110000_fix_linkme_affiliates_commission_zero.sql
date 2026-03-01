-- Fix: linkme_affiliates.linkme_commission_rate was set to 5% by default,
-- causing the quote dialog to show 5% commission for catalogue products
-- when channel_pricing.channel_commission_rate is NULL (37/44 products).
--
-- The source of truth for commission is channel_pricing.channel_commission_rate.
-- linkme_affiliates.linkme_commission_rate is a legacy field and should always be 0.

UPDATE linkme_affiliates
SET linkme_commission_rate = 0, updated_at = now()
WHERE linkme_commission_rate != 0;
