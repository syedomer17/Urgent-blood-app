import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../../types';

const VerificationsPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/v1/admin/verifications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const reason = action === 'reject' ? prompt('Rejection reason (optional)') : undefined;
      const res = await fetch(`/api/v1/admin/verifications/${id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} successfully`);
      fetchPending();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="font-bold text-xl">Pending Verifications</h2>
      {users.length === 0 ? (
        <div className="p-6 bg-surface-container-lowest rounded-lg">No pending verifications.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="p-4 bg-surface-container-lowest rounded-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-bold">{u.name} <span className="text-xs text-secondary">({u.role})</span></div>
                  {u.verification?.aiAutoApproved && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Auto-approved (AI)</div>
                  )}
                </div>
                <div className="text-sm text-secondary">{u.email} · {u.contactNumber}</div>
                {u.verification?.aiConfidence !== undefined && (
                  <div className="mt-1 text-sm">
                    <strong className="text-xs">AI Confidence:</strong>
                    <span className="ml-2 text-sm font-bold">{(u.verification.aiConfidence || 0).toFixed(2)}</span>
                  </div>
                )}
                {u.verification?.aiDetails && (
                  <div className="mt-1 text-sm text-secondary">{u.verification.aiDetails}</div>
                )}
                {u.verification && (u as any).verification.flags && (u as any).verification.flags.length > 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    <strong>Flags:</strong> {(u as any).verification.flags.join(', ')}
                  </div>
                )}
                {u.verification?.documents && u.verification.documents.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-semibold text-xs text-secondary mb-1">Documents:</div>
                    <div className="flex gap-2 flex-wrap">
                      {u.verification.documents.map((doc: any, idx: number) => {
                        const filePath: string = doc.path || '';
                        const publicPath = filePath.includes('/uploads/') ? filePath.slice(filePath.indexOf('/uploads')) : `/uploads/${doc.filename}`;
                        return (
                          <a key={idx} href={publicPath} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-xs underline">
                            View {doc.filename || `doc-${idx + 1}`}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(u._id, 'approve')} className="bg-green-600 text-white px-3 py-2 rounded">Approve</button>
                <button onClick={() => handleAction(u._id, 'reject')} className="bg-red-600 text-white px-3 py-2 rounded">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default VerificationsPage;
