import { Bookmark } from "lucide-react";
import { useState } from "react";
import { usePortal } from "../../context/portal";
import { useAuth } from "../../context/auth";
export default function SaveButton({ kind, id }) {
  const { user } = useAuth();
  const { saved, toggleSaved } = usePortal();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!user) return null;
  const active = saved.some((item) => item.kind === kind && item.id === id);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await toggleSaved(kind, id);
    } catch (error) {
      setError(
        error.response?.data?.message || "Could not update saved items.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        aria-label={active ? "Remove bookmark" : "Save bookmark"}
        aria-pressed={active}
        disabled={busy}
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-blue-700"
      >
        <Bookmark size={16} fill={active ? "currentColor" : "none"} />
        {active ? "Saved" : "Save"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
