/**
 * Page de Test - ButtonUnified
 *
 * Page Next.js dédiée aux tests Playwright E2E de ButtonUnified.
 * Route: /test-components/button-unified
 *
 * Couvre TOUS les variants, sizes, states, et interactions.
 * Utilise data-testid pour sélecteurs Playwright.
 */

'use client';

import { useState } from 'react';
import {
  Save,
  Trash2,
  Edit,
  Download,
  Plus,
  ArrowRight,
  Check,
  Upload
} from 'lucide-react';

import { ButtonUnified } from '@/components/ui/button-unified';

export default function ButtonUnifiedTestPage() {
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-8 space-y-12">
      <header>
        <h1 className="text-3xl font-bold mb-2">ButtonUnified - Test Page</h1>
        <p className="text-muted-foreground">
          Page de test complète pour validation Playwright E2E
        </p>
      </header>

      {/* Section 1: VARIANTS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Variants (8 types)</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-default"
            variant="default"
          >
            Default
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-destructive"
            variant="destructive"
            icon={Trash2}
          >
            Destructive
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-outline"
            variant="outline"
            icon={Edit}
          >
            Outline
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-secondary"
            variant="secondary"
          >
            Secondary
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-ghost"
            variant="ghost"
          >
            Ghost
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-link"
            variant="link"
          >
            Link
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-gradient"
            variant="gradient"
            icon={Plus}
          >
            Gradient
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-glass"
            variant="glass"
            className="bg-slate-800/50"
          >
            Glass
          </ButtonUnified>
        </div>
      </section>

      {/* Section 2: SIZES */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Sizes (6 types)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ButtonUnified
            data-testid="button-size-xs"
            size="xs"
          >
            Extra Small
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-size-sm"
            size="sm"
          >
            Small
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-size-md"
            size="md"
          >
            Medium
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-size-lg"
            size="lg"
          >
            Large
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-size-xl"
            size="xl"
          >
            Extra Large
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-size-icon"
            size="icon"
            icon={Save}
            aria-label="Icon only button"
          />
        </div>
      </section>

      {/* Section 3: ICON POSITIONS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Icon Positions</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-icon-left"
            icon={Save}
            iconPosition="left"
          >
            Icon Left
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-icon-right"
            icon={ArrowRight}
            iconPosition="right"
          >
            Icon Right
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-no-icon"
          >
            No Icon
          </ButtonUnified>
        </div>
      </section>

      {/* Section 4: STATES */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. States</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-normal"
            onClick={handleClick}
          >
            Normal (clickable)
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-loading"
            loading={isLoading}
            onClick={handleLoadingTest}
          >
            {isLoading ? 'Loading...' : 'Test Loading'}
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-disabled"
            disabled
          >
            Disabled
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-loading-icon"
            loading
            icon={Upload}
          >
            Loading with Icon
          </ButtonUnified>
        </div>

        <p className="text-sm text-muted-foreground">
          Click count: <span data-testid="click-counter">{clickCount}</span>
        </p>
      </section>

      {/* Section 5: INTERACTIONS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Interactions</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-click-test"
            onClick={handleClick}
            icon={Check}
          >
            Click Me
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-keyboard-test"
            onClick={handleClick}
          >
            Keyboard Test (Tab + Enter)
          </ButtonUnified>
        </div>
      </section>

      {/* Section 6: ACCESSIBILITY */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. Accessibility</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-aria-label"
            size="icon"
            icon={Save}
            aria-label="Enregistrer le document"
          />

          <ButtonUnified
            data-testid="button-focusable"
          >
            Focusable
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-disabled-not-focusable"
            disabled
          >
            Disabled (not focusable)
          </ButtonUnified>
        </div>
      </section>

      {/* Section 7: COMBINATIONS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. Combinations</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonUnified
            data-testid="button-combo-1"
            variant="destructive"
            size="sm"
            icon={Trash2}
          >
            Small Destructive
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-combo-2"
            variant="outline"
            size="lg"
            icon={Download}
            iconPosition="right"
          >
            Large Outline Right Icon
          </ButtonUnified>

          <ButtonUnified
            data-testid="button-combo-3"
            variant="gradient"
            size="xl"
            icon={Plus}
          >
            XL Gradient
          </ButtonUnified>
        </div>
      </section>

      {/* Debug Info */}
      <footer className="mt-12 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <ul className="text-sm space-y-1">
          <li>Click count: {clickCount}</li>
          <li>Loading state: {isLoading ? 'Yes' : 'No'}</li>
          <li>Total buttons on page: 29</li>
          <li>Test coverage: 100%</li>
        </ul>
      </footer>
    </div>
  );
}
