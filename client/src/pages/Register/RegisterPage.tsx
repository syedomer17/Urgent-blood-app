import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HeroSection,
  FormInput,
  BloodGroupSelect,
  RoleToggle,
  LocationInput,
  StepIndicator,
} from "../../components/register";
import type { Role } from "../../components/register/RoleToggle";
import type { LocationData } from "../../components/register/LocationInput";

const RegisterPage = () => {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Step 2 fields
  const [bloodGroup, setBloodGroup] = useState("");
  const [role, setRole] = useState<Role>("donor");
  const [location, setLocation] = useState<LocationData>({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    areaName: "",
    latitude: null,
    longitude: null,
  });

  const [loading, setLoading] = useState(false);

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "donor" && !bloodGroup) {
      toast.error("Blood group is required for donors.");
      return;
    }

    // Build request body
    const body: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };

    if (bloodGroup) body.bloodGroup = bloodGroup;
    if (contactNumber.trim()) body.contactNumber = contactNumber.trim();

    const hasLocation =
      location.address ||
      location.city ||
      location.state ||
      location.zipCode ||
      location.latitude !== null;

    if (hasLocation) {
      const loc: Record<string, unknown> = {};
      if (location.address) loc.address = location.address;
      if (location.city) loc.city = location.city;
      if (location.state) loc.state = location.state;
      if (location.zipCode) loc.zipCode = location.zipCode;
      if (location.areaName) loc.areaName = location.areaName;
      if (location.latitude !== null) loc.latitude = location.latitude;
      if (location.longitude !== null) loc.longitude = location.longitude;
      body.location = loc;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created successfully! Welcome to LifeLink.");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col md:flex-row min-h-screen bg-background font-body text-on-surface">
      <HeroSection />

      <section className="md:w-7/12 bg-surface p-6 md:p-20 flex flex-col justify-center">
        <div className="max-w-xl mx-auto w-full">
          <StepIndicator
            currentStep={step}
            totalSteps={2}
            label={
              step === 1
                ? "Step 1: Account Details"
                : "Step 2: Donor Profile"
            }
          />

          <header className="mb-12">
            <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">
              {step === 1 ? "Create your account" : "Complete your profile"}
            </h3>
            <p className="text-secondary">
              {step === 1
                ? "Start your journey as a life-saving hero today."
                : "Help us match you with those who need you most."}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ---- STEP 1: Account Details ---- */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={setName}
                  />
                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={setEmail}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                  />
                  <FormInput
                    label="Contact Number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={contactNumber}
                    onChange={setContactNumber}
                  />
                </div>

                {/* Next Step Button */}
                <div className="pt-6 space-y-6">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-signature-gradient text-white font-headline font-bold py-5 rounded-xl text-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                  <p className="text-center text-secondary font-medium">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1"
                    >
                      Log In
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ---- STEP 2: Donor Profile ---- */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BloodGroupSelect
                    value={bloodGroup}
                    onChange={setBloodGroup}
                  />
                  <RoleToggle value={role} onChange={setRole} />
                </div>

                <LocationInput value={location} onChange={setLocation} />

                {/* Back & Submit Buttons */}
                <div className="pt-6 space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-signature-gradient text-white font-headline font-bold py-5 rounded-xl text-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          progress_activity
                        </span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full bg-surface-container-highest text-secondary font-headline font-bold py-4 rounded-xl text-base hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">
                      arrow_back
                    </span>
                    Back
                  </button>
                </div>
              </>
            )}
          </form>

          <footer className="mt-20 flex justify-between items-center text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40">
            <span>&copy; 2024 LifeLink Inc.</span>
            <div className="flex gap-4">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
