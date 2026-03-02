-- Fix: reverse_stock_on_movement_delete must respect affects_forecast flag
-- Bug: DELETE trigger did not check affects_forecast, causing stock_real inflation
-- when forecast-only movements were deleted (affects_forecast=true movements
-- never impacted stock_real on INSERT, but the DELETE trigger blindly reversed them)
--
-- Root cause: Cleanup of orphan forecast movements triggered stock_real += abs(quantity)
-- for 10 products, inflating their stock by the exact forecast amount.

CREATE OR REPLACE FUNCTION reverse_stock_on_movement_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- If the movement only affected forecast, DO NOT touch stock_real
    -- (mirrors the INSERT trigger which skips stock_real for affects_forecast=true)
    IF OLD.affects_forecast = true THEN
        RAISE NOTICE 'stock_movement DELETE % (affects_forecast=true): stock_real not modified for product %',
            OLD.id, OLD.product_id;
        RETURN OLD;
    END IF;

    -- Reverse the quantity_change on products.stock_real
    -- If movement was +10 (IN) -> stock -= 10
    -- If movement was -5 (OUT) -> stock -= (-5) = stock += 5
    UPDATE products
    SET stock_real = COALESCE(stock_real, 0) - OLD.quantity_change,
        updated_at = NOW()
    WHERE id = OLD.product_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
