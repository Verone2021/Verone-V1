import "./globals.css"
import { Inter } from "next/font/google"
import { AppSidebar } from "../components/layout/app-sidebar"
import { AppHeader } from "../components/layout/app-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Vérone Back Office",
  description: "CRM/ERP modulaire pour Vérone - Décoration et mobilier d'intérieur",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-white text-black antialiased`}>
        <div className="flex h-full">
          {/* Sidebar fixe */}
          <AppSidebar />

          {/* Contenu principal */}
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}