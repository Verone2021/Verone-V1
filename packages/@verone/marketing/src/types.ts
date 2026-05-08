import { z } from 'zod';

export type BrandSlug = 'verone' | 'bohemia' | 'solar' | 'flos' | 'linkme';

export interface Brand {
  slug: BrandSlug;
  name: string;
  description: string;
  visualIdentity: string;
  palette: string;
  keywords: string;
  avoid: string;
}

export type PromptFormat = '1:1' | '4:5' | '9:16' | '16:9';

export interface Preset {
  id: string;
  brand: BrandSlug;
  name: string;
  description: string;
  format: PromptFormat;
  template: string;
}

export interface PromptInputs {
  brand: BrandSlug;
  presetId: string;
  productDescription: string;
}

export interface ComposedPrompt {
  preset: Preset;
  brand: Brand;
  text: string;
  hasPlaceholder: boolean;
}

// =====================================================================
// CANAL CIBLE
// =====================================================================

export const TARGET_CHANNEL_VALUES = [
  'instagram',
  'facebook',
  'pinterest',
  'whatsapp',
  'merchant',
  'website',
  'email',
  'other',
] as const;

export type TargetChannel = (typeof TARGET_CHANNEL_VALUES)[number];

export const TARGET_CHANNEL_LABELS: Record<TargetChannel, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
  merchant: 'Merchant',
  website: 'Site web',
  email: 'Email',
  other: 'Autre',
};

// =====================================================================
// GÉNÉRATION D'IMAGES MARKETING — SCHEMAS ZOD
// =====================================================================

export const GenerateMarketingImageRequestSchema = z.object({
  sourceImageIds: z
    .array(z.string().uuid())
    .min(1, 'Au moins une image source est requise')
    .max(5, '5 images sources maximum'),
  productIds: z.array(z.string().uuid()).optional(),
  brandSlug: z.enum(['verone', 'bohemia', 'solar', 'flos', 'linkme'] as const),
  presetId: z.string().min(1),
  targetChannel: z.enum(TARGET_CHANNEL_VALUES),
  customPrompt: z.string().max(2000).optional(),
  saveImmediately: z.boolean().optional().default(false),
});

export type GenerateMarketingImageRequest = z.infer<
  typeof GenerateMarketingImageRequestSchema
>;

export interface GenerateMarketingImagePreviewResponse {
  mode: 'preview';
  imageBase64: string;
  mimeType: string;
  modelUsed: string;
  promptUsed: string;
}

export interface GenerateMarketingImageSavedResponse {
  mode: 'saved';
  asset: {
    id: string;
    cloudflare_image_id: string;
    public_url: string;
    alt_text: string | null;
  };
}

export type GenerateMarketingImageResponse =
  | GenerateMarketingImagePreviewResponse
  | GenerateMarketingImageSavedResponse;
