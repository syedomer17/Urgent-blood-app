import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor' as 'donor' | 'requester',
    bloodGroup: 'O+',
    contactNumber: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const registrationData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      if (formData.contactNumber) registrationData.contactNumber = formData.contactNumber;
      if (formData.role === 'donor') registrationData.bloodGroup = formData.bloodGroup;
      if (formData.address) registrationData.location = { address: formData.address };

      await register(registrationData);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-end pb-10 pt-14 px-6"
        style={{
          background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
          minHeight: '30vh',
        }}
      >
        <div
          className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.335 4.068 1 7.028 1c1.971 0 3.76.985 4.972 2.503C13.21 1.985 15 1 16.972 1 19.932 1 23 3.335 23 7.19c0 4.106-5.262 8.682-11 14.402z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create Account</h1>
          <p className="text-red-100 text-sm opacity-90 mt-0.5">Join the LifeLink community</p>
        </div>
      </div>

      {/* Floating card */}
      <div className="flex-1 px-5 -mt-6 relative z-10 pb-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-6 py-7 max-w-sm mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: step === 1 ? '50%' : '100%',
                  background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                }}
              />
            </div>
            <span className="text-xs font-bold text-gray-400 shrink-0">{step}/2</span>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Basic Info</h2>
              <p className="text-gray-500 text-sm mb-5">Tell us a bit about yourself</p>

              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      className={inputClass + ' pr-12'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18" />
                          : <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Repeat password" className={inputClass} />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', boxShadow: '0 8px 24px rgba(231,76,60,0.4)' }}
                >
                  Continue →
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Your Role</h2>
              <p className="text-gray-500 text-sm mb-5">How will you use LifeLink?</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">I am a…</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['donor', 'requester'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, role: r }))}
                        className={`py-4 rounded-2xl text-sm font-bold transition-all border-2 active:scale-95 ${formData.role === r
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                      >
                        <span className="block text-2xl mb-1">{r === 'donor' ? '🩸' : '🏥'}</span>
                        <span className="capitalize">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blood group */}
                {formData.role === 'donor' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Group</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, bloodGroup: bg }))}
                          className={`py-3 rounded-xl text-sm font-black transition-all border-2 active:scale-95 ${formData.bloodGroup === bg
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Phone <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <input name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleChange} placeholder="+92 300 0000000" className={inputClass} />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Address <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <input name="address" type="text" value={formData.address} onChange={handleChange} placeholder="City, Country" className={inputClass} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-4 px-5 rounded-2xl text-gray-600 font-bold text-sm border-2 border-gray-200 bg-gray-50 active:scale-95 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', boxShadow: '0 8px 24px rgba(231,76,60,0.4)' }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating…
                      </span>
                    ) : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-red-600 underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
