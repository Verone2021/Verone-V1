'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Key } from 'lucide-react'
import { UserPasswordModal } from './user-password-modal'

interface User {
  id: string
  email: string
  nom?: string
  prenom?: string
}

interface UserEditPasswordManagerProps {
  user: User
}

export function UserEditPasswordManager({ user }: UserEditPasswordManagerProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => setPasswordModalOpen(true)}
          className="w-full"
          size="sm"
        >
          <Key className="h-4 w-4 mr-2" />
          Définir le mot de passe
        </Button>
      </div>

      <UserPasswordModal
        user={user}
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </>
  )
}