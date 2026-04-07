export interface PendingChange {
  catalogProductId: string;
  field: string;
  originalValue: number | null;
  newValue: number | null;
}
