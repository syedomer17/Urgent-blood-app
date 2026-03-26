import type { User } from "../../types";

interface StatsGridProps {
  user: User;
}

const StatsGrid = ({ user }: StatsGridProps) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Donations */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40 group">
        <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
          Total Donations
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-headline font-black text-on-surface">
            {user.totalDonations ?? 0}
          </span>
          <span className="text-primary font-bold">Units</span>
        </div>
        <div className="h-1 bg-signature-gradient w-full rounded-full opacity-30 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Trust Rating */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40 border-l-4 border-tertiary">
        <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
          Trust Rating
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-headline font-black text-on-surface">
            {user.trustRating?.toFixed(1) ?? "0.0"}
          </span>
          <span className="text-tertiary font-bold">/ 5</span>
        </div>
        <p className="text-[10px] text-secondary font-medium italic">
          Based on {user.ratingCount ?? 0} reviews
        </p>
      </div>

      {/* Impact Score */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40 bg-gradient-to-br from-primary-container to-primary text-white">
        <div className="flex justify-between items-start">
          <span className="font-semibold text-xs uppercase tracking-wider opacity-80">
            Impact Status
          </span>
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
        </div>
        <h3 className="font-headline font-extrabold text-2xl">
          {(user.totalDonations ?? 0) >= 10
            ? "Elite Donor"
            : (user.totalDonations ?? 0) >= 5
              ? "Active Donor"
              : "New Donor"}
        </h3>
        <span className="text-xs font-medium opacity-70">
          {user.availability ? "Available to donate" : "Currently unavailable"}
        </span>
      </div>
    </section>
  );
};

export default StatsGrid;
