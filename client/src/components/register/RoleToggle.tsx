type Role = "donor" | "requester";

interface RoleToggleProps {
  value: Role;
  onChange: (value: Role) => void;
}

const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
        Primary Role
      </label>
      <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => onChange("donor")}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            value === "donor"
              ? "bg-white shadow-sm text-primary"
              : "text-secondary hover:bg-surface-variant/50"
          }`}
        >
          Donor
        </button>
        <button
          type="button"
          onClick={() => onChange("requester")}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            value === "requester"
              ? "bg-white shadow-sm text-primary"
              : "text-secondary hover:bg-surface-variant/50"
          }`}
        >
          Requester
        </button>
      </div>
    </div>
  );
};

export type { Role };
export default RoleToggle;
