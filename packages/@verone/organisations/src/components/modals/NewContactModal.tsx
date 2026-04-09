'use client';

/**
 * NewContactModal - Modal 2 etapes pour creer un contact depuis n'importe quelle page
 *
 * Etape 1: Selectionner une organisation (recherche + liste)
 * Etape 2: Formulaire contact via ContactFormModal
 *
 * Utilise quand l'organisation n'est PAS connue a l'avance
 * (page dashboard contacts-organisations, page contacts)
 */

import { useState, useMemo } from 'react';

import {
  useOrganisations,
  getOrganisationDisplayName,
} from '@verone/organisations/hooks';
import type { Organisation } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { colors, spacing } from '@verone/ui';
import { Building2, Search, Loader2 } from 'lucide-react';

import { ContactFormModalWrapper } from './ContactFormModalWrapper';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewContactModal({
  isOpen,
  onClose,
  onSuccess,
}: NewContactModalProps) {
  const { organisations, loading } = useOrganisations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);

  const filteredOrgs = useMemo(() => {
    if (!searchTerm.trim()) return organisations.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return organisations
      .filter(org => {
        const name = getOrganisationDisplayName(org).toLowerCase();
        const email = (org.email ?? '').toLowerCase();
        return name.includes(term) || email.includes(term);
      })
      .slice(0, 20);
  }, [organisations, searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    setSelectedOrg(null);
    onClose();
  };

  const handleContactSuccess = () => {
    setSearchTerm('');
    setSelectedOrg(null);
    onSuccess?.();
    onClose();
  };

  // Etape 2: Formulaire contact
  if (selectedOrg) {
    return (
      <ContactFormModalWrapper
        isOpen
        onClose={handleClose}
        organisationId={selectedOrg.id}
        onSuccess={handleContactSuccess}
      />
    );
  }

  // Etape 1: Selection organisation
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent style={{ maxWidth: 520 }}>
        <DialogHeader>
          <DialogTitle>Nouveau contact</DialogTitle>
        </DialogHeader>

        <p
          style={{
            color: colors.text.subtle,
            fontSize: 14,
            marginBottom: spacing[3],
          }}
        >
          Sélectionnez l&apos;organisation à laquelle rattacher le contact
        </p>

        <div style={{ position: 'relative', marginBottom: spacing[3] }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.subtle,
            }}
          />
          <Input
            placeholder="Rechercher une organisation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36 }}
            autoFocus
          />
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing[6],
            }}
          >
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: colors.text.subtle }}
            />
            <span
              style={{
                marginLeft: spacing[2],
                fontSize: 13,
                color: colors.text.subtle,
              }}
            >
              Chargement...
            </span>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: colors.text.subtle,
              textAlign: 'center',
              padding: spacing[4],
            }}
          >
            Aucune organisation trouvée
          </p>
        ) : (
          <div
            style={{
              maxHeight: 320,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[1],
            }}
          >
            {filteredOrgs.map(org => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    colors.background.hover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'transparent';
                }}
              >
                <Building2
                  size={16}
                  style={{ color: colors.text.subtle, flexShrink: 0 }}
                />
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 500,
                      color: colors.text.DEFAULT,
                    }}
                  >
                    {getOrganisationDisplayName(org)}
                  </span>
                  {org.email && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: colors.text.subtle,
                      }}
                    >
                      {org.email}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: spacing[3],
          }}
        >
          <ButtonV2 variant="ghost" onClick={handleClose}>
            Annuler
          </ButtonV2>
        </div>
      </DialogContent>
    </Dialog>
  );
}
