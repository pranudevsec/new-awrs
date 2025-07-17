import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

export function UploadDocs() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false); // 🆕 state for loader

  const handleUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true); // start loading

    try {
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/api/chatbot/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("File uploaded successfully!");
      } else {
        toast.error("❌ Upload failed: " + (data.error ?? "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Upload error occurred.");
    } finally {
      setIsUploading(false); // stop loading
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-warning bg-opacity-25 px-3">
      <div className="card shadow-lg border border-light rounded-4 p-4" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="card-body text-center">
          <h1 className="card-title fw-bold text-dark mb-3 fs-2">Upload Documents</h1>
          <p className="text-secondary mb-4">
            Upload your documents to enable the chatbot to understand your data.
          </p>

          <label
            htmlFor="file-upload"
            className="border border-2 border-primary rounded-4 py-5 px-3 d-flex flex-column align-items-center justify-content-center bg-light"
            style={{
              cursor: "pointer",
              borderStyle: "dashed",
            }}
          >
            <UploadCloud size={48} className="text-primary mb-3" />
            <span className="text-primary fw-medium fs-5">
              Click to upload or drag files here
            </span>
            <input
              id="file-upload"
              type="file"
              ref={inputRef}
              className="d-none"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>

          <p className="text-muted small mt-3">
            Supported formats: PDF, DOCX, TXT
          </p>

          {isUploading && (
            <div className="mt-3 d-flex flex-column align-items-center">
              <div className="spinner-border text-primary" aria-hidden="true" style={{ width: "2rem", height: "2rem" }}>
                <span className="visually-hidden">Uploading...</span>
              </div>
              <div aria-live="polite">
                <small className="text-primary mt-2">Uploading file, please wait...</small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
