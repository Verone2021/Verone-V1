'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import { AlertTriangle, EyeOff, Loader2, Mail, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { OrderWithMissing } from './types';
import {
  CATEGORY_BADGE_COLORS,
  EMAIL_REGEX,
  getInfoRequestStatus,
} from './types';
import { useSendInfoRequest, useIgnoreField } from './hooks';

interface SendInfoRequestDialogProps {
  order: OrderWithMissing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendInfoRequestDialog({
  order,
  open,
  onOpenChange,
}: SendInfoRequestDialogProps) {
  const details = order.details;
  const requesterEmail = details?.requester_email ?? '';
  const requesterName = details?.requester_name ?? '';
  const ownerEmail = details?.owner_email ?? '';
  const ownerName = details?.owner_name ?? '';

  // Auto-select: requester > owner > manual (fallback when no emails exist)
  const defaultRecipientType: 'requester' | 'owner' | 'manual' = requesterEmail
    ? 'requester'
    : ownerEmail
      ? 'owner'
      : 'manual';

  const [recipientType, setRecipientType] = useState<
    'requester' | 'owner' | 'manual'
  >(defaultRecipientType);
  const [manualEmails, setManualEmails] = useState<string[]>(['']);
  const [customMessage, setCustomMessage] = useState('');
  const sendInfoRequest = useSendInfoRequest();
  const ignoreField = useIgnoreField();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const validManualEmails = manualEmails.filter(e =>
    EMAIL_REGEX.test(e.trim())
  );

  const selectedEmail =
    recipientType === 'manual'
      ? validManualEmails.join(', ')
      : recipientType === 'requester'
        ? requesterEmail
        : ownerEmail;
  const selectedName =
    recipientType === 'manual'
      ? ''
      : recipientType === 'requester'
        ? requesterName
        : ownerName;

  const canSend =
    recipientType === 'manual' ? validManualEmails.length > 0 : !!selectedEmail;

  const pendingRequest = order.infoRequests.find(
    r =>
      r.recipient_type === recipientType &&
      getInfoRequestStatus(r) === 'pending'
  );

  const handleSend = async () => {
    if (!currentUser?.id || !canSend) return;

    await sendInfoRequest.mutateAsync({
      salesOrderId: order.id,
      orderNumber: order.order_number,
      recipientEmail: selectedEmail,
      recipientName: selectedName,
      recipientType,
      organisationName: order.organisationName,
      totalTtc: order.total_ttc,
      requestedFields: order.missingFields.fields.map(f => ({
        key: f.key,
        label: f.label,
        category: f.category,
        inputType: f.inputType,
      })),
      customMessage: customMessage.trim() || undefined,
      sentBy: currentUser.id,
    });

    onOpenChange(false);
    setCustomMessage('');
    setManualEmails(['']);
  };

  const handleAddEmail = () => {
    setManualEmails(prev => [...prev, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setManualEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    setManualEmails(prev => prev.map((e, i) => (i === index ? value : e)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer une demande d&apos;informations</DialogTitle>
          <DialogDescription>
            Commande {order.order_number}
            {order.organisationName ? ` - ${order.organisationName}` : ''} (
            {formatCurrency(order.total_ttc)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Destinataire</Label>
            <div className="space-y-2">
              <label
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  recipientType === 'requester'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !requesterEmail && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="requester"
                  checked={recipientType === 'requester'}
                  onChange={() => setRecipientType('requester')}
                  disabled={!requesterEmail}
                  className="accent-blue-600"
                />
                <div>
                  <div className="font-medium">Responsable</div>
                  <div className="text-sm text-gray-500">
                    {requesterName ? `${requesterName} - ` : ''}
                    {requesterEmail || 'Email non renseigne'}
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  recipientType === 'owner'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !ownerEmail && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="owner"
                  checked={recipientType === 'owner'}
                  onChange={() => setRecipientType('owner')}
                  disabled={!ownerEmail}
                  className="accent-blue-600"
                />
                <div>
                  <div className="font-medium">Responsable (franchise)</div>
                  <div className="text-sm text-gray-500">
                    {ownerName ? `${ownerName} - ` : ''}
                    {ownerEmail || 'Email non renseigne'}
                  </div>
                </div>
              </label>

              {/* Manual email option */}
              <label
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  recipientType === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="manual"
                  checked={recipientType === 'manual'}
                  onChange={() => setRecipientType('manual')}
                  className="accent-blue-600 mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="font-medium">Email manuel</div>
                  {recipientType === 'manual' && (
                    <div className="space-y-2">
                      {manualEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="email"
                            placeholder="email@exemple.fr"
                            value={email}
                            onChange={e =>
                              handleEmailChange(index, e.target.value)
                            }
                            className={cn(
                              'flex-1 h-8 text-sm',
                              email.trim() &&
                                !EMAIL_REGEX.test(email.trim()) &&
                                'border-red-300 focus-visible:ring-red-500'
                            )}
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(index)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter un destinataire
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Missing fields with ignore buttons */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Champs manquants ({order.missingFields.total})
            </Label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {order.missingFields.fields.map(f => (
                <div
                  key={f.key}
                  className="flex items-center gap-2 text-sm group"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs flex-shrink-0',
                      CATEGORY_BADGE_COLORS[f.category]
                    )}
                  >
                    {f.category}
                  </Badge>
                  <span className="flex-1">{f.label}</span>
                  {order.detailsId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              if (!order.detailsId) return;
                              void ignoreField
                                .mutateAsync({
                                  detailsId: order.detailsId,
                                  currentIgnored: order.ignoredFields,
                                  fieldKey: f.key,
                                })
                                .catch(err => {
                                  console.error(
                                    '[SendInfoRequestDialog] ignoreField failed:',
                                    err
                                  );
                                });
                            }}
                            disabled={ignoreField.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Ignorer ce champ pour cette commande
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
              {order.ignoredFields.length > 0 && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Champs ignores ({order.ignoredFields.length}) :
                  </p>
                  {order.ignoredFields.map(key => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs text-gray-400 group"
                    >
                      <EyeOff className="h-3 w-3 flex-shrink-0" />
                      <span className="line-through flex-1">
                        {key.replace(/_/g, ' ')}
                      </span>
                      {order.detailsId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!order.detailsId) return;
                            void ignoreField
                              .mutateAsync({
                                detailsId: order.detailsId,
                                currentIgnored: order.ignoredFields,
                                fieldKey: key,
                              })
                              .catch(err => {
                                console.error(
                                  '[SendInfoRequestDialog] restoreField failed:',
                                  err
                                );
                              });
                          }}
                          disabled={ignoreField.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500 hover:underline"
                        >
                          Restaurer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom message */}
          <div className="space-y-2">
            <Label htmlFor="customMsg">Message personnalise (optionnel)</Label>
            <Textarea
              id="customMsg"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Ajoutez un message pour le destinataire..."
              rows={3}
            />
          </div>

          {/* Warning if pending */}
          {pendingRequest && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Une demande est deja en attente pour ce destinataire (envoyee le{' '}
                {new Date(pendingRequest.sent_at).toLocaleDateString('fr-FR')}).
                Envoyer une nouvelle demande creera un lien supplementaire.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!canSend && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mr-auto">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {recipientType === 'manual'
                ? 'Saisissez au moins un email valide'
                : 'Aucun email disponible pour ce destinataire'}
            </p>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSend().catch(err => {
                console.error('[SendInfoRequest] failed:', err);
              });
            }}
            disabled={sendInfoRequest.isPending || !canSend}
          >
            {sendInfoRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer la demande
                {recipientType === 'manual' && validManualEmails.length > 1
                  ? ` (${validManualEmails.length})`
                  : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
