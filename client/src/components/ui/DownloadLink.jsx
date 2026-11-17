import { Download } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
export default function DownloadLink({
  url,
  label = "Download",
  cache = false,
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [cached, setCached] = useState(false);
  if (!url)
    return <span className="text-xs text-slate-500">No file attached</span>;
  const internal = /^\/api\/files\/[a-f0-9-]+$/.test(url);
  const external = /^https?:\/\//i.test(url);
  if (!internal && !external)
    return (
      <span className="text-xs text-slate-500">Attachment unavailable</span>
    );
  async function download(event) {
    if (external || busy) {
      if (busy) event.preventDefault();
      return;
    }
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = url.slice(4),
        key = new URL(url, window.location.origin).href;
      let blob;
      try {
        const response = await api.get(endpoint, {
          responseType: "blob",
          timeout: 60000,
        });
        blob = response.data;
        if (cache && "caches" in window) {
          const storage = await caches.open("pust-documents-v1");
          await storage.put(
            key,
            new Response(blob, {
              headers: { "Content-Type": "application/pdf" },
            }),
          );
          setCached(true);
        }
      } catch (error) {
        const stored = cache && "caches" in window && (await caches.match(key));
        if (!stored) throw error;
        blob = await stored.blob();
        setCached(true);
      }
      const objectUrl = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = cache ? "syllabus.pdf" : "evidence";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch {
      setError("Unable to download this file. Reconnect and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <a
        href={external ? url : "#download"}
        onClick={download}
        target={external ? "_blank" : undefined}
        rel="noreferrer"
        aria-disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700"
      >
        <Download size={16} />
        {busy ? "Downloading…" : label}
      </a>
      {cache && internal && (
        <p className="mt-1 text-xs text-slate-500">
          {cached
            ? "Available offline on this device"
            : "Download once to keep an offline copy"}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
