import type { Meta, StoryObj } from '@storybook/nextjs';

import { ErrorStateCard } from '@verone/ui';

const meta = {
  title: '1-UI-Base/Alerts/ErrorStateCard',
  component: ErrorStateCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
🚨 **ErrorStateCard** - Composant réutilisable pour afficher les états d'erreur avec possibilité de réessayer.

**Variantes** :
- \`default\` : Style information (bleu) - pour erreurs non-critiques ou messages info
- \`destructive\` : Style erreur (rouge) - pour erreurs critiques

**Props** :
- \`title\` : Titre personnalisé (défaut: "Erreur")
- \`message\` : Message d'erreur à afficher (**requis**)
- \`onRetry\` : Callback pour action de retry (optionnel - affiche bouton si fourni)
- \`variant\` : Type visuel (\`default\` | \`destructive\`)

**Cas d'usage** :
- Échec de requête API (avec retry)
- Erreur validation formulaire
- Timeout réseau
- Données introuvables
- Permission refusée

**Version** : 1.0.0
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: "Titre de l'état d'erreur",
      defaultValue: 'Erreur',
    },
    message: {
      control: 'text',
      description: "Message d'erreur descriptif",
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Variante visuelle de la card',
    },
    onRetry: {
      action: 'retry',
      description: 'Callback de retry (affiche bouton si fourni)',
    },
  },
} satisfies Meta<typeof ErrorStateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ✅ Default (Bleu - Information)
 * Variante info pour erreurs non-critiques ou messages informatifs
 */
export const Default: Story = {
  args: {
    title: 'Échec de chargement',
    message: 'Impossible de charger les données. Veuillez réessayer.',
    variant: 'default',
    onRetry: () => alert('Retry clicked!'),
  },
};

/**
 * 🔥 Destructive (Rouge - Erreur Critique)
 * Variante erreur pour situations critiques
 */
export const Destructive: Story = {
  args: {
    title: 'Erreur critique',
    message:
      "Une erreur inattendue s'est produite lors de la sauvegarde. Contactez le support si le problème persiste.",
    variant: 'destructive',
    onRetry: () => alert('Retry clicked!'),
  },
};

/**
 * ⚠️ Sans Retry
 * Card d'erreur sans action de retry (info seulement)
 */
export const WithoutRetry: Story = {
  args: {
    title: 'Permission refusée',
    message:
      "Vous n'avez pas les permissions nécessaires pour effectuer cette action. Contactez un administrateur.",
    variant: 'destructive',
    // Pas de onRetry → pas de bouton
  },
};

/**
 * 📊 Erreur API - Données Introuvables
 * Exemple réaliste : ressource non trouvée
 */
export const ApiNotFound: Story = {
  args: {
    title: 'Produit introuvable',
    message:
      "Le produit demandé n'existe pas ou a été supprimé. Vérifiez l'URL ou retournez à la liste.",
    variant: 'default',
  },
};

/**
 * 🌐 Erreur Réseau - Timeout
 * Exemple réaliste : timeout réseau avec retry
 */
export const NetworkTimeout: Story = {
  args: {
    title: 'Délai dépassé',
    message:
      'Le serveur met trop de temps à répondre. Vérifiez votre connexion internet et réessayez.',
    variant: 'default',
    onRetry: () => alert('Retry network request...'),
  },
};

/**
 * 📋 Erreur Validation - Formulaire
 * Exemple réaliste : données invalides
 */
export const ValidationError: Story = {
  args: {
    title: 'Données invalides',
    message:
      'Certains champs du formulaire contiennent des erreurs. Veuillez corriger avant de continuer.',
    variant: 'destructive',
  },
};

/**
 * 🔐 Erreur Authentification
 * Exemple réaliste : session expirée
 */
export const AuthenticationError: Story = {
  args: {
    title: 'Session expirée',
    message:
      'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
    variant: 'destructive',
    onRetry: () => alert('Redirect to login...'),
  },
};

/**
 * 📝 Titre Personnalisé
 * Démonstration avec titre personnalisé
 */
export const CustomTitle: Story = {
  args: {
    title: 'Oups ! Quelque chose a mal tourné',
    message:
      'Une erreur technique est survenue. Nos équipes ont été notifiées et travaillent sur le problème.',
    variant: 'default',
    onRetry: () => alert('Retry!'),
  },
};

/**
 * 🎨 Sans Titre (Défaut)
 * Utilise le titre par défaut "Erreur"
 */
export const WithDefaultTitle: Story = {
  args: {
    // Pas de title → utilise "Erreur"
    message: 'Le fichier téléchargé est trop volumineux (max 10 MB).',
    variant: 'destructive',
  },
};

/**
 * 📚 Exemple Multi-Cartes
 * Plusieurs ErrorStateCard dans un container
 */
export const MultipleCards: Story = {
  args: {
    message: '', // Requis pour Story type
  },
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <ErrorStateCard
        title="Erreur API"
        message="Échec de connexion au serveur principal."
        variant="destructive"
        onRetry={() => alert('Retry API')}
      />
      <ErrorStateCard
        title="Avertissement"
        message="Certaines fonctionnalités sont temporairement indisponibles."
        variant="default"
      />
      <ErrorStateCard
        message="Les données ont été mises à jour récemment. Rechargez la page."
        variant="default"
        onRetry={() => alert('Reload')}
      />
    </div>
  ),
};
