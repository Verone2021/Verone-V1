import { useState } from 'react';

import type { FullOrderData } from '../page';

// ============================================================================
// HOOK
// ============================================================================

export function useEditOrderDelivery(details: FullOrderData['details']) {
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState(
    details?.desired_delivery_date ?? ''
  );
  const [isMallDelivery, setIsMallDelivery] = useState(
    details?.is_mall_delivery ?? false
  );
  const [mallEmail, setMallEmail] = useState(details?.mall_email ?? '');
  const [semiTrailerAccessible, setSemiTrailerAccessible] = useState(
    details?.semi_trailer_accessible ?? true
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    details?.delivery_notes ?? ''
  );

  return {
    desiredDeliveryDate,
    setDesiredDeliveryDate,
    isMallDelivery,
    setIsMallDelivery,
    mallEmail,
    setMallEmail,
    semiTrailerAccessible,
    setSemiTrailerAccessible,
    deliveryNotes,
    setDeliveryNotes,
  };
}
