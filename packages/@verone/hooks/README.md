# @verone/hooks

Collection de 17 hooks React réutilisables pour le monorepo Vérone.
Compatible shadcn/ui patterns et best practices 2025.

## Installation

```bash
# Depuis un package du monorepo
pnpm add @verone/hooks
```

## Hooks disponibles (17 total)

### 📱 Media Queries (2 hooks)

### `useMediaQuery(query: string): boolean`

Détecte si une media query CSS correspond.

```tsx
import { useMediaQuery } from '@verone/hooks';

function ResponsiveComponent() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );

  return isDesktop ? <DesktopView /> : <MobileView />;
}
```

### `useMobile(): boolean`

Alias pratique pour détecter les appareils mobiles (< 768px).

```tsx
import { useMobile } from '@verone/hooks';

function Navigation() {
  const isMobile = useMobile();

  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

### `useDebounce<T>(value: T, delay?: number): T`

Debounce une valeur avec délai configurable (défaut: 500ms).

```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@verone/hooks';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
  );
}
```

### `useCopyToClipboard(): CopyToClipboardReturn`

Copie du texte dans le presse-papiers avec état.

```tsx
import { useCopyToClipboard } from '@verone/hooks';

function CopyButton({ text }: { text: string }) {
  const { copy, isCopied } = useCopyToClipboard();
  return (
    <button onClick={() => copy(text)}>{isCopied ? 'Copied!' : 'Copy'}</button>
  );
}
```

---

### 💾 Storage (3 hooks)

### `useLocalStorage<T>(key: string, initialValue: T)`

Synchronise état React avec localStorage (cross-tab sync).

```tsx
import { useLocalStorage } from '@verone/hooks';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle
    </button>
  );
}
```

### `useSessionStorage<T>(key: string, initialValue: T)`

Comme useLocalStorage mais sessionStorage (non persistant entre sessions).

```tsx
import { useSessionStorage } from '@verone/hooks';

function SearchFilters() {
  const [filters, setFilters] = useSessionStorage('search-filters', {});
  // Filtres perdus à la fermeture du tab
}
```

### `useReadLocalStorage<T>(key: string): T | null`

Lecture seule localStorage avec synchronisation.

```tsx
import { useReadLocalStorage } from '@verone/hooks';

function ThemeConsumer() {
  const theme = useReadLocalStorage<'light' | 'dark'>('theme');
  return <div className={theme === 'dark' ? 'dark' : ''}>{/* ... */}</div>;
}
```

---

### 🎛️ State Management (3 hooks)

### `useToggle(initialValue?: boolean)`

Toggle boolean simplifié.

```tsx
import { useToggle } from '@verone/hooks';

function Modal() {
  const [isOpen, toggleOpen, setOpen] = useToggle(false);

  return (
    <>
      <button onClick={toggleOpen}>Toggle</button>
      <button onClick={() => setOpen(true)}>Open</button>
      <button onClick={() => setOpen(false)}>Close</button>
    </>
  );
}
```

### `useBoolean(initialValue?: boolean)`

Boolean state avec setters sémantiques.

```tsx
import { useBoolean } from '@verone/hooks';

function Dropdown() {
  const dropdown = useBoolean(false);

  return (
    <>
      <button onClick={dropdown.setTrue}>Open</button>
      <button onClick={dropdown.setFalse}>Close</button>
      <button onClick={dropdown.toggle}>Toggle</button>
      {dropdown.value && <Menu />}
    </>
  );
}
```

### `useCounter(initialValue?: number, min?: number, max?: number)`

Compteur avec increment/decrement/reset.

```tsx
import { useCounter } from '@verone/hooks';

function QuantityPicker() {
  const counter = useCounter(1, 0, 99);

  return (
    <div>
      <button onClick={counter.decrement}>-</button>
      <span>{counter.count}</span>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
```

---

### 🎨 UI/UX (4 hooks)

### `useClickOutside(ref, handler)`

Fermer dropdowns/modals au clic extérieur.

```tsx
import { useRef } from 'react';
import { useClickOutside } from '@verone/hooks';

function Dropdown() {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return <div ref={dropdownRef}>{/* Dropdown content */}</div>;
}
```

### `useWindowSize(): { width: number; height: number }`

Dimensions fenêtre réactives.

```tsx
import { useWindowSize } from '@verone/hooks';

function ResponsiveGrid() {
  const { width } = useWindowSize();
  const columns = width > 1280 ? 4 : width > 1024 ? 3 : 2;

  return <Grid columns={columns}>{/* Items */}</Grid>;
}
```

### `useHover(ref): boolean`

Détection hover sur élément.

```tsx
import { useRef } from 'react';
import { useHover } from '@verone/hooks';

function HoverCard() {
  const hoverRef = useRef(null);
  const isHovered = useHover(hoverRef);

  return <div ref={hoverRef}>{isHovered ? 'Hovered!' : 'Hover me'}</div>;
}
```

### `useIntersectionObserver(ref, options)`

Lazy loading, infinite scroll.

```tsx
import { useRef } from 'react';
import { useIntersectionObserver } from '@verone/hooks';

function LazyImage({ src }: { src: string }) {
  const imgRef = useRef(null);
  const entry = useIntersectionObserver(imgRef, {
    threshold: 0.5,
    freezeOnceVisible: true,
  });
  const isVisible = entry?.isIntersecting;

  return <img ref={imgRef} src={isVisible ? src : placeholder} />;
}
```

---

### ⏱️ Events & Timers (3 hooks)

### `useEventListener(eventName, handler, element?)`

Event listeners React-friendly.

```tsx
import { useEventListener } from '@verone/hooks';

function KeyboardShortcuts() {
  useEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'k' && e.metaKey) openSearch();
  });

  return <div>{/* UI */}</div>;
}
```

### `useInterval(callback, delay)`

setInterval déclaratif.

```tsx
import { useState } from 'react';
import { useInterval } from '@verone/hooks';

function AutoRefresh() {
  const [data, setData] = useState(null);

  useInterval(() => {
    fetchData().then(setData);
  }, 30000); // Refresh toutes les 30s

  return <div>{data}</div>;
}
```

### `useTimeout(callback, delay)`

setTimeout déclaratif.

```tsx
import { useState } from 'react';
import { useTimeout } from '@verone/hooks';

function AutoHideAlert() {
  const [show, setShow] = useState(true);

  useTimeout(() => {
    setShow(false);
  }, 3000); // Cache après 3s

  return show ? <Alert /> : null;
}
```

---

## Best Practices

- Tous les hooks sont **SSR-safe** (vérifient `typeof window !== 'undefined'`)
- Types **TypeScript stricts** (pas de `any`)
- **Performance optimisée** avec memoization
- **Cross-tab synchronization** (useLocalStorage)
- **Compatibilité navigateurs** (fallbacks inclus)

## License

Proprietary - Vérone SAS
