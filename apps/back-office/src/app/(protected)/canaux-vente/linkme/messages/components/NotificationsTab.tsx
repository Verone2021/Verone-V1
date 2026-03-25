'use client';

import { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Building2,
  Info,
  Loader2,
  Send,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import type { NotificationSeverity, TargetType } from './types';
import { useEnseignes, useAffiliates, useSendNotification } from './hooks';

// =============================================================================
// SeveritySelector
// =============================================================================

interface SeveritySelectorProps {
  value: NotificationSeverity;
  onChange: (value: NotificationSeverity) => void;
}

function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
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
// NotificationsTab
// =============================================================================

export function NotificationsTab() {
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedEnseigne, setSelectedEnseigne] = useState<string>('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotificationSeverity>('info');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [includeAction, setIncludeAction] = useState(false);

  const { data: enseignes } = useEnseignes();
  const { data: affiliates } = useAffiliates(
    targetType === 'enseigne' ? selectedEnseigne : undefined
  );
  const sendNotification = useSendNotification();

  useEffect(() => {
    setSelectedEnseigne('');
    setSelectedAffiliate('');
  }, [targetType]);

  const getRecipientCount = (): number => {
    if (targetType === 'all') return affiliates?.length ?? 0;
    if (targetType === 'enseigne' && selectedEnseigne)
      return affiliates?.filter(a => a.enseigne_name).length ?? 0;
    if (targetType === 'affiliate' && selectedAffiliate) return 1;
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }
    if (targetType === 'enseigne' && !selectedEnseigne) {
      toast.error('Veuillez selectionner une enseigne');
      return;
    }
    if (targetType === 'affiliate' && !selectedAffiliate) {
      toast.error('Veuillez selectionner un affilie');
      return;
    }
    if (includeAction && (!actionUrl || !actionLabel)) {
      toast.error("Veuillez remplir l'URL et le libelle de l'action");
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="space-y-4">
                <Label className="text-base font-semibold">Destinataires</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      type: 'all' as const,
                      label: 'Tous les affilies',
                      icon: Users,
                      count: affiliates?.length ?? 0,
                    },
                    {
                      type: 'enseigne' as const,
                      label: 'Par enseigne',
                      icon: Building2,
                      count: enseignes?.length ?? 0,
                    },
                    {
                      type: 'affiliate' as const,
                      label: 'Un affilie',
                      icon: User,
                      count: undefined,
                    },
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setTargetType(t.type)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          targetType === t.type
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{t.label}</span>
                        {t.count !== undefined && (
                          <Badge variant="secondary">{t.count}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
                {targetType === 'enseigne' && (
                  <Select
                    value={selectedEnseigne}
                    onValueChange={setSelectedEnseigne}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner une enseigne..." />
                    </SelectTrigger>
                    <SelectContent>
                      {enseignes?.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.affiliate_count} affilie(s))
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {targetType === 'affiliate' && (
                  <Select
                    value={selectedAffiliate}
                    onValueChange={setSelectedAffiliate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un affilie..." />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates?.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.display_name}
                          {a.enseigne_name && (
                            <span className="text-gray-500 ml-2">
                              ({a.enseigne_name})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Type de notification
                </Label>
                <SeveritySelector value={severity} onChange={setSeverity} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-title">Titre *</Label>
                <Input
                  id="notif-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Nouvelle fonctionnalite disponible"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-message">Message *</Label>
                <Textarea
                  id="notif-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Decrivez votre message..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {message.length}/500
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeAction"
                    checked={includeAction}
                    onCheckedChange={checked => setIncludeAction(!!checked)}
                  />
                  <Label htmlFor="includeAction" className="font-normal">
                    Ajouter un bouton d&apos;action (optionnel)
                  </Label>
                </div>
                {includeAction && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="actionLabel">Libelle du bouton</Label>
                      <Input
                        id="actionLabel"
                        value={actionLabel}
                        onChange={e => setActionLabel(e.target.value)}
                        placeholder="Ex: Voir les details"
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
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {getRecipientCount() > 0 ? (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getRecipientCount()} destinataire(s)
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      Selectionnez des destinataires
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

      {/* Preview + Tips */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apercu</CardTitle>
          </CardHeader>
          <CardContent>
            {title || message ? (
              <div
                className={cn(
                  'p-4 rounded-lg border-l-4',
                  severity === 'urgent' && 'bg-red-50 border-red-500',
                  severity === 'important' && 'bg-orange-50 border-orange-500',
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
                  Remplissez le formulaire pour voir l&apos;apercu
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conseils</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Info</strong> : Pour les annonces generales, mises a
                jour mineures
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Important</strong> : Pour les changements qui
                necessitent attention
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Urgent</strong> : Pour les actions requises
                immediatement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
