import { getBrand } from '../data/brands';
import { getPreset } from '../data/presets';
import type { ComposedPrompt, PromptInputs } from '../types';

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
