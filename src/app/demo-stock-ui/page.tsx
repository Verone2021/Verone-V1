'use client'

/**
 * 🎨 Demo Page - Stock UI Components
 *
 * Page de démonstration des composants @verone/ui-stock
 * Design System V2 - Best Practices 2025
 */

import { useState } from 'react'
import { Package, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react'
import {
  ChannelBadge,
  ChannelFilter,
  StockMovementCard,
  StockKPICard,
} from '@/components/ui-v2/stock'

export default function DemoStockUIPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">
            Stock UI Components - Demo
          </h1>
          <p className="text-gray-500 mt-2">
            Package @verone/ui-stock - Design System V2 - Phase 3.1
          </p>
        </div>

        {/* Section 1: Channel Badges */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Channel Badges
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Taille Small</p>
              <div className="flex flex-wrap gap-2">
                <ChannelBadge channelCode="b2b" size="sm" />
                <ChannelBadge channelCode="ecommerce" size="sm" />
                <ChannelBadge channelCode="retail" size="sm" />
                <ChannelBadge channelCode="wholesale" size="sm" />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Taille Medium (default)</p>
              <div className="flex flex-wrap gap-2">
                <ChannelBadge channelCode="b2b" size="md" />
                <ChannelBadge channelCode="ecommerce" size="md" />
                <ChannelBadge channelCode="retail" size="md" />
                <ChannelBadge channelCode="wholesale" size="md" />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Taille Large</p>
              <div className="flex flex-wrap gap-2">
                <ChannelBadge channelCode="b2b" size="lg" />
                <ChannelBadge channelCode="ecommerce" size="lg" />
                <ChannelBadge channelCode="retail" size="lg" />
                <ChannelBadge channelCode="wholesale" size="lg" />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Sans icône</p>
              <div className="flex flex-wrap gap-2">
                <ChannelBadge channelCode="b2b" showIcon={false} />
                <ChannelBadge channelCode="ecommerce" showIcon={false} />
                <ChannelBadge channelCode="retail" showIcon={false} />
                <ChannelBadge channelCode="wholesale" showIcon={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Channel Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Channel Filter (avec fetch Supabase)
          </h2>

          <div className="space-y-4">
            <ChannelFilter
              selectedChannel={selectedChannel}
              onChannelChange={setSelectedChannel}
              showAllOption
            />

            <div className="text-sm text-gray-600">
              Canal sélectionné: {selectedChannel || 'Tous les canaux'}
            </div>
          </div>
        </div>

        {/* Section 3: Stock Movement Cards */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            3. Stock Movement Cards
          </h2>

          <div className="space-y-4">
            <StockMovementCard
              movement={{
                id: 'mvt-001-abc123',
                movement_type: 'IN',
                quantity_change: 50,
                reason_code: 'PURCHASE',
                performed_at: '2025-10-31T10:30:00Z',
                channel_id: 'ch-1',
                products: {
                  name: 'Canapé Oslo 3 places',
                  sku: 'CANAPE-OSLO-3P',
                },
                sales_channels: {
                  name: 'E-commerce',
                  code: 'ecommerce',
                },
              }}
              onClick={() => alert('Clicked: Entrée stock')}
            />

            <StockMovementCard
              movement={{
                id: 'mvt-002-def456',
                movement_type: 'OUT',
                quantity_change: -15,
                reason_code: 'SALE',
                performed_at: '2025-10-31T14:45:00Z',
                channel_id: 'ch-2',
                products: {
                  name: 'Fauteuil Scandinave Velours',
                  sku: 'FAUT-SCAND-VEL',
                },
                sales_channels: {
                  name: 'B2B',
                  code: 'b2b',
                },
              }}
              onClick={() => alert('Clicked: Sortie stock')}
            />

            <StockMovementCard
              movement={{
                id: 'mvt-003-ghi789',
                movement_type: 'ADJUST',
                quantity_change: 5,
                reason_code: 'INVENTORY_CHECK',
                performed_at: '2025-10-31T16:20:00Z',
                products: {
                  name: 'Table basse Marbre',
                  sku: 'TABLE-MARBRE-120',
                },
                sales_channels: null,
              }}
            />

            <StockMovementCard
              movement={{
                id: 'mvt-004-jkl012',
                movement_type: 'TRANSFER',
                quantity_change: 10,
                reason_code: 'WAREHOUSE_TRANSFER',
                performed_at: '2025-10-31T09:15:00Z',
                channel_id: 'ch-3',
                products: {
                  name: 'Lampe sur pied Design',
                  sku: 'LAMP-DESIGN-FL',
                },
                sales_channels: {
                  name: 'Retail',
                  code: 'retail',
                },
              }}
              onClick={() => alert('Clicked: Transfert stock')}
            />
          </div>
        </div>

        {/* Section 4: Stock KPI Cards */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            4. Stock KPI Cards (ultra-compact 80px)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StockKPICard
              title="Total Stock"
              value={12450}
              icon={Package}
              variant="default"
            />

            <StockKPICard
              title="Stock Disponible"
              value={8320}
              icon={TrendingUp}
              variant="success"
              trend={{ value: 12.5, direction: 'up' }}
            />

            <StockKPICard
              title="Alertes Stock Bas"
              value={23}
              icon={AlertTriangle}
              variant="warning"
              trend={{ value: 8.3, direction: 'down' }}
            />

            <StockKPICard
              title="Commandes Pendantes"
              value={156}
              icon={ShoppingCart}
              variant="danger"
              trend={{ value: 15.7, direction: 'up' }}
            />
          </div>
        </div>

        {/* Section 5: Usage Example */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            5. Code Example - Import & Usage
          </h2>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {`import {
  ChannelBadge,
  ChannelFilter,
  StockMovementCard,
  StockKPICard,
  type ChannelCode,
  type MovementType
} from '@/components/ui-v2/stock'

// Usage
<ChannelBadge channelCode="b2b" size="md" showIcon />

<ChannelFilter
  selectedChannel={channel}
  onChannelChange={setChannel}
/>

<StockMovementCard
  movement={movementData}
  onClick={() => navigate(\`/stocks/mouvements/\${id}\`)}
/>

<StockKPICard
  title="Total Stock"
  value={12450}
  icon={Package}
  variant="success"
  trend={{ value: 12.5, direction: 'up' }}
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}
