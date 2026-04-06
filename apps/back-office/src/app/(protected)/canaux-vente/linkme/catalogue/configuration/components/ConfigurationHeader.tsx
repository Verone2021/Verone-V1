import { Settings, Save, RotateCcw, Loader2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';

interface ConfigurationHeaderProps {
  pendingChangesCount: number;
  isPending: boolean;
  handleDiscardAll: () => void;
  handleSaveAll: () => Promise<void>;
}

export function ConfigurationHeader({
  pendingChangesCount,
  isPending,
  handleDiscardAll,
  handleSaveAll,
}: ConfigurationHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Settings className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Configuration des Prix</h1>
            <p className="text-sm text-gray-500">
              Éditez les prix en ligne pour tous les produits du catalogue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingChangesCount > 0 && (
            <>
              <Badge variant="warning" className="mr-2">
                {pendingChangesCount} modification(s)
              </Badge>
              <ButtonV2 variant="outline" size="sm" onClick={handleDiscardAll}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Annuler
              </ButtonV2>
              <ButtonV2
                size="sm"
                onClick={() => {
                  void handleSaveAll().catch(error => {
                    console.error(
                      '[ConfigurationPage] handleSaveAll failed:',
                      error
                    );
                  });
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Sauvegarder tout
              </ButtonV2>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
