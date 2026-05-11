import Link from 'next/link';

export function CollectionsFooterBanner() {
  return (
    <section className="flex w-full flex-col items-center justify-center bg-verone-charbon px-5 py-24 text-center md:px-16 md:py-32">
      <h2 className="mb-12 max-w-2xl font-bodoni text-[28px] font-normal italic leading-[1.25] text-verone-white md:text-[32px]">
        «&nbsp;Tu n&apos;as pas à tout voir pour trouver ce qu&apos;il te
        faut.&nbsp;»
      </h2>
      <Link
        href="/catalogue"
        className="inline-flex items-center justify-center bg-verone-white px-10 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.32em] text-verone-charbon transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961]"
      >
        Voir toute la sélection
      </Link>
    </section>
  );
}
