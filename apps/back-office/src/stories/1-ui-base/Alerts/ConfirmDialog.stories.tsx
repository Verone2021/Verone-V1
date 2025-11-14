import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { ButtonV2, ConfirmDialog } from '@verone/ui';

const meta = {
  title: '1-UI-Base/Alerts/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
🚨 **ConfirmDialog** - Dialogue de confirmation réutilisable basé sur AlertDialog Radix UI.

**Variantes** :
- \`default\` : Style information (bleu)
- \`destructive\` : Style danger (rouge) pour actions destructives

**Props requises** :
- \`open\` : État ouvert/fermé
- \`onOpenChange\` : Callback changement état
- \`title\` : Titre du dialogue
- \`description\` : Message de confirmation
- \`onConfirm\` : Callback confirmation (peut être async)

**Props optionnelles** :
- \`confirmText\` : Texte bouton confirmation (défaut: "Confirmer")
- \`cancelText\` : Texte bouton annulation (défaut: "Annuler")
- \`variant\` : Style visuel (défaut: "default")
- \`onCancel\` : Callback annulation
- \`loading\` : État de chargement manuel

**Version** : 1.0.0
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🧩 Playground
 * Exemple interactif avec compteur
 */
export const Playground: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-100 rounded border">
          <p className="text-sm text-slate-600 mb-2">
            Compteur : <strong>{count}</strong>
          </p>
          <ButtonV2 onClick={() => setOpen(true)}>Ouvrir le dialogue</ButtonV2>
        </div>

        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Confirmer l'action ?"
          description="Cliquez sur Confirmer pour incrémenter le compteur."
          onConfirm={() => setCount(count + 1)}
        />
      </div>
    );
  },
};

/**
 * ✅ Default
 * Confirmation standard (bleu)
 */
export const Default: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <ButtonV2 onClick={() => setOpen(true)}>Sauvegarder</ButtonV2>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Sauvegarder les modifications ?"
          description="Les modifications seront enregistrées."
          variant="default"
          confirmText="Sauvegarder"
          onConfirm={() => alert('Sauvegardé!')}
        />
      </div>
    );
  },
};

/**
 * 🔥 Destructive
 * Action dangereuse/irréversible (rouge)
 */
export const Destructive: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <ButtonV2 variant="destructive" onClick={() => setOpen(true)}>
          Supprimer
        </ButtonV2>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Supprimer définitivement ?"
          description="Cette action est irréversible. Le produit sera définitivement supprimé."
          variant="destructive"
          confirmText="Supprimer"
          onConfirm={() => alert('Supprimé!')}
        />
      </div>
    );
  },
};

/**
 * ⏳ Async Action
 * Avec loading automatique
 */
export const AsyncAction: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);

    const handleConfirm = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Action complétée!');
    };

    return (
      <div>
        <ButtonV2 onClick={() => setOpen(true)}>Action async (2s)</ButtonV2>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Déconnecter ?"
          description="Vous serez déconnecté de tous vos appareils."
          confirmText="Déconnecter"
          onConfirm={handleConfirm}
        />
      </div>
    );
  },
};

/**
 * ⚠️ Avec Callback Annulation
 */
export const WithCancelCallback: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <ButtonV2 onClick={() => setOpen(true)}>Quitter</ButtonV2>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Quitter sans sauvegarder ?"
          description="Modifications non enregistrées seront perdues."
          confirmText="Quitter"
          cancelText="Continuer l'édition"
          onConfirm={() => alert('Quitté')}
          onCancel={() => alert('Annulé')}
        />
      </div>
    );
  },
};

/**
 * 🎨 Textes Personnalisés
 */
export const CustomTexts: Story = {
  args: {} as any,
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <ButtonV2 onClick={() => setOpen(true)}>Inviter</ButtonV2>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Envoyer l'invitation ?"
          description="Une invitation par email sera envoyée à l'utilisateur."
          confirmText="Envoyer l'invitation"
          cancelText="Pas maintenant"
          onConfirm={() => alert('Invitation envoyée!')}
        />
      </div>
    );
  },
};
