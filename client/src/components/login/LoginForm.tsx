import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../utils/apiConfig";

interface LoginFormProps {
  onBack: () => void;
}

const LoginForm = ({ onBack }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed. Please try again.");
        return;
      }

      toast.success("Welcome back to LifeLink!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-8 pt-16 pb-16 flex-1 flex flex-col justify-center">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 z-20 flex items-center gap-1 text-white/70 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
        <span className="font-headline font-bold text-sm">Back</span>
      </button>

      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <span
          className="material-symbols-outlined text-white text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          bloodtype
        </span>
        <h1 className="font-headline font-black text-2xl tracking-tighter text-white">
          LifeLink
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white/10 backdrop-blur-[20px] rounded-3xl border border-white/10 p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-headline font-extrabold text-2xl text-white">
            Welcome back
          </h2>
          <p className="text-on-primary-container text-sm opacity-80">
            Log in to continue saving lives
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold font-headline text-on-primary-container/70 uppercase px-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border-none ring-1 ring-white/20 rounded-xl p-4 focus:ring-2 focus:ring-white/50 transition-all text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold font-headline text-on-primary-container/70 uppercase px-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border-none ring-1 ring-white/20 rounded-xl p-4 focus:ring-2 focus:ring-white/50 transition-all text-white placeholder:text-white/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-primary font-headline font-extrabold text-lg rounded-xl shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-primary">
                  progress_activity
                </span>
                Logging in...
              </>
            ) : (
              <>
                Log In
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-on-primary-container/70 text-sm font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-white font-bold hover:underline decoration-2 underline-offset-4 ml-1"
          >
            Sign Up
          </Link>
        </p>
      </div>

      {/* Footer */}
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

export default LoginForm;
