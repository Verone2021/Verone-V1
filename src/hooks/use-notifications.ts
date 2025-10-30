/**
 * Hook Notifications - Système ERP/CRM Intelligent
 * Gestion complète des notifications utilisateur selon best practices
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types selon architecture recommandée
export interface Notification {
  id: string;
  type: 'system' | 'business' | 'catalog' | 'operations' | 'performance' | 'maintenance';
  severity: 'urgent' | 'important' | 'info';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  user_id: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour création de notifications
export interface CreateNotificationData {
  type: Notification['type'];
  severity: Notification['severity'];
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  user_id?: string; // Optionnel, utilisera l'utilisateur courant par défaut
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null
  });

  const supabase = createClient();

  // Charger les notifications de l'utilisateur courant
  const loadNotifications = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false, notifications: [], unreadCount: 0 }));
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limiter à 50 notifications récentes

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.read).length;

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        loading: false
      }) as any);

    } catch (error) {
      // En développement, ignorer les erreurs si la table n'existe pas encore
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      if (errorMessage.includes('relation "notifications" does not exist') ||
          errorMessage.includes('Failed to fetch')) {
        // Table pas encore créée - état silencieux
        setState(prev => ({
          ...prev,
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null
        }));
      } else {
        console.error('Erreur chargement notifications:', error);
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      }
    }
  }, [supabase]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Mise à jour optimiste du state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

    } catch (error) {
      console.error('Erreur marquage notification:', error);
      throw error;
    }
  }, [supabase]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Mise à jour optimiste du state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));

    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      throw error;
    }
  }, [supabase]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Mise à jour optimiste du state
      setState(prev => {
        const deletedNotification = prev.notifications.find(n => n.id === notificationId);
        const wasUnread = deletedNotification && !deletedNotification.read;

        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
        };
      });

    } catch (error) {
      console.error('Erreur suppression notification:', error);
      throw error;
    }
  }, [supabase]);

  // Créer une nouvelle notification (pour admin/système)
  const createNotification = useCallback(async (data: CreateNotificationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const notificationData = {
        ...data,
        user_id: data.user_id || user.id
      };

      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;

      // Si la notification est pour l'utilisateur courant, l'ajouter au state
      if (newNotification.user_id === user.id) {
        setState(prev => ({
          ...prev,
          notifications: [newNotification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1
        }) as any);
      }

      return newNotification;

    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }, [supabase]);

  // Helpers pour filtrer par type/severity
  const getByType = useCallback((type: Notification['type']) =>
    state.notifications.filter(n => n.type === type), [state.notifications]);

  const getBySeverity = useCallback((severity: Notification['severity']) =>
    state.notifications.filter(n => n.severity === severity), [state.notifications]);

  const getUnread = useCallback(() =>
    state.notifications.filter(n => !n.read), [state.notifications]);

  // Chargement initial et écoute des changements
  useEffect(() => {
    loadNotifications();

    // Écouter les changements en temps réel avec gestion optimiste
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        // Ajouter la nouvelle notification sans recharger
        const newNotification = payload.new as Notification;
        setState(prev => ({
          ...prev,
          notifications: [newNotification, ...prev.notifications],
          unreadCount: newNotification.read ? prev.unreadCount : prev.unreadCount + 1
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        // Mettre à jour la notification sans recharger
        const updatedNotification = payload.new as Notification;
        setState(prev => {
          const oldNotification = prev.notifications.find(n => n.id === updatedNotification.id);
          const unreadDelta = oldNotification && !oldNotification.read && updatedNotification.read ? -1 : 0;

          return {
            ...prev,
            notifications: prev.notifications.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: Math.max(0, prev.unreadCount + unreadDelta)
          };
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        // Supprimer la notification sans recharger
        const deletedId = payload.old.id as string;
        setState(prev => {
          const deletedNotification = prev.notifications.find(n => n.id === deletedId);
          const wasUnread = deletedNotification && !deletedNotification.read;

          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== deletedId),
            unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase]);

  return {
    // État
    ...state,

    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,

    // Helpers
    getByType,
    getBySeverity,
    getUnread,

    // Stats utiles
    stats: {
      total: state.notifications.length,
      unread: state.unreadCount,
      urgent: state.notifications.filter(n => n.severity === 'urgent').length,
      important: state.notifications.filter(n => n.severity === 'important').length,
      byType: {
        system: state.notifications.filter(n => n.type === 'system').length,
        business: state.notifications.filter(n => n.type === 'business').length,
        catalog: state.notifications.filter(n => n.type === 'catalog').length,
        operations: state.notifications.filter(n => n.type === 'operations').length,
        performance: state.notifications.filter(n => n.type === 'performance').length,
        maintenance: state.notifications.filter(n => n.type === 'maintenance').length,
      }
    }
  };
};

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

  stockCritical: (productName: string, stock: number, minStock: number): CreateNotificationData => ({
    type: 'business',
    severity: 'urgent',
    title: 'Stock critique',
    message: `Stock epuise : ${productName} (${stock} unites restantes, seuil min: ${minStock})`,
    action_url: '/stocks/inventaire',
    action_label: 'Reapprovisionner',
  }),

  stockNegativeForecast: (productName: string, forecast: number): CreateNotificationData => ({
    type: 'business',
    severity: 'urgent',
    title: 'Stock previsionnel negatif',
    message: `Le stock previsionnel de ${productName} sera negatif (${forecast} unites)`,
    action_url: '/stocks/inventaire',
    action_label: 'Voir Details',
  }),

  poDelayed: (poNumber: string, daysLate: number): CreateNotificationData => ({
    type: 'operations',
    severity: 'urgent',
    title: 'Commande fournisseur en retard',
    message: `La commande fournisseur ${poNumber} est en retard de ${daysLate} jour(s)`,
    action_url: '/commandes/fournisseurs',
    action_label: 'Contacter Fournisseur',
  }),

  // ========================================
  // NIVEAU 2 - IMPORTANT
  // ========================================

  orderConfirmed: (orderNumber: string): CreateNotificationData => ({
    type: 'business',
    severity: 'important',
    title: 'Commande validee',
    message: `La commande ${orderNumber} a ete validee avec succes`,
    action_url: '/commandes/clients',
    action_label: 'Voir Details',
  }),

  orderPaid: (orderNumber: string, amount: number): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Paiement recu',
    message: `Paiement de ${amount.toFixed(2)} EUR recu pour la commande ${orderNumber}`,
    action_url: '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  orderCancelled: (orderNumber: string): CreateNotificationData => ({
    type: 'business',
    severity: 'important',
    title: 'Commande annulee',
    message: `La commande ${orderNumber} a ete annulee`,
    action_url: '/commandes/clients',
    action_label: 'Voir Details',
  }),

  poConfirmed: (poNumber: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Commande fournisseur confirmee',
    message: `La commande fournisseur ${poNumber} a ete confirmee par le fournisseur`,
    action_url: '/commandes/fournisseurs',
    action_label: 'Voir Details',
  }),

  poReceived: (poNumber: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'important',
    title: 'Reception complete',
    message: `La commande fournisseur ${poNumber} a ete recue integralement`,
    action_url: '/commandes/fournisseurs',
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

  orderShipped: (orderNumber: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Commande expediee',
    message: `La commande ${orderNumber} a ete expediee avec succes`,
    action_url: '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  orderDelivered: (orderNumber: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Commande livree',
    message: `La commande ${orderNumber} a ete livree au client`,
    action_url: '/commandes/clients',
    action_label: 'Voir Commande',
  }),

  poCreated: (poNumber: string, supplierName: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Commande fournisseur creee',
    message: `Nouvelle commande fournisseur ${poNumber} creee pour ${supplierName}`,
    action_url: '/commandes/fournisseurs',
    action_label: 'Voir Commande',
  }),

  poPartialReceived: (poNumber: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Reception partielle',
    message: `Reception partielle pour la commande fournisseur ${poNumber}`,
    action_url: '/commandes/fournisseurs',
    action_label: 'Voir Reception',
  }),

  stockReplenished: (productName: string, quantityAdded: number): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Reapprovisionnement effectue',
    message: `Le produit ${productName} a ete reapprovisionne (+${quantityAdded} unites)`,
    action_url: '/stocks/inventaire',
    action_label: 'Voir Stock',
  }),

  productOutOfStock: (productName: string): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Produit epuise',
    message: `Le produit ${productName} est completement epuise`,
    action_url: '/catalogue',
    action_label: 'Voir Produit',
  }),

  productVariantMissing: (productName: string): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Variantes manquantes',
    message: `Le produit ${productName} a des variantes manquantes`,
    action_url: '/catalogue',
    action_label: 'Completer Variantes',
  }),

  collectionPublished: (collectionName: string): CreateNotificationData => ({
    type: 'catalog',
    severity: 'info',
    title: 'Collection publiee',
    message: `La collection ${collectionName} a ete publiee avec succes`,
    action_url: '/catalogue/collections',
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

  paymentReceived: (amount: number, source: string): CreateNotificationData => ({
    type: 'operations',
    severity: 'info',
    title: 'Paiement recu',
    message: `Paiement de ${amount.toFixed(2)} EUR recu via ${source}`,
    action_url: '/finance/payments',
    action_label: 'Voir Details',
  }),
};

export default useNotifications;