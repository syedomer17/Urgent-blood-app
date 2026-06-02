interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

const StepIndicator = ({ currentStep, totalSteps, label }: StepIndicatorProps) => {
  return (
    <div className="mb-10 flex items-center gap-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full ${
            i < currentStep ? "bg-primary" : "bg-surface-container-highest"
          }`}
        />
      ))}
      <span className="text-xs font-bold font-headline text-secondary uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

export default StepIndicator;
