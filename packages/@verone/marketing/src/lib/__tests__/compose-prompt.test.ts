import { composePromptWithSources } from '../compose-prompt';

describe('composePromptWithSources', () => {
  const baseInputs = {
    brand: 'verone' as const,
    presetId: 'V1',
    productDescription: 'Vase en céramique artisanal beige',
    sourceImagesCount: 1,
    targetChannel: 'instagram' as const,
  };

  it('injecte le préambule 1 source + canal dans le prompt', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      sourceImagesCount: 1,
    });
    expect(result).not.toBeNull();
    expect(result?.text).toContain('Use the 1 reference image');
    expect(result?.text).toContain('Output optimized for Instagram placement.');
    expect(result?.text).toContain('Vase en céramique artisanal beige');
  });

  it('pluralise correctement avec 3 sources', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      sourceImagesCount: 3,
    });
    expect(result).not.toBeNull();
    expect(result?.text).toContain('Use the 3 reference images');
  });

  it('utilise customPrompt à la place du template preset', () => {
    const customText = 'Mon prompt personnalisé pour ce produit unique';
    const result = composePromptWithSources({
      ...baseInputs,
      customPrompt: customText,
    });
    expect(result).not.toBeNull();
    // Le customPrompt doit apparaître dans le texte
    expect(result?.text).toContain(customText);
    // Le préambule doit toujours être là
    expect(result?.text).toContain('Use the 1 reference image');
    expect(result?.text).toContain('Output optimized for Instagram placement.');
    // Le template du preset NE doit PAS être utilisé
    expect(result?.text).not.toContain('Pantone Cool Gray 1C');
  });

  it('retourne null si preset inconnu', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      presetId: 'PRESET_INCONNU_XYZ',
    });
    expect(result).toBeNull();
  });

  it('retourne null si marque inconnue', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      brand: 'marque_inexistante' as never,
    });
    expect(result).toBeNull();
  });

  it('retourne le bon preset et brand dans le résultat', () => {
    const result = composePromptWithSources(baseInputs);
    expect(result?.preset.id).toBe('V1');
    expect(result?.brand.slug).toBe('verone');
  });

  it('gère correctement le canal facebook', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      targetChannel: 'facebook',
    });
    expect(result?.text).toContain('Output optimized for Facebook placement.');
  });

  it('fonctionne avec 0 source (cas exceptionnel)', () => {
    const result = composePromptWithSources({
      ...baseInputs,
      sourceImagesCount: 0,
    });
    expect(result).not.toBeNull();
    // Pas de ligne "Use the N reference images" si 0 sources
    expect(result?.text).not.toContain('Use the 0 reference image');
    // Mais le canal est toujours présent
    expect(result?.text).toContain('Output optimized for Instagram placement.');
  });
});
