/**
 * Layout Public pour page Unauthorized
 *
 * Layout minimal sans sidebar/header pour la page d'erreur d'accès non autorisé.
 * Utilisé quand un utilisateur authentifié n'a pas de rôle back-office.
 */

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
