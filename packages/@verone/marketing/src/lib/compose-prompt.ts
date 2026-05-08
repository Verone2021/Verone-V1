import { getBrand } from '../data/brands';
import { getPreset } from '../data/presets';
import { TARGET_CHANNEL_LABELS } from '../types';
import type {
  BrandSlug,
  ComposedPrompt,
  PromptInputs,
  TargetChannel,
} from '../types';

const PRODUCT_PLACEHOLDER = '{{PRODUCT}}';

export function composePrompt(inputs: PromptInputs): ComposedPrompt | null {
  const preset = getPreset(inputs.presetId);
  const brand = getBrand(inputs.brand);
  if (!preset || !brand) return null;

  const productSubject = inputs.productDescription.trim();
  const hasPlaceholder = productSubject.length === 0;
  const subject = hasPlaceholder ? '[Produit — décris-le ici]' : productSubject;

  return {
    preset,
    brand,
    text: preset.template.split(PRODUCT_PLACEHOLDER).join(subject),
    hasPlaceholder,
  };
}

export interface ComposePromptWithSourcesInputs {
  brand: BrandSlug;
  presetId: string;
  productDescription: string;
  sourceImagesCount: number;
  targetChannel: TargetChannel;
  customPrompt?: string;
}

/**
 * Étend composePrompt en injectant un préambule multi-sources + canal cible.
 * Le préambule vient AVANT le template du preset.
 */
export function composePromptWithSources(
  inputs: ComposePromptWithSourcesInputs
): ComposedPrompt | null {
  // Si customPrompt fourni : on l'utilise mais on conserve preset/brand pour metadata
  const preset = getPreset(inputs.presetId);
  const brand = getBrand(inputs.brand);
  if (!preset || !brand) return null;

  const productSubject = inputs.productDescription.trim();
  const hasPlaceholder = productSubject.length === 0;
  const subject = hasPlaceholder ? '[Produit — décris-le ici]' : productSubject;

  const channelLabel =
    TARGET_CHANNEL_LABELS[inputs.targetChannel] ?? inputs.targetChannel;

  // Préambule multi-sources
  const sourceLine =
    inputs.sourceImagesCount > 0
      ? `Use the ${inputs.sourceImagesCount} reference image${inputs.sourceImagesCount > 1 ? 's' : ''} as primary visual reference for product, materials, finishes, and proportions.`
      : '';

  const channelLine = `Output optimized for ${channelLabel} placement.`;

  const preamble = [sourceLine, channelLine].filter(Boolean).join('\n');

  let templateText: string;
  if (inputs.customPrompt && inputs.customPrompt.trim().length > 0) {
    templateText = inputs.customPrompt.trim();
  } else {
    templateText = preset.template.split(PRODUCT_PLACEHOLDER).join(subject);
  }

  const fullText = preamble ? `${preamble}\n\n${templateText}` : templateText;

  return {
    preset,
    brand,
    text: fullText,
    hasPlaceholder,
  };
}
