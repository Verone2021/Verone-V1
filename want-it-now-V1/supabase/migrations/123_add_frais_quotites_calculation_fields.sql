-- Migration: Add frais_notaire and frais_annexes for quotités calculations
-- Author: Claude Code
-- Date: $(date '+%Y-%m-%d')
-- Purpose: Add missing financial fields for automatic quotités calculation

-- Add missing financial fields to proprietes table
ALTER TABLE proprietes 
ADD COLUMN IF NOT EXISTS frais_notaire NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS frais_annexes NUMERIC(12,2);

-- Add comments for documentation
COMMENT ON COLUMN proprietes.frais_notaire IS 'Frais de notaire lors de l''achat de la propriété';
COMMENT ON COLUMN proprietes.frais_annexes IS 'Frais annexes lors de l''achat (expertise, diagnostics, etc.)';

-- Update validation schema to ensure positive values
ALTER TABLE proprietes 
ADD CONSTRAINT proprietes_frais_notaire_positive 
CHECK (frais_notaire IS NULL OR frais_notaire >= 0);

ALTER TABLE proprietes 
ADD CONSTRAINT proprietes_frais_annexes_positive 
CHECK (frais_annexes IS NULL OR frais_annexes >= 0);

-- Create helper function for calculating quotité price automatically
CREATE OR REPLACE FUNCTION calculate_quotite_prix_acquisition(
  p_propriete_id UUID,
  p_pourcentage NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_prix_achat NUMERIC;
  v_frais_notaire NUMERIC;
  v_frais_annexes NUMERIC;
  v_total_achat NUMERIC;
  v_quotite_prix NUMERIC;
BEGIN
  -- Get property purchase details
  SELECT prix_achat, frais_notaire, frais_annexes
  INTO v_prix_achat, v_frais_notaire, v_frais_annexes
  FROM proprietes
  WHERE id = p_propriete_id;

  -- Return NULL if no purchase price is set
  IF v_prix_achat IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate total purchase cost
  v_total_achat := COALESCE(v_prix_achat, 0) 
                 + COALESCE(v_frais_notaire, 0) 
                 + COALESCE(v_frais_annexes, 0);

  -- Calculate quotité portion
  v_quotite_prix := v_total_achat * (p_pourcentage / 100.0);

  RETURN v_quotite_prix;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for function
COMMENT ON FUNCTION calculate_quotite_prix_acquisition(UUID, NUMERIC) IS 
'Calcule automatiquement le prix d''acquisition d''une quotité basé sur le prix d''achat total et le pourcentage';

-- Create trigger function to auto-calculate quotité prix_acquisition if not manually set
CREATE OR REPLACE FUNCTION auto_calculate_quotite_prix()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-calculate if prix_acquisition is NULL and property has purchase price
  IF NEW.prix_acquisition IS NULL THEN
    NEW.prix_acquisition := calculate_quotite_prix_acquisition(NEW.propriete_id, NEW.pourcentage);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to automatically calculate quotité prices
DROP TRIGGER IF EXISTS trg_auto_calculate_quotite_prix ON propriete_proprietaires;
CREATE TRIGGER trg_auto_calculate_quotite_prix
  BEFORE INSERT OR UPDATE ON propriete_proprietaires
  FOR EACH ROW 
  EXECUTE FUNCTION auto_calculate_quotite_prix();

-- Create view for property financial summary including new fields
CREATE OR REPLACE VIEW proprietes_financial_summary AS
SELECT 
  p.id,
  p.nom,
  p.prix_achat,
  p.frais_acquisition,
  p.frais_notaire,
  p.frais_annexes,
  -- Calculate total investment
  (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) AS total_investissement,
  -- Property value and profit
  p.valeur_actuelle,
  (COALESCE(p.valeur_actuelle, 0) - COALESCE(p.prix_achat, 0) - COALESCE(p.frais_notaire, 0) - COALESCE(p.frais_annexes, 0)) AS plus_value,
  -- Operating costs
  p.loyer,
  p.charges,
  p.taxe_fonciere,
  (COALESCE(p.loyer, 0) - COALESCE(p.charges, 0) - COALESCE(p.taxe_fonciere, 0)) AS benefice_mensuel_net
FROM proprietes p;

COMMENT ON VIEW proprietes_financial_summary IS 
'Vue résumé financier des propriétés avec calculs automatiques des totaux et bénéfices';