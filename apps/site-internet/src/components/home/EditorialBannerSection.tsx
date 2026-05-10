export function EditorialBannerSection() {
  return (
    <section className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden bg-verone-charbon md:min-h-[480px]">
      {/* Overlay subtil pour profondeur (ready pour future photo de fond) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"
      />

      <blockquote className="relative z-10 mx-auto max-w-[800px] px-6 text-center md:px-16">
        <p className="font-bodoni text-[28px] font-normal italic leading-[1.25] text-verone-white sm:text-[32px] md:text-[38px]">
          « Ce n&apos;est pas un catalogue. C&apos;est un regard. »
        </p>
      </blockquote>
    </section>
  );
}
