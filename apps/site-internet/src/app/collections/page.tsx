import { CollectionsHero } from '@/components/collections/CollectionsHero';
import { CollectionsListGrid } from '@/components/collections/CollectionsListGrid';
import { CollectionsFooterBanner } from '@/components/collections/CollectionsFooterBanner';

export default function CollectionsPage() {
  return (
    <main>
      <CollectionsHero />
      <CollectionsListGrid />
      <CollectionsFooterBanner />
    </main>
  );
}
