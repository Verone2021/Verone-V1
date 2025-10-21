/**
 * 📇 Page Contacts - Vérone
 *
 * Gestion centralisée de tous les contacts professionnels
 * (contacts fournisseurs, contacts clients B2B)
 */

'use client'

import { Contact } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { ContactsTab } from '../components/contacts-tab'

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Contacts Professionnels"
        description="Annuaire complet de tous vos contacts fournisseurs et clients professionnels"
        icon={Contact}
      />

      <div className="p-6">
        <ContactsTab />
      </div>
    </div>
  )
}
