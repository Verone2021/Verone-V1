'use client';

interface CollectionsTabsProps {
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
  activeCount: number;
  archivedCount: number;
}

export function CollectionsTabs({
  activeTab,
  onTabChange,
  activeCount,
  archivedCount,
}: CollectionsTabsProps) {
  return (
    <div className="flex border-b border-gray-200 px-6">
      <button
        onClick={() => onTabChange('active')}
        className={`px-6 py-3 font-medium transition-colors ${
          activeTab === 'active'
            ? 'border-b-2 border-black text-black'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Collections Actives ({activeCount})
      </button>
      <button
        onClick={() => onTabChange('archived')}
        className={`px-6 py-3 font-medium transition-colors ${
          activeTab === 'archived'
            ? 'border-b-2 border-black text-black'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Collections Archivées ({archivedCount})
      </button>
    </div>
  );
}
