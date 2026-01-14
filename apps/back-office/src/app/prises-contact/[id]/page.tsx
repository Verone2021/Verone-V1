/**
 * Page: Détail Prise de Contact - Vérone Back Office
 * Vue détaillée d'une soumission de formulaire avec actions
 *
 * Features:
 * - Informations complètes du contact
 * - Historique des messages
 * - Actions: changer statut, priorité, assigner
 * - Conversion vers commande/consultation/sourcing
 * - Notes internes
 */

'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ButtonUnified } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
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
  role: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  sla_deadline: string | null;
  metadata: any;
  internal_notes: string | null;
};

type FormType = {
  code: string;
  label: string;
  description: string | null;
  icon: string | null;
  sla_hours: number | null;
};

/**
 * Page détail
 */
export default function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [formType, setFormType] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch submission (using any to bypass type checking for new table)
        const { data: sub, error: subError } = await (supabase as any)
          .from('form_submissions')
          .select('*')
          .eq('id', params.id)
          .single();

        if (subError) throw subError;
        if (!sub) {
          router.push('/prises-contact');
          return;
        }

        setSubmission(sub);
        setNewStatus(sub.status);
        setNewPriority(sub.priority);
        setNewNotes(sub.internal_notes || '');

        // Fetch form type (using any to bypass type checking for new table)
        const { data: type, error: typeError } = await (supabase as any)
          .from('form_types')
          .select('*')
          .eq('code', sub.form_type)
          .single();

        if (!typeError && type) {
          setFormType(type);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, router]);

  // Save status
  const saveStatus = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from('form_submissions')
        .update({ status: newStatus })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({ ...submission, status: newStatus });
      setEditingStatus(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setSaving(false);
    }
  };

  // Save priority
  const savePriority = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from('form_submissions')
        .update({ priority: newPriority })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({ ...submission, priority: newPriority });
      setEditingPriority(false);
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Erreur lors de la mise à jour de la priorité');
    } finally {
      setSaving(false);
    }
  };

  // Save notes
  const saveNotes = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from('form_submissions')
        .update({ internal_notes: newNotes || null })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({ ...submission, internal_notes: newNotes || null });
      setEditingNotes(false);
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Erreur lors de la mise à jour des notes');
    } finally {
      setSaving(false);
    }
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
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  const timeAgo = formatDistanceToNow(new Date(submission.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const createdDate = format(new Date(submission.created_at), 'PPPp', {
    locale: fr,
  });

  // Status options
  const statusOptions = [
    { value: 'new', label: '🆕 Nouveau' },
    { value: 'in_progress', label: '⏳ En cours' },
    { value: 'waiting', label: '⏸️ En attente' },
    { value: 'resolved', label: '✅ Résolu' },
    { value: 'closed', label: '🔒 Fermé' },
    { value: 'spam', label: '🚫 Spam' },
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: '🔵 Basse' },
    { value: 'medium', label: '🟡 Moyenne' },
    { value: 'high', label: '🟠 Haute' },
    { value: 'urgent', label: '🔴 URGENT' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="border-b"
        style={{
          padding: `${spacing[4]} ${spacing[6]}`,
          borderColor: colors.neutral[200],
        }}
      >
        <Link
          href="/prises-contact"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: colors.text.subtle }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: colors.text.DEFAULT }}
            >
              {submission.first_name} {submission.last_name}
            </h1>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              {formType?.label || submission.form_type} • {createdDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status editor */}
            {editingStatus ? (
              <div className="flex items-center gap-2">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="px-3 py-1 rounded-md border text-sm"
                  style={{ borderColor: colors.neutral[300] }}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ButtonUnified
                  variant="default"
                  size="sm"
                  onClick={saveStatus}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </ButtonUnified>
                <ButtonUnified
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingStatus(false);
                    setNewStatus(submission.status);
                  }}
                >
                  <X className="h-4 w-4" />
                </ButtonUnified>
              </div>
            ) : (
              <ButtonUnified
                variant="secondary"
                size="sm"
                onClick={() => setEditingStatus(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                {statusOptions.find(s => s.value === submission.status)
                  ?.label || submission.status}
              </ButtonUnified>
            )}

            {/* Priority editor */}
            {editingPriority ? (
              <div className="flex items-center gap-2">
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="px-3 py-1 rounded-md border text-sm"
                  style={{ borderColor: colors.neutral[300] }}
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ButtonUnified
                  variant="default"
                  size="sm"
                  onClick={savePriority}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </ButtonUnified>
                <ButtonUnified
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPriority(false);
                    setNewPriority(submission.priority);
                  }}
                >
                  <X className="h-4 w-4" />
                </ButtonUnified>
              </div>
            ) : (
              <ButtonUnified
                variant="secondary"
                size="sm"
                onClick={() => setEditingPriority(true)}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                {priorityOptions.find(p => p.value === submission.priority)
                  ?.label || submission.priority}
              </ButtonUnified>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[6] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact info card */}
            <div
              className="border rounded-lg"
              style={{
                borderColor: colors.neutral[200],
                padding: spacing[4],
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.DEFAULT }}
              >
                Informations de contact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail
                    className="h-5 w-5 mt-0.5"
                    style={{ color: colors.text.muted }}
                  />
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: colors.text.muted }}
                    >
                      Email
                    </p>
                    <a
                      href={`mailto:${submission.email}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: colors.primary[600] }}
                    >
                      {submission.email}
                    </a>
                  </div>
                </div>

                {submission.phone && (
                  <div className="flex items-start gap-3">
                    <Phone
                      className="h-5 w-5 mt-0.5"
                      style={{ color: colors.text.muted }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: colors.text.muted }}
                      >
                        Téléphone
                      </p>
                      <a
                        href={`tel:${submission.phone}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: colors.primary[600] }}
                      >
                        {submission.phone}
                      </a>
                    </div>
                  </div>
                )}

                {submission.company_name && (
                  <div className="flex items-start gap-3">
                    <Building2
                      className="h-5 w-5 mt-0.5"
                      style={{ color: colors.text.muted }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: colors.text.muted }}
                      >
                        Entreprise
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.DEFAULT }}
                      >
                        {submission.company_name}
                      </p>
                    </div>
                  </div>
                )}

                {submission.role && (
                  <div className="flex items-start gap-3">
                    <User
                      className="h-5 w-5 mt-0.5"
                      style={{ color: colors.text.muted }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: colors.text.muted }}
                      >
                        Fonction
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.DEFAULT }}
                      >
                        {submission.role}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message card */}
            <div
              className="border rounded-lg"
              style={{
                borderColor: colors.neutral[200],
                padding: spacing[4],
              }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: colors.text.DEFAULT }}
              >
                {submission.subject || 'Message'}
              </h2>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: colors.text.subtle }}
              >
                {submission.message}
              </p>
            </div>

            {/* Internal notes */}
            <div
              className="border rounded-lg"
              style={{
                borderColor: colors.neutral[200],
                padding: spacing[4],
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Notes internes
                </h2>
                {!editingNotes && (
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </ButtonUnified>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-md border text-sm"
                    style={{ borderColor: colors.neutral[300] }}
                    placeholder="Ajoutez des notes internes..."
                  />
                  <div className="flex items-center gap-2">
                    <ButtonUnified
                      variant="default"
                      size="sm"
                      onClick={saveNotes}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </ButtonUnified>
                    <ButtonUnified
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNotes(false);
                        setNewNotes(submission.internal_notes || '');
                      }}
                    >
                      Annuler
                    </ButtonUnified>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: colors.text.subtle }}
                >
                  {submission.internal_notes || 'Aucune note'}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata card */}
            <div
              className="border rounded-lg"
              style={{
                borderColor: colors.neutral[200],
                padding: spacing[4],
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text.DEFAULT }}
              >
                Métadonnées
              </h3>

              <div className="space-y-3">
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: colors.text.muted }}
                  >
                    Source
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    {submission.source}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: colors.text.muted }}
                  >
                    Créé
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    {timeAgo}
                  </p>
                </div>

                {formType?.sla_hours && submission.sla_deadline && (
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: colors.text.muted }}
                    >
                      Deadline SLA ({formType.sla_hours}h)
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.text.DEFAULT }}
                    >
                      {format(new Date(submission.sla_deadline), 'PPp', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}

                {submission.metadata &&
                  Object.keys(submission.metadata).length > 0 && (
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: colors.text.muted }}
                      >
                        Données additionnelles
                      </p>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(submission.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
              </div>
            </div>

            {/* Actions card */}
            <div
              className="border rounded-lg"
              style={{
                borderColor: colors.neutral[200],
                padding: spacing[4],
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text.DEFAULT }}
              >
                Actions rapides
              </h3>

              <div className="space-y-2">
                <ButtonUnified
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    alert('Conversion vers commande - Fonctionnalité à venir')
                  }
                >
                  Convertir en commande
                </ButtonUnified>

                <ButtonUnified
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    alert(
                      'Conversion vers consultation - Fonctionnalité à venir'
                    )
                  }
                >
                  Créer une consultation
                </ButtonUnified>

                <ButtonUnified
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    alert('Conversion vers sourcing - Fonctionnalité à venir')
                  }
                >
                  Créer un sourcing
                </ButtonUnified>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
