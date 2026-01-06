import type { Metadata } from 'next';

import { AppSidebar } from '../../components/layout/AppSidebar';
import { MinimalHeader } from '../../components/layout/MinimalHeader';
import { SidebarProvider } from '../../components/layout/SidebarProvider';
import { Providers } from '../../components/providers/Providers';
import '../globals.css';

export const metadata: Metadata = {
  title: "LINKME - Plateforme d'affiliation Vérone",
  description:
    "Découvrez les sélections de mobilier et décoration d'intérieur par nos partenaires affiliés.",
};

/**
 * Layout pour les pages INTERNES LinkMe
 * Design e-commerce moderne avec sidebar + header minimaliste
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50/50">
        <Providers>
          <SidebarProvider>
            <div className="flex min-h-screen">
              {/* Sidebar Navigation */}
              <AppSidebar />

              {/* Main Content Area - ml-16 pour sidebar collapsible (w-16) */}
              <div className="flex-1 flex flex-col min-h-screen lg:ml-16">
                <MinimalHeader />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
