/**
 * Hook React: Gestion Listes de Prix (CRUD Complet)
 *
 * Gestion administrative des listes de prix avec:
 * - CRUD listes de prix (base, channel, customer_group, promotional, contract)
 * - CRUD items de prix avec paliers quantités
 * - Assignment listes aux clients/canaux
 * - Historique modifications
 * - Validation règles métier
 */

export type {
  CreatePriceListData,
  CreatePriceListItemData,
  PriceList,
  PriceListItem,
  PriceListType,
  UpdatePriceListData,
  UpdatePriceListItemData,
} from './use-price-lists.types';

export {
  useDeletePriceListItem,
  useCreatePriceListItem,
  useUpdatePriceListItem,
} from './use-price-list-item.mutations';

export {
  useCreatePriceList,
  useDeletePriceList,
  useUpdatePriceList,
} from './use-price-list.mutations';

export {
  usePriceList,
  usePriceListItems,
  usePriceLists,
} from './use-price-lists.queries';
