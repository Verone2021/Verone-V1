/**
 * 🏠 Public Layout - Vérone Back Office
 *
 * Layout pour pages publiques (non-authentifiées) sans sidebar/header
 */

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return <>{children}</>;
}
