/**
 * 🎯 TEMPLATE DE COMPOSANT VERONE - Règles Strictes 2026
 *
 * ⚠️ OBLIGATOIRE AVANT DE CRÉER UN NOUVEAU COMPOSANT :
 *
 * 1. 🔍 RECHERCHER L'EXISTANT
 *    - Glob: **\/*nom-similaire*.tsx dans components/
 *    - Vérifier si un composant similaire existe déjà
 *    - RÉUTILISER au lieu de RECRÉER
 *
 * 2. 📦 VÉRIFIER LES PACKAGES
 *    - @verone/ui → Composants de base (Button, Card, etc.)
 *    - @verone/customers → Logique clients
 *    - @verone/products → Logique produits
 *    - @verone/finance → Logique finance
 *    - packages/ui/src/ → System de design Verone
 *
 * 3. 🎨 PATTERNS À SUIVRE
 *    - Utiliser les composants existants (ButtonV2, Card, Modal)
 *    - Suivre la structure des composants business/
 *    - Gestion d'erreur systématique (try/catch + toast)
 *    - Types stricts (pas de `any`)
 *
 * 4. ✅ VALIDATION AVANT COMMIT
 *    ```bash
 *    pnpm type-check  # 0 erreur
 *    pnpm lint        # 0 erreur async
 *    ```
 */

'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ Imports depuis packages Verone
import { useToast } from '@verone/common/hooks';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Loader2 } from 'lucide-react';

/**
 * Props Interface - TOUJOURS typer les props
 */
interface MyComponentProps {
  /** ID de la ressource (requis) */
  resourceId: string;
  /** Callback appelé après succès */
  onSuccess?: () => void;
  /** Modal ouvert ? */
  open: boolean;
  /** Callback fermeture modal */
  onOpenChange: (open: boolean) => void;
}

/**
 * Type pour les données du formulaire
 */
interface FormData {
  name: string;
  email: string;
  // Ajouter les champs nécessaires
}

/**
 * 🎯 COMPOSANT PRINCIPAL
 *
 * Description: [À REMPLIR - Qu'est-ce que ce composant fait ?]
 * Utilisé dans: [À REMPLIR - Où est-il utilisé ?]
 *
 * @example
 * <MyComponent
 *   resourceId="123"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => console.log('Success!')}
 * />
 */
export function MyComponent({
  resourceId,
  onSuccess,
  open,
  onOpenChange,
}: MyComponentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ État local pour le formulaire
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });

  // ✅ Pattern React Query pour mutation async
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // TODO: Remplacer par ton appel API réel
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      return response.json();
    },
    // ✅ OBLIGATOIRE: onSuccess async avec await
    onSuccess: async () => {
      // Invalider le cache React Query
      await queryClient.invalidateQueries({
        queryKey: ['resources', resourceId],
      });

      // Toast de succès
      toast({
        title: 'Succès',
        description: 'Opération réussie',
      });

      // Callback parent
      onSuccess?.();

      // Fermer le modal
      onOpenChange(false);

      // Reset form
      setFormData({ name: '', email: '' });
    },
    // ✅ OBLIGATOIRE: Gestion d'erreur
    onError: error => {
      console.error('[MyComponent] Mutation failed:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // ✅ Handler avec gestion d'erreur intégrée
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation simple
      if (!formData.name || !formData.email) {
        toast({
          title: 'Validation',
          description: 'Veuillez remplir tous les champs',
          variant: 'destructive',
        });
        return;
      }

      // Lancer la mutation (gestion d'erreur dans onError)
      mutation.mutate(formData);
    },
    [formData, mutation, toast]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Titre du Modal</DialogTitle>
          <DialogDescription>
            Description de ce que fait ce modal
          </DialogDescription>
        </DialogHeader>

        {/* ✅ Formulaire avec onSubmit géré */}
        <form
          onSubmit={e => {
            // ✅ PATTERN OBLIGATOIRE: Wrapper async dans event handler
            void handleSubmit(e).catch(error => {
              console.error('[MyComponent] Submit failed:', error);
            });
          }}
          className="space-y-4 py-4"
        >
          {/* Champ Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Entrez un nom"
              disabled={mutation.isPending}
            />
          </div>

          {/* Champ Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
              placeholder="exemple@verone.fr"
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter>
            {/* ✅ Bouton Annuler */}
            <ButtonV2
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Annuler
            </ButtonV2>

            {/* ✅ Bouton Submit avec loading state */}
            <ButtonV2 type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ========================================
 * 📚 EXEMPLES DE PATTERNS COURANTS
 * ========================================
 */

/**
 * PATTERN 1: Bouton avec action async
 */
export function ButtonWithAsyncAction() {
  const { toast } = useToast();

  const handleClick = useCallback(async () => {
    try {
      await fetch('/api/action');
      toast({ title: 'Succès' });
    } catch (error) {
      console.error('[ButtonWithAsyncAction] Failed:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <ButtonV2
      // ✅ OBLIGATOIRE: void + .catch()
      onClick={() => {
        void handleClick().catch(error => {
          console.error('[ButtonWithAsyncAction] Click failed:', error);
        });
      }}
    >
      Action
    </ButtonV2>
  );
}

/**
 * PATTERN 2: Custom Hook pour réutilisation
 */
function useAsyncAction<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(() => {
    setLoading(true);
    void asyncFn()
      .then(result => {
        options?.onSuccess?.(result);
      })
      .catch(error => {
        console.error('[useAsyncAction] Failed:', error);
        toast({
          title: 'Erreur',
          variant: 'destructive',
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
        options?.onError?.(error as Error);
      })
      .finally(() => setLoading(false));
  }, [asyncFn, options, toast]);

  return { execute, loading };
}

/**
 * PATTERN 3: Usage du custom hook
 */
export function ButtonWithCustomHook() {
  const { execute, loading } = useAsyncAction(
    () => fetch('/api/action').then(r => r.json()),
    {
      onSuccess: data => console.log('Success:', data),
    }
  );

  return (
    <ButtonV2 onClick={execute} disabled={loading}>
      {loading ? 'Chargement...' : 'Action'}
    </ButtonV2>
  );
}
