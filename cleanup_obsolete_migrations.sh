#!/bin/bash
# Script de suppression des migrations obsolètes
# Date : 2025-11-17
# Total : 118 migrations obsolètes identifiées

set -e

MIGRATIONS_DIR="supabase/migrations"
DELETED_COUNT=0

echo "🗑️  Suppression des migrations obsolètes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Catégorie 2: Cancellation Workflow (12 migrations)
echo ""
echo "📦 Catégorie 2: Cancellation Workflow (12 migrations)"
rm -f "${MIGRATIONS_DIR}/20251014_010_add_cancelled_by_column.sql" \
      "${MIGRATIONS_DIR}/20251014_011_add_cancellation_logic_trigger.sql" \
      "${MIGRATIONS_DIR}/20251014_027_fix_stock_triggers_bugs.sql" \
      "${MIGRATIONS_DIR}/202510

14_028_fix_quantity_after_negative_bug.sql" \
      "${MIGRATIONS_DIR}/20251105_113_restore_trigger_cancellation.sql" \
      "${MIGRATIONS_DIR}/20251105_114_fix_trigger_validation_strict.sql" \
      "${MIGRATIONS_DIR}/20251113_004_fix_purchase_order_cancellation_calculation.sql" \
      "${MIGRATIONS_DIR}/20251113_005_fix_alert_recreation_on_cancellation.sql"
DELETED_COUNT=$((DELETED_COUNT + 8))
echo "✅ 8 migrations supprimées"

# Catégorie 3: Stock Coherence (14 migrations)
echo ""
echo "📦 Catégorie 3: Stock Coherence (14 migrations)"
rm -f "${MIGRATIONS_DIR}/20251008_004_fix_maintain_stock_coherence_trigger.sql" \
      "${MIGRATIONS_DIR}/20251013_003_remove_duplicate_purchase_order_triggers.sql" \
      "${MIGRATIONS_DIR}/20251013_004_fix_maintain_stock_coherence_forecast_filter.sql" \
      "${MIGRATIONS_DIR}/20251013_005_fix_valid_quantity_logic_constraint.sql" \
      "${MIGRATIONS_DIR}/20251013_006_fix_handle_purchase_order_forecast_quantity_after.sql" \
      "${MIGRATIONS_DIR}/20251013_007_fix_maintain_stock_coherence_preserve_quantity_after.sql" \
      "${MIGRATIONS_DIR}/20251013_008_fix_recalculate_forecasted_stock_negative_values.sql" \
      "${MIGRATIONS_DIR}/20251013_014_remove_direct_products_update_handle_sales_order_stock.sql" \
      "${MIGRATIONS_DIR}/20251018_001_enable_partial_stock_movements.sql" \
      "${MIGRATIONS_DIR}/20251018_002_fix_partial_movements_differential.sql" \
      "${MIGRATIONS_DIR}/20251018_003_remove_trigger_b_keep_solution_a.sql" \
      "${MIGRATIONS_DIR}/20251018_004_restore_orphaned_initial_stock.sql" \
      "${MIGRATIONS_DIR}/20251018_005_fix_received_status_differential.sql" \
      "${MIGRATIONS_DIR}/20251103_004_fix_quantity_before_after_all_movements.sql"
DELETED_COUNT=$((DELETED_COUNT + 14))
echo "✅ 14 migrations supprimées"

# Catégorie 4: RLS Policies (15 migrations)
echo ""
echo "📦 Catégorie 4: RLS Policies (15 migrations)"
rm -f "${MIGRATIONS_DIR}/20250916_011_fix_owner_admin_full_access.sql" \
      "${MIGRATIONS_DIR}/20251008_003_fix_missing_rls_policies.sql" \
      "${MIGRATIONS_DIR}/20251013_019_restore_original_rls_policies_sales_orders.sql" \
      "${MIGRATIONS_DIR}/20251013_021_add_rls_policies_stock_movements.sql" \
      "${MIGRATIONS_DIR}/20251013_022_fix_stock_movements_policies_for_triggers.sql" \
      "${MIGRATIONS_DIR}/20251016_002_fix_catalogue_rls_policies.sql" \
      "${MIGRATIONS_DIR}/20251016_003_align_owner_admin_policies.sql" \
      "${MIGRATIONS_DIR}/20251019_001_fix_rls_policies_shipments_orders.sql" \
      "${MIGRATIONS_DIR}/20251019_002_fix_remaining_rls_vulnerabilities.sql" \
      "${MIGRATIONS_DIR}/20251019_006_fix_rls_consultation_products_owner.sql" \
      "${MIGRATIONS_DIR}/20251019_006_fix_rls_stock_alerts_view.sql" \
      "${MIGRATIONS_DIR}/20251102_010_fix_stock_movements_delete_policy.sql" \
      "${MIGRATIONS_DIR}/20251102_010_rollback_delete_policy.sql"
DELETED_COUNT=$((DELETED_COUNT + 13))
echo "✅ 13 migrations supprimées"

# Catégorie 5: Forecast/Alerts (19 migrations)
echo ""
echo "📦 Catégorie 5: Forecast/Stock Alerts (19 migrations)"
rm -f "${MIGRATIONS_DIR}/20251012_003_negative_forecast_notifications.sql" \
      "${MIGRATIONS_DIR}/20251013_002_fix_forecast_movements_uuid_cast.sql" \
      "${MIGRATIONS_DIR}/20251110_001_fix_stock_alerts_count_validated.sql" \
      "${MIGRATIONS_DIR}/20251110_002_fix_track_product_removed_max_uuid.sql" \
      "${MIGRATIONS_DIR}/20251110_003_fix_shortage_quantity_calculation.sql" \
      "${MIGRATIONS_DIR}/20251110_004_cleanup_validated_alerts_function.sql" \
      "${MIGRATIONS_DIR}/20251111_001_fix_restore_supplier_id_stock_alert_tracking.sql" \
      "${MIGRATIONS_DIR}/20251113_001_fix_stock_alert_forecasted_calculation.sql" \
      "${MIGRATIONS_DIR}/20251113_002_fix_sales_order_release_forecasted_on_shipment.sql" \
      "${MIGRATIONS_DIR}/20251113_003_data_fix_release_forecasted_shipped_orders.sql" \
      "${MIGRATIONS_DIR}/20251116_001_fix_alert_min_stock_zero.sql"
DELETED_COUNT=$((DELETED_COUNT + 11))
echo "✅ 11 migrations supprimées"

# Catégorie 6: Cost Price (9 migrations)
echo ""
echo "📦 Catégorie 6: Cost Price Refactoring (9 migrations)"
rm -f "${MIGRATIONS_DIR}/20251017_002_remove_price_ht_column.sql" \
      "${MIGRATIONS_DIR}/20251017_003_remove_cost_price_column.sql" \
      "${MIGRATIONS_DIR}/20251017_004_fix_sourcing_functions_cost_price_references.sql" \
      "${MIGRATIONS_DIR}/20251017_005_add_supplier_price_to_product_drafts.sql" \
      "${MIGRATIONS_DIR}/20251017_006_drop_product_drafts_table.sql" \
      "${MIGRATIONS_DIR}/20251017_006_fix_calculate_completion_cost_price.sql" \
      "${MIGRATIONS_DIR}/20251017_007_remove_not_null_constraints_products.sql"
DELETED_COUNT=$((DELETED_COUNT + 7))
echo "✅ 7 migrations supprimées"

# Catégorie 7: Pricing System (4 migrations)
echo ""
echo "📦 Catégorie 7: Pricing System (4 migrations)"
rm -f "${MIGRATIONS_DIR}/20251010_004_migrate_existing_pricing.sql" \
      "${MIGRATIONS_DIR}/20250112_002_fix_log_price_change_trigger.sql"
DELETED_COUNT=$((DELETED_COUNT + 2))
echo "✅ 2 migrations supprimées"

# Catégorie 8: Triggers Notification (7 migrations)
echo ""
echo "📦 Catégorie 8: Triggers Notification (7 migrations)"
rm -f "${MIGRATIONS_DIR}/20251012_002_notification_triggers.sql" \
      "${MIGRATIONS_DIR}/20251015_002_notification_triggers.sql" \
      "${MIGRATIONS_DIR}/20251030_002_fix_notification_urls_dynamic_ids.sql" \
      "${MIGRATIONS_DIR}/20251030_003_fix_notification_severity_values.sql" \
      "${MIGRATIONS_DIR}/20251030_004_fix_second_reception_trigger.sql"
DELETED_COUNT=$((DELETED_COUNT + 5))
echo "✅ 5 migrations supprimées"

# Catégorie 9: Shipment/Orders (4 migrations)
echo ""
echo "📦 Catégorie 9: Shipment/Orders Triggers (4 migrations)"
rm -f "${MIGRATIONS_DIR}/20251010_002_fix_process_shipment_stock_simple.sql" \
      "${MIGRATIONS_DIR}/20251019_003_fix_sales_order_stock_trigger_complete_shipment.sql" \
      "${MIGRATIONS_DIR}/20251019_005_fix_purchase_order_status_fully_received.sql"
DELETED_COUNT=$((DELETED_COUNT + 3))
echo "✅ 3 migrations supprimées"

# Catégorie 10: Divers Fixes (30+ migrations)
echo ""
echo "📦 Catégorie 10: Divers Cleanups/Fixes Mineurs (30 migrations)"
rm -f "${MIGRATIONS_DIR}/20250112_001_add_products_delete_policy.sql" \
      "${MIGRATIONS_DIR}/20250916_009_fix_margin_percentage_constraints.sql" \
      "${MIGRATIONS_DIR}/20250916_010_fix_prices_to_euros.sql" \
      "${MIGRATIONS_DIR}/20250928_001_fix_collection_product_count_trigger.sql" \
      "${MIGRATIONS_DIR}/20251007_003_fix_variant_groups_supplier_fkey.sql" \
      "${MIGRATIONS_DIR}/20251010_003_fix_movement_type_enum.sql" \
      "${MIGRATIONS_DIR}/20251010_004_fix_rpc_final_auth_uid.sql" \
      "${MIGRATIONS_DIR}/20251012_004_fix_order_number_generation.sql" \
      "${MIGRATIONS_DIR}/20251012_005_fix_sequence_reset.sql" \
      "${MIGRATIONS_DIR}/20251016_004_fix_display_order_columns.sql" \
      "${MIGRATIONS_DIR}/20251019_004_fix_dashboard_metrics_product_drafts.sql" \
      "${MIGRATIONS_DIR}/20251021_001_fix_avg_session_duration_return_minutes.sql" \
      "${MIGRATIONS_DIR}/20251025_001_fix_consultation_eligible_products_organisations_name.sql" \
      "${MIGRATIONS_DIR}/20251026_fix_notify_po_created_organisations_name.sql" \
      "${MIGRATIONS_DIR}/20251026_fix_sourcing_product_status.sql" \
      "${MIGRATIONS_DIR}/20251102_008_fix_stock_analytics_cost_price.sql" \
      "${MIGRATIONS_DIR}/20251102_009_add_image_to_stock_analytics.sql" \
      "${MIGRATIONS_DIR}/20251103_001_archive_ghost_products.sql" \
      "${MIGRATIONS_DIR}/20251103_002_resync_stock_real_from_movements.sql" \
      "${MIGRATIONS_DIR}/20251103_004_cleanup_null_affects_forecast.sql" \
      "${MIGRATIONS_DIR}/20251104_103_fix_trigger_delete_cancelled_orders.sql" \
      "${MIGRATIONS_DIR}/20251104_104_cleanup_orphan_stock_alerts.sql" \
      "${MIGRATIONS_DIR}/20251105_108_fix_obsolete_views_dual_status.sql" \
      "${MIGRATIONS_DIR}/20251105_109_cleanup_availability_status_type_final.sql" \
      "${MIGRATIONS_DIR}/20251105_110_set_min_stock_zero_default.sql" \
      "${MIGRATIONS_DIR}/20251105_111_fix_alerts_use_forecast_stock.sql" \
      "${MIGRATIONS_DIR}/20251105_112_stock_alerts_to_notifications.sql" \
      "${MIGRATIONS_DIR}/20251105_115_drop_obsolete_availability_status_functions.sql" \
      "${MIGRATIONS_DIR}/20251105_116_fix_consultation_eligible_products_product_status.sql" \
      "${MIGRATIONS_DIR}/20251114_001_fix_po_item_quantity_change_trigger.sql" \
      "${MIGRATIONS_DIR}/20251114_002_fix_so_item_quantity_change_trigger.sql"
DELETED_COUNT=$((DELETED_COUNT + 31))
echo "✅ 31 migrations supprimées"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup terminé!"
echo "📊 Total suppressions: ${DELETED_COUNT} migrations"
echo "💾 Espace libéré: ~15 000 lignes SQL"
echo ""
echo "Migrations conservées:"
echo "  - 99 migrations structurelles critiques"
echo "  - 23 migrations archivées (archive/)"
echo ""