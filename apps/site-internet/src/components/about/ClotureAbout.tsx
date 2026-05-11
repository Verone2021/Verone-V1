export function ClotureAbout() {
  return (
    <section className="relative flex min-h-[600px] w-full items-center justify-center overflow-hidden bg-verone-charbon md:min-h-[819px]">
      {/* Overlay subtil pour profondeur (ready pour future photo de fond brutaliste) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"
      />

      <blockquote className="relative z-10 mx-auto max-w-[1440px] px-6 text-center md:px-16">
        <p className="font-bodoni text-[36px] font-normal italic leading-[1.04] text-verone-white sm:text-[44px] md:text-[52px]">
          «&nbsp;Habiter le silence.&nbsp;»
        </p>
      </blockquote>
    </section>
  );
}
