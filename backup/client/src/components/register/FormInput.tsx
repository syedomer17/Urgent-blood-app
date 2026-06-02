interface FormInputProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const FormInput = ({ label, type, placeholder, value, onChange }: FormInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-gray-400"
      />
    </div>
  );
};

export default FormInput;
