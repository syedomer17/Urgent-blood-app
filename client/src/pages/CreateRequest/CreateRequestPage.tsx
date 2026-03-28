import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LocationPicker from "../../components/location/LocationPicker";
import type { LocationData } from "../../components/location/LocationPicker";

const URGENCY_LEVELS = [
  { value: "low", label: "Low", activeClass: "bg-secondary-fixed text-on-secondary-fixed-variant" },
  { value: "medium", label: "Medium", activeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  { value: "high", label: "High", activeClass: "bg-primary-fixed text-on-primary-fixed-variant" },
  { value: "critical", label: "Critical", activeClass: "bg-error-container text-on-error-container" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  hospitalName: string | null;
  documentType: string | null;
  patientName: string | null;
  bloodGroup: string | null;
  details: string;
  flags: string[];
}

const CreateRequestPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [unitsRequired, setUnitsRequired] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  // Document verification state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.");
      e.target.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setVerification(null);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const res = await fetch("/api/v1/requests/verify-document", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed.");
        return;
      }

      const result: VerificationResult = data.data.verification;
      setVerification(result);

      if (result.isVerified) {
        toast.success("Document verified successfully!");

        // Auto-fill fields if detected by AI
        if (result.patientName && !patientName) {
          setPatientName(result.patientName);
        }
        if (result.bloodGroup && !bloodGroup) {
          setBloodGroup(result.bloodGroup);
        }
        if (result.hospitalName && !locationData) {
          // Auto-fill hospital name as address hint but don't override a real location pick
          toast("Hospital name detected: " + result.hospitalName, { icon: "🏥" });
        }
      } else {
        toast.error("Document could not be verified. Please upload a valid hospital document.");
      }
    } catch {
      toast.error("Network error during verification.");
    } finally {
      setVerifying(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setVerification(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) { toast.error("Patient name is required."); return; }
    if (!bloodGroup) { toast.error("Blood group is required."); return; }
    if (!unitsRequired || Number(unitsRequired) < 1) { toast.error("At least 1 unit is required."); return; }
    if (!contactNumber.trim()) { toast.error("Contact number is required."); return; }

    // Require verified document
    if (!verification?.isVerified) {
      toast.error("Please upload and verify a hospital document before submitting.");
      return;
    }

    const location: Record<string, unknown> = {};
    if (locationData) {
      location.address = locationData.address;
      location.latitude = locationData.lat;
      location.longitude = locationData.lng;
      if (locationData.city) location.city = locationData.city;
      if (locationData.state) location.state = locationData.state;
      if (locationData.zipCode) location.zipCode = locationData.zipCode;
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
        {/* Hospital Document Verification */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-tertiary/10 p-2 rounded-xl">
              <span
                className="material-symbols-outlined text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Hospital Document Verification
              </h3>
              <p className="text-xs text-secondary">
                Upload a hospital document (prescription, blood test report, admission form) for AI verification
              </p>
            </div>
          </div>

          {/* Upload Area */}
          {!selectedFile ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined text-4xl text-secondary/50 mb-2">
                  cloud_upload
                </span>
                <p className="font-headline font-bold text-sm text-on-surface">
                  Click to upload document
                </p>
                <p className="text-xs text-secondary mt-1">
                  JPG, PNG, WebP, or PDF — max 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Document preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-error-container/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      description
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-on-surface truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &middot;{" "}
                    {selectedFile.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 rounded-lg hover:bg-error-container/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-error text-xl">
                    close
                  </span>
                </button>
              </div>

              {/* Verify Button */}
              {!verification && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full bg-tertiary text-white font-headline font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                      Verifying with AI...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">smart_toy</span>
                      Verify Document
                    </>
                  )}
                </button>
              )}

              {/* Verification Result */}
              {verification && (
                <div
                  className={`rounded-xl p-4 space-y-3 ${
                    verification.isVerified
                      ? "bg-green-50 ring-1 ring-green-200"
                      : "bg-error-container/30 ring-1 ring-error/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined ${
                        verification.isVerified ? "text-green-600" : "text-error"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {verification.isVerified ? "check_circle" : "cancel"}
                    </span>
                    <span
                      className={`font-headline font-bold text-sm ${
                        verification.isVerified ? "text-green-700" : "text-on-error-container"
                      }`}
                    >
                      {verification.isVerified
                        ? "Document Verified"
                        : "Verification Failed"}
                    </span>
                    <span className="ml-auto text-xs font-bold text-secondary">
                      {Math.round(verification.confidence * 100)}% confidence
                    </span>
                  </div>

                  <p className="text-xs text-secondary">{verification.details}</p>

                  {(verification.hospitalName || verification.documentType) && (
                    <div className="flex flex-wrap gap-2">
                      {verification.hospitalName && (
                        <span className="bg-white/80 px-2 py-1 rounded-lg text-[10px] font-bold text-on-surface">
                          {verification.hospitalName}
                        </span>
                      )}
                      {verification.documentType && (
                        <span className="bg-white/80 px-2 py-1 rounded-lg text-[10px] font-bold text-secondary">
                          {verification.documentType}
                        </span>
                      )}
                      {verification.bloodGroup && (
                        <span className="bg-primary-fixed px-2 py-1 rounded-lg text-[10px] font-bold text-primary">
                          Blood: {verification.bloodGroup}
                        </span>
                      )}
                    </div>
                  )}

                  {verification.flags.length > 0 && (
                    <div className="space-y-1">
                      {verification.flags.map((flag, i) => (
                        <p key={i} className="text-[10px] text-error font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          {flag}
                        </p>
                      ))}
                    </div>
                  )}

                  {!verification.isVerified && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Upload a different document
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
            <LocationPicker value={locationData} onChange={setLocationData} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !verification?.isVerified}
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

        {!verification?.isVerified && (
          <p className="text-center text-xs text-secondary">
            You must verify a hospital document before posting a request
          </p>
        )}
      </form>
    </main>
  );
};

export default CreateRequestPage;
