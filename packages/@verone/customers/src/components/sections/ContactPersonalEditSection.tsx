'use client';

import { User, Save, X, Edit } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { useInlineEdit, type EditableSection } from '@verone/common/hooks';
import type { Contact } from '@verone/types';

interface ContactPersonalEditSectionProps {
  contact: Contact;
  onUpdate: (updatedContact: Partial<Contact>) => void;
  className?: string;
}

export function ContactPersonalEditSection({
  contact,
  onUpdate,
  className,
}: ContactPersonalEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    contactId: contact.id,
    onUpdate: updatedData => {
      onUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour informations personnelles:', error);
    },
  });

  const section: EditableSection = 'personal';
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      first_name: contact.first_name,
      last_name: contact.last_name,
      title: contact.title || '',
      department: contact.department || '',
    });
  };

  const handleSave = async () => {
    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Informations personnelles mises à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handleFieldChange = (field: string, value: string) => {
    updateEditedData(section, { [field]: value.trim() || null });
  };

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informations Personnelles
          </h3>
          <div className="flex space-x-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Prénom *
            </label>
            <input
              type="text"
              value={editData?.first_name || ''}
              onChange={e => handleFieldChange('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Prénom"
              required
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={editData?.last_name || ''}
              onChange={e => handleFieldChange('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Nom de famille"
              required
            />
          </div>

          {/* Titre/Poste */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Titre/Poste
            </label>
            <input
              type="text"
              value={editData?.title || ''}
              onChange={e => handleFieldChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Directeur Commercial, Chef de Projet..."
            />
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Département
            </label>
            <input
              type="text"
              value={editData?.department || ''}
              onChange={e => handleFieldChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Commercial, Support, Production..."
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage
  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <User className="h-5 w-5 mr-2" />
          Informations Personnelles
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-black opacity-70">Prénom:</span>
          <div className="text-lg font-semibold text-black">
            {contact.first_name}
          </div>
        </div>

        <div>
          <span className="text-sm text-black opacity-70">Nom:</span>
          <div className="text-lg font-semibold text-black">
            {contact.last_name}
          </div>
        </div>

        {contact.title && (
          <div>
            <span className="text-sm text-black opacity-70">Titre/Poste:</span>
            <div className="text-sm text-black">{contact.title}</div>
          </div>
        )}

        {contact.department && (
          <div>
            <span className="text-sm text-black opacity-70">Département:</span>
            <div className="text-sm text-black">{contact.department}</div>
          </div>
        )}

        {!contact.title && !contact.department && (
          <div className="col-span-2 text-center text-gray-400 text-xs italic py-2">
            Aucune information complémentaire renseignée
          </div>
        )}
      </div>
    </div>
  );
}
