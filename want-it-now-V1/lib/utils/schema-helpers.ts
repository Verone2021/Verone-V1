import { z } from 'zod'

/**
 * Créer une version partielle d'un schéma Zod, avec support pour les discriminated unions
 * 
 * Cette fonction gère deux cas :
 * 1. Discriminated unions : préserve le discriminateur obligatoire, rend les autres champs optionnels
 * 2. Schémas normaux : applique .partial() directement
 * 
 * @param schema Le schéma Zod à rendre partiel
 * @returns Un nouveau schéma avec le discriminateur requis et les autres champs optionnels
 */
export function makeSchemaPartial<T extends z.ZodTypeAny>(
  schema: T
): z.ZodType<Partial<z.infer<T>>> {
  // Vérifier si c'est une discriminated union
  if (
    '_def' in schema && 
    schema._def &&
    'discriminator' in schema._def && 
    'options' in schema._def
  ) {
    const discriminatedUnion = schema as any
    const discriminatorKey = discriminatedUnion._def.discriminator
    
    // Créer des options partielles qui préservent le discriminateur
    const partialOptions = discriminatedUnion._def.options.map((option: any) => {
      if (option && typeof option.partial === 'function' && option._def && option._def.shape) {
        // Extraire le discriminateur de l'option
        const discriminatorValue = option._def.shape[discriminatorKey]
        
        // Créer version partielle de l'option
        const partialOption = option.partial()
        
        // Reconstituer avec discriminateur obligatoire
        return partialOption.extend({
          [discriminatorKey]: discriminatorValue // Garder le discriminateur requis
        })
      }
      // Fallback au cas où l'option n'a pas .partial()
      return option
    })
    
    // Recréer la discriminated union avec les options partielles
    return z.discriminatedUnion(
      discriminatorKey, 
      partialOptions
    ) as any
  }
  
  // Pour les schémas normaux, utiliser .partial() directement
  if (schema && typeof (schema as any).partial === 'function') {
    return (schema as any).partial()
  }
  
  // Fallback - retourner le schéma original si rien d'autre ne fonctionne
  console.warn('makeSchemaPartial: Unable to make schema partial, returning original schema')
  return schema as any
}

/**
 * Type helper pour extraire le type d'un schéma partiel
 */
export type PartialSchema<T extends z.ZodTypeAny> = z.ZodType<Partial<z.infer<T>>>