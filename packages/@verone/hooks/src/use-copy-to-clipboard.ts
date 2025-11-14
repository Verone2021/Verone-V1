/**
 * Hook: useCopyToClipboard
 * Copie du texte dans le presse-papiers avec état
 * Compatible shadcn/ui patterns
 */

import { useState, useCallback } from 'react';

interface CopyToClipboardState {
  value: string | null;
  error: Error | null;
  isCopied: boolean;
}

interface CopyToClipboardReturn extends CopyToClipboardState {
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook pour copier du texte dans le presse-papiers
 * @returns Object avec copy function, état et reset
 *
 * @example
 * const { copy, isCopied } = useCopyToClipboard()
 *
 * <button onClick={() => copy("Hello World")}>
 *   {isCopied ? "Copied!" : "Copy"}
 * </button>
 */
export function useCopyToClipboard(): CopyToClipboardReturn {
  const [state, setState] = useState<CopyToClipboardState>({
    value: null,
    error: null,
    isCopied: false,
  });

  const copy = useCallback(async (text: string) => {
    try {
      // Modern API (navigator.clipboard)
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setState({ value: text, error: null, isCopied: true });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setState({ value: text, error: null, isCopied: true });
      }

      // Reset isCopied after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, isCopied: false }));
      }, 2000);
    } catch (error) {
      setState({
        value: null,
        error: error as Error,
        isCopied: false,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      value: null,
      error: null,
      isCopied: false,
    });
  }, []);

  return {
    ...state,
    copy,
    reset,
  };
}
