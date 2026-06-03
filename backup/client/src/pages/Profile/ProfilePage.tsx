import { useState } from "react";
import toast from "react-hot-toast";
import type { User } from "../../types";
import { API_BASE_URL } from "../../utils/apiConfig";

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeInputValue(value?: string) {
  return value ? value.slice(0, 16) : "";
}

interface ProfilePageProps {
  user: User;
  refetch: () => void;
  onLogout: () => void;
}

const ProfilePage = ({ user, refetch, onLogout }: ProfilePageProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(user.dateOfBirth));
  const [weightKg, setWeightKg] = useState(user.weightKg ? String(user.weightKg) : "");
  const [medicalConditions, setMedicalConditions] = useState((user.medicalConditions ?? []).join(", "));
  const [nextReminderAt, setNextReminderAt] = useState(toDateTimeInputValue(user.nextReminderAt));
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(user.reminderEnabled));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (bloodGroup && bloodGroup !== user.bloodGroup) body.bloodGroup = bloodGroup;
      if (dateOfBirth !== toDateInputValue(user.dateOfBirth)) body.dateOfBirth = dateOfBirth || null;
      if (weightKg !== (user.weightKg ? String(user.weightKg) : "")) body.weightKg = weightKg ? Number(weightKg) : null;
      if (medicalConditions !== (user.medicalConditions ?? []).join(", ")) {
        body.medicalConditions = medicalConditions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (nextReminderAt !== toDateTimeInputValue(user.nextReminderAt)) body.nextReminderAt = nextReminderAt || null;
      if (reminderEnabled !== Boolean(user.reminderEnabled)) body.reminderEnabled = reminderEnabled;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
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
                  onClick={() => { setEditing(false); setName(user.name); setBloodGroup(user.bloodGroup ?? ""); setDateOfBirth(toDateInputValue(user.dateOfBirth)); setWeightKg(user.weightKg ? String(user.weightKg) : ""); setMedicalConditions((user.medicalConditions ?? []).join(", ")); setNextReminderAt(toDateTimeInputValue(user.nextReminderAt)); setReminderEnabled(Boolean(user.reminderEnabled)); }}
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
              <p className="font-headline font-black text-2xl text-primary">
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

      {user.role === "donor" && (
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-5">
          <div>
            <h2 className="font-headline font-bold text-xl">Donor Health Profile</h2>
            <p className="text-sm text-secondary mt-1">Used for eligibility warnings, reminders, and donor support.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Date of Birth</span>
              {editing ? (
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
              ) : (
                <p className="text-on-surface font-medium">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Weight (kg)</span>
              {editing ? (
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
              ) : (
                <p className="text-on-surface font-medium">{user.weightKg ? `${user.weightKg} kg` : "Not provided"}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Medical Conditions</span>
              {editing ? (
                <textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  rows={3}
                  placeholder="Comma-separated items like iron deficiency, recent surgery"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
              ) : (
                <p className="text-on-surface font-medium">{(user.medicalConditions ?? []).length ? user.medicalConditions?.join(", ") : "None recorded"}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Reminder Time</span>
              {editing ? (
                <input
                  type="datetime-local"
                  value={nextReminderAt}
                  onChange={(e) => setNextReminderAt(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
              ) : (
                <p className="text-on-surface font-medium">{user.nextReminderAt ? new Date(user.nextReminderAt).toLocaleString() : "Not scheduled"}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Reminder Enabled</span>
              {editing ? (
                <button
                  type="button"
                  onClick={() => setReminderEnabled((current) => !current)}
                  className={`w-full rounded-xl px-4 py-3 font-bold text-sm transition-colors ${reminderEnabled ? "bg-primary text-white" : "bg-surface-container-low text-secondary"}`}
                >
                  {reminderEnabled ? "Enabled" : "Disabled"}
                </button>
              ) : (
                <p className={`font-medium ${user.reminderEnabled ? "text-green-600" : "text-secondary"}`}>{user.reminderEnabled ? "Enabled" : "Disabled"}</p>
              )}
            </div>
          </div>
        </section>
      )}

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
