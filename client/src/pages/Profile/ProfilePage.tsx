import { useState } from "react";
import toast from "react-hot-toast";
import type { User } from "../../types";

interface ProfilePageProps {
  user: User;
  refetch: () => void;
  onLogout: () => void;
}

const ProfilePage = ({ user, refetch, onLogout }: ProfilePageProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (bloodGroup && bloodGroup !== user.bloodGroup) body.bloodGroup = bloodGroup;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        return;
      }

      const res = await fetch("/api/v1/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update profile.");
        return;
      }
      toast.success("Profile updated successfully!");
      setEditing(false);
      refetch();
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pt-4 px-6 max-w-2xl mx-auto space-y-8">
      {/* Profile Header */}
      <section className="bg-signature-gradient rounded-3xl p-8 shadow-xl text-white overflow-hidden relative">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </div>
          <div>
            <h1 className="font-headline font-extrabold text-2xl">{user.name}</h1>
            <p className="text-on-primary-container text-sm opacity-80">{user.email}</p>
            <span className="inline-block mt-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>
      </section>

      {/* Profile Details */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-headline font-bold text-xl">Profile Details</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setName(user.name); setBloodGroup(user.bloodGroup ?? ""); }}
                className="text-secondary font-bold text-sm px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Full Name
            </span>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
              />
            ) : (
              <p className="text-on-surface font-medium">{user.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Email
            </span>
            <p className="text-on-surface font-medium">{user.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Blood Group
            </span>
            {editing ? (
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            ) : (
              <p className="text-on-surface font-medium text-2xl font-headline font-black text-primary">
                {user.bloodGroup || "—"}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Role
            </span>
            <p className="text-on-surface font-medium capitalize">{user.role}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Contact
            </span>
            <p className="text-on-surface font-medium">
              {user.contactNumber || "Not provided"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
              Availability
            </span>
            <p className={`font-medium ${user.availability ? "text-green-600" : "text-secondary"}`}>
              {user.availability ? "Available" : "Unavailable"}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Card */}
      {user.role === "donor" && (
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <h2 className="font-headline font-bold text-xl mb-6">Donation Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="text-3xl font-headline font-black text-primary">
                {user.totalDonations ?? 0}
              </span>
              <p className="text-xs text-secondary font-bold uppercase mt-1">Donations</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-headline font-black text-on-surface">
                {user.trustRating?.toFixed(1) ?? "0.0"}
              </span>
              <p className="text-xs text-secondary font-bold uppercase mt-1">Rating</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-headline font-black text-tertiary">
                {user.ratingCount ?? 0}
              </span>
              <p className="text-xs text-secondary font-bold uppercase mt-1">Reviews</p>
            </div>
          </div>
        </section>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-surface-container-highest text-on-surface font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
      >
        <span className="material-symbols-outlined">logout</span>
        Log Out
      </button>
    </main>
  );
};

export default ProfilePage;
