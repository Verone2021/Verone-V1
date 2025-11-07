import type { Meta, StoryObj } from '@storybook/react';
import {
  Package,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';

import { ButtonUnified } from './button-unified';
import { KPICardUnified } from './kpi-card-unified';

/**
 * KPICardUnified - Composant KPI Card générique unifié Design System V2
 *
 * ## Caractéristiques
 * - 3 variants : compact (40px), elegant (96px), detailed (140px)
 * - Support trend indicator (positif/négatif)
 * - Icône avec background coloré
 * - Description optionnelle
 * - Actions optionnelles (boutons)
 * - Sparkline optionnel (graphique tendance)
 * - onClick pour interactivité
 *
 * ## Migration depuis composants legacy
 * - `CompactKpiCard` → `KPICardUnified variant="compact"`
 * - `ElegantKpiCard` → `KPICardUnified variant="elegant"`
 * - `MediumKpiCard` → `KPICardUnified variant="detailed"`
 *
 * @see /docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md
 */
const meta: Meta<typeof KPICardUnified> = {
  title: 'UI/KPICardUnified',
  component: KPICardUnified,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'elegant', 'detailed'],
      description: 'Style variant de la card',
    },
    title: {
      control: 'text',
      description: 'Titre de la métrique',
    },
    value: {
      control: 'text',
      description: 'Valeur affichée (nombre ou string formaté)',
    },
    icon: {
      control: false,
      description: 'Icône Lucide',
    },
    trend: {
      control: 'object',
      description: 'Indicateur de tendance {value, isPositive} ou nombre simple',
    },
    description: {
      control: 'text',
      description: 'Description additionnelle (elegant/detailed)',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'accent', 'danger'],
      description: 'Couleur de l\'icône et accents',
    },
    sparklineData: {
      control: 'object',
      description: 'Données pour mini sparkline',
    },
    onClick: {
      control: false,
      description: 'Callback au clic',
    },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof KPICardUnified>;

// Données sparkline exemple
const sparklineDataUptrend = [12, 15, 18, 14, 20, 22, 25, 28];
const sparklineDataDowntrend = [28, 26, 24, 25, 22, 19, 18, 15];
const sparklineDataVolatile = [15, 22, 18, 25, 20, 28, 23, 26];

// ============================================
// VARIANTS
// ============================================

export const Compact: Story = {
  args: {
    variant: 'compact',
    title: 'Produits actifs',
    value: '1,234',
    icon: Package,
    trend: { value: 12, isPositive: true },
    color: 'primary',
  },
};

export const Elegant: Story = {
  args: {
    variant: 'elegant',
    title: 'Chiffre d\'affaires',
    value: '€45,231',
    icon: DollarSign,
    description: 'vs mois dernier',
    trend: { value: 8.5, isPositive: true },
    color: 'success',
  },
};

export const Detailed: Story = {
  args: {
    variant: 'detailed',
    title: 'Commandes en cours',
    value: 42,
    icon: ShoppingCart,
    description: '15 en attente de validation',
    sparklineData: sparklineDataUptrend,
    trend: { value: 18, isPositive: true },
    color: 'warning',
  },
};

// ============================================
// COLORS
// ============================================

export const AllColors: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 max-w-md">
      <KPICardUnified
        variant="compact"
        title="Primary"
        value="1,234"
        icon={Package}
        color="primary"
        trend={12}
      />
      <KPICardUnified
        variant="compact"
        title="Success"
        value="€45K"
        icon={DollarSign}
        color="success"
        trend={8.5}
      />
      <KPICardUnified
        variant="compact"
        title="Warning"
        value="42"
        icon={Activity}
        color="warning"
        trend={-5}
      />
      <KPICardUnified
        variant="compact"
        title="Accent"
        value="328"
        icon={Users}
        color="accent"
        trend={15}
      />
      <KPICardUnified
        variant="compact"
        title="Danger"
        value="12"
        icon={Target}
        color="danger"
        trend={-12}
      />
    </div>
  ),
};

// ============================================
// TREND INDICATOR
// ============================================

export const PositiveTrend: Story = {
  args: {
    variant: 'elegant',
    title: 'Ventes du mois',
    value: '€12,450',
    icon: TrendingUp,
    trend: { value: 23.5, isPositive: true },
    description: '+€2,250 vs mois dernier',
    color: 'success',
  },
};

export const NegativeTrend: Story = {
  args: {
    variant: 'elegant',
    title: 'Stock faible',
    value: '18 produits',
    icon: Package,
    trend: { value: 15, isPositive: false },
    description: 'Attention : seuil critique atteint',
    color: 'danger',
  },
};

export const SimpleTrendNumber: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Le prop `trend` accepte aussi un nombre simple (auto-détecte positif/négatif) :
      </p>
      <div className="grid grid-cols-3 gap-4">
        <KPICardUnified
          title="Positif"
          value="1,234"
          icon={Package}
          trend={15} // Nombre positif → vert
        />
        <KPICardUnified
          title="Négatif"
          value="856"
          icon={Users}
          trend={-8} // Nombre négatif → rouge
        />
        <KPICardUnified
          title="Neutre"
          value="42"
          icon={ShoppingCart}
          // Sans trend
        />
      </div>
    </div>
  ),
};

// ============================================
// SPARKLINE
// ============================================

export const WithSparkline: Story = {
  args: {
    variant: 'compact',
    title: 'Ventes 7j',
    value: '€8,234',
    icon: BarChart3,
    sparklineData: sparklineDataUptrend,
    color: 'success',
  },
};

export const DetailedWithSparkline: Story = {
  args: {
    variant: 'detailed',
    title: 'Activité mensuelle',
    value: '2,450',
    icon: Activity,
    description: 'Actions utilisateurs ce mois',
    sparklineData: sparklineDataVolatile,
    trend: 12,
    color: 'primary',
  },
};

export const SparklineVariations: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 max-w-md">
      <KPICardUnified
        variant="compact"
        title="Tendance haussière"
        value="€12K"
        icon={TrendingUp}
        sparklineData={sparklineDataUptrend}
        color="success"
      />
      <KPICardUnified
        variant="compact"
        title="Tendance baissière"
        value="856"
        icon={Package}
        sparklineData={sparklineDataDowntrend}
        color="danger"
      />
      <KPICardUnified
        variant="compact"
        title="Volatile"
        value="1,234"
        icon={Activity}
        sparklineData={sparklineDataVolatile}
        color="warning"
      />
    </div>
  ),
};

// ============================================
// ACTIONS
// ============================================

export const WithActions: Story = {
  args: {
    variant: 'elegant',
    title: 'Commandes en attente',
    value: 12,
    icon: ShoppingCart,
    description: '3 urgentes à traiter',
    trend: -5,
    color: 'warning',
    actions: (
      <ButtonUnified size="sm" variant="outline">
        Traiter
      </ButtonUnified>
    ),
  },
};

export const DetailedWithActions: Story = {
  args: {
    variant: 'detailed',
    title: 'Clients actifs',
    value: 328,
    icon: Users,
    description: '45 nouveaux ce mois',
    sparklineData: sparklineDataUptrend,
    trend: 18,
    color: 'primary',
    actions: (
      <div className="flex gap-2">
        <ButtonUnified size="sm" variant="outline">
          Voir liste
        </ButtonUnified>
        <ButtonUnified size="sm">Exporter</ButtonUnified>
      </div>
    ),
  },
};

// ============================================
// INTERACTIVE
// ============================================

export const Clickable: Story = {
  args: {
    variant: 'elegant',
    title: 'Produits en stock',
    value: '1,234',
    icon: Package,
    description: 'Cliquez pour voir le détail',
    trend: 8,
    onClick: () => alert('Navigation vers le stock'),
  },
};

export const ClickableGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <KPICardUnified
        variant="compact"
        title="Produits"
        value="1,234"
        icon={Package}
        trend={12}
        onClick={() => alert('Navigation vers produits')}
      />
      <KPICardUnified
        variant="compact"
        title="Clients"
        value="328"
        icon={Users}
        trend={8}
        onClick={() => alert('Navigation vers clients')}
      />
      <KPICardUnified
        variant="compact"
        title="Commandes"
        value="42"
        icon={ShoppingCart}
        trend={-5}
        onClick={() => alert('Navigation vers commandes')}
      />
      <KPICardUnified
        variant="compact"
        title="CA"
        value="€45K"
        icon={DollarSign}
        trend={15}
        onClick={() => alert('Navigation vers finance')}
      />
    </div>
  ),
};

// ============================================
// DASHBOARD LAYOUT
// ============================================

export const CompactDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 max-w-5xl">
      <KPICardUnified
        variant="compact"
        title="Produits actifs"
        value="1,234"
        icon={Package}
        trend={12}
        color="primary"
      />
      <KPICardUnified
        variant="compact"
        title="Chiffre d'affaires"
        value="€45K"
        icon={DollarSign}
        trend={8.5}
        color="success"
      />
      <KPICardUnified
        variant="compact"
        title="Clients"
        value="328"
        icon={Users}
        trend={15}
        color="accent"
      />
      <KPICardUnified
        variant="compact"
        title="Commandes"
        value="42"
        icon={ShoppingCart}
        trend={-5}
        color="warning"
      />
    </div>
  ),
};

export const ElegantDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 max-w-5xl">
      <KPICardUnified
        variant="elegant"
        title="Chiffre d'affaires"
        value="€45,231"
        icon={DollarSign}
        description="vs mois dernier"
        trend={8.5}
        color="success"
      />
      <KPICardUnified
        variant="elegant"
        title="Nouveaux clients"
        value="45"
        icon={Users}
        description="Objectif : 50/mois"
        trend={12}
        color="primary"
      />
      <KPICardUnified
        variant="elegant"
        title="Taux de conversion"
        value="12.5%"
        icon={Target}
        description="Moyenne industrie : 10%"
        trend={2.5}
        color="success"
      />
    </div>
  ),
};

export const DetailedDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <KPICardUnified
        variant="detailed"
        title="Ventes hebdomadaires"
        value="€12,450"
        icon={DollarSign}
        description="+€2,250 vs semaine dernière"
        sparklineData={sparklineDataUptrend}
        trend={18}
        color="success"
        actions={
          <ButtonUnified size="sm" variant="outline">
            Voir détails
          </ButtonUnified>
        }
      />
      <KPICardUnified
        variant="detailed"
        title="Activité utilisateurs"
        value="2,450"
        icon={Activity}
        description="Actions ce mois"
        sparklineData={sparklineDataVolatile}
        trend={12}
        color="primary"
        actions={
          <ButtonUnified size="sm" variant="outline">
            Exporter
          </ButtonUnified>
        }
      />
    </div>
  ),
};

// ============================================
// MIXED LAYOUT
// ============================================

export const MixedDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 max-w-6xl">
      {/* Row 1: Compact KPIs */}
      <KPICardUnified
        variant="compact"
        title="Produits"
        value="1,234"
        icon={Package}
        trend={12}
      />
      <KPICardUnified
        variant="compact"
        title="Clients"
        value="328"
        icon={Users}
        trend={8}
      />
      <KPICardUnified
        variant="compact"
        title="Commandes"
        value="42"
        icon={ShoppingCart}
        trend={-5}
      />
      <KPICardUnified
        variant="compact"
        title="CA"
        value="€45K"
        icon={DollarSign}
        trend={15}
      />

      {/* Row 2: Elegant + Detailed */}
      <div className="col-span-2">
        <KPICardUnified
          variant="elegant"
          title="Chiffre d'affaires mensuel"
          value="€145,231"
          icon={DollarSign}
          description="Objectif : €150K"
          trend={8.5}
          color="success"
        />
      </div>
      <div className="col-span-2">
        <KPICardUnified
          variant="detailed"
          title="Activité 7 derniers jours"
          value="2,450"
          icon={Activity}
          sparklineData={sparklineDataUptrend}
          trend={12}
          actions={<ButtonUnified size="sm">Détails</ButtonUnified>}
        />
      </div>
    </div>
  ),
};
