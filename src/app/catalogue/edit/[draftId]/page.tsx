'use client'

import { useRouter } from 'next/navigation'
import { DraftCompletionWizard } from '../../../../components/business/draft-completion-wizard'

interface DraftEditPageProps {
  params: {
    draftId: string
  }
}

export default function DraftEditPage({ params }: DraftEditPageProps) {
  const router = useRouter()
  const { draftId } = params

  const handleCancel = () => {
    router.back()
  }

  const handleSuccess = (productId: string) => {
    // Rediriger vers le produit créé
    router.push(`/catalogue/${productId}`)
  }

  const handleDraftUpdated = () => {
    // Optionnel : rafraîchir ou mettre à jour des données
    console.log('Brouillon mis à jour')
  }

  return (
    <div className="container mx-auto py-6">
      <DraftCompletionWizard
        draftId={draftId}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        onDraftUpdated={handleDraftUpdated}
      />
    </div>
  )
}