const HeroSection = () => {
  return (
    <section className="md:w-5/12 bg-signature-gradient p-10 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-96 h-96 bg-primary-container/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-12">
          <span
            className="material-symbols-outlined text-white text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bloodtype
          </span>
          <h1 className="font-headline font-black text-3xl tracking-tighter text-white">
            LifeLink
          </h1>
        </div>

        <div className="mt-20">
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Welcome to LifeLink
          </h2>
          <p className="text-on-primary-container text-lg max-w-sm opacity-90 leading-relaxed">
            Every drop counts. Join our community of lifesavers and help bridge
            the gap between donors and those in need.
          </p>
        </div>
      </div>

      <div className="relative z-10 hidden md:block">
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-fixed bg-white/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                group
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                Join 2,400+ Donors
              </p>
              <p className="text-on-primary-container text-xs">
                Active in your metropolitan area
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
