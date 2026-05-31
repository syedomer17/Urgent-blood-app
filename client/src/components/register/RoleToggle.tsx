type Role = "donor" | "requester" | "hospital";

interface RoleToggleProps {
  value: Role;
  onChange: (value: Role) => void;
}

const roles: { key: Role; label: string; icon: string }[] = [
  { key: "donor", label: "Donor", icon: "volunteer_activism" },
  { key: "requester", label: "Requester", icon: "emergency" },
  { key: "hospital", label: "Hospital", icon: "local_hospital" },
];

const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
        Primary Role
      </label>
      <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
        {roles.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 py-3 px-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center gap-1 ${
              value === key
                ? "bg-white shadow-sm text-primary"
                : "text-secondary hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export type { Role };
export default RoleToggle;
