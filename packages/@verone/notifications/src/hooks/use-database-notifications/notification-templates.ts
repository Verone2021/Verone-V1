import type { CreateNotificationData } from './types';

// Fonctions utilitaires pour créer des notifications type ERP/CRM
export const NotificationTemplates = {
  // ========================================
  // NIVEAU 1 - URGENT
  // ========================================

  systemError: (message: string): CreateNotificationData => ({
    type: 'system',
    severity: 'urgent',
    title: 'Erreur systeme critique',
    message,
    action_label: 'Diagnostiquer',
  }),

  stockCritical: (
    productName: string,
    stock: number,
    minStock: number,
    productId?: string,
    category?: string,
    supplier?: string
  ): CreateNotificationData => {
    const categoryInfo = category ? ` (${category})` : '';
    const supplierInfo = supplier ? ` - ${supplier}` : '';
    const message = `${productName}${categoryInfo} - ${stock} unité${stock > 1 ? 's' : ''}${supplierInfo}`;

    return {
      type: 'business',
      severity: 'urgent',
      title: 'Stock critique',
      message,
      action_url: productId
        ? `/stocks/inventaire?id=${productId}`
        : '/stocks/inventaire',
      action_label: 'Réapprovisionner',
    };
  },

  stockNegativeForecast: (
    productName: string,
    forecast: number,
    productId?: string
  ): CreateNotificationData => ({
    type: 'business',
    severity: 'urgent',
    title: 'Stock previsionnel negatif',
    message: `Le stock previsionnel de ${productName} sera negatif (${forecast} unites)`,
    action_url: productId
      ? `/stocks/inventaire?id=${productId}`
      : '/stocks/inventaire',
    action_label: 'Voir Details',
  }),

  poDelayed: (
    poNumber: string,
    daysLate: number,
    orderId?: string,
    supplierName?: string,
    city?: string,
    country?: string,
    product?: string
  ): CreateNotificationData => {
    let message = poNumber;

    if (supplierName) {
      message += ` - ${supplierName}`;
      if (city && country) {
        message += ` (${city}, ${country})`;
      }
    }

    if (product) {
      message += ` - ${product}`;
    }

    message += ` - ${daysLate}j de retard`;

    return {
      type: 'operations',
      severity: 'urgent',
      title: 'Commande fournisseur en retard',
      message,
      action_url: orderId
        ? `/commandes/fournisseurs?id=${orderId}`
        : '/commandes/fournisseurs',
      action_label: 'Contacter Fournisseur',
    };
  },

  // ========================================
  // NIVEAU 2 - IMPORTANT
  // ========================================

  orderConfirmed: (
    orderNumber: string,
    orderId?: string,
    customerName?: string,
    city?: string,
    country?: string,
    product?: string,
    daysWaiting?: number
  ): CreateNotificationData => {
    let message = orderNumber;

    if (customerName) {
      message += ` - ${customerName}`;
      if (city && country) {
        message += ` (${city}, ${country})`;
      }
    }

    if (product) {
      message += ` - ${product}`;
    }

    if (daysWaiting !== undefined) {
      message += ` - ${daysWaiting}j d'attente`;
    }

    return {
      type: 'business',
      severity: 'important',
      title: 'Commande validee',
      message,
      action_url: orderId
        ? `/commandes/clients?id=${orderId}`
        : '/commandes/clients',
      action_label: 'Voir Details',
    };
  },

  orderPaid: (
    orderNumber: string,
    amount: number,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Paiement recu',
    message: `Paiement de ${amount.toFixed(2)} EUR recu pour la commande ${orderNumber}`,
    action_url: orderId
      ? `/commandes/clients?id=${orderId}`
      : '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  orderCancelled: (
    orderNumber: string,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'business',
    severity: 'important',
    title: 'Commande annulee',
    message: `La commande ${orderNumber} a ete annulee`,
    action_url: orderId
      ? `/commandes/clients?id=${orderId}`
      : '/commandes/clients',
    action_label: 'Voir Details',
  }),

  poConfirmed: (
    poNumber: string,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Commande fournisseur confirmee',
    message: `La commande fournisseur ${poNumber} a ete confirmee par le fournisseur`,
    action_url: orderId
      ? `/commandes/fournisseurs?id=${orderId}`
      : '/commandes/fournisseurs',
    action_label: 'Voir Details',
  }),

  poReceived: (poNumber: string, orderId?: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Reception complete',
    message: `La commande fournisseur ${poNumber} a ete recue integralement`,
    action_url: orderId
      ? `/commandes/fournisseurs?id=${orderId}`
      : '/commandes/fournisseurs',
    action_label: 'Voir Reception',
  }),

  productIncomplete: (count: number): CreateNotificationData => ({
    type: 'catalog',
    severity: 'important',
    title: 'Catalogue incomplet',
    message: `${count} produits sans images ou prix d'achat`,
    action_url: '/catalogue',
    action_label: 'Completer',
  }),

  invoiceOverdue: (count: number, amount: number): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Factures impayees',
    message: `${count} factures impayees (${amount.toFixed(2)} EUR)`,
    action_url: '/finance/invoices',
    action_label: 'Gerer',
  }),

  // ========================================
  // NIVEAU 3 - INFORMATIF
  // ========================================

  orderShipped: (
    orderNumber: string,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Commande expediee',
    message: `La commande ${orderNumber} a ete expediee avec succes`,
    action_url: orderId
      ? `/commandes/clients?id=${orderId}`
      : '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  orderDelivered: (
    orderNumber: string,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Commande livree',
    message: `La commande ${orderNumber} a ete livree au client`,
    action_url: orderId
      ? `/commandes/clients?id=${orderId}`
      : '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  poCreated: (
    poNumber: string,
    supplierName: string,
    orderId?: string,
    city?: string,
    country?: string,
    product?: string,
    amount?: number
  ): CreateNotificationData => {
    let message = `${poNumber} - ${supplierName}`;

    if (city && country) {
      message += ` (${city}, ${country})`;
    }

    if (product) {
      message += ` - ${product}`;
    }

    if (amount !== undefined) {
      message += ` - ${amount.toFixed(2)} EUR`;
    }

    return {
      type: 'operations',
      severity: 'info',
      title: 'Commande fournisseur creee',
      message,
      action_url: orderId
        ? `/commandes/fournisseurs?id=${orderId}`
        : '/commandes/fournisseurs',
      action_label: 'Voir Commande',
    };
  },

  poPartialReceived: (
    poNumber: string,
    orderId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Reception partielle',
    message: `Reception partielle pour la commande fournisseur ${poNumber}`,
    action_url: orderId
      ? `/commandes/fournisseurs?id=${orderId}`
      : '/commandes/fournisseurs',
    action_label: 'Voir Reception',
  }),

  stockReplenished: (
    productName: string,
    quantityAdded: number,
    productId?: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Reapprovisionnement effectue',
    message: `Le produit ${productName} a ete reapprovisionne (+${quantityAdded} unites)`,
    action_url: productId
      ? `/stocks/inventaire?id=${productId}`
      : '/stocks/inventaire',
    action_label: 'Voir Stock',
  }),

  productOutOfStock: (
    productName: string,
    productId?: string
  ): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Produit epuise',
    message: `Le produit ${productName} est completement epuise`,
    action_url: productId
      ? `/produits/catalogue?id=${productId}`
      : '/produits/catalogue',
    action_label: 'Voir Produit',
  }),

  productVariantMissing: (
    productName: string,
    productId?: string
  ): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Variantes manquantes',
    message: `Le produit ${productName} a des variantes manquantes`,
    action_url: productId
      ? `/produits/catalogue?id=${productId}`
      : '/produits/catalogue',
    action_label: 'Completer Variantes',
  }),

  collectionPublished: (
    collectionName: string,
    collectionId?: string
  ): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Collection publiee',
    message: `La collection ${collectionName} a ete publiee avec succes`,
    action_url: collectionId
      ? `/produits/catalogue/collections?id=${collectionId}`
      : '/produits/catalogue/collections',
    action_label: 'Voir Collection',
  }),

  dailySummary: (orders: number, revenue: number): CreateNotificationData => ({
    type: 'performance',
    severity: 'info',
    title: 'Resume quotidien',
    message: `${orders} nouvelles commandes (${revenue.toFixed(2)} EUR)`,
    action_url: '/dashboard',
    action_label: 'Voir Dashboard',
  }),

  backupComplete: (): CreateNotificationData => ({
    type: 'maintenance',
    severity: 'info',
    title: 'Sauvegarde terminee',
    message: 'Sauvegarde quotidienne terminee avec succes',
  }),

  paymentReceived: (
    amount: number,
    source: string
  ): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Paiement recu',
    message: `Paiement de ${amount.toFixed(2)} EUR recu via ${source}`,
    action_url: '/finance/payments',
    action_label: 'Voir Details',
  }),

  // ========================================
  // NOUVEAUX TEMPLATES - ORGANISATIONS
  // ========================================

  customerOrgCreated: (
    orgName: string,
    city?: string,
    country?: string
  ): CreateNotificationData => {
    let message = orgName;

    if (city && country) {
      message += ` - ${city}, ${country}`;
    }

    return {
      type: 'business',
      severity: 'info',
      title: 'Nouveau client B2B',
      message,
      action_url: '/contacts-organisations',
      action_label: 'Voir Fiche',
    };
  },

  customerIndCreated: (
    firstName: string,
    lastName: string,
    city?: string,
    country?: string
  ): CreateNotificationData => {
    let message = `${firstName} ${lastName}`;

    if (city && country) {
      message += ` - ${city}, ${country}`;
    }

    return {
      type: 'business',
      severity: 'info',
      title: 'Nouveau client B2C',
      message,
      action_url: '/contacts-organisations',
      action_label: 'Voir Fiche',
    };
  },

  supplierCreated: (
    supplierName: string,
    city?: string,
    country?: string
  ): CreateNotificationData => {
    let message = supplierName;

    if (city && country) {
      message += ` - ${city}, ${country}`;
    }

    return {
      type: 'business',
      severity: 'info',
      title: 'Nouveau fournisseur',
      message,
      action_url: '/contacts-organisations',
      action_label: 'Voir Fiche',
    };
  },

  // ========================================
  // NOUVEAUX TEMPLATES - ÉCHANTILLONS
  // ========================================

  sampleUrgent: (
    sampleNumber: string,
    supplierName: string,
    daysWaiting: number,
    city?: string,
    country?: string,
    product?: string
  ): CreateNotificationData => {
    let message = `${sampleNumber} - ${supplierName}`;

    if (city && country) {
      message += ` (${city}, ${country})`;
    }

    if (product) {
      message += ` - ${product}`;
    }

    message += ` - ${daysWaiting}j d'attente`;

    return {
      type: 'operations',
      severity: 'urgent',
      title: 'Échantillon urgent',
      message,
      action_url: '/produits/sourcing/echantillons',
      action_label: 'Voir Échantillon',
    };
  },

  sampleDelivered: (
    sampleNumber: string,
    supplierName: string,
    city?: string,
    country?: string,
    product?: string
  ): CreateNotificationData => {
    let message = `${sampleNumber} - ${supplierName}`;

    if (city && country) {
      message += ` (${city}, ${country})`;
    }

    if (product) {
      message += ` - ${product}`;
    }

    message += ' - Livré';

    return {
      type: 'operations',
      severity: 'info',
      title: 'Échantillon livré',
      message,
      action_url: '/produits/sourcing/echantillons',
      action_label: 'Voir Échantillon',
    };
  },
};
