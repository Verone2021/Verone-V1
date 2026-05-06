'use client';

// ComposeMailModal — modal de composition/reponse de mail (BO-MSG-010).
// 3 modes d'envoi : Copier (HTML), Ouvrir Gmail (text/plain), Envoyer
// directement via /api/gmail/send (BO-MSG-010B, scope gmail.send requis).

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@verone/ui';
import {
  AlertCircle,
  Copy,
  ExternalLink,
  Mail,
  Reply,
  Send,
} from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

import {
  buildGmailComposeUrl,
  fillTemplate,
  stripHtml,
} from './compose-helpers';
import type { EmailMessageEnriched } from './types';

interface EmailTemplateLite {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_body: string;
  body_text: string | null;
  variables: string[];
  category: string | null;
  brand: 'verone' | 'linkme' | 'all' | null;
  default_alias: 'contact' | 'commandes' | null;
}

const TEMPLATE_LIST_COLUMNS =
  'id, name, slug, subject, html_body, body_text, variables, category, brand, default_alias';

interface ComposeMailModalProps {
  open: boolean;
  onClose: () => void;
  /** Si fourni : mode « Répondre à ce mail ». Sinon : mode « Composer nouveau ». */
  replyTo?: EmailMessageEnriched | null;
  /** Marque pré-sélectionnée pour filtrer les templates. */
  defaultBrand?: 'verone' | 'linkme';
}

export function ComposeMailModal({
  open,
  onClose,
  replyTo,
  defaultBrand,
}: ComposeMailModalProps): JSX.Element {
  const supabase = useSupabase();

  const [templates, setTemplates] = useState<EmailTemplateLite[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [fromAlias, setFromAlias] = useState<'contact' | 'commandes'>(
    'contact'
  );
  const [composeBrand, setComposeBrand] = useState<'verone' | 'linkme'>(
    'verone'
  );

  const inferredBrand = useMemo<'verone' | 'linkme' | undefined>(() => {
    if (defaultBrand) return defaultBrand;
    if (replyTo?.brand === 'verone' || replyTo?.brand === 'linkme') {
      return replyTo.brand;
    }
    return undefined;
  }, [defaultBrand, replyTo]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select(TEMPLATE_LIST_COLUMNS)
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[ComposeMail] load templates failed', error);
        return;
      }
      setTemplates(
        ((data ?? []) as unknown as EmailTemplateLite[]).map(t => ({
          ...t,
          variables: Array.isArray(t.variables) ? t.variables : [],
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  useEffect(() => {
    if (!open) return;
    if (replyTo) {
      setTo(replyTo.from_email);
      const baseSubject = replyTo.subject ?? '';
      setSubject(
        baseSubject.startsWith('Re:') ? baseSubject : `Re: ${baseSubject}`
      );
      setBodyHtml('');
      const parentTo = replyTo.to_address.toLowerCase();
      if (parentTo.startsWith('commandes@')) {
        setFromAlias('commandes');
      } else {
        setFromAlias('contact');
      }
      setComposeBrand(replyTo.brand);
    } else {
      setTo('');
      setSubject('');
      setBodyHtml('');
      if (defaultBrand) setComposeBrand(defaultBrand);
    }
    setCc('');
    setSelectedTemplateId('');
    setCopied(false);
    setSendError(null);
    setSendSuccess(false);
  }, [open, replyTo, defaultBrand]);

  const filteredTemplates = useMemo(() => {
    if (!inferredBrand) return templates;
    return templates.filter(
      t => t.brand === null || t.brand === 'all' || t.brand === inferredBrand
    );
  }, [templates, inferredBrand]);

  const contextValues = useMemo<Record<string, string | undefined>>(() => {
    const orgName = replyTo?.organisation?.name;
    const contactFirst = replyTo?.contact?.first_name ?? undefined;
    const contactLast = replyTo?.contact?.last_name ?? undefined;
    const clientName =
      orgName ??
      [contactFirst, contactLast].filter(Boolean).join(' ').trim() ??
      undefined;
    return {
      clientName:
        clientName !== '' && clientName !== undefined
          ? clientName
          : (replyTo?.from_name ?? replyTo?.from_email),
      organisationName: orgName,
      contactFirstName: contactFirst,
      contactLastName: contactLast,
      contactEmail: replyTo?.from_email,
      orderNumber: replyTo?.linked_order_number ?? undefined,
      brand: replyTo?.brand,
      todayDate: new Date().toLocaleDateString('fr-FR'),
    };
  }, [replyTo]);

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const tpl = templates.find(t => t.id === templateId);
      if (!tpl) return;
      setSubject(fillTemplate(tpl.subject, contextValues));
      setBodyHtml(fillTemplate(tpl.html_body, contextValues));
    },
    [templates, contextValues]
  );

  const handleCopyHtml = useCallback(async () => {
    try {
      const text = stripHtml(bodyHtml);
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([bodyHtml], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('[ComposeMail] copy failed', err);
      window.alert(
        'Copie impossible. Selectionne le contenu et copie a la main.'
      );
    }
  }, [bodyHtml]);

  const handleSendDirect = useCallback(async () => {
    setSendError(null);
    setSendSuccess(false);
    if (!to.trim() || !subject.trim() || !bodyHtml.trim()) {
      setSendError('Destinataire, sujet et corps sont obligatoires.');
      return;
    }
    const fromDomain =
      composeBrand === 'verone' ? 'veronecollections.fr' : 'linkme.network';
    const fromAddress = `${fromAlias}@${fromDomain}`;
    try {
      setSending(true);
      const resp = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAddress,
          to,
          cc: cc.trim() === '' ? undefined : cc,
          subject,
          bodyHtml,
          bodyText: stripHtml(bodyHtml),
          threadId: replyTo?.gmail_thread_id ?? undefined,
          inReplyToMessageId: replyTo?.gmail_message_id ?? undefined,
          parentEmailId: replyTo?.id ?? undefined,
          brand: composeBrand,
          templateId:
            selectedTemplateId !== '' ? selectedTemplateId : undefined,
        }),
      });
      const data = (await resp.json().catch(() => null)) as {
        error?: string;
        code?: string;
        hint?: string;
        ok?: boolean;
      } | null;
      if (!resp.ok || !data?.ok) {
        const baseMsg = data?.error ?? `Erreur ${resp.status}`;
        const fullMsg = data?.hint ? `${baseMsg} — ${data.hint}` : baseMsg;
        setSendError(fullMsg);
        return;
      }
      setSendSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[ComposeMail] send failed', err);
      setSendError(
        err instanceof Error ? err.message : "Erreur d'envoi inconnue"
      );
    } finally {
      setSending(false);
    }
  }, [
    to,
    cc,
    subject,
    bodyHtml,
    fromAlias,
    composeBrand,
    replyTo,
    selectedTemplateId,
    onClose,
  ]);

  const handleOpenGmail = useCallback(() => {
    const text = stripHtml(bodyHtml);
    const url = buildGmailComposeUrl({
      to,
      cc,
      subject,
      bodyText: text,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [to, cc, subject, bodyHtml]);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-200">
          <SheetTitle className="flex items-center gap-2">
            {replyTo ? (
              <>
                <Reply className="h-5 w-5" />
                Répondre à {replyTo.from_name ?? replyTo.from_email}
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Nouveau mail
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Envoyer depuis (marque)
              </label>
              <select
                value={composeBrand}
                onChange={e =>
                  setComposeBrand(e.target.value as 'verone' | 'linkme')
                }
                className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="verone">Vérone</option>
                <option value="linkme">LinkMe</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Alias
              </label>
              <select
                value={fromAlias}
                onChange={e =>
                  setFromAlias(e.target.value as 'contact' | 'commandes')
                }
                className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="contact">contact@</option>
                <option value="commandes">commandes@</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Mail envoyé depuis :{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
              {fromAlias}@
              {composeBrand === 'verone'
                ? 'veronecollections.fr'
                : 'linkme.network'}
            </code>
          </p>

          <div>
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={e => handleApplyTemplate(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">— Aucun template —</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.category ? `[${t.category}] ` : ''}
                  {t.name}
                </option>
              ))}
            </select>
            {Object.keys(contextValues).length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Variables disponibles :{' '}
                {Object.entries(contextValues)
                  .filter(([, v]) => v != null && v !== '')
                  .map(([k]) => `{{${k}}}`)
                  .join(', ') || 'aucune'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              À
            </label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="destinataire@exemple.com"
              className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Cc (optionnel)
            </label>
            <input
              type="text"
              value={cc}
              onChange={e => setCc(e.target.value)}
              placeholder="autre@exemple.com"
              className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Sujet du mail"
              className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Message (HTML)
            </label>
            <textarea
              value={bodyHtml}
              onChange={e => setBodyHtml(e.target.value)}
              placeholder="<p>Bonjour…</p>"
              className="mt-1 w-full min-h-[280px] p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Le bouton « Copier » place le HTML dans le presse-papier. Le
              bouton « Ouvrir Gmail » lance Gmail Compose en text/plain (mise en
              forme perdue).
            </p>
          </div>
        </div>

        {sendError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{sendError}</p>
          </div>
        )}
        {sendSuccess && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200">
            <p className="text-sm text-green-800 font-medium">
              Mail envoyé. Fermeture en cours…
            </p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-between bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                void handleCopyHtml();
              }}
              disabled={!bodyHtml.trim()}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copié ✓' : 'Copier'}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenGmail}
              disabled={!to.trim() || !subject.trim()}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans Gmail
            </Button>
            <Button
              variant="default"
              onClick={() => {
                void handleSendDirect();
              }}
              disabled={
                sending || !to.trim() || !subject.trim() || !bodyHtml.trim()
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Envoi…' : 'Envoyer maintenant'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
