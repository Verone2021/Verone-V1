'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { ButtonUnified, Input } from '@verone/ui';
import {
  Mail,
  ArrowLeft,
  Eye,
  AlertCircle,
  RefreshCw,
  Code,
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
}

export default function PreviewEmailTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [renderedHtml, setRenderedHtml] = useState('');
  const [showRawHtml, setShowRawHtml] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;

        const variables = Array.isArray(data.variables)
          ? data.variables.filter(v => typeof v === 'string')
          : [];

        const templateData = {
          ...data,
          variables,
        };

        setTemplate(templateData as EmailTemplate);

        // Initialize variable values with placeholders
        const initialValues: Record<string, string> = {};
        variables.forEach((variable: string) => {
          initialValues[variable] = `{{${variable}}}`;
        });
        setVariableValues(initialValues);
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setLoading(false);
      }
    }

    void loadTemplate().catch(error => {
      console.error('[EmailPreviewPage] loadTemplate failed:', error);
    });
  }, [slug, supabase]);

  const renderTemplate = useCallback(() => {
    if (!template) return;

    let html = template.html_body;
    let subject = template.subject;

    // Simple variable replacement (basic Handlebars-like)
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Handle basic conditionals {{#if variable}}...{{/if}}
    // This is a simplified version - real Handlebars would be better
    html = html.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
      (_match: string, varName: string, content: string): string => {
        const value = variableValues[varName];
        return value && value !== `{{${varName}}}` ? content : '';
      }
    );

    setRenderedHtml(html);
  }, [template, variableValues]);

  useEffect(() => {
    if (template) {
      renderTemplate();
    }
  }, [template, renderTemplate]);

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
            <Eye className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">
                Aperçu du Template
              </h1>
              <p className="text-gray-600">{template.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => setShowRawHtml(!showRawHtml)}
            >
              <Code className="h-4 w-4" />
              {showRawHtml ? 'Aperçu' : 'HTML'}
            </ButtonUnified>
            <ButtonUnified variant="outline" size="sm" onClick={renderTemplate}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </ButtonUnified>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Variables sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-black mb-4">
              Valeurs des variables
            </h3>
            <div className="space-y-3">
              {template.variables?.map(variable => (
                <div key={variable}>
                  <label className="text-xs text-gray-600 mb-1 block">
                    {variable}
                  </label>
                  <Input
                    type="text"
                    value={variableValues[variable] ?? ''}
                    onChange={e =>
                      setVariableValues(prev => ({
                        ...prev,
                        [variable]: e.target.value,
                      }))
                    }
                    placeholder={`Valeur pour ${variable}`}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-medium text-gray-600 mb-2">Sujet</h3>
            <p className="text-sm text-black">
              {template.subject.replace(
                /{{(\w+)}}/g,
                (match: string, varName: string): string =>
                  variableValues[varName] ?? match
              )}
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-black">
                  Aperçu de l'email
                </span>
              </div>
            </div>

            {showRawHtml ? (
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                  <code>{renderedHtml}</code>
                </pre>
              </div>
            ) : (
              <div className="p-8 bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
                  <iframe
                    srcDoc={renderedHtml}
                    className="w-full min-h-[600px] border-0"
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
