import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(), // Fonction/poste
});

export type ProfileFormData = z.infer<typeof profileSchema>;
