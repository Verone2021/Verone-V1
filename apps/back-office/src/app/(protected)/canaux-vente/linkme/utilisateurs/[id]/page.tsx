'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Button } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  Activity,
  ArrowLeft,
  Clock,
  Link2,
  Loader2,
  ShoppingBag,
  User,
} from 'lucide-react';

import { UserConfigModal } from '../../components/UserConfigModal';
import { useLinkMeUser } from '../../hooks/use-linkme-users';
import { UserActivityTimeline } from './components/UserActivityTimeline';
import { UserEngagementCards } from './components/UserEngagementCards';
import { UserNavigationStats } from './components/UserNavigationStats';
import { UserAttachmentsTab } from './_components/UserAttachmentsTab';
import { UserInfoTab } from './_components/UserInfoTab';
import { UserPageHeader } from './_components/UserPageHeader';
import { UserSelectionsTab } from './_components/UserSelectionsTab';

/**
 * Page détail utilisateur LinkMe
 */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useLinkMeUser(userId);

  const [activeTab, setActiveTab] = useState('infos');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">
          Erreur lors du chargement de l&apos;utilisateur
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserPageHeader
        user={user}
        onConfigureClick={() => setIsConfigModalOpen(true)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="infos" variant="underline">
            <User className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="rattachements" variant="underline">
            <Link2 className="h-4 w-4 mr-2" />
            Rattachements
          </TabsTrigger>
          <TabsTrigger value="selections" variant="underline">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Sélections
          </TabsTrigger>
          <TabsTrigger value="activite" variant="underline">
            <Activity className="h-4 w-4 mr-2" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="historique" variant="underline">
            <Clock className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="mt-6">
          <UserInfoTab user={user} />
        </TabsContent>

        <TabsContent value="rattachements" className="mt-6">
          <UserAttachmentsTab user={user} />
        </TabsContent>

        <TabsContent value="selections" className="mt-6">
          <UserSelectionsTab
            enseigneId={user.enseigne_id ?? null}
            organisationId={user.organisation_id ?? null}
          />
        </TabsContent>

        <TabsContent value="activite" className="mt-6 space-y-6">
          <UserEngagementCards userId={user.user_id} />
          <UserNavigationStats userId={user.user_id} />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <UserActivityTimeline
            userId={user.user_id}
            enseigneId={user.enseigne_id ?? null}
            organisationId={user.organisation_id ?? null}
          />
        </TabsContent>
      </Tabs>

      <UserConfigModal
        isOpen={isConfigModalOpen}
        user={user}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
