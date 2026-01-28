/**
 * LinkMe Layout
 *
 * Navigation tabs are now handled by ChannelTabs component
 * in the auth-wrapper layout (removed double sidebar pattern)
 *
 * @see /Users/romeodossantos/.claude/plans/greedy-chasing-hinton.md
 */

export default function LinkMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple passthrough - tabs handled by parent layout
  return <>{children}</>;
}
