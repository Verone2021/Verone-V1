-- Migration: Link 12 historical Qonto invoices to sales orders
-- Date: 2026-02-24
-- Context: These 12 invoices were identified by exact client+amount matching
--          during the Qonto consolidation audit. The consolidate route bug
--          (purchase_order vs purchase_order_number field) prevented automatic linking.
-- Schema notes:
--   document_direction = 'inbound' (customer invoices = inbound cash from clients)
--   document_type = 'customer_invoice'
--   partner_type = 'customer' (constraint: inbound + customer)
--   status = 'sent' (Qonto finalized → mapQontoStatusToLocal default)
--   created_by = back-office admin user

INSERT INTO financial_documents (
  document_type,
  document_direction,
  partner_id,
  partner_type,
  document_number,
  document_date,
  due_date,
  total_ht,
  total_ttc,
  tva_amount,
  amount_paid,
  status,
  workflow_status,
  sales_order_id,
  qonto_invoice_id,
  invoice_source,
  created_by
) VALUES
  (
    'customer_invoice', 'inbound',
    'd1ed3199-e47a-461a-9477-eac6df8b3d2a', 'customer',
    'F-2026-007', '2026-01-12', '2026-02-11',
    7950.00, 9540.00, 1590.00, 0, 'sent', null,
    '87fdaf89-51df-40c8-875e-90aa997217c9',
    '019c8127-217b-7199-a689-eec0d1fab428',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'd1ed3199-e47a-461a-9477-eac6df8b3d2a', 'customer',
    'F-2026-008', '2026-01-12', '2026-02-11',
    3450.00, 4140.00, 690.00, 0, 'sent', null,
    'dd8a22b8-c96b-4bc0-86ba-124ff85aa79c',
    '019c8b21-5aad-7402-a5fc-d23c86da7533',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'd1ed3199-e47a-461a-9477-eac6df8b3d2a', 'customer',
    'F-2026-009', '2026-01-12', '2026-02-11',
    10450.00, 12540.00, 2090.00, 0, 'sent', null,
    'c6809ff8-a62b-41af-ba97-b745a9522920',
    '019c8b24-0aa1-7239-8b4e-b1aae74eee1a',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'd1ed3199-e47a-461a-9477-eac6df8b3d2a', 'customer',
    'F-2026-005', '2026-01-12', '2026-02-11',
    2709.00, 3250.80, 541.80, 0, 'sent', null,
    '45e5587f-e353-4ad5-b012-88312e4be087',
    '019c8b24-ab73-762a-a874-071980cfa138',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'd1ed3199-e47a-461a-9477-eac6df8b3d2a', 'customer',
    'F-2026-006', '2026-01-12', '2026-02-11',
    6475.00, 7770.00, 1295.00, 0, 'sent', null,
    'deb4f6c3-cdb2-46d7-b0d4-9bcd2edecb43',
    '019c8b25-9581-7f0e-bb59-8c3165b5fca0',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'ede22164-0934-4a1b-aa4f-00f13f3d8c55', 'customer',
    'F-2026-010', '2026-02-02', '2026-03-04',
    128.20, 177.72, 49.52, 0, 'sent', null,
    '890508d4-dbb1-4329-967f-6e42a62a6206',
    '019c8b32-54cd-7a8d-88b6-1c211a0ce97c',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'e5bd238f-2b05-4305-8297-7bd76eb73d8f', 'customer',
    'F-2026-011', '2026-02-02', '2026-03-04',
    74.10, 112.80, 38.70, 0, 'sent', null,
    '38e0b418-77e6-4cff-aa84-c81ced45c7a7',
    '019c8b35-af35-7758-a2fa-1b3d2335cf8b',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    'b0861ebf-b9d3-4905-8c44-c3aa586cf232', 'customer',
    'F-2026-012', '2026-02-09', '2026-03-11',
    285.24, 389.09, 103.85, 0, 'sent', null,
    '6fbb66c3-4059-473b-938e-fce652fceff6',
    '019c8b36-844a-77ab-b906-1ae54c37c568',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    '5a508412-4c0b-4d79-a425-61457507b659', 'customer',
    'F-2026-013', '2026-02-09', '2026-03-11',
    587.52, 751.82, 164.30, 0, 'sent', null,
    '57126488-1df6-4e8f-8eb9-3db65b0b5c79',
    '019c8b37-6dba-7b1a-9f9f-bd3ae4055072',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    '245efa11-855a-44ae-9269-320ce5dc0253', 'customer',
    'F-2026-014', '2026-02-09', '2026-03-11',
    794.00, 1011.60, 217.60, 0, 'sent', null,
    'd63a88d7-713a-4a10-aafe-fbfcdb7306ed',
    '019c8b38-3800-7600-bcbb-1c41a83a1067',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    '25963447-210e-47c3-bda9-9897eb05eaa3', 'customer',
    'F-2026-015', '2026-02-09', '2026-03-11',
    326.40, 450.48, 124.08, 0, 'sent', null,
    '52026452-ecf2-4393-b9b2-4805a980922b',
    '019c8b39-d2bc-7f00-a219-6eaf3916931b',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  ),
  (
    'customer_invoice', 'inbound',
    '9f7b194e-4155-47b2-83cd-7cd7fc8084b8', 'customer',
    'F-2026-016', '2026-02-09', '2026-03-25',
    870.40, 1103.28, 232.88, 0, 'sent', null,
    'e15684db-febb-433e-8667-d7e08571d60b',
    '019c8b39-8365-7e4d-8aaf-5f85ff5015b7',
    'qonto_existing', '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0'
  );
