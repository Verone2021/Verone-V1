/**
 * Re-export SupplierSelector depuis business components
 */
// FIXME: SupplierSelector component can't be imported from apps/back-office in package
// export { SupplierSelector } from '@/components/business/supplier-selector';

// Placeholder component temporaire
export function SupplierSelector({ value, onChange, ...props }: any) {
  return (
    <div className="p-2 border rounded bg-gray-50">
      <p className="text-sm text-gray-600">
        SupplierSelector (temporairement désactivé)
      </p>
    </div>
  );
}
