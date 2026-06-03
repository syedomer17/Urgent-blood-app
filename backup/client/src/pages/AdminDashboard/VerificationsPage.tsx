import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/apiConfig';
import type { User } from '../../types';

type RoleFilter = 'all' | 'hospital' | 'requester' | 'donor' | 'admin';

type ParsedAiDetails = {
  verificationStatus?: string;
  confidenceScore?: number;
  reasons?: string[];
  missingFields?: string[];
  hospitalName?: string;
};

const isImageFile = (filename?: string, path?: string) => {
  const target = `${filename || ''} ${path || ''}`.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some((ext) => target.includes(ext));
};

const parseAiDetails = (details?: string): ParsedAiDetails | null => {
  if (!details) return null;
  try {
    return JSON.parse(details) as ParsedAiDetails;
  } catch {
    return null;
  }
};

const roleLabel: Record<RoleFilter, string> = {
  all: 'All',
  hospital: 'Hospitals',
  requester: 'Requesters',
  donor: 'Donors',
  admin: 'Admins',
};

const VerificationsPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('hospital');

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/verifications`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const visibleUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((user) => user.role === roleFilter);
  }, [users, roleFilter]);

  const stats = useMemo(() => ({
    all: users.length,
    hospital: users.filter((user) => user.role === 'hospital').length,
    requester: users.filter((user) => user.role === 'requester').length,
    donor: users.filter((user) => user.role === 'donor').length,
    admin: users.filter((user) => user.role === 'admin').length,
  }), [users]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const reason = action === 'reject' ? prompt('Rejection reason (optional)') : undefined;
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/verifications/${id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} successfully`);
      fetchPending();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">
          progress_activity
        </span>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <section className="rounded-3xl bg-linear-to-br from-primary to-primary-container text-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(183,28,28,0.18)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
              Review Queue
            </div>
            <div>
              <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight">Pending Verifications</h2>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-2xl">
                Review hospital documents, inspect AI findings, and approve or reject each account from a single responsive dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {[
              { label: 'All Pending', value: stats.all },
              { label: 'Hospitals', value: stats.hospital },
              { label: 'Requesters', value: stats.requester },
              { label: 'Donors/Admins', value: stats.donor + stats.admin },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold">{item.label}</div>
                <div className="mt-1 text-2xl font-black">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {(['all', 'hospital', 'requester', 'donor', 'admin'] as RoleFilter[]).map((filter) => {
          const active = roleFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                active
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-highest'
              }`}
            >
              {roleLabel[filter]}
            </button>
          );
        })}
      </section>

      {visibleUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface">No matching verifications</h3>
          <p className="mt-2 text-sm text-secondary">
            Try switching the filter or check back later when new hospital documents are uploaded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleUsers.map((u) => {
            const aiDetails = parseAiDetails(u.verification?.aiDetails);
            const confidence = u.verification?.aiConfidence ?? aiDetails?.confidenceScore ?? 0;
            const docs = u.verification?.documents ?? [];

            return (
              <article
                key={u._id}
                className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-4 sm:px-6 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-headline text-lg sm:text-xl font-black text-on-surface truncate">{u.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${u.role === 'hospital' ? 'bg-primary-fixed text-primary' : 'bg-surface-container-high text-secondary'}`}>
                          {u.role}
                        </span>
                        {u.verification?.aiAutoApproved && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-green-800">
                            Auto-approved
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-secondary">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          <span className="truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span className="truncate">{u.contactNumber || 'No phone number'}</span>
                        </div>
                        {u.hospitalDetails?.hospitalName && (
                          <div className="flex items-center gap-2 min-w-0 sm:col-span-2">
                            <span className="material-symbols-outlined text-sm">local_hospital</span>
                            <span className="truncate">{u.hospitalDetails.hospitalName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto lg:min-w-[320px]">
                      <div className="rounded-2xl bg-surface-container-low px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">AI Confidence</div>
                        <div className="mt-1 text-xl font-black text-on-surface">{Number(confidence || 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Documents</div>
                        <div className="mt-1 text-xl font-black text-on-surface">{docs.length}</div>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low px-3 py-3 text-center col-span-2 sm:col-span-1">
                        <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Status</div>
                        <div className={`mt-1 text-sm font-black ${u.isVerified ? 'text-green-700' : 'text-amber-700'}`}>
                          {u.isVerified ? 'Verified' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 px-4 sm:px-6 py-5 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-4">
                    {aiDetails && (
                      <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/10">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                          <h4 className="font-bold text-sm text-on-surface">AI Review Summary</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-secondary font-bold">Verdict</div>
                            <div className="mt-1 font-bold text-on-surface">{aiDetails.verificationStatus || 'pending'}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-secondary font-bold">Hospital</div>
                            <div className="mt-1 font-medium text-on-surface truncate">{aiDetails.hospitalName || 'Not detected'}</div>
                          </div>
                        </div>

                        {Array.isArray(aiDetails.reasons) && aiDetails.reasons.length > 0 && (
                          <div className="mt-4">
                            <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-2">Reasons</div>
                            <ul className="space-y-2 text-sm text-secondary">
                              {aiDetails.reasons.slice(0, 4).map((reason, idx) => (
                                <li key={idx} className="rounded-xl bg-white px-3 py-2 ring-1 ring-outline-variant/10">{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(aiDetails.missingFields) && aiDetails.missingFields.length > 0 && (
                          <div className="mt-4">
                            <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-2">Missing Fields</div>
                            <div className="flex flex-wrap gap-2">
                              {aiDetails.missingFields.map((field) => (
                                <span key={field} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{field}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {docs.length > 0 && (
                      <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/10">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                          <h4 className="font-bold text-sm text-on-surface">Uploaded Documents</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {docs.map((doc: any, idx: number) => {
                            const filePath: string = doc.path || '';
                            const publicPath = filePath.includes('/uploads/') ? filePath.slice(filePath.indexOf('/uploads')) : `/uploads/${doc.filename}`;
                            const imagePreview = isImageFile(doc.filename, filePath);

                            return (
                              <div key={idx} className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-white shadow-sm">
                                {imagePreview ? (
                                  <img
                                    src={publicPath}
                                    alt={doc.filename || `doc-${idx + 1}`}
                                    className="h-48 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-48 w-full items-center justify-center bg-surface-container-low text-secondary">
                                    <div className="text-center">
                                      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                                      <p className="mt-2 text-sm font-semibold">PDF preview unavailable</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-3 px-3 py-3">
                                  <p className="min-w-0 flex-1 truncate text-xs font-bold text-on-surface">
                                    {doc.filename || `doc-${idx + 1}`}
                                  </p>
                                  <a
                                    href={publicPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>open_in_new</span>
                                    Open
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:justify-start">
                    <button
                      onClick={() => handleAction(u._id, 'approve')}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-bold text-white shadow-sm transition-transform active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(u._id, 'reject')}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white shadow-sm transition-transform active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Reject
                    </button>
                    <div className="rounded-2xl bg-surface-container-lowest p-4 text-sm text-secondary">
                      <div className="font-bold text-on-surface">Admin notes</div>
                      <p className="mt-1 leading-6">
                        Approve only if the hospital details and uploaded document look legitimate. Reject if the document is unclear or inconsistent.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default VerificationsPage;
