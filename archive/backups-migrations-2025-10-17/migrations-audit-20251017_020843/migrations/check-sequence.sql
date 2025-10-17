-- Vérifier les numéros de commandes clients existants
SELECT order_number, created_at
FROM sales_orders
ORDER BY created_at DESC
LIMIT 15;

-- Vérifier l'état actuel de la séquence SO
SELECT last_value, is_called FROM sales_orders_sequence;

-- Trouver le max numéro
SELECT MAX(
  CASE WHEN order_number ~ '^SO-[0-9]{4}-[0-9]+$'
  THEN CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
  ELSE 0 END
) as max_order_num
FROM sales_orders;
