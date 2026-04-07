'use client';

import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, Briefcase, ChevronRight } from 'lucide-react';

import {
  formatVolumeM3,
  type StorageOverviewItem,
} from '../../hooks/use-linkme-storage';

export function StorageCard({
  item,
}: {
  item: StorageOverviewItem;
}): React.ReactElement {
  const isEnseigne = item.owner_type === 'enseigne';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              isEnseigne ? 'bg-blue-50' : 'bg-purple-50'
            }`}
          >
            {isEnseigne ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <Briefcase className="h-4 w-4 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">
              {item.owner_name}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1 py-0',
                isEnseigne
                  ? 'border-blue-300 text-blue-700'
                  : 'border-purple-300 text-purple-700'
              )}
            >
              {isEnseigne ? 'Enseigne' : 'Organisation'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {item.total_units}
            </p>
            <p className="text-[10px] text-gray-500">unites</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">
              {formatVolumeM3(item.total_volume_m3)}
            </p>
            <p className="text-[10px] text-gray-500">volume</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {item.products_count}
            </p>
            <p className="text-[10px] text-gray-500">produits</p>
          </div>
        </div>
        {item.billable_volume_m3 > 0 && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-gray-500">Facturable</span>
            <span className="font-semibold text-green-600">
              {formatVolumeM3(item.billable_volume_m3)}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Link
          href={`/canaux-vente/linkme/stockage/${item.owner_type}-${item.owner_id}`}
          className="w-full"
        >
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            Voir details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
