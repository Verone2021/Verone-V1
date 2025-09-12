import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface ProprieteBreadcrumbProps {
  propriete: {
    nom: string
    type: string
  }
  currentPage?: string
}

export function ProprieteBreadcrumb({ propriete, currentPage }: ProprieteBreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-gray-600 mb-4">
      <Link href="/dashboard" className="hover:text-gray-900">
        Tableau de bord
      </Link>
      <ChevronRight className="w-4 h-4 mx-2" />
      <Link href="/proprietes" className="hover:text-gray-900">
        Propriétés
      </Link>
      <ChevronRight className="w-4 h-4 mx-2" />
      <span className="text-gray-900 font-medium">
        {propriete.nom}
      </span>
      {currentPage && (
        <>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  )
}