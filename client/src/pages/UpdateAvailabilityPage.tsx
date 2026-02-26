import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const UpdateAvailabilityPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [availability, setAvailability] = useState(user?.availability !== false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ availability });
      setSuccess(true);
      setTimeout(() => { window.location.href = '/'; }, 1800);
    } catch { }
    finally { setIsLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="bg-white rounded-3xl p-8 text-center mx-4" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <p className="text-gray-900 font-extrabold text-lg mb-1">Status Updated!</p>
          <p className="text-gray-400 text-sm">{availability ? 'You are now available' : 'You are now unavailable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      <div className="px-5 pt-12 pb-8" style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}>
        <h1 className="text-white text-xl font-extrabold">Availability</h1>
        <p className="text-red-100 text-xs mt-0.5">Let requesters know you're ready</p>
      </div>

      <div className="px-4 pt-5 max-w-sm mx-auto space-y-4">
        {/* Big toggle card */}
        <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-extrabold text-gray-900">{availability ? '🟢 Available' : '🔴 Unavailable'}</p>
              <p className="text-sm text-gray-400 mt-0.5">{availability ? 'Visible to requesters' : 'Hidden from requesters'}</p>
            </div>
            <button
              onClick={() => setAvailability(!availability)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${availability ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${availability ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          <div className={`rounded-2xl p-4 text-sm leading-relaxed ${availability ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
            {availability
              ? '✅ Your profile will appear when someone needs a compatible blood donor. You may receive urgent calls.'
              : '⏸ Your profile is hidden. No one will contact you for donations until you go available again.'}
          </div>
        </div>

        {/* Tip box */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-red-800 text-sm font-bold mb-0.5">🩸 Did you know?</p>
          <p className="text-red-600 text-xs">A single blood donation can save up to 3 lives. Your availability matters!</p>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', boxShadow: '0 8px 24px rgba(231,76,60,0.4)' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving…
              </span>
            ) : 'Confirm Status'}
          </button>
          <button onClick={() => window.location.href = '/'} className="w-full py-4 rounded-2xl text-gray-500 font-bold text-sm border-2 border-gray-200 bg-white active:scale-95 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
