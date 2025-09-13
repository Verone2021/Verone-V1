/**
 * 🏠 Public Layout - Vérone Back Office
 *
 * Layout pour pages publiques (non-authentifiées) sans sidebar/header
 */

import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={`${inter.className} min-h-screen bg-white text-black antialiased`}>
      {children}
    </div>
  )
}