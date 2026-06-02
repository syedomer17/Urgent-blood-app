import toast from "react-hot-toast";
import type { BloodRequest } from "../../types";
import { API_BASE_URL } from "../../utils/apiConfig";

interface RequestCardProps {
  request: BloodRequest;
  userRole: string;
  onAccepted?: () => void;
}

const urgencyStyles: Record<string, { bg: string; text: string }> = {
  critical: {
    bg: "bg-error-container",
    text: "text-on-error-container",
  },
  high: {
    bg: "bg-primary-fixed",
    text: "text-on-primary-fixed-variant",
  },
  medium: {
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed-variant",
  },
  low: {
    bg: "bg-surface-container-high",
    text: "text-secondary",
  },
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

const RequestCard = ({ request, userRole, onAccepted }: RequestCardProps) => {
  const style = urgencyStyles[request.urgency] ?? urgencyStyles.low;

  const handleAccept = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/donations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId: request._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to accept request.");
        return;
      }
      toast.success("Request accepted! Thank you for donating.");
      onAccepted?.();
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <span
          className={`${style.bg} ${style.text} text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter`}
        >
          {request.urgency} Urgency
        </span>
        <span className="text-secondary text-xs">
          {timeAgo(request.createdAt)}
        </span>
      </div>
      <div>
        <h4 className="font-headline font-bold text-xl">
          {request.bloodGroup}
        </h4>
        <p className="text-secondary text-sm line-clamp-1">
          {request.patientName}
          {request.location?.address && ` — ${request.location.address}`}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-secondary">
        <span className="font-bold">
          {request.unitsRequired} unit{request.unitsRequired > 1 ? "s" : ""}{" "}
          needed
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            request.status === "pending"
              ? "bg-primary-fixed text-primary"
              : request.status === "accepted"
                ? "bg-secondary-fixed text-tertiary"
                : "bg-surface-container-high text-secondary"
          }`}
        >
          {request.status}
        </span>
      </div>
      {userRole === "donor" && request.status === "pending" && (
        <button
          onClick={handleAccept}
          className="w-full mt-2 border border-primary text-primary font-bold py-2 rounded-xl text-sm hover:bg-primary/5 transition-colors"
        >
          Respond Now
        </button>
      )}
    </div>
  );
};

export default RequestCard;
