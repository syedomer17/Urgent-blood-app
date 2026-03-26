import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Donor {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating: number;
  totalDonations: number;
  contactNumber?: string;
  location?: {
    address?: string;
    city?: string;
  };
}

const DonorsPage = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodFilter, setBloodFilter] = useState("");

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await fetch("/api/v1/donors", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDonors(data.data?.donors ?? data.data ?? []);
        }
      } catch {
        toast.error("Failed to load donors.");
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, []);

  const filtered = donors.filter((d) => {
    if (bloodFilter && d.bloodGroup !== bloodFilter) return false;
    return true;
  });

  return (
    <main className="pt-4 pb-8 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div className="space-y-1">
          <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Community
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            Donors
          </h2>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-10">
        <div className="relative">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-primary focus:ring-2 transition-all outline-none"
          >
            <option value="">All Blood Groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-secondary pointer-events-none text-lg">
            expand_more
          </span>
        </div>
      </div>

      {/* Donors List */}
      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary/30 mb-4">
            group_off
          </span>
          <p className="text-secondary font-medium">No donors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((donor) => (
            <div
              key={donor._id}
              className="bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-surface-container hover:shadow-lg transition-all flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="font-headline font-black text-lg text-primary">
                  {donor.bloodGroup}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-base text-on-surface truncate">
                    {donor.name}
                  </h3>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      donor.availability ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                  <span className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {donor.trustRating?.toFixed(1) ?? "0.0"}
                  </span>
                  <span>{donor.totalDonations} donations</span>
                  {donor.location?.city && (
                    <span className="flex items-center gap-0.5 truncate">
                      <span className="material-symbols-outlined text-xs">
                        location_on
                      </span>
                      {donor.location.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default DonorsPage;
