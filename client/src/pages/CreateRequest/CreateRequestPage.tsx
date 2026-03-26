import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const URGENCY_LEVELS = [
  { value: "low", label: "Low", activeClass: "bg-secondary-fixed text-on-secondary-fixed-variant" },
  { value: "medium", label: "Medium", activeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  { value: "high", label: "High", activeClass: "bg-primary-fixed text-on-primary-fixed-variant" },
  { value: "critical", label: "Critical", activeClass: "bg-error-container text-on-error-container" },
];

const CreateRequestPage = () => {
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [unitsRequired, setUnitsRequired] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) { toast.error("Patient name is required."); return; }
    if (!bloodGroup) { toast.error("Blood group is required."); return; }
    if (!unitsRequired || Number(unitsRequired) < 1) { toast.error("At least 1 unit is required."); return; }
    if (!contactNumber.trim()) { toast.error("Contact number is required."); return; }

    const location: Record<string, unknown> = {};
    if (address) location.address = address;
    if (city) location.city = city;
    if (state) location.state = state;
    if (zipCode) location.zipCode = zipCode;

    // Try to get GPS coordinates
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        location.latitude = pos.coords.latitude;
        location.longitude = pos.coords.longitude;
      } catch {
        // GPS not available, continue without it
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientName: patientName.trim(),
          bloodGroup,
          unitsRequired: Number(unitsRequired),
          urgency,
          contactNumber: contactNumber.trim(),
          notes: notes.trim() || undefined,
          location: Object.keys(location).length > 0 ? location : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create request.");
        return;
      }

      toast.success("Blood request posted! Matching donors nearby...");
      navigate("/requests");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-4 px-4 max-w-2xl mx-auto space-y-8">
      {/* Hero Header */}
      <section className="bg-signature-gradient rounded-3xl p-8 shadow-xl text-on-primary overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight mb-2">
            Create Blood Request
          </h1>
          <p className="text-on-primary-container text-sm font-medium opacity-90 max-w-xs">
            Your request will be broadcast to compatible donors in your
            immediate vicinity.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Full name of patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all"
              >
                <option value="">Select Group</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Units & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Units Required
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-4">
                <span className="material-symbols-outlined text-gray-400 mr-2">
                  bloodtype
                </span>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(e.target.value)}
                  className="w-full bg-transparent border-none py-3 focus:ring-0 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Urgency Level
              </label>
              <div className="flex gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setUrgency(level.value)}
                    className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                      urgency === level.value
                        ? level.activeClass
                        : "bg-surface-container-low text-gray-500"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact & Notes */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Contact Number
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-4">
                <span className="material-symbols-outlined text-gray-400 mr-2">
                  call
                </span>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-transparent border-none py-3 focus:ring-0 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-headline text-sm font-bold ml-1 text-secondary">
                Additional Notes
              </label>
              <textarea
                placeholder="e.g. Hospital name, Ward number, specific instructions..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="font-headline text-sm font-bold ml-1 text-secondary">
              Hospital Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="col-span-2 bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-signature-gradient w-full py-5 rounded-2xl text-white font-headline font-extrabold text-lg shadow-[0_12px_24px_rgba(183,28,28,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              Posting Request...
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              Post Urgent Request
            </>
          )}
        </button>
      </form>
    </main>
  );
};

export default CreateRequestPage;
