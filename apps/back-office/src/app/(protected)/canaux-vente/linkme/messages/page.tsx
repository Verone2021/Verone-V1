'use client';

/**
 * Page Messages - Envoi de notifications aux affiliés LinkMe
 *
 * Permet aux admins Vérone d'envoyer des notifications ciblées aux :
 * - Tous les affiliés
 * - Une enseigne spécifique (tous ses utilisateurs)
 * - Un affilié spécifique
 *
 * Types de notifications :
 * - Info (bleu) : Information générale
 * - Important (orange) : Nécessite attention
 * - Urgent (rouge) : Action requise
 *
 * @module MessagesPage
 * @since 2026-01-22
 */

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { toast } from 'sonner';
import {
  Send,
  Bell,
  Users,
  Building2,
  User,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// =============================================================================
// TYPES
// =============================================================================

type NotificationSeverity = 'info' | 'important' | 'urgent';
type TargetType = 'all' | 'enseigne' | 'affiliate';

interface Enseigne {
  id: string;
  name: string;
  affiliate_count: number;
}

interface Affiliate {
  id: string;
  user_id: string;
  display_name: string;
  enseigne_name: string | null;
}

interface _NotificationHistory {
  id: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
  recipient_count: number;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook pour récupérer les enseignes avec nombre d'affiliés
 */
function useEnseignes() {
  return useQuery({
    queryKey: ['admin-enseignes'],
    queryFn: async () => {
      const supabase = createClient();

      type EnseigneWithCount = {
        id: string;
        name: string;
        linkme_affiliates: Array<{ count: number }>;
      };

      const { data, error } = await supabase
        .from('enseignes')
        .select(
          `
          id,
          name,
          linkme_affiliates!inner(count)
        `
        )
        .order('name')
        .returns<EnseigneWithCount[]>();

      if (error) throw error;

      return (data ?? []).map(e => ({
        id: e.id,
        name: e.name,
        affiliate_count: e.linkme_affiliates?.[0]?.count ?? 0,
      })) as Enseigne[];
    },
  });
}

/**
 * Hook pour récupérer les utilisateurs LinkMe actifs
 * Utilise la vue v_linkme_users qui contient les user_ids
 */
function useAffiliates(enseigneId?: string) {
  return useQuery({
    queryKey: ['admin-affiliates', enseigneId],
    queryFn: async () => {
      const supabase = createClient();

      type LinkMeUser = {
        user_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        enseigne_id: string | null;
        enseigne_name: string | null;
      };

      let query = supabase
        .from('v_linkme_users')
        .select(
          'user_id, email, first_name, last_name, enseigne_id, enseigne_name'
        )
        .eq('is_active', true)
        .not('user_id', 'is', null);

      if (enseigneId) {
        query = query.eq('enseigne_id', enseigneId);
      }

      const { data, error } = await query
        .order('first_name')
        .returns<LinkMeUser[]>();
      if (error) throw error;

      return (data ?? []).map(u => ({
        id: u.user_id,
        user_id: u.user_id,
        display_name:
          `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
        enseigne_name: u.enseigne_name ?? null,
      })) as Affiliate[];
    },
  });
}

/**
 * Hook pour envoyer une notification
 */
function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      title,
      message,
      severity,
      actionUrl,
      actionLabel,
    }: {
      targetType: TargetType;
      targetId?: string;
      title: string;
      message: string;
      severity: NotificationSeverity;
      actionUrl?: string;
      actionLabel?: string;
    }) => {
      const supabase = createClient();

      // Récupérer les user_ids cibles via v_linkme_users
      let userIds: string[] = [];

      type UserIdResult = { user_id: string };

      if (targetType === 'all') {
        const { data } = await supabase
          .from('v_linkme_users')
          .select('user_id')
          .eq('is_active', true)
          .not('user_id', 'is', null)
          .returns<UserIdResult[]>();
        userIds = (data ?? []).map(a => a.user_id).filter(Boolean);
      } else if (targetType === 'enseigne' && targetId) {
        const { data } = await supabase
          .from('v_linkme_users')
          .select('user_id')
          .eq('enseigne_id', targetId)
          .eq('is_active', true)
          .not('user_id', 'is', null)
          .returns<UserIdResult[]>();
        userIds = (data ?? []).map(a => a.user_id).filter(Boolean);
      } else if (targetType === 'affiliate' && targetId) {
        // targetId est déjà le user_id
        userIds = [targetId];
      }

      if (userIds.length === 0) {
        throw new Error('Aucun destinataire trouvé');
      }

      // Créer les notifications pour chaque utilisateur
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'business' as const,
        severity,
        title,
        message,
        action_url: actionUrl ?? null,
        action_label: actionLabel ?? null,
        read: false,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      return { recipientCount: userIds.length };
    },
    onSuccess: async data => {
      toast.success(
        `Notification envoyée à ${data.recipientCount} destinataire(s)`
      );
      await queryClient.invalidateQueries({
        queryKey: ['notification-history'],
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Messages] Erreur envoi notification:', message);
      toast.error("Erreur lors de l'envoi de la notification");
    },
  });
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Sélecteur de sévérité
 */
function SeveritySelector({
  value,
  onChange,
}: {
  value: NotificationSeverity;
  onChange: (value: NotificationSeverity) => void;
}) {
  const options: {
    value: NotificationSeverity;
    label: string;
    icon: typeof Info;
    color: string;
  }[] = [
    {
      value: 'info',
      label: 'Information',
      icon: Info,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      value: 'important',
      label: 'Important',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      value: 'urgent',
      label: 'Urgent',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map(option => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
              value === option.value
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                option.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MessagesPage() {
  const _queryClient = useQueryClient();

  // Form state
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedEnseigne, setSelectedEnseigne] = useState<string>('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotificationSeverity>('info');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [includeAction, setIncludeAction] = useState(false);

  // Queries
  const { data: enseignes, isLoading: _enseignesLoading } = useEnseignes();
  const { data: affiliates, isLoading: _affiliatesLoading } = useAffiliates(
    targetType === 'enseigne' ? selectedEnseigne : undefined
  );

  // Mutation
  const sendNotification = useSendNotification();

  // Reset selections when target type changes
  useEffect(() => {
    setSelectedEnseigne('');
    setSelectedAffiliate('');
  }, [targetType]);

  // Calculate recipient count
  const getRecipientCount = (): number => {
    if (targetType === 'all') {
      return affiliates?.length ?? 0;
    }
    if (targetType === 'enseigne' && selectedEnseigne) {
      return affiliates?.filter(a => a.enseigne_name).length ?? 0;
    }
    if (targetType === 'affiliate' && selectedAffiliate) {
      return 1;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    if (targetType === 'enseigne' && !selectedEnseigne) {
      toast.error('Veuillez sélectionner une enseigne');
      return;
    }

    if (targetType === 'affiliate' && !selectedAffiliate) {
      toast.error('Veuillez sélectionner un affilié');
      return;
    }

    if (includeAction && (!actionUrl || !actionLabel)) {
      toast.error("Veuillez remplir l'URL et le libellé de l'action");
      return;
    }

    sendNotification.mutate({
      targetType,
      targetId:
        targetType === 'enseigne'
          ? selectedEnseigne
          : targetType === 'affiliate'
            ? selectedAffiliate
            : undefined,
      title: title.trim(),
      message: message.trim(),
      severity,
      actionUrl: includeAction ? actionUrl : undefined,
      actionLabel: includeAction ? actionLabel : undefined,
    });

    // Reset form on success
    if (!sendNotification.isPending) {
      setTitle('');
      setMessage('');
      setSeverity('info');
      setActionUrl('');
      setActionLabel('');
      setIncludeAction(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Messages & Notifications
            </h1>
            <p className="text-sm text-gray-500">
              Envoyer des notifications aux affiliés LinkMe
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'envoi */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Nouvelle notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  void handleSubmit(e).catch(error => {
                    console.error('[MessagesPage] handleSubmit failed:', error);
                  });
                }}
                className="space-y-6"
              >
                {/* Destinataires */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Destinataires
                  </Label>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetType('all')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        targetType === 'all'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Users className="h-6 w-6" />
                      <span className="text-sm font-medium">
                        Tous les affiliés
                      </span>
                      <Badge variant="secondary">
                        {affiliates?.length ?? 0}
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType('enseigne')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        targetType === 'enseigne'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Building2 className="h-6 w-6" />
                      <span className="text-sm font-medium">Par enseigne</span>
                      <Badge variant="secondary">
                        {enseignes?.length ?? 0}
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType('affiliate')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        targetType === 'affiliate'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <User className="h-6 w-6" />
                      <span className="text-sm font-medium">Un affilié</span>
                    </button>
                  </div>

                  {/* Sélection enseigne */}
                  {targetType === 'enseigne' && (
                    <Select
                      value={selectedEnseigne}
                      onValueChange={setSelectedEnseigne}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une enseigne..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enseignes?.map(enseigne => (
                          <SelectItem key={enseigne.id} value={enseigne.id}>
                            {enseigne.name} ({enseigne.affiliate_count}{' '}
                            affilié(s))
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Sélection affilié */}
                  {targetType === 'affiliate' && (
                    <Select
                      value={selectedAffiliate}
                      onValueChange={setSelectedAffiliate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un affilié..." />
                      </SelectTrigger>
                      <SelectContent>
                        {affiliates?.map(affiliate => (
                          <SelectItem key={affiliate.id} value={affiliate.id}>
                            {affiliate.display_name}
                            {affiliate.enseigne_name && (
                              <span className="text-gray-500 ml-2">
                                ({affiliate.enseigne_name})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Sévérité */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Type de notification
                  </Label>
                  <SeveritySelector value={severity} onChange={setSeverity} />
                </div>

                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Nouvelle fonctionnalité disponible"
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Décrivez votre message..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {message.length}/500
                  </p>
                </div>

                {/* Action optionnelle */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeAction"
                      checked={includeAction}
                      onCheckedChange={checked => setIncludeAction(!!checked)}
                    />
                    <Label htmlFor="includeAction" className="font-normal">
                      Ajouter un bouton d'action (optionnel)
                    </Label>
                  </div>

                  {includeAction && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="actionLabel">Libellé du bouton</Label>
                        <Input
                          id="actionLabel"
                          value={actionLabel}
                          onChange={e => setActionLabel(e.target.value)}
                          placeholder="Ex: Voir les détails"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actionUrl">URL</Label>
                        <Input
                          id="actionUrl"
                          value={actionUrl}
                          onChange={e => setActionUrl(e.target.value)}
                          placeholder="Ex: /ma-selection"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {getRecipientCount() > 0 ? (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {getRecipientCount()} destinataire(s)
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        Sélectionnez des destinataires
                      </span>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      sendNotification.isPending || getRecipientCount() === 0
                    }
                  >
                    {sendNotification.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer la notification
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              {title || message ? (
                <div
                  className={cn(
                    'p-4 rounded-lg border-l-4',
                    severity === 'urgent' && 'bg-red-50 border-red-500',
                    severity === 'important' &&
                      'bg-orange-50 border-orange-500',
                    severity === 'info' && 'bg-blue-50 border-blue-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        severity === 'urgent' && 'bg-red-100 text-red-600',
                        severity === 'important' &&
                          'bg-orange-100 text-orange-600',
                        severity === 'info' && 'bg-blue-100 text-blue-600'
                      )}
                    >
                      {severity === 'urgent' && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {severity === 'important' && (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {severity === 'info' && <Info className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {title || 'Titre de la notification'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {message || 'Message de la notification...'}
                      </p>
                      {includeAction && actionLabel && (
                        <Button size="sm" className="mt-3">
                          {actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Remplissez le formulaire pour voir l'aperçu
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conseils</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Info</strong> : Pour les annonces générales, mises à
                  jour mineures
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Important</strong> : Pour les changements qui
                  nécessitent attention
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Urgent</strong> : Pour les actions requises
                  immédiatement
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
