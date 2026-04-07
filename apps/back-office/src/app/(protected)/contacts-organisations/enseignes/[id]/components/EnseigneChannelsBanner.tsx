'use client';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, Sparkles, Globe, Store } from 'lucide-react';

import type { EnseigneChannel } from '../types';

interface EnseigneChannelsBannerProps {
  channels: EnseigneChannel[];
}

export function EnseigneChannelsBanner({
  channels,
}: EnseigneChannelsBannerProps) {
  if (channels.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Store className="h-4 w-4" />
            Canaux de vente:
          </span>
          <div className="flex flex-wrap gap-2">
            {channels.map(channel => (
              <Link key={channel.code} href={channel.link}>
                <Badge
                  variant={channel.isActive ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer hover:opacity-80 transition-opacity',
                    channel.code === 'linkme' &&
                      'bg-purple-600 hover:bg-purple-700 text-white',
                    channel.code === 'site-internet' &&
                      'bg-blue-600 hover:bg-blue-700 text-white',
                    channel.code === 'b2b' &&
                      'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  {channel.code === 'linkme' && (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  {channel.code === 'site-internet' && (
                    <Globe className="h-3 w-3 mr-1" />
                  )}
                  {channel.code === 'b2b' && (
                    <Building2 className="h-3 w-3 mr-1" />
                  )}
                  {channel.name}
                  {!channel.isActive && (
                    <span className="ml-1 text-xs opacity-70">(inactif)</span>
                  )}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
