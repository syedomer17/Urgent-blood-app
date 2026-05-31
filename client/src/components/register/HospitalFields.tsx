import { useRef, useState, useCallback } from "react";
import FormInput from "./FormInput";

interface HospitalFieldsProps {
  hospitalName: string;
  onHospitalNameChange: (v: string) => void;
  registrationNumber: string;
  onRegistrationNumberChange: (v: string) => void;
  licenseNumber: string;
  onLicenseNumberChange: (v: string) => void;
  gstNumber: string;
  onGstNumberChange: (v: string) => void;
  hospitalAddress: string;
  onHospitalAddressChange: (v: string) => void;
  hospitalEmail: string;
  onHospitalEmailChange: (v: string) => void;
  hospitalPhone: string;
  onHospitalPhoneChange: (v: string) => void;
  documentFile: File | null;
  onDocumentFileChange: (file: File | null) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const HospitalFields = ({
  hospitalName,
  onHospitalNameChange,
  registrationNumber,
  onRegistrationNumberChange,
  licenseNumber,
  onLicenseNumberChange,
  gstNumber,
  onGstNumberChange,
  hospitalAddress,
  onHospitalAddressChange,
  hospitalEmail,
  onHospitalEmailChange,
  hospitalPhone,
  onHospitalPhoneChange,
  documentFile,
  onDocumentFileChange,
}: HospitalFieldsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      onDocumentFileChange(file);
    },
    [onDocumentFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
    },
    [handleFile]
  );

  const isImage = documentFile?.type.startsWith("image/");
  const previewUrl = documentFile && isImage ? URL.createObjectURL(documentFile) : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Hospital Name"
          type="text"
          placeholder="City General Hospital"
          value={hospitalName}
          onChange={onHospitalNameChange}
        />
        <FormInput
          label="Registration Number"
          type="text"
          placeholder="REG-XXXX-XXXX"
          value={registrationNumber}
          onChange={onRegistrationNumberChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="License Number"
          type="text"
          placeholder="LIC-XXXX-XXXX"
          value={licenseNumber}
          onChange={onLicenseNumberChange}
        />
        <FormInput
          label="GST Number"
          type="text"
          placeholder="22AAAAA0000A1Z5 (optional)"
          value={gstNumber}
          onChange={onGstNumberChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
          Hospital Address
        </label>
        <textarea
          placeholder="Full hospital address including city, state, and PIN code"
          value={hospitalAddress}
          onChange={(e) => onHospitalAddressChange(e.target.value)}
          rows={3}
          className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-gray-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Hospital Email"
          type="email"
          placeholder="admin@hospital.com"
          value={hospitalEmail}
          onChange={onHospitalEmailChange}
        />
        <FormInput
          label="Hospital Phone"
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          value={hospitalPhone}
          onChange={onHospitalPhoneChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
          Hospital Document
        </label>

        {!documentFile ? (
          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            className={`relative flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl transition-colors ${
                isDragging ? "text-primary" : "text-secondary"
              }`}
            >
              cloud_upload
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-on-surface">
                Drag &amp; drop your hospital document here
              </p>
              <p className="text-xs text-secondary mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-[10px] text-secondary/60 uppercase tracking-wider font-bold mt-1">
              JPEG, PNG, WebP, or PDF
            </p>
          </div>
        ) : (
          <div className="relative flex items-center gap-4 p-4 bg-surface-container-lowest ring-1 ring-outline-variant/20 rounded-2xl">
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt="Document preview"
                className="w-20 h-20 object-cover rounded-xl ring-1 ring-outline-variant/10"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-error/10 rounded-xl">
                <span className="material-symbols-outlined text-3xl text-error">
                  picture_as_pdf
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">
                {documentFile.name}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {(documentFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onDocumentFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default HospitalFields;
