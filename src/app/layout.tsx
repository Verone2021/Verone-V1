import "./globals.css"
import { Inter } from "next/font/google"
import { Analytics } from '@vercel/analytics/react'
import { AuthWrapper } from "../components/layout/auth-wrapper"
import { ClientOnlyActivityTracker } from "../components/providers/client-only-activity-tracker"

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
        <AuthWrapper>
          <ClientOnlyActivityTracker>
            {children}
          </ClientOnlyActivityTracker>
        </AuthWrapper>
        <Analytics />
      </body>
    </html>
  )
}