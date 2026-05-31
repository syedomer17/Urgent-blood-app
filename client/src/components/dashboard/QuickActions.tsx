import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { User } from "../../types";

interface QuickActionsProps {
  user: User;
  onToggleAvailability: () => void;
}

const QuickActions = ({ user, onToggleAvailability }: QuickActionsProps) => {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {user.role === "requester" || user.role === "hospital" || user.role === "admin" ? (
        <button
          onClick={() => navigate("/create-request")}
          className="bg-signature-gradient text-white rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">bloodtype</span>
          Request Blood
        </button>
      ) : (
        <button
          onClick={() => navigate("/requests")}
          className="bg-signature-gradient text-white rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">bloodtype</span>
          View Requests
        </button>
      )}

      <button
        onClick={() => navigate("/requests")}
        className="bg-surface-container-highest text-primary rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">person_search</span>
        Nearby Requests
      </button>

      <button
        onClick={() => {
          onToggleAvailability();
          toast.success(
            user.availability
              ? "You are now unavailable"
              : "You are now available to donate"
          );
        }}
        className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">event_available</span>
        {user.availability ? "Set Unavailable" : "Set Available"}
      </button>
    </section>
  );
};

export default QuickActions;
