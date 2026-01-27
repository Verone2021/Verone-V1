/**
 * Page: Prises de Contact - Vérone Back Office
 * Liste et gestion des formulaires soumis
 *
 * Features:
 * - Filtres par statut, priorité, type de formulaire
 * - Grouping par date ou par type
 * - Search bar
 * - Actions: voir détail, marquer résolu, assigner
 * - Design cohérent avec le système
 */

'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import { IconButton } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Mail,
  Search,
  Filter,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Phone,
} from 'lucide-react';

// Types
type FormSubmission = {
  id: string;
  form_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  priority: string;
  created_at: string;
  sla_deadline: string | null;
};

type FormType = {
  code: string;
  label: string;
  icon: string | null;
};

type FilterTab = 'all' | 'new' | 'urgent' | 'by-type';

/**
 * Grouping des soumissions par date
 */
function groupSubmissionsByDate(submissions: FormSubmission[]) {
  const groups: Record<string, FormSubmission[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  submissions.forEach(sub => {
    const date = new Date(sub.created_at);

    if (isToday(date)) {
      groups.today.push(sub);
    } else if (isYesterday(date)) {
      groups.yesterday.push(sub);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      groups.thisWeek.push(sub);
    } else {
      groups.older.push(sub);
    }
  });

  return groups;
}

/**
 * Submission Card Component
 */
interface SubmissionCardProps {
  submission: FormSubmission;
  formTypeLabel: string;
}

const SubmissionCard = ({ submission, formTypeLabel }: SubmissionCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), {
    addSuffix: true,
    locale: fr,
  });

  // Badge de priorité
  const priorityConfig = {
    urgent: {
      className: 'bg-red-500/10 text-red-700 border border-red-200',
      label: '🔴 URGENT',
    },
    high: {
      className: 'bg-orange-500/10 text-orange-700 border border-orange-200',
      label: '🟠 Haute',
    },
    medium: {
      className: 'bg-yellow-500/10 text-yellow-700 border border-yellow-200',
      label: '🟡 Moyenne',
    },
    low: {
      className: 'bg-blue-500/10 text-blue-700 border border-blue-200',
      label: '🔵 Basse',
    },
  }[submission.priority] || {
    className: 'bg-gray-500/10 text-gray-700 border border-gray-200',
    label: 'Normal',
  };

  // Badge de statut
  const statusConfig = {
    new: {
      className: 'bg-green-500/10 text-green-700',
      label: '🆕 Nouveau',
      icon: AlertCircle,
    },
    in_progress: {
      className: 'bg-blue-500/10 text-blue-700',
      label: '⏳ En cours',
      icon: Clock,
    },
    waiting: {
      className: 'bg-orange-500/10 text-orange-700',
      label: '⏸️ En attente',
      icon: Clock,
    },
    resolved: {
      className: 'bg-emerald-500/10 text-emerald-700',
      label: '✅ Résolu',
      icon: CheckCircle,
    },
    closed: {
      className: 'bg-gray-500/10 text-gray-700',
      label: '🔒 Fermé',
      icon: CheckCircle,
    },
  }[submission.status] || {
    className: 'bg-gray-500/10 text-gray-700',
    label: submission.status,
    icon: AlertCircle,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <Link href={`/prises-contact/${submission.id}`}>
      <div
        className={cn(
          'group relative transition-all duration-200',
          'border-b last:border-b-0',
          'hover:bg-neutral-50 cursor-pointer',
          submission.status === 'new' && 'bg-blue-50/30'
        )}
        style={{
          padding: spacing[4],
        }}
      >
        {/* Layout principal */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.neutral[100] }}
          >
            <MessageSquare
              className="h-5 w-5"
              style={{ color: colors.text.muted }}
            />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* En-tête */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <h4
                  className="font-semibold text-[15px] leading-tight mb-1"
                  style={{ color: colors.text.DEFAULT }}
                >
                  {submission.first_name} {submission.last_name}
                  {submission.company_name && (
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: colors.text.subtle }}
                    >
                      ({submission.company_name})
                    </span>
                  )}
                </h4>
                <p
                  className="text-sm mb-1"
                  style={{ color: colors.text.subtle }}
                >
                  {formTypeLabel}
                  {submission.subject && ` • ${submission.subject}`}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md',
                    priorityConfig.className
                  )}
                >
                  {priorityConfig.label}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1',
                    statusConfig.className
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div
              className="flex items-center gap-4 text-xs mb-2"
              style={{ color: colors.text.muted }}
            >
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {submission.email}
              </span>
              {submission.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {submission.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            {/* Message preview */}
            <p
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: colors.text.subtle }}
            >
              {submission.message}
            </p>
          </div>

          {/* Action */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              icon={Eye}
              size="sm"
              label="Voir le détail"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * Group Header Component
 */
interface GroupHeaderProps {
  label: string;
  count: number;
}

const GroupHeader = ({ label, count }: GroupHeaderProps) => (
  <div
    className="sticky top-0 z-10 bg-white border-b"
    style={{
      padding: `${spacing[3]} ${spacing[4]}`,
      borderColor: colors.neutral[200],
    }}
  >
    <div className="flex items-center justify-between">
      <h3
        className="font-semibold text-base"
        style={{ color: colors.text.DEFAULT }}
      >
        {label}
      </h3>
      <span
        className="text-sm font-medium px-2 py-0.5 rounded-md"
        style={{
          backgroundColor: colors.neutral[100],
          color: colors.text.subtle,
        }}
      >
        {count}
      </span>
    </div>
  </div>
);

/**
 * Page principale Prises de Contact
 */
export default function PrisesContactPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormType, setSelectedFormType] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch submissions (using any to bypass type checking for new table)
        const { data: subs, error: subsError } = await (supabase as any)
          .from('form_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (subsError) throw subsError;

        // Fetch form types (using any to bypass type checking for new table)
        const { data: types, error: typesError } = await (supabase as any)
          .from('form_types')
          .select('code, label, icon')
          .eq('enabled', true);

        if (typesError) throw typesError;

        setSubmissions(subs || []);
        setFormTypes(types || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Counts
  const newCount = submissions.filter(s => s.status === 'new').length;
  const urgentCount = submissions.filter(s => s.priority === 'urgent').length;

  // Filtrage
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Filtre par tab
    if (activeTab === 'new') {
      filtered = filtered.filter(s => s.status === 'new');
    } else if (activeTab === 'urgent') {
      filtered = filtered.filter(s => s.priority === 'urgent');
    }

    // Filtre par type
    if (activeTab === 'by-type' && selectedFormType !== 'all') {
      filtered = filtered.filter(s => s.form_type === selectedFormType);
    }

    // Filtre par search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.first_name.toLowerCase().includes(query) ||
          s.last_name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.message.toLowerCase().includes(query) ||
          (s.company_name && s.company_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [submissions, activeTab, selectedFormType, searchQuery]);

  // Grouping
  const groupedSubmissions = useMemo(() => {
    return groupSubmissionsByDate(filteredSubmissions);
  }, [filteredSubmissions]);

  // Labels pour les groupes
  const getGroupLabel = (key: string): string => {
    const labels: Record<string, string> = {
      today: "Aujourd'hui",
      yesterday: 'Hier',
      thisWeek: 'Cette semaine',
      older: 'Plus ancien',
    };
    return labels[key] || key;
  };

  // Get form type label
  const getFormTypeLabel = (code: string): string => {
    const type = formTypes.find(t => t.code === code);
    return type?.label || code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.primary[500] }}
          />
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Chargement des prises de contact...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="sticky top-0 z-20 bg-white border-b"
        style={{
          padding: `${spacing[4]} ${spacing[6]}`,
          borderColor: colors.neutral[200],
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6" style={{ color: colors.text.DEFAULT }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: colors.text.DEFAULT }}
              >
                Prises de Contact
              </h1>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                {submissions.length} formulaire
                {submissions.length > 1 ? 's' : ''}{' '}
                {newCount > 0 &&
                  `• ${newCount} nouveau${newCount > 1 ? 'x' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Toutes
              <span className="ml-2 opacity-70">({submissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'new'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Nouveaux
              {newCount > 0 && (
                <span className="ml-2 opacity-70">({newCount})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('urgent')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'urgent'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Urgent
              <span className="ml-2 opacity-70">({urgentCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('by-type')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'by-type'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              <Filter className="inline h-4 w-4 mr-1" />
              Par type
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[300px] max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: colors.text.muted }}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: colors.neutral[300],
                  color: colors.text.DEFAULT,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4" style={{ color: colors.text.muted }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Type filters */}
        {activeTab === 'by-type' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setSelectedFormType('all')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                selectedFormType === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Tous les types
            </button>
            {formTypes.map(type => (
              <button
                key={type.code}
                onClick={() => setSelectedFormType(type.code)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  selectedFormType === type.code
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {type.icon && `${type.icon} `}
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {filteredSubmissions.length === 0 ? (
          <div
            className="text-center"
            style={{ padding: `${spacing[12]} ${spacing[6]}` }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <Mail className="h-8 w-8" style={{ color: colors.text.muted }} />
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: colors.text.DEFAULT }}
            >
              Aucune prise de contact
            </p>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              {searchQuery
                ? 'Aucun résultat pour votre recherche'
                : 'Les formulaires soumis apparaîtront ici'}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedSubmissions).map(
              ([groupKey, groupSubmissions]) => {
                if (groupSubmissions.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <GroupHeader
                      label={getGroupLabel(groupKey)}
                      count={groupSubmissions.length}
                    />
                    {groupSubmissions.map(submission => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        formTypeLabel={getFormTypeLabel(submission.form_type)}
                      />
                    ))}
                  </div>
                );
              }
            )}
          </>
        )}
      </div>
    </div>
  );
}
