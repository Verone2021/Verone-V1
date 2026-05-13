'use client';

/**
 * FooterPlaceholder — sous-onglet "Footer" du canal site-internet.
 *
 * Le contenu actuel du footer (réseaux sociaux, liens légaux, blocs de
 * colonnes) est encore hardcodé dans `apps/site-internet/.../Footer.tsx`.
 * Cette card marque l'emplacement futur du Footer Manager — implémenté dans
 * un sprint suivant (BO-SITE-CMS-002) pour rester focused sur le scope
 * actuel.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Info } from 'lucide-react';

export function FooterPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Footer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          La gestion du footer (réseaux sociaux, liens légaux, mentions,
          colonnes de liens) sera disponible dans un prochain sprint. Pour
          l&apos;instant, ces éléments sont définis dans le code du site.
        </p>
      </CardContent>
    </Card>
  );
}
