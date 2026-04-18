'use client';

import { colors } from '@verone/ui/design-system';

import { FormSubmissionMessages } from '@/components/form-submission-messages';

import { ActionsCard } from './components/ActionsCard';
import { ContactInfoCard } from './components/ContactInfoCard';
import { InternalNotesCard } from './components/InternalNotesCard';
import { MessageCard } from './components/MessageCard';
import { MetadataCard } from './components/MetadataCard';
import { SubmissionHeader } from './components/SubmissionHeader';
import { useSubmissionDetail } from './hooks';

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    submission,
    formType,
    loading,
    editingStatus,
    editingPriority,
    editingNotes,
    newStatus,
    newPriority,
    newNotes,
    saving,
    setEditingStatus,
    setEditingPriority,
    setEditingNotes,
    setNewStatus,
    setNewPriority,
    setNewNotes,
    saveStatus,
    savePriority,
    saveNotes,
    handleConvertToOrder,
    handleConvertToConsultation,
    handleConvertToSourcing,
    handleConvertToContact,
    handleMarkAsResolved,
  } = useSubmissionDetail(params);

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

  return (
    <div className="min-h-screen bg-white">
      <SubmissionHeader
        submission={submission}
        formType={formType}
        editingStatus={editingStatus}
        editingPriority={editingPriority}
        newStatus={newStatus}
        newPriority={newPriority}
        saving={saving}
        setEditingStatus={setEditingStatus}
        setEditingPriority={setEditingPriority}
        setNewStatus={setNewStatus}
        setNewPriority={setNewPriority}
        saveStatus={saveStatus}
        savePriority={savePriority}
      />

      <div className="w-full p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContactInfoCard submission={submission} />

            <MessageCard submission={submission} />

            <InternalNotesCard
              submission={submission}
              editingNotes={editingNotes}
              newNotes={newNotes}
              saving={saving}
              setEditingNotes={setEditingNotes}
              setNewNotes={setNewNotes}
              saveNotes={saveNotes}
            />

            <FormSubmissionMessages
              submissionId={submission.id}
              contactEmail={submission.email}
              contactName={`${submission.first_name} ${submission.last_name}`}
            />
          </div>

          <div className="space-y-6">
            <MetadataCard submission={submission} formType={formType} />

            <ActionsCard
              onConvertToOrder={handleConvertToOrder}
              onConvertToConsultation={handleConvertToConsultation}
              onConvertToSourcing={handleConvertToSourcing}
              onConvertToContact={handleConvertToContact}
              onMarkAsResolved={handleMarkAsResolved}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
