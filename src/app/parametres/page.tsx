'use client'

import React from 'react'
import {
  Settings,
  User,
  Shield,
  Bell,
  Globe,
  Palette,
  Database,
  Save
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  settings: SettingItem[]
}

interface SettingItem {
  id: string
  label: string
  description: string
  type: 'input' | 'toggle' | 'select'
  value: string | boolean
  options?: string[]
}

const settingSections: SettingSection[] = [
  {
    id: 'profile',
    title: 'Profil utilisateur',
    description: 'Informations personnelles et préférences',
    icon: <User className="h-5 w-5" />,
    settings: [
      {
        id: 'name',
        label: 'Nom complet',
        description: 'Votre nom tel qu\'il apparaît dans l\'interface',
        type: 'input',
        value: 'Utilisateur Admin'
      },
      {
        id: 'email',
        label: 'Email',
        description: 'Adresse email pour les notifications',
        type: 'input',
        value: 'admin@verone.com'
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Gestion des alertes et notifications',
    icon: <Bell className="h-5 w-5" />,
    settings: [
      {
        id: 'email_notifications',
        label: 'Notifications par email',
        description: 'Recevoir les alertes importantes par email',
        type: 'toggle',
        value: true
      },
      {
        id: 'stock_alerts',
        label: 'Alertes de stock',
        description: 'Notifications en cas de stock faible',
        type: 'toggle',
        value: true
      },
      {
        id: 'order_notifications',
        label: 'Notifications de commandes',
        description: 'Alertes pour les nouvelles commandes',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'appearance',
    title: 'Apparence',
    description: 'Personnalisation de l\'interface',
    icon: <Palette className="h-5 w-5" />,
    settings: [
      {
        id: 'language',
        label: 'Langue',
        description: 'Langue de l\'interface',
        type: 'select',
        value: 'Français',
        options: ['Français', 'English', 'Español']
      },
      {
        id: 'timezone',
        label: 'Fuseau horaire',
        description: 'Fuseau horaire pour l\'affichage des dates',
        type: 'select',
        value: 'Europe/Paris',
        options: ['Europe/Paris', 'UTC', 'America/New_York']
      }
    ]
  },
  {
    id: 'security',
    title: 'Sécurité',
    description: 'Paramètres de sécurité et confidentialité',
    icon: <Shield className="h-5 w-5" />,
    settings: [
      {
        id: 'two_factor',
        label: 'Authentification à deux facteurs',
        description: 'Renforcer la sécurité de votre compte',
        type: 'toggle',
        value: false
      },
      {
        id: 'session_timeout',
        label: 'Délai d\'inactivité',
        description: 'Temps avant déconnexion automatique',
        type: 'select',
        value: '30 minutes',
        options: ['15 minutes', '30 minutes', '1 heure', '4 heures']
      }
    ]
  }
]

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
        enabled ? 'bg-black' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-black" />
          <div>
            <h1 className="text-2xl font-bold text-black">Paramètres</h1>
            <p className="text-gray-600">Configuration de l'application</p>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {settingSections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {section.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">{section.title}</h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {section.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-black">{setting.label}</label>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className="ml-4">
                    {setting.type === 'input' && (
                      <Input
                        type="text"
                        value={setting.value as string}
                        className="w-64"
                        onChange={() => {}}
                      />
                    )}
                    {setting.type === 'toggle' && (
                      <ToggleSwitch
                        enabled={setting.value as boolean}
                        onChange={() => {}}
                      />
                    )}
                    {setting.type === 'select' && (
                      <select
                        value={setting.value as string}
                        onChange={() => {}}
                        className="w-48 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      >
                        {setting.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black">Informations système</h3>
            <p className="text-sm text-gray-600">Détails techniques de l'application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Version de l'application</p>
            <p className="text-sm text-black">v1.0.0</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Dernière mise à jour</p>
            <p className="text-sm text-black">15 janvier 2024</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Environnement</p>
            <p className="text-sm text-black">Production</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Base de données</p>
            <p className="text-sm text-black">PostgreSQL 15.0</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <ButtonV2 className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Enregistrer les modifications</span>
        </ButtonV2>
      </div>
    </div>
  )
}