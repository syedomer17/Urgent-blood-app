import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const URGENCY = [
  { value: 'low', emoji: '🟢', label: 'Low' },
  { value: 'medium', emoji: '🟡', label: 'Medium' },
  { value: 'high', emoji: '🟠', label: 'High' },
  { value: 'critical', emoji: '🔴', label: 'Critical' },
];

export const RequestBloodPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    urgency: 'medium' as any,
    notes: '',
    address: '',
    contactNumber: user?.contactNumber || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (user?.role !== 'requester') {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
        <div className="px-5 pt-12 pb-5" style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}>
          <h1 className="text-white text-xl font-extrabold">Request Blood</h1>
        </div>
        <div className="px-4 pt-10 text-center max-w-sm mx-auto">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-gray-700 font-semibold mb-6 text-sm">Only blood requesters can create requests</p>
          <button onClick={() => (window.location.href = '/')} className="px-6 py-3 rounded-2xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>← Go Home</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await requestApi.create({
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        unitsRequired: formData.unitsRequired,
        urgency: formData.urgency,
        notes: formData.notes,
        contactNumber: formData.contactNumber,
        location: { address: formData.address },
      });
      if (res.success) { setSuccess(true); setTimeout(() => { window.location.href = '/requests'; }, 1800); }
    } catch (err: any) { setError(err.message || 'Failed to create request'); }
    finally { setIsLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="bg-white rounded-3xl p-8 text-center mx-4" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <p className="text-gray-900 font-extrabold text-lg mb-1">Request Created!</p>
          <p className="text-gray-400 text-sm">Redirecting to requests…</p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      <div className="px-5 pt-12 pb-5" style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}>
        <h1 className="text-white text-xl font-extrabold">Request Blood</h1>
        <p className="text-red-100 text-xs mt-0.5">Fill in the patient details</p>
      </div>

      <div className="px-4 pt-4 max-w-sm mx-auto">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Patient name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Patient Name</label>
              <input name="patientName" placeholder="Full name" value={formData.patientName} onChange={(e) => setFormData((p) => ({ ...p, patientName: e.target.value }))} required className={inputClass} />
            </div>

            {/* Blood group */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button" onClick={() => setFormData((p) => ({ ...p, bloodGroup: bg }))} className={`py-3 rounded-xl text-sm font-black transition-all active:scale-95 border-2 ${formData.bloodGroup === bg ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{bg}</button>
                ))}
              </div>
            </div>

            {/* Units stepper */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Units Needed</label>
              <div className="flex items-center gap-0 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden w-full">
                <button type="button" onClick={() => setFormData((p) => ({ ...p, unitsRequired: Math.max(1, p.unitsRequired - 1) }))} className="flex-1 py-3.5 text-xl text-gray-600 font-bold active:bg-gray-100 transition-all">−</button>
                <span className="w-14 text-center text-lg font-black text-gray-900">{formData.unitsRequired}</span>
                <button type="button" onClick={() => setFormData((p) => ({ ...p, unitsRequired: Math.min(10, p.unitsRequired + 1) }))} className="flex-1 py-3.5 text-xl text-gray-600 font-bold active:bg-gray-100 transition-all">+</button>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Urgency</label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY.map(({ value, emoji, label }) => (
                  <button key={value} type="button" onClick={() => setFormData((p) => ({ ...p, urgency: value }))} className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 border-2 flex items-center justify-center gap-2 ${formData.urgency === value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hospital / Location</label>
              <input placeholder="Hospital name or address" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Number</label>
              <input type="tel" placeholder="+92 300 0000000" value={formData.contactNumber} onChange={(e) => setFormData((p) => ({ ...p, contactNumber: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Notes <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <textarea placeholder="Any medical notes or special instructions…" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} className={inputClass + ' resize-none'} />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', boxShadow: '0 8px 24px rgba(231,76,60,0.4)' }}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Creating…
              </span>
            ) : '🩸 Create Request'}
          </button>
        </form>
      </div>
    </div>
  );
};
