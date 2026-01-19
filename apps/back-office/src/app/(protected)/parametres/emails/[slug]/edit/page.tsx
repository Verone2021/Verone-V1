'use client';

import React, { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { ButtonUnified } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Mail,
  Save,
  ArrowLeft,
  Eye,
  AlertCircle,
  CheckCircle2,
  Code,
  Type,
  Tag,
  Power,
} from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_body: string;
  variables: string[];
  category: string | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function EditEmailTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [category, setCategory] = useState('general');
  const [active, setActive] = useState(true);
  const [variablesInput, setVariablesInput] = useState('');

  useEffect(() => {
    loadTemplate();
  }, [slug]);

  async function loadTemplate() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      const templateData = {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables : [],
      };

      setTemplate(templateData as EmailTemplate);
      setName(data.name);
      setSubject(data.subject);
      setHtmlBody(data.html_body);
      setCategory(data.category || 'general');
      setActive(data.active ?? true);
      setVariablesInput(
        Array.isArray(data.variables) ? data.variables.join(', ') : ''
      );
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Impossible de charger le template');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Parse variables
      const variables = variablesInput
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      const { error } = await supabase
        .from('email_templates')
        .update({
          name,
          subject,
          html_body: htmlBody,
          category,
          active,
          variables,
        })
        .eq('slug', slug);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload template to get updated data
      await loadTemplate();
    } catch (error) {
      console.error('Error saving template:', error);
      setError(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
        <p className="mt-4 text-gray-600">Chargement du template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Template introuvable</p>
        <ButtonUnified
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/parametres/emails')}
        >
          Retour à la liste
        </ButtonUnified>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
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
              <h1 className="text-2xl font-bold text-black">Éditer Template</h1>
              <p className="text-gray-600">{template.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => router.push(`/parametres/emails/${slug}/preview`)}
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </ButtonUnified>
            <ButtonUnified
              variant="success"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </ButtonUnified>
          </div>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Template enregistré avec succès
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
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
              placeholder="Ex: Commande LinkMe Approuvée"
            />
          </div>

          {/* Subject */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">
                Sujet de l'email
              </label>
            </div>
            <Input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Votre commande {{orderNumber}} a été approuvée"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez {`{{variableName}}`} pour insérer des variables
            </p>
          </div>

          {/* HTML Body */}
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
              placeholder="HTML du template..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez {`{{variableName}}`} pour insérer des variables. Syntaxe
              Handlebars supportée: {`{{#if condition}}...{{/if}}`}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category */}
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
              <option value="notifications">Notifications</option>
            </select>
          </div>

          {/* Active status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Power className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-black">Statut</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                  active ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Variables */}
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
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="orderNumber, ownerEmail, ownerName"
            />
            <div className="mt-3 flex flex-wrap gap-1">
              {variablesInput
                .split(',')
                .map(v => v.trim())
                .filter(v => v)
                .map(variable => (
                  <code
                    key={variable}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                  >
                    {`{{${variable}}}`}
                  </code>
                ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-black mb-3">Métadonnées</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">Slug:</span>
                <code className="ml-2 bg-white px-2 py-0.5 rounded">
                  {template.slug}
                </code>
              </div>
              <div>
                <span className="font-medium">Créé le:</span>
                <span className="ml-2">
                  {template.created_at
                    ? new Date(template.created_at).toLocaleString('fr-FR')
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Modifié le:</span>
                <span className="ml-2">
                  {template.updated_at
                    ? new Date(template.updated_at).toLocaleString('fr-FR')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
