'use client';

import Link from 'next/link';

import { Badge, Card, CardContent } from '@verone/ui';
import { cn } from '@verone/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MessageSquare,
  Link2,
  Globe,
  Mail,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedMessage {
  id: string;
  type: 'info_request' | 'form_submission';
  channel: 'linkme' | 'site_internet' | 'other';
  status: string;
  statusLabel: string;
  title: string;
  subtitle: string;
  date: string;
  linkHref: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Status helpers
// ============================================================================

export const INFO_REQUEST_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completee', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulee', color: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expiree', color: 'bg-red-100 text-red-600' },
};

export const FORM_STATUS_MAP: Record<string, { label: string; color: string }> =
  {
    new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
    open: { label: 'En cours', color: 'bg-orange-100 text-orange-700' },
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    replied: { label: 'Repondu', color: 'bg-green-100 text-green-700' },
    closed: { label: 'Cloture', color: 'bg-gray-100 text-gray-600' },
    spam: { label: 'Spam', color: 'bg-red-100 text-red-600' },
  };

export function getInfoRequestStatus(row: Record<string, unknown>): string {
  if (row.cancelled_at) return 'cancelled';
  if (row.completed_at) return 'completed';
  const expiresAt = row.token_expires_at as string | null;
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  return 'pending';
}

// ============================================================================
// MessageCard component
// ============================================================================

export function MessageCard({ message }: { message: UnifiedMessage }) {
  const timeAgo = formatDistanceToNow(new Date(message.date), {
    addSuffix: true,
    locale: fr,
  });

  const channelIcon =
    message.channel === 'linkme' ? (
      <Link2 className="h-3.5 w-3.5" />
    ) : message.channel === 'site_internet' ? (
      <Globe className="h-3.5 w-3.5" />
    ) : (
      <MessageSquare className="h-3.5 w-3.5" />
    );

  const channelLabel =
    message.channel === 'linkme'
      ? 'LinkMe'
      : message.channel === 'site_internet'
        ? 'Site Internet'
        : 'Autre';

  const typeIcon =
    message.type === 'info_request' ? (
      <Mail className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );

  const statusInfo =
    message.type === 'info_request'
      ? (INFO_REQUEST_STATUS_MAP[message.status] ?? {
          label: message.status,
          color: 'bg-gray-100 text-gray-600',
        })
      : (FORM_STATUS_MAP[message.status] ?? {
          label: message.status,
          color: 'bg-gray-100 text-gray-600',
        });

  return (
    <Link href={message.linkHref}>
      <Card
        className={cn(
          'group transition-all duration-150 hover:shadow-md hover:translate-x-0.5 cursor-pointer',
          message.status === 'pending' || message.status === 'new'
            ? 'border-l-4 border-l-orange-400'
            : 'border-l-4 border-l-transparent'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
                message.channel === 'linkme'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-blue-50 text-blue-600'
              )}
            >
              {typeIcon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm truncate">
                  {message.title}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium',
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {message.subtitle}
              </p>

              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  {channelIcon}
                  {channelLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </div>

            <ArrowRight
              className={cn(
                'h-4 w-4 text-muted-foreground/30 transition-all duration-150 flex-shrink-0 mt-2',
                'group-hover:text-foreground group-hover:translate-x-0.5'
              )}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
