-- Migration: Fix order_date for all LinkMe orders imported from Bubble
-- All dates verified manually from invoice PDFs on applinkme.bubbleapps.io
-- Date format: YYYY-MM-DD (from DD/MM/YYYY on invoices)

-- Page 1: LINK-230001 to LINK-230019
UPDATE sales_orders SET order_date = '2023-05-30' WHERE order_number = 'LINK-230001';
UPDATE sales_orders SET order_date = '2023-06-08' WHERE order_number = 'LINK-230002';
UPDATE sales_orders SET order_date = '2023-06-14' WHERE order_number = 'LINK-230003';
UPDATE sales_orders SET order_date = '2023-06-19' WHERE order_number = 'LINK-230004';
UPDATE sales_orders SET order_date = '2023-06-19' WHERE order_number = 'LINK-230005';
UPDATE sales_orders SET order_date = '2023-06-20' WHERE order_number = 'LINK-230006';
UPDATE sales_orders SET order_date = '2023-06-20' WHERE order_number = 'LINK-230007';
UPDATE sales_orders SET order_date = '2023-06-21' WHERE order_number = 'LINK-230008';
UPDATE sales_orders SET order_date = '2023-06-22' WHERE order_number = 'LINK-230009';
UPDATE sales_orders SET order_date = '2023-06-23' WHERE order_number = 'LINK-230010';
UPDATE sales_orders SET order_date = '2023-06-23' WHERE order_number = 'LINK-230011';
UPDATE sales_orders SET order_date = '2023-06-23' WHERE order_number = 'LINK-230012';
UPDATE sales_orders SET order_date = '2023-07-04' WHERE order_number = 'LINK-230013';
UPDATE sales_orders SET order_date = '2023-07-04' WHERE order_number = 'LINK-230014';
UPDATE sales_orders SET order_date = '2023-07-04' WHERE order_number = 'LINK-230015';
UPDATE sales_orders SET order_date = '2023-07-05' WHERE order_number = 'LINK-230016';
UPDATE sales_orders SET order_date = '2023-07-18' WHERE order_number = 'LINK-230017';
UPDATE sales_orders SET order_date = '2023-07-18' WHERE order_number = 'LINK-230018';
UPDATE sales_orders SET order_date = '2023-07-27' WHERE order_number = 'LINK-230019';

-- Page 2: LINK-230020 to LINK-240011
UPDATE sales_orders SET order_date = '2023-08-08' WHERE order_number = 'LINK-230020';
UPDATE sales_orders SET order_date = '2023-09-18' WHERE order_number = 'LINK-230021';
UPDATE sales_orders SET order_date = '2023-10-27' WHERE order_number = 'LINK-230022';
UPDATE sales_orders SET order_date = '2023-10-27' WHERE order_number = 'LINK-230023';
UPDATE sales_orders SET order_date = '2023-10-27' WHERE order_number = 'LINK-230024';
UPDATE sales_orders SET order_date = '2023-11-08' WHERE order_number = 'LINK-230025';
UPDATE sales_orders SET order_date = '2023-11-08' WHERE order_number = 'LINK-230026';
UPDATE sales_orders SET order_date = '2023-12-06' WHERE order_number = 'LINK-230027';
UPDATE sales_orders SET order_date = '2023-12-04' WHERE order_number = 'LINK-230028';
UPDATE sales_orders SET order_date = '2024-01-08' WHERE order_number = 'LINK-240001';
UPDATE sales_orders SET order_date = '2024-01-08' WHERE order_number = 'LINK-240002';
UPDATE sales_orders SET order_date = '2024-01-08' WHERE order_number = 'LINK-240003';
UPDATE sales_orders SET order_date = '2024-01-16' WHERE order_number = 'LINK-240004';
UPDATE sales_orders SET order_date = '2024-01-16' WHERE order_number = 'LINK-240005';
UPDATE sales_orders SET order_date = '2024-01-16' WHERE order_number = 'LINK-240006';
UPDATE sales_orders SET order_date = '2024-02-08' WHERE order_number = 'LINK-240007';
UPDATE sales_orders SET order_date = '2024-02-23' WHERE order_number = 'LINK-240008';
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240009';
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240010';
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240011';

-- Page 3: LINK-240012 to LINK-240033
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240012';
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240013';
UPDATE sales_orders SET order_date = '2024-04-05' WHERE order_number = 'LINK-240014';
UPDATE sales_orders SET order_date = '2024-04-08' WHERE order_number = 'LINK-240015';
UPDATE sales_orders SET order_date = '2024-04-03' WHERE order_number = 'LINK-240016';
UPDATE sales_orders SET order_date = '2024-04-08' WHERE order_number = 'LINK-240017';
UPDATE sales_orders SET order_date = '2024-04-08' WHERE order_number = 'LINK-240018';
UPDATE sales_orders SET order_date = '2024-04-08' WHERE order_number = 'LINK-240019';
UPDATE sales_orders SET order_date = '2024-04-11' WHERE order_number = 'LINK-240021';
UPDATE sales_orders SET order_date = '2024-06-01' WHERE order_number = 'LINK-240022';
UPDATE sales_orders SET order_date = '2024-06-11' WHERE order_number = 'LINK-240023';
UPDATE sales_orders SET order_date = '2024-06-11' WHERE order_number = 'LINK-240024';
UPDATE sales_orders SET order_date = '2024-06-12' WHERE order_number = 'LINK-240025';
UPDATE sales_orders SET order_date = '2024-06-21' WHERE order_number = 'LINK-240027';
UPDATE sales_orders SET order_date = '2024-06-21' WHERE order_number = 'LINK-240028';
UPDATE sales_orders SET order_date = '2024-06-21' WHERE order_number = 'LINK-240029';
UPDATE sales_orders SET order_date = '2024-07-25' WHERE order_number = 'LINK-240030';
UPDATE sales_orders SET order_date = '2024-07-25' WHERE order_number = 'LINK-240031';
UPDATE sales_orders SET order_date = '2024-07-29' WHERE order_number = 'LINK-240032';
UPDATE sales_orders SET order_date = '2024-07-29' WHERE order_number = 'LINK-240033';

-- Page 4: LINK-240034 to LINK-240046
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240034';
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240035';
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240036';
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240037';
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240038';
UPDATE sales_orders SET order_date = '2024-09-20' WHERE order_number = 'LINK-240039';
UPDATE sales_orders SET order_date = '2024-10-11' WHERE order_number = 'LINK-240040';
UPDATE sales_orders SET order_date = '2024-10-24' WHERE order_number = 'LINK-240043';
UPDATE sales_orders SET order_date = '2024-11-01' WHERE order_number = 'LINK-240044';
UPDATE sales_orders SET order_date = '2024-11-01' WHERE order_number = 'LINK-240045';
UPDATE sales_orders SET order_date = '2024-12-10' WHERE order_number = 'LINK-240046';

-- Note: LINK-240020 and LINK-240026 do not exist in Bubble (skipped numbers)
-- Note: LINK-240041 and LINK-240042 do not exist in Bubble (skipped numbers)
-- Note: LINK-240047 to LINK-240055 on Bubble map to F-25-xxx orders in our DB
--       which already have order_date set, so no update needed for those
