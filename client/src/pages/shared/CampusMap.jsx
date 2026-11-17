import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LocateFixed, Navigation, MapPin } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState, Feedback } from "../../components/ui/Feedback";
import useApi from "../../hooks/useApi";
const campus = { latitude: 24.01343, longitude: 89.2791, name: "PUST campus" };
export default function CampusMap() {
  const request = useApi("/map"),
    [params] = useSearchParams();
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState(Number(params.get("location")) || null),
    [position, setPosition] = useState(null),
    [error, setError] = useState("");
  const rows = (request.data || []).filter((item) =>
    `${item.name} ${item.category} ${item.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const location = request.data?.find((item) => item.id === selected);
  const point =
    position ||
    (location?.latitude != null && location?.longitude != null
      ? location
      : campus);
  const lat = Number(point.latitude),
    lon = Number(point.longitude),
    delta = 0.004;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`;
  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) =>
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          name: "Your location",
        }),
      () =>
        setError(
          "Your location could not be accessed. Allow location access or choose a campus location.",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <AppLayout>
      <PageHeader
        title="Find your way around"
        subtitle="Explore campus locations and open walking directions"
      />
      <main className="page-pad py-6">
        <div className="card overflow-hidden">
          <iframe
            title={`Map of ${point.name}`}
            src={embed}
            className="h-80 w-full border-0 md:h-96"
            loading="lazy"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="font-semibold">{point.name}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={locate}>
                <LocateFixed size={16} />
                My location
              </button>
              {position && (
                <button
                  className="btn-secondary"
                  onClick={() => setPosition(null)}
                >
                  Back to campus
                </button>
              )}
              <a
                className="btn-primary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${location?.latitude != null && location?.longitude != null ? `${location.latitude},${location.longitude}` : encodeURIComponent("Pabna University of Science and Technology")}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={16} />
                Directions
              </a>
            </div>
          </div>
        </div>
        <Feedback error={error} />
        {location && location.latitude == null && (
          <p className="notice mt-4">
            An exact location has not been published for {location.name}. The
            map shows the campus overview.
          </p>
        )}
        <label className="field mt-6">
          Search campus locations
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Library, medical center, departments…"
          />
        </label>
        <DataState request={request} empty={!rows.length}>
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item.id);
                  setPosition(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`card flex items-center gap-3 p-4 text-left ${selected === item.id ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
              >
                <MapPin className="shrink-0 text-blue-600" size={22} />
                <span>
                  <b className="block">{item.name}</b>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.category} · {item.description}
                  </span>
                  {item.latitude == null && (
                    <span className="text-xs text-slate-500">
                      Coordinates not published
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}
