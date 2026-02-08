# Pattern Logout Standard Verone

## Context

Logout doit utiliser `window.location.href` pour éviter `AuthSessionMissingError`
pendant cleanup session Supabase.

## Pattern Obligatoire

```typescript
const handleLogout = () => {
  const supabase = createClient();
  void supabase.auth
    .signOut()
    .then(() => {
      // Hard navigation évite rerender pendant session cleanup
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; // ou '/' pour site-internet/linkme
      }
    })
    .catch(error => {
      console.error('[Component] Logout failed:', error);
      // Fallback: force redirect même si signOut échoue
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    });
};
```

## ❌ INTERDIT

- `router.push()` après signOut (cause rerender soft)
- `await` dans event handler (no-misused-promises)
- Oublier `.catch()` (no-floating-promises)

## ✅ OBLIGATOIRE

- `void` explicit
- `window.location.href` (hard navigation)
- SSR guard `typeof window !== 'undefined'`
- Error logging console
- Fallback redirect dans `.catch()`

## Pourquoi ?

### Problème avec router.push()

1. `signOut()` détruit la session Supabase
2. `router.push()` = soft navigation (React rerender)
3. Composants (AuthWrapper, ActivityTracker) s'exécutent pendant rerender
4. Composants tentent d'accéder session → `AuthSessionMissingError`

### Solution avec window.location.href

- Hard navigation = full browser reload
- Détruit complètement le contexte React avant reload
- Aucun composant ne s'exécute pendant transition
- Nouvelle page `/login` démarre avec état vierge

## Références

- LinkMe AuthContext: `apps/linkme/src/contexts/AuthContext.tsx:498-507`
- Back-office Sidebar: `apps/back-office/src/components/layout/app-sidebar.tsx:924-928`
- Back-office Header (CORRIGÉ): `apps/back-office/src/components/layout/app-header.tsx:54-71`
- Password Change Dialog: `apps/back-office/src/components/profile/password-change-dialog.tsx:153-156`
