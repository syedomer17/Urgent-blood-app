import { Link } from "react-router-dom";

interface SplashViewProps {
  onLoginClick: () => void;
}

const SplashView = ({ onLoginClick }: SplashViewProps) => {
  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-8 pt-24 pb-16 flex-1 flex flex-col justify-between">
      {/* Logo & Brand Identity */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center p-1">
          <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-primary-container to-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bloodtype
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-headline font-black text-4xl tracking-tighter text-white">
            LifeLink
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <span className="h-px w-8 bg-white/30" />
            <span className="font-headline font-bold text-sm tracking-widest text-on-primary-container uppercase">
              The Vital Pulse
            </span>
            <span className="h-px w-8 bg-white/30" />
          </div>
        </div>
      </div>

      {/* Headlines & Copy */}
      <div className="my-12 space-y-4 text-center">
        <h2 className="font-headline font-extrabold text-3xl leading-tight text-white px-2">
          Save a Life,
          <br />
          Donate Blood
        </h2>
        <p className="text-on-primary-container text-lg font-medium leading-relaxed opacity-90 px-4">
          A real-time platform connecting donors and requesters in your area.
        </p>
      </div>

      {/* Action Cluster */}
      <div className="mt-12 space-y-4 w-full">
        <Link
          to="/register"
          className="w-full h-16 bg-white text-primary font-headline font-extrabold text-lg rounded-2xl shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>Get Started</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>

        <button
          onClick={onLoginClick}
          className="w-full h-16 bg-white/10 backdrop-blur-[20px] text-white font-headline font-bold text-lg rounded-2xl border border-white/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
        >
          Log In
        </button>
      </div>

      {/* Footer Meta */}
      <div className="mt-8 text-center">
        <p className="text-white/40 text-xs font-semibold tracking-widest uppercase flex items-center justify-center space-x-2">
          <span className="material-symbols-outlined text-[14px]">
            verified_user
          </span>
          <span>Secure &amp; Verified Platform</span>
        </p>
      </div>
    </div>
  );
};

export default SplashView;
