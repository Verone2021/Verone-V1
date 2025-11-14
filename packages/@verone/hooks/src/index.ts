/**
 * @verone/hooks
 * Collection de hooks React réutilisables
 * Compatible shadcn/ui patterns
 */

// Media Queries
export { useMediaQuery } from './use-media-query';
export { useMobile } from './use-mobile';

// Utilities
export { useDebounce } from './use-debounce';
export { useCopyToClipboard } from './use-copy-to-clipboard';

// Storage
export { useLocalStorage } from './use-local-storage';
export { useSessionStorage } from './use-session-storage';
export { useReadLocalStorage } from './use-read-local-storage';

// State Management
export { useToggle } from './use-toggle';
export { useBoolean } from './use-boolean';
export { useCounter } from './use-counter';

// UI/UX
export { useClickOutside } from './use-click-outside';
export { useWindowSize } from './use-window-size';
export { useHover } from './use-hover';
export { useIntersectionObserver } from './use-intersection-observer';

// Events & Timers
export { useEventListener } from './use-event-listener';
export { useInterval } from './use-interval';
export { useTimeout } from './use-timeout';
