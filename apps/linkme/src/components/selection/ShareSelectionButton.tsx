'use client';

import { useState } from 'react';

import { Send, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';

import type { UserSelection } from '../../lib/hooks/use-user-selection';
import { useToggleSelectionPublished } from '../../lib/hooks/use-user-selection';

interface ShareSelectionButtonProps {
  selection: UserSelection;
  className?: string;
}

export function ShareSelectionButton({
  selection,
  className = '',
}: ShareSelectionButtonProps): React.JSX.Element {
  const [linkCopied, setLinkCopied] = useState(false);
  const togglePublished = useToggleSelectionPublished();
  const isPublished = !!selection.published_at;

  const handleShare = (): void => {
    if (!isPublished) {
      // Publier d'abord
      void togglePublished
        .mutateAsync({ selectionId: selection.id, isPublic: true })
        .then(() => {
          toast.success(
            'Boutique publiée ! Vous pouvez maintenant partager le lien.'
          );
          copyLink();
        })
        .catch((error: unknown) => {
          console.error('[ShareSelectionButton] Publish failed:', error);
          toast.error('Impossible de publier la boutique');
        });
      return;
    }

    copyLink();
  };

  const copyLink = (): void => {
    const shareUrl = `${window.location.origin}/s/${selection.slug ?? selection.id}`;
    void navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setLinkCopied(true);
        toast.success(
          'Lien copié ! Envoyez-le à vos clients par email ou SMS.'
        );
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch((err: unknown) => {
        console.error('[ShareSelectionButton] Copy failed:', err);
        toast.error('Impossible de copier le lien');
      });
  };

  return (
    <button
      onClick={handleShare}
      disabled={togglePublished.isPending}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-lg shadow-linkme-turquoise/25 hover:shadow-xl hover:shadow-linkme-turquoise/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {linkCopied ? (
        <>
          <Check className="h-5 w-5" />
          Lien copié !
        </>
      ) : !isPublished ? (
        <>
          <Globe className="h-5 w-5" />
          Publier et partager
        </>
      ) : (
        <>
          <Send className="h-5 w-5" />
          Partager avec mes clients
        </>
      )}
    </button>
  );
}
