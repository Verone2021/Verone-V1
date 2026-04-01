/**
 * Server Actions: Gestion des notifications
 * - Emails destinataires (app_settings.notification_emails)
 * - Preferences utilisateur (user_notification_preferences)
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createServerClient } from '@verone/utils/supabase/server';

interface ActionResult {
  success: boolean;
  error?: string;
  emails?: string[];
}

export interface NotificationPreferences {
  notify_business: boolean;
  notify_operations: boolean;
  notify_system: boolean;
  notify_catalog: boolean;
  notify_performance: boolean;
  notify_maintenance: boolean;
  min_severity: 'info' | 'important' | 'urgent';
  email_enabled: boolean;
  email_urgent_only: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notify_business: true,
  notify_operations: true,
  notify_system: true,
  notify_catalog: true,
  notify_performance: true,
  notify_maintenance: true,
  min_severity: 'info',
  email_enabled: false,
  email_urgent_only: true,
};

interface AppSetting {
  setting_key: string;
  setting_value: {
    form_submissions?: string[];
  };
  updated_at?: string;
}

type AppSettingQueryResult = {
  data: AppSetting | null;
  error: { code?: string; message?: string } | null;
};

/**
 * Récupérer la liste des emails de notification
 */
export async function getNotificationEmails(): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();

    const { data, error } = (await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_emails')
      .single()) as AppSettingQueryResult;

    if (error) {
      // Si la clé n'existe pas encore, retourner un tableau vide
      if (error.code === 'PGRST116') {
        return { success: true, emails: [] };
      }
      throw error;
    }

    const emails = data?.setting_value?.form_submissions ?? [];

    return {
      success: true,
      emails: Array.isArray(emails) ? emails : [],
    };
  } catch (error) {
    console.error('Error getting notification emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajouter un email à la liste de notification
 */
export async function addNotificationEmail(
  email: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();

    // Récupérer la configuration actuelle
    const { data: currentData } = (await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_emails')
      .single()) as AppSettingQueryResult;

    const currentEmails = currentData?.setting_value?.form_submissions ?? [];

    // Vérifier si l'email existe déjà
    if (currentEmails.includes(email)) {
      return {
        success: false,
        error: 'Cet email est déjà dans la liste',
      };
    }

    // Ajouter le nouvel email
    const updatedEmails = [...currentEmails, email];

    // Upsert dans app_settings
    const { error: upsertError } = (await supabase.from('app_settings').upsert(
      {
        setting_key: 'notification_emails',
        setting_value: {
          form_submissions: updatedEmails,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'setting_key',
      }
    )) as { error: { message?: string } | null };

    if (upsertError) throw upsertError;

    revalidatePath('/parametres/notifications');

    return {
      success: true,
      emails: updatedEmails,
    };
  } catch (error) {
    console.error('Error adding notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprimer un email de la liste de notification
 */
export async function removeNotificationEmail(
  email: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();

    const { data: currentData } = (await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_emails')
      .single()) as AppSettingQueryResult;

    const currentEmails = currentData?.setting_value?.form_submissions ?? [];
    const updatedEmails = currentEmails.filter((e: string) => e !== email);

    const { error: updateError } = (await supabase
      .from('app_settings')
      .update({
        setting_value: { form_submissions: updatedEmails },
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', 'notification_emails')) as {
      error: { message?: string } | null;
    };

    if (updateError) throw updateError;
    revalidatePath('/parametres/notifications');

    return { success: true, emails: updatedEmails };
  } catch (error) {
    console.error('Error removing notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ============================================
// PREFERENCES UTILISATEUR
// ============================================

/**
 * Charger les preferences de notification de l'utilisateur connecte
 */
export async function getNotificationPreferences(): Promise<{
  success: boolean;
  preferences: NotificationPreferences;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        preferences: DEFAULT_PREFERENCES,
        error: 'Non authentifie',
      };
    }

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select(
        'notify_business, notify_operations, notify_system, notify_catalog, notify_performance, notify_maintenance, min_severity, email_enabled, email_urgent_only'
      )
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Pas de preferences = defaults
      if (error.code === 'PGRST116') {
        return { success: true, preferences: DEFAULT_PREFERENCES };
      }
      throw error;
    }

    return {
      success: true,
      preferences: data as NotificationPreferences,
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      success: false,
      preferences: DEFAULT_PREFERENCES,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Sauvegarder les preferences de notification de l'utilisateur connecte
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    revalidatePath('/parametres/notifications');

    return { success: true };
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
