'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Package, Grid3x3, Tags, Boxes, FolderKanban, Layers } from 'lucide-react'

export default function ProduitsPage() {
  const router = useRouter()

  const subsections = [
    {
      id: 'sourcing',
      title: 'Sourcing',
      description: 'Gestion des fournisseurs et approvisionnement',
      icon: Package,
      path: '/sourcing',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      hoverColor: 'hover:bg-blue-100',
    },
    {
      id: 'catalogue',
      title: 'Catalogue',
      description: 'Gestion des produits et fiches articles',
      icon: Grid3x3,
      path: '/catalogue',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      hoverColor: 'hover:bg-purple-100',
    },
    {
      id: 'categories',
      title: 'Catégories',
      description: 'Organisation par familles et catégories',
      icon: Tags,
      path: '/catalogue/categories',
      color: 'bg-green-50 text-green-600 border-green-200',
      hoverColor: 'hover:bg-green-100',
    },
    {
      id: 'variantes',
      title: 'Variantes',
      description: 'Gestion des variantes produits',
      icon: Boxes,
      path: '/catalogue/variantes',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      hoverColor: 'hover:bg-orange-100',
    },
    {
      id: 'collections',
      title: 'Collections',
      description: 'Gestion des collections thématiques',
      icon: FolderKanban,
      path: '/catalogue/collections',
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      hoverColor: 'hover:bg-pink-100',
    },
    {
      id: 'stocks',
      title: 'Stocks',
      description: 'Gestion des stocks et inventaire',
      icon: Layers,
      path: '/catalogue/stocks',
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      hoverColor: 'hover:bg-cyan-100',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Produits</h1>
            <p className="text-sm text-slate-600">
              Gestion complète des produits Vérone
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Sections disponibles
          </h2>
          <p className="text-sm text-slate-600">
            Sélectionnez une section pour accéder aux fonctionnalités
          </p>
        </div>

        {/* Grille de navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => router.push(section.path)}
                className={`
                  p-6 rounded-xl border-2 transition-all duration-200
                  ${section.color} ${section.hoverColor}
                  hover:shadow-md hover:scale-[1.02]
                  text-left group
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-1 group-hover:underline">
                      {section.title}
                    </h3>
                    <p className="text-sm opacity-80">
                      {section.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Section informative */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <Package className="h-6 w-6 text-slate-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Module Produits
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ce module centralise toutes les fonctionnalités liées à la gestion
                des produits Vérone : du sourcing fournisseur jusqu'à la gestion
                des stocks, en passant par la création du catalogue, l'organisation
                par catégories, la gestion des variantes et des collections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
