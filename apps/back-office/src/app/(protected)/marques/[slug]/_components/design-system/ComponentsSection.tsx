'use client';

import { ButtonsCard } from './components/ButtonsCard';
import { InputsCard } from './components/InputsCard';
import { NavCard } from './components/NavCard';
import { TagsCard } from './components/TagsCard';
import { ProductCard } from './components/ProductCard';
import { FooterCard } from './components/FooterCard';

export function ComponentsSection() {
  return (
    <section className="space-y-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Composants
      </h3>

      <ButtonsCard />
      <InputsCard />
      <NavCard />
      <TagsCard />
      <ProductCard />
      <FooterCard />
    </section>
  );
}
