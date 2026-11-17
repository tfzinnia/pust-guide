import { useState } from "react";
import api from "../../api/axios";
import { Feedback } from "./Feedback";
export default function UploadField({
  purpose,
  value,
  onChange,
  onBusyChange,
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose a file smaller than 10 MB.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    setProgress(0);
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);
    try {
      const response = await api.post("/files", body, {
        timeout: 60000,
        onUploadProgress: (event) =>
          setProgress(
            Math.round((event.loaded * 100) / (event.total || event.loaded)),
          ),
      });
      onChange(response.data.url);
    } catch (error) {
      setError(
        error.response?.data?.message || "Upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      event.target.value = "";
    }
  }
  return (
    <div className="field">
      <label htmlFor={`upload-${purpose}`}>
        {purpose === "syllabus" ? "Syllabus PDF" : "Evidence attachment"}{" "}
        <span className="text-sm font-normal text-slate-500">
          (up to 10 MB)
        </span>
      </label>
      <input
        id={`upload-${purpose}`}
        type="file"
        accept={purpose === "syllabus" ? ".pdf" : ".pdf,.png,.jpg,.jpeg,.webp"}
        onChange={upload}
        disabled={busy}
      />
      {busy && <p role="status">Uploading… {progress}%</p>}
      {value && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 text-sm">
          <span>Attachment ready</span>
          <button
            type="button"
            className="text-red-600"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        </div>
      )}
      <Feedback error={error} />
    </div>
  );
}
