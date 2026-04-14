'use client';

/**
 * ValidationSectionWrapper - Wrapper collapsible pour sections de validation
 *
 * @module ValidationSectionWrapper
 * @since 2026-04-14
 */

import {
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@verone/ui';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ValidationSectionWrapperProps {
  sectionKey: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Classes CSS additionnelles pour la Card */
  cardClassName?: string;
  /** Remplacement du sous-titre par un élément custom */
  subtitleElement?: React.ReactNode;
}

export function ValidationSectionWrapper({
  sectionKey,
  title,
  subtitle,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  isOpen,
  onToggle,
  children,
  cardClassName,
  subtitleElement,
}: ValidationSectionWrapperProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className={cn('overflow-hidden', cardClassName)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  iconBgClass
                )}
              >
                <Icon className={cn('h-5 w-5', iconColorClass)} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {subtitleElement ??
                  (subtitle && (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                  ))}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
              data-section={sectionKey}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 border-t">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
