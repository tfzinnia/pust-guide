import { useEffect, useState } from "react";
export default function ConnectionBar() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    !online && (
      <div
        role="status"
        className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900"
      >
        You’re offline. Previously viewed academic information remains
        available. Changes require a connection.
      </div>
    )
  );
}
