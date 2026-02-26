import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    contactNumber: user?.contactNumber || '',
    address: user?.location?.address || '',
    availability: user?.availability !== false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        contactNumber: user.contactNumber || '',
        address: user.location?.address || '',
        availability: user.availability !== false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        contactNumber: formData.contactNumber,
        location: { address: formData.address },
        availability: formData.availability,
      });
      setIsEditing(false);
    } catch { }
    finally { setIsSaving(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  const firstName = user.name.split(' ')[0];

  const infoRows = [
    { label: '📧 Email', value: user.email },
    { label: '📞 Phone', value: user.contactNumber || 'Not set' },
    { label: '📍 Address', value: user.location?.address || 'Not set' },
    ...(user.role === 'donor' ? [{ label: '🩸 Blood Group', value: user.bloodGroup || '—' }] : []),
    { label: '🏷️ Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { label: '⭐ Rating', value: `${(user.rating || 0).toFixed(1)} / 5` },
  ];

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      {/* Hero header */}
      <div
        className="px-5 pt-12 pb-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between">
          <h1 className="text-white text-xl font-extrabold">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Avatar card floats over header */}
      <div className="px-4 -mt-8 max-w-sm mx-auto">
        <div className="bg-white rounded-3xl p-5 flex items-center gap-4 mb-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-white text-2xl font-black"
            style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
          >
            {firstName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-gray-900 text-base truncate">{user.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {user.bloodGroup && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-50 text-red-600">{user.bloodGroup}</span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 capitalize">{user.role}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.availability ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.availability ? '● Available' : '○ Away'}
              </span>
            </div>
          </div>
        </div>

        {/* Info card */}
        {!isEditing && (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {infoRows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900 text-right max-w-[55%] truncate">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData((p) => ({ ...p, contactNumber: e.target.value }))}
                placeholder="+92 300 0000000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                placeholder="Your city or full address"
                className={inputClass}
              />
            </div>
            {user.role === 'donor' && (
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Available to Donate</p>
                  <p className="text-xs text-gray-400 mt-0.5">Show up for donors in need</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, availability: !p.availability }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${formData.availability ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.availability ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 8px 24px rgba(231,76,60,0.35)' }}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
