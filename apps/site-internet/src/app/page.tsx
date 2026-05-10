import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { EditorialBannerSection } from '@/components/home/EditorialBannerSection';
import { CollectionsSection } from '@/components/home/CollectionsSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';

export default function HomePage() {
  return (
    <div>
      {/* 1. Hero typographique centré (Sprint 1 ✅) */}
      <HeroSection />

      {/* 2. Nos trouvailles — 4 produits éditoriaux (Sprint 2 ✅) */}
      <FeaturedProductsSection />

      {/* 3. Bannière éditoriale (Sprint 3 ✅) */}
      <EditorialBannerSection />

      {/* 4. Nos collections — 3 univers (Sprint 4 ✅) */}
      <CollectionsSection />

      {/* 5. Newsletter charbon (Sprint 5 ✅) */}
      <NewsletterSection />
    </div>
  );
}
