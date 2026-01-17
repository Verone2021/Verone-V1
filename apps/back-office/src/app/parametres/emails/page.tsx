'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { ButtonUnified } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Mail,
  Search,
  Edit,
  Eye,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
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

export default function EmailTemplatesPage() {
  const supabase = useSupabase();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      const templates = (data || []).map(item => ({
        ...item,
        variables: Array.isArray(item.variables) ? item.variables : [],
      }));
      setTemplates(templates as EmailTemplate[]);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(templates.map(t => t.category).filter((c): c is string => c !== null))
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">
                Templates Email
              </h1>
              <p className="text-gray-600">
                Gérer les modèles d'emails automatiques
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredTemplates.length} template
          {filteredTemplates.length > 1 ? 's' : ''} trouvé
          {filteredTemplates.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
          <p className="mt-4 text-gray-600">Chargement des templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchQuery || categoryFilter !== 'all'
              ? 'Aucun template trouvé avec ces filtres'
              : 'Aucun template disponible'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black">
                      {template.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {template.category}
                    </span>
                    {template.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Sujet: <span className="font-medium">{template.subject}</span>
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">
                      Slug: <code className="bg-gray-100 px-2 py-0.5 rounded">{template.slug}</code>
                    </span>
                  </div>

                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="text-xs text-gray-500 mr-2">
                        Variables disponibles:
                      </span>
                      {template.variables.map(variable => (
                        <code
                          key={variable}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                        >
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    Mis à jour le{' '}
                    {template.updated_at
                      ? new Date(template.updated_at).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/parametres/emails/${template.slug}/preview`}>
                    <ButtonUnified variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </ButtonUnified>
                  </Link>
                  <Link href={`/parametres/emails/${template.slug}/edit`}>
                    <ButtonUnified variant="default" size="sm">
                      <Edit className="h-4 w-4" />
                      Éditer
                    </ButtonUnified>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
