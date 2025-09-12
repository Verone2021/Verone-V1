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

interface UserDetailPasswordManagerProps {
  user: User
}

export function UserDetailPasswordManager({ user }: UserDetailPasswordManagerProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-start"
        onClick={() => setPasswordModalOpen(true)}
      >
        <Key className="h-4 w-4 mr-2" />
        Gérer le mot de passe
      </Button>

      <UserPasswordModal
        user={user}
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </>
  )
}