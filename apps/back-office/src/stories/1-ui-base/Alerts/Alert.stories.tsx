import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Zap,
} from 'lucide-react';

import { Alert, AlertTitle, AlertDescription, Button } from '@verone/ui';

const meta = {
  title: '1-UI-Base/Alerts/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
🚨 **Alert** - Messages contextuels avec variants colorés et icons automatiques.

**Variantes** :
- \`default\` : Blanc neutre (Info icon)
- \`info\` : Bleu (Info icon)
- \`success\` : Vert (CheckCircle2 icon)
- \`warning\` : Orange (AlertTriangle icon)
- \`error\` : Rouge (AlertCircle icon)
- \`destructive\` : Rouge foncé (AlertCircle icon)

**Tailles** :
- \`sm\` : Compact (p-3, text-sm, icon 16px) - **Nouveau**
- \`md\` : Standard (p-4, text-base, icon 20px) - **Default**
- \`lg\` : Large (p-5, text-lg, icon 24px) - **Nouveau**

**Fonctionnalités** :
- Icon automatique selon variant (mappé)
- Icon personnalisable (\`icon\` prop)
- Dismissible avec state interne (\`dismissible\`)
- Actions (boutons) avec slot \`actions\`
- Composition : \`Alert\` + \`AlertTitle\` + \`AlertDescription\`

**Version** : V2 (CVA + Size variants)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'info',
        'success',
        'warning',
        'error',
        'destructive',
      ],
      description: 'Variante colorée avec icon automatique',
    },
    alertSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: "Taille de l'alerte",
    },
    dismissible: {
      control: 'boolean',
      description: 'Afficher bouton fermeture (avec state interne)',
    },
    hideIcon: {
      control: 'boolean',
      description: "Masquer l'icône",
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Alert info par défaut avec title + description
 */
export const Default: Story = {
  args: {
    variant: 'info',
    children: (
      <>
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Ceci est un message informatif avec une icône Info automatique.
        </AlertDescription>
      </>
    ),
  },
};

/**
 * Toutes les variantes avec leurs icons automatiques
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>
          Message neutre blanc avec icon Info (par défaut)
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Message informatif bleu avec icon Info automatique
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Succès</AlertTitle>
        <AlertDescription>
          Message succès vert avec icon CheckCircle2 automatique
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Attention</AlertTitle>
        <AlertDescription>
          Message avertissement orange avec icon AlertTriangle automatique
        </AlertDescription>
      </Alert>

      <Alert variant="error">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Message erreur rouge avec icon AlertCircle automatique
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Destructif</AlertTitle>
        <AlertDescription>
          Action destructive critique rouge foncé avec icon AlertCircle
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Tailles disponibles (sm, md, lg)
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert variant="info" alertSize="sm">
        <AlertTitle>Small (sm)</AlertTitle>
        <AlertDescription>
          Alert compact avec p-3, text-sm, icon 16px - Pour espaces restreints
        </AlertDescription>
      </Alert>

      <Alert variant="info" alertSize="md">
        <AlertTitle>Medium (md) - Default</AlertTitle>
        <AlertDescription>
          Alert standard avec p-4, text-base, icon 20px - Taille par défaut
        </AlertDescription>
      </Alert>

      <Alert variant="info" alertSize="lg">
        <AlertTitle>Large (lg)</AlertTitle>
        <AlertDescription>
          Alert large avec p-5, text-lg, icon 24px - Pour messages importants
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Alert dismissible avec bouton fermeture
 */
export const Dismissible: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert variant="info" dismissible>
        <AlertTitle>Message dismissible</AlertTitle>
        <AlertDescription>
          Cliquez sur le X pour fermer cette alerte. State géré en interne.
        </AlertDescription>
      </Alert>

      <Alert
        variant="warning"
        dismissible
        onDismiss={() => console.log('Alert dismissed')}
      >
        <AlertTitle>Avec callback onDismiss</AlertTitle>
        <AlertDescription>
          Alert avec callback onDismiss pour tracking ou actions personnalisées.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Alert avec actions (boutons)
 */
export const WithActions: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert
        variant="warning"
        actions={
          <>
            <Button variant="outline" size="sm">
              Ignorer
            </Button>
            <Button variant="primary" size="sm">
              Confirmer
            </Button>
          </>
        }
      >
        <AlertTitle>Confirmation requise</AlertTitle>
        <AlertDescription>
          Cette action nécessite une confirmation. Voulez-vous continuer ?
        </AlertDescription>
      </Alert>

      <Alert
        variant="error"
        dismissible
        actions={
          <Button variant="destructive" size="sm">
            Voir les détails
          </Button>
        }
      >
        <AlertTitle>Erreur de synchronisation</AlertTitle>
        <AlertDescription>
          La synchronisation avec Google Merchant a échoué. Consultez les logs.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Alert avec icône personnalisée
 */
export const WithCustomIcon: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert variant="info" icon={<Zap className="h-5 w-5 text-blue-600" />}>
        <AlertTitle>Icône personnalisée</AlertTitle>
        <AlertDescription>
          Alert avec icône Zap personnalisée au lieu de l'icône automatique
          Info.
        </AlertDescription>
      </Alert>

      <Alert variant="success" hideIcon>
        <AlertTitle>Sans icône</AlertTitle>
        <AlertDescription>
          Alert avec hideIcon=true pour masquer complètement l'icône.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Alert simple sans title (description uniquement)
 */
export const SimpleWithoutTitle: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert variant="success">
        <AlertDescription>
          Produit créé avec succès ! (Alert sans AlertTitle)
        </AlertDescription>
      </Alert>

      <Alert variant="error">
        <AlertDescription>
          Une erreur est survenue lors de l'enregistrement.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Exemples réels d'utilisation business
 */
export const RealWorld: Story = {
  render: () => (
    <div className="space-y-6 p-4 w-[700px]">
      {/* Succès création produit */}
      <Alert variant="success" dismissible>
        <AlertTitle>Produit créé avec succès</AlertTitle>
        <AlertDescription>
          Le fauteuil "Milo Vert" a été ajouté au catalogue avec le SKU
          FAUT-MILO-VERT.
        </AlertDescription>
      </Alert>

      {/* Warning stock faible */}
      <Alert
        variant="warning"
        actions={
          <>
            <Button variant="outline" size="sm">
              Rappeler plus tard
            </Button>
            <Button variant="primary" size="sm">
              Commander maintenant
            </Button>
          </>
        }
      >
        <AlertTitle>Stock faible détecté</AlertTitle>
        <AlertDescription>
          3 produits ont un stock inférieur au seuil minimum. Recommander auprès
          des fournisseurs ?
        </AlertDescription>
      </Alert>

      {/* Error sync Google Merchant */}
      <Alert
        variant="error"
        alertSize="sm"
        dismissible
        actions={
          <Button variant="destructive" size="sm">
            Voir les logs
          </Button>
        }
      >
        <AlertTitle>Échec synchronisation Google Merchant</AlertTitle>
        <AlertDescription>
          15 produits n'ont pas pu être synchronisés (erreur API). Consultez les
          détails.
        </AlertDescription>
      </Alert>

      {/* Info nouvelle feature */}
      <Alert variant="info" alertSize="lg" dismissible>
        <AlertTitle>Nouvelle fonctionnalité disponible</AlertTitle>
        <AlertDescription>
          Vous pouvez maintenant gérer les tarifs clients par quantité avec des
          paliers personnalisés (10/50/100 unités). Accédez à la section
          &quot;Canaux de vente &gt; Prix clients&quot;.
        </AlertDescription>
      </Alert>

      {/* Destructive suppression */}
      <Alert
        variant="destructive"
        actions={
          <>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
            <Button variant="destructive" size="sm">
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <AlertTitle>Attention : Action irréversible</AlertTitle>
        <AlertDescription>
          La suppression du fournisseur "Atelier Martin" est définitive et
          supprimera également toutes les commandes associées (12 commandes).
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Variations de composition (avec/sans title/description)
 */
export const CompositionVariations: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      {/* Title + Description */}
      <Alert variant="info">
        <AlertTitle>Avec Title et Description</AlertTitle>
        <AlertDescription>
          Composition complète : AlertTitle en semibold + AlertDescription
          text-sm.
        </AlertDescription>
      </Alert>

      {/* Description uniquement */}
      <Alert variant="success">
        <AlertDescription>
          Description uniquement sans AlertTitle (cas simple).
        </AlertDescription>
      </Alert>

      {/* Title uniquement */}
      <Alert variant="warning">
        <AlertTitle>Title uniquement sans description</AlertTitle>
      </Alert>

      {/* Custom content */}
      <Alert variant="default">
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900">Custom content HTML</h4>
          <p className="text-sm text-slate-600">
            Vous pouvez passer n'importe quel contenu React/HTML à la place de
            AlertTitle/AlertDescription.
          </p>
          <ul className="text-sm text-slate-600 list-disc ml-5">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </div>
      </Alert>
    </div>
  ),
};
