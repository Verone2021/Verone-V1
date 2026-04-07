'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';

interface SidebarLogoProps {
  isExpanded: boolean;
}

/**
 * Section logo de la sidebar — Adaptive (symbole compact / logo expanded).
 */
export function SidebarLogo({ isExpanded }: SidebarLogoProps) {
  return (
    <div className="flex h-16 items-center justify-center border-b border-black px-2">
      {isExpanded ? (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-black/5 transition-colors"
        >
          <Image
            src="/images/verone-logo.png"
            alt="VÉRONE"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      ) : (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className="flex items-center justify-center p-2 rounded-md hover:bg-black/5 transition-colors"
            >
              <Image
                src="/images/verone-symbol.png"
                alt="V"
                width={32}
                height={32}
                className="h-8 object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>VÉRONE - Dashboard</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
