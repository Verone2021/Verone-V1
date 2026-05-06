'use client';

/**
 * Page de création d'un nouveau template email (BO-MSG-014).
 * Le slug est généré automatiquement depuis le nom (slugify) — l'utilisateur
 * peut l'override avant d'enregistrer.
 */

import React, { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ButtonUnified, Input } from '@verone/ui';
import {
  AlertCircle,
  ArrowLeft,
  Code,
  Mail,
  Save,
  Tag,
  Type,
} from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateEmailTemplatePage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [category, setCategory] = useState('general');
  const [brand, setBrand] = useState<'verone' | 'linkme' | 'all' | ''>('');
  const [defaultAlias, setDefaultAlias] = useState<
    'contact' | 'commandes' | ''
  >('');
  const [tagsInput, setTagsInput] = useState('');
  const [variablesInput, setVariablesInput] = useState('');

  // Auto-slug si l'utilisateur n'a pas modifié le slug manuellement
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const handleSave = useCallback(async () => {
    setError(null);

    if (!name.trim() || !slug.trim() || !subject.trim() || !htmlBody.trim()) {
      setError('Nom, slug, sujet et corps HTML sont obligatoires.');
      return;
    }

    try {
      setSaving(true);
      const variables = variablesInput
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error: insertError } = await supabase
        .from('email_templates')
        .insert({
          name,
          slug,
          subject,
          html_body: htmlBody,
          body_text: bodyText.trim() === '' ? null : bodyText,
          category,
          brand: brand === '' ? null : brand,
          default_alias: defaultAlias === '' ? null : defaultAlias,
          tags,
          variables,
          active: true,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(
            `Un template avec le slug « ${slug} » existe déjà. Choisis un slug différent.`
          );
        }
        throw insertError;
      }

      router.push(`/parametres/emails/${slug}/edit`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      console.error('[CreateEmailTemplate]', err);
    } finally {
      setSaving(false);
    }
  }, [
    name,
    slug,
    subject,
    htmlBody,
    bodyText,
    category,
    brand,
    defaultAlias,
    tagsInput,
    variablesInput,
    supabase,
    router,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => router.push('/parametres/emails')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </ButtonUnified>
            <Mail className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">
                Nouveau template
              </h1>
              <p className="text-gray-600">
                Crée un modèle de mail (devis, facture, relance, etc.)
              </p>
            </div>
          </div>
          <ButtonUnified
            variant="success"
            disabled={saving}
            onClick={() => {
              void handleSave().catch(err =>
                console.error('[CreateEmailTemplate] handleSave failed:', err)
              );
            }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Création...' : 'Créer'}
          </ButtonUnified>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Nom du template
              </label>
            </div>
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Relance facture impayée"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Slug (identifiant URL)
              </label>
            </div>
            <Input
              type="text"
              value={slug}
              onChange={e => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="relance-facture-impayee"
            />
            <p className="text-xs text-gray-500 mt-2">
              Auto-généré depuis le nom. Modifiable. Doit être unique.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Sujet du mail
              </label>
            </div>
            <Input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Relance facture {{invoiceNumber}}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez {`{{variableName}}`} pour insérer des variables
              dynamiques.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Corps HTML
              </label>
            </div>
            <textarea
              value={htmlBody}
              onChange={e => setHtmlBody(e.target.value)}
              className="w-full min-h-[400px] p-4 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="<p>Bonjour {{clientName}},</p>..."
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Version texte (fallback)
              </label>
            </div>
            <textarea
              value={bodyText}
              onChange={e => setBodyText(e.target.value)}
              className="w-full min-h-[160px] p-4 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Optionnel — utile pour la délivrabilité."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Catégorie
              </label>
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="general">Général</option>
              <option value="linkme">LinkMe</option>
              <option value="orders">Commandes</option>
              <option value="invoices">Factures</option>
              <option value="quotes">Devis</option>
              <option value="payment_reminders">Relances paiement</option>
              <option value="contact_requests">Demandes de contact</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">Marque</label>
            </div>
            <select
              value={brand}
              onChange={e =>
                setBrand(e.target.value as 'verone' | 'linkme' | 'all' | '')
              }
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">— Non spécifié —</option>
              <option value="all">Toutes</option>
              <option value="verone">Vérone</option>
              <option value="linkme">LinkMe</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Alias par défaut
              </label>
            </div>
            <select
              value={defaultAlias}
              onChange={e =>
                setDefaultAlias(e.target.value as 'contact' | 'commandes' | '')
              }
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">— Non spécifié —</option>
              <option value="contact">contact@</option>
              <option value="commandes">commandes@</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-black">
                Variables disponibles
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Liste séparée par des virgules
              </p>
            </div>
            <textarea
              value={variablesInput}
              onChange={e => setVariablesInput(e.target.value)}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="clientName, invoiceNumber, amount, dueDate"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-black">Tags</label>
              <p className="text-xs text-gray-500 mt-1">
                Liste séparée par des virgules
              </p>
            </div>
            <Input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="relance, urgent, devis"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
