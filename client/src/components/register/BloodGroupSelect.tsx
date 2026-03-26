const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface BloodGroupSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const BloodGroupSelect = ({ value, onChange }: BloodGroupSelectProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
        Blood Group
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl p-4 pr-10 focus:ring-2 focus:ring-primary transition-all text-on-surface"
        >
          <option disabled value="">
            Select type
          </option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
};

export default BloodGroupSelect;
