/**
 * Server Actions: Gestion des emails de notification
 * CRUD pour app_settings.notification_emails
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@verone/utils/supabase/server';

interface ActionResult {
  success: boolean;
  error?: string;
  emails?: string[];
}

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
    const supabase = createClient();

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
    const supabase = createClient();

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
    const supabase = createClient();

    // Récupérer la configuration actuelle
    const { data: currentData } = (await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_emails')
      .single()) as AppSettingQueryResult;

    const currentEmails = currentData?.setting_value?.form_submissions ?? [];

    // Filtrer l'email à supprimer
    const updatedEmails = currentEmails.filter((e: string) => e !== email);

    // Mettre à jour app_settings
    const { error: updateError } = (await supabase
      .from('app_settings')
      .update({
        setting_value: {
          form_submissions: updatedEmails,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', 'notification_emails')) as {
      error: { message?: string } | null;
    };

    if (updateError) throw updateError;

    revalidatePath('/parametres/notifications');

    return {
      success: true,
      emails: updatedEmails,
    };
  } catch (error) {
    console.error('Error removing notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
