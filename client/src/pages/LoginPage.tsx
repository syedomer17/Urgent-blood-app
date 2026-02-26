import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero top section */}
      <div
        className="relative flex flex-col items-center justify-end pb-10 pt-16 px-6"
        style={{
          background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
          minHeight: '38vh',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }}
        />

        {/* Logo + brand */}
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.335 4.068 1 7.028 1c1.971 0 3.76.985 4.972 2.503C13.21 1.985 15 1 16.972 1 19.932 1 23 3.335 23 7.19c0 4.106-5.262 8.682-11 14.402z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LifeLink</h1>
          <p className="text-red-100 text-sm mt-1 opacity-90">Donate blood. Save lives.</p>
        </div>
      </div>

      {/* Card that floats over the hero */}
      <div className="flex-1 px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-6 py-8 max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back 👋</h2>
          <p className="text-gray-500 text-sm mb-7">Sign in to your LifeLink account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: isLoading ? '#e74c3c' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                boxShadow: '0 8px 24px rgba(231,76,60,0.4)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-sm text-gray-500">
              New to LifeLink?{' '}
              <Link to="/register" className="font-bold text-red-600 underline underline-offset-2">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-gray-400 mt-6 mb-4">🩸 Every 2 seconds someone needs blood</p>
      </div>
    </div>
  );
};
