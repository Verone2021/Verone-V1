'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ============================================================================
// Types
// ============================================================================

export interface IAffiliateBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

// LinkMe default colors (from tailwind.config.js)
export const LINKME_DEFAULT_BRANDING: IAffiliateBranding = {
  primary_color: '#5DBEBB', // turquoise
  secondary_color: '#3976BB', // royal
  accent_color: '#7E84C0', // mauve
  text_color: '#183559', // marine
  background_color: '#FFFFFF', // white
};

// ============================================================================
// Hook: useAffiliateBranding
// ============================================================================

interface IUseAffiliateBrandingOptions {
  enabled?: boolean;
}

export function useAffiliateBranding(
  affiliateId: string | null,
  options: IUseAffiliateBrandingOptions = {}
): {
  branding: IAffiliateBranding;
  isLoading: boolean;
  error: Error | null;
  updateBranding: (branding: Partial<IAffiliateBranding>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isUpdating: boolean;
} {
  const queryClient = useQueryClient();
  const { enabled = true } = options;

  // Fetch branding from database
  const {
    data: brandingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['affiliate-branding', affiliateId],
    queryFn: async (): Promise<IAffiliateBranding> => {
      if (!affiliateId) {
        return LINKME_DEFAULT_BRANDING;
      }

      // Note: Using type assertion because columns were added after types generation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = (await supabase
        .from('linkme_affiliates')
        .select(
          'primary_color, secondary_color, accent_color, text_color, background_color'
        )
        .eq('id', affiliateId)
        .single()) as {
        data: Partial<IAffiliateBranding> | null;
        error: Error | null;
      };

      if (fetchError) {
        console.error('Error fetching branding:', fetchError);
        return LINKME_DEFAULT_BRANDING;
      }

      // Return data with fallback to defaults for null values
      return {
        primary_color:
          data?.primary_color ?? LINKME_DEFAULT_BRANDING.primary_color,
        secondary_color:
          data?.secondary_color ?? LINKME_DEFAULT_BRANDING.secondary_color,
        accent_color:
          data?.accent_color ?? LINKME_DEFAULT_BRANDING.accent_color,
        text_color: data?.text_color ?? LINKME_DEFAULT_BRANDING.text_color,
        background_color:
          data?.background_color ?? LINKME_DEFAULT_BRANDING.background_color,
      };
    },
    enabled: enabled && !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation to update branding
  const updateMutation = useMutation({
    mutationFn: async (
      newBranding: Partial<IAffiliateBranding>
    ): Promise<void> => {
      if (!affiliateId) {
        throw new Error('Affiliate ID is required');
      }

      const { error: updateError } = await supabase
        .from('linkme_affiliates')
        .update({
          ...newBranding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);

      if (updateError) {
        throw updateError;
      }
    },
    onSuccess: (): void => {
      // Invalidate query to refetch
      void queryClient.invalidateQueries({
        queryKey: ['affiliate-branding', affiliateId],
      });
    },
  });

  // Reset to defaults
  const resetToDefaults = async (): Promise<void> => {
    await updateMutation.mutateAsync(LINKME_DEFAULT_BRANDING);
  };

  return {
    branding: brandingData ?? LINKME_DEFAULT_BRANDING,
    isLoading,
    error: error,
    updateBranding: updateMutation.mutateAsync,
    resetToDefaults,
    isUpdating: updateMutation.isPending,
  };
}

// ============================================================================
// Utility: Get contrast text color
// ============================================================================

export function getContrastTextColor(hexColor: string): string {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, dark for light colors
  return luminance > 0.5 ? '#183559' : '#FFFFFF';
}

// ============================================================================
// Utility: Darken/Lighten color for hover states
// ============================================================================

export function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
