export type BrandSlug = 'verone' | 'bohemia' | 'solar' | 'flos';

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
