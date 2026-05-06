'use client';

/**
 * ComposeMailModal — modal de composition / réponse de mail (BO-MSG-010A).
 *
 * Stratégie « fallback Gmail » : pas d'envoi direct via Gmail API (sprint
 * BO-MSG-010B après activation du scope gmail.send côté Workspace admin).
 * Le composant pré-remplit le mail à partir d'un template + variables du
 * contexte, puis offre :
 *   1. Copier dans le presse-papier (le contenu html prêt à coller dans Gmail)
 *   2. Ouvrir Gmail compose pré-rempli (URL https://mail.google.com/mail/?view=cm…)
 *
 * Les templates sont stockés dans la table email_templates.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@verone/ui';
import { Copy, ExternalLink, Mail, Reply } from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

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

/**
 * Remplace {{variable}} par la valeur correspondante dans le mapping.
 * Les variables non fournies sont laissées telles quelles, l'utilisateur les
 * complète à la main dans le textarea.
 */
function fillTemplate(
  template: string,
  values: Record<string, string | undefined>
): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, varName) => {
      const v = values[varName as string];
      return v ?? match;
    }
  );
}

/**
 * Construit l'URL Gmail Compose pré-remplie. Documentation Google :
 * https://developers.google.com/gmail/api/guides/uploads (web compose URL).
 *
 * Format : https://mail.google.com/mail/?view=cm&fs=1&to=…&cc=…&su=…&body=…
 *
 * Limite : le body est en text/plain (pas html). Si le template est HTML,
 * on génère une version texte basique via strip-tags. Pour préserver la mise
 * en forme HTML, l'utilisateur doit utiliser le bouton « Copier ».
 */
function buildGmailComposeUrl(args: {
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;
}): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: args.to,
    su: args.subject,
    body: args.bodyText,
  });
  if (args.cc && args.cc.trim() !== '') {
    params.set('cc', args.cc);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Strip basique des balises HTML pour générer un fallback texte. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  // Brand inférée pour pré-filtrer les templates
  const inferredBrand = useMemo<'verone' | 'linkme' | undefined>(() => {
    if (defaultBrand) return defaultBrand;
    if (replyTo?.brand === 'verone' || replyTo?.brand === 'linkme') {
      return replyTo.brand;
    }
    return undefined;
  }, [defaultBrand, replyTo]);

  // Charge les templates actifs (filtrés par brand côté client)
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

  // Pré-remplit lors de l'ouverture (mode reply)
  useEffect(() => {
    if (!open) return;
    if (replyTo) {
      setTo(replyTo.from_email);
      const baseSubject = replyTo.subject ?? '';
      setSubject(
        baseSubject.startsWith('Re:') ? baseSubject : `Re: ${baseSubject}`
      );
      setBodyHtml('');
    } else {
      setTo('');
      setSubject('');
      setBodyHtml('');
    }
    setCc('');
    setSelectedTemplateId('');
    setCopied(false);
  }, [open, replyTo]);

  // Templates filtrés par brand inférée
  const filteredTemplates = useMemo(() => {
    if (!inferredBrand) return templates;
    return templates.filter(
      t => t.brand === null || t.brand === 'all' || t.brand === inferredBrand
    );
  }, [templates, inferredBrand]);

  // Variables disponibles depuis le contexte (mail parent + client)
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
      // Copy en clipboard avec html + texte (compatible Gmail web compose)
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
          {/* Template selector */}
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

          {/* To */}
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

          {/* Cc */}
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

          {/* Subject */}
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

          {/* Body */}
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

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-between bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void handleCopyHtml();
              }}
              disabled={!bodyHtml.trim()}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copié ✓' : 'Copier le mail'}
            </Button>
            <Button
              variant="default"
              onClick={handleOpenGmail}
              disabled={!to.trim() || !subject.trim()}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans Gmail
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
