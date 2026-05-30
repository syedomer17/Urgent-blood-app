import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LocationPicker from "../../components/location/LocationPicker";
import type { LocationData } from "../../components/location/LocationPicker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const URGENCY_LEVELS = [
  { value: "low", label: "Normal", icon: "schedule", color: "#16a34a", bg: "#f0fdf4" },
  { value: "medium", label: "Urgent", icon: "priority_high", color: "#d97706", bg: "#fffbeb" },
  { value: "high", label: "High", icon: "warning", color: "#ea580c", bg: "#fff7ed" },
  { value: "critical", label: "Emergency", icon: "emergency", color: "#dc2626", bg: "#fef2f2" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  // Form state
  const [bloodGroup, setBloodGroup] = useState("");
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [urgency, setUrgency] = useState("high");
  const [hospitalName, setHospitalName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  // Document verification
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP, and PDF allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Max 10MB.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    setVerification(null);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) return;
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
      if (!res.ok) { toast.error(data.message || "Verification failed."); return; }

      const result: VerificationResult = data.data.verification;
      setVerification(result);

      if (result.isVerified) {
        toast.success("Document verified!");
        if (result.patientName && !patientName) setPatientName(result.patientName);
        if (result.bloodGroup && !bloodGroup) setBloodGroup(result.bloodGroup);
        if (result.hospitalName && !hospitalName) setHospitalName(result.hospitalName);
      } else {
        toast.error("Verification failed. Try a different document.");
      }
    } catch {
      toast.error("Network error during verification.");
    } finally {
      setVerifying(false);
    }
  };

    const handleRetry = async () => {
      if (!selectedFile) return;
      setVerification(null);
      await handleVerify();
    };

  const removeFile = () => {
    setSelectedFile(null);
    setVerification(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup) { toast.error("Select a blood group."); return; }
    if (!patientName.trim()) { toast.error("Patient name is required."); return; }
    if (!hospitalName.trim()) { toast.error("Hospital name is required."); return; }
    if (!contactNumber.trim()) { toast.error("Contact number is required."); return; }
    if (!requiredDate) { toast.error("Required date is needed."); return; }
    if (!verification?.isVerified) {
      toast.error("Please verify a hospital document first.");
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
          unitsRequired,
          urgency,
          hospitalName: hospitalName.trim(),
          requiredDate: new Date(requiredDate).toISOString(),
          contactNumber: contactNumber.trim(),
          notes: notes.trim() || undefined,
          location: Object.keys(location).length > 0 ? location : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to create request."); return; }
      toast.success("Blood request posted! Notifying donors...");
      navigate("/requests");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Min date for the date picker = now
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <main className="pb-32">
      {/* Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%)",
          padding: "24px 20px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: -0.5 }}>
            Request Blood
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: "4px 0 0" }}>
            Fill in the details below — we'll find donors near you
          </p>
        </div>
        <div style={{ position: "absolute", right: -40, bottom: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      </section>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>

        {/* ── 1. Blood Group ── */}
        <div style={{ marginTop: -20, position: "relative", zIndex: 2 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 20px 16px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              Blood Group Needed
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {BLOOD_GROUPS.map((g) => {
                const active = bloodGroup === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setBloodGroup(g)}
                    style={{
                      padding: "14px 0",
                      borderRadius: 14,
                      border: active ? "2px solid #b71c1c" : "2px solid #eee",
                      background: active ? "#b71c1c" : "#fafafa",
                      color: active ? "#fff" : "#333",
                      fontWeight: 800,
                      fontSize: 17,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      transform: active ? "scale(1.05)" : "scale(1)",
                      boxShadow: active ? "0 4px 12px rgba(183,28,28,0.3)" : "none",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 2. Urgency ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            How urgent?
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {URGENCY_LEVELS.map((u) => {
              const active = urgency === u.value;
              return (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "12px 4px",
                    borderRadius: 14,
                    border: active ? `2px solid ${u.color}` : "2px solid transparent",
                    background: active ? u.bg : "#f9f9f9",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: active ? u.color : "#aaa", fontVariationSettings: "'FILL' 1" }}
                  >
                    {u.icon}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? u.color : "#888" }}>
                    {u.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Units ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            Units Required
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <button
              type="button"
              onClick={() => setUnitsRequired((v) => Math.max(1, v - 1))}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "2px solid #eee", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#666",
              }}
            >
              −
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "#b71c1c", lineHeight: 1 }}>
                {unitsRequired}
              </div>
              <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginTop: 4 }}>
                {unitsRequired === 1 ? "unit" : "units"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnitsRequired((v) => Math.min(20, v + 1))}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "2px solid #eee", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#666",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* ── 4. Patient & Hospital Details ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 16 }}>
            Patient & Hospital
          </label>

          {/* Patient Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 14, padding: "0 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa", marginRight: 10 }}>person</span>
              <input
                type="text"
                placeholder="Patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", padding: "14px 0", fontSize: 15, outline: "none", color: "#1a1c1d" }}
              />
            </div>
          </div>

          {/* Hospital Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 14, padding: "0 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa", marginRight: 10, fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
              <input
                type="text"
                placeholder="Hospital name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", padding: "14px 0", fontSize: 15, outline: "none", color: "#1a1c1d" }}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 14, padding: "0 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa", marginRight: 10, fontVariationSettings: "'FILL' 1" }}>call</span>
              <input
                type="tel"
                placeholder="Contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", padding: "14px 0", fontSize: 15, outline: "none", color: "#1a1c1d" }}
              />
            </div>
          </div>

          {/* Required Date/Time */}
          <div>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 14, padding: "0 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa", marginRight: 10, fontVariationSettings: "'FILL' 1" }}>event</span>
              <input
                type="datetime-local"
                min={minDate}
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", padding: "14px 0", fontSize: 15, outline: "none", color: requiredDate ? "#1a1c1d" : "#999" }}
              />
            </div>
          </div>
        </div>

        {/* ── 5. Hospital Location (map) ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            Hospital Location
          </label>
          <LocationPicker value={locationData} onChange={setLocationData} />
        </div>

        {/* ── 6. Additional Notes (optional, collapsed feel) ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            Notes <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11 }}>(optional)</span>
          </label>
          <textarea
            placeholder="Ward number, special instructions..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", border: "none", background: "#f5f5f5", borderRadius: 14, padding: "12px 14px", fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit", color: "#1a1c1d" }}
          />
        </div>

        {/* ── 7. Document Verification ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#2e7d32", fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1c1d", margin: 0 }}>Verify Hospital Document</p>
              <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>Upload prescription or admission form</p>
            </div>
          </div>

          {!selectedFile ? (
            <label style={{ cursor: "pointer", display: "block" }}>
              <div style={{
                border: "2px dashed #ddd",
                borderRadius: 16,
                padding: "28px 16px",
                textAlign: "center",
                transition: "all 0.15s",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#ccc", display: "block", marginBottom: 6 }}>cloud_upload</span>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#555", margin: 0 }}>Tap to upload</p>
                <p style={{ fontSize: 11, color: "#bbb", margin: "4px 0 0" }}>JPG, PNG, WebP, PDF — max 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </label>
          ) : (
            <div>
              {/* File info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f9f9f9", borderRadius: 14, padding: "10px 14px", marginBottom: 12 }}>
                {filePreview ? (
                  <img src={filePreview} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#1976d2" }}>description</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#333", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</p>
                  <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button type="button" onClick={removeFile} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <span className="material-symbols-outlined" style={{ color: "#e53935", fontSize: 20 }}>close</span>
                </button>
              </div>

              {/* Verify button */}
              {!verification && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 14,
                    background: "#2e7d32", color: "#fff", border: "none",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: verifying ? 0.6 : 1,
                  }}
                >
                  {verifying ? (
                    <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Verifying...</>
                  ) : (
                    <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>smart_toy</span> Verify with AI</>
                  )}
                </button>
              )}

              {/* Verification result */}
              {verification && (
                <div style={{
                  borderRadius: 14, padding: "14px 16px",
                  background: verification.isVerified ? "#e8f5e9" : "#ffebee",
                  border: `1px solid ${verification.isVerified ? "#a5d6a7" : "#ef9a9a"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="material-symbols-outlined" style={{ color: verification.isVerified ? "#2e7d32" : "#c62828", fontVariationSettings: "'FILL' 1", fontSize: 20 }}>
                      {verification.isVerified ? "check_circle" : "cancel"}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: verification.isVerified ? "#2e7d32" : "#c62828" }}>
                      {verification.isVerified ? "Verified" : "Not Verified"}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#888" }}>
                      {Math.round(verification.confidence * 100)}%
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{verification.details}</p>
                  {verification.flags.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {verification.flags.map((flag, i) => (
                        <p key={i} style={{ fontSize: 11, color: "#c62828", margin: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>warning</span> {flag}
                        </p>
                      ))}
                    </div>
                  )}
                  {!verification.isVerified && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button type="button" onClick={handleRetry} disabled={verifying} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        {verifying ? 'Retrying...' : 'Retry'}
                      </button>
                      <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', color: '#b71c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                        Try a different document
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <div style={{ padding: "20px 0 0" }}>
          <button
            type="submit"
            disabled={loading || !verification?.isVerified}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 18,
              border: "none",
              background: verification?.isVerified
                ? "linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%)"
                : "#ddd",
              color: verification?.isVerified ? "#fff" : "#999",
              fontWeight: 800,
              fontSize: 17,
              cursor: verification?.isVerified && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: verification?.isVerified ? "0 8px 24px rgba(183,28,28,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 22 }}>progress_activity</span> Posting...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>bolt</span> Post Blood Request</>
            )}
          </button>
          {!verification?.isVerified && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 10 }}>
              Verify a hospital document to enable posting
            </p>
          )}
        </div>
      </form>
    </main>
  );
};

export default CreateRequestPage;
