import { LocateFixed, MapPin, Navigation, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";

export default function CampusMap() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const res = await api.get("/map");
      setLocations(res.data);
    }

    load();
  }, []);

  const fallback = [
    { id: 1, name: "CSE Department", category: "Academic", description: "Engineering Building" },
    { id: 2, name: "EEE Department", category: "Academic", description: "Engineering Building" },
    { id: 3, name: "Central Library", category: "Facility", description: "Library Building" },
    { id: 4, name: "Admin Building", category: "Office", description: "Administrative Building" },
    { id: 5, name: "Medical Center", category: "Facility", description: "Health support" },
  ];

  const data = locations.length ? locations : fallback;

  const filtered = useMemo(() => {
    return data.filter((item) =>
      `${item.name} ${item.category} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-8 pt-8 text-white">
        <h1 className="text-2xl font-bold">Campus Map</h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-600">
          <Search size={21} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="card overflow-hidden">
          <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
            <div className="grid grid-cols-3 gap-4 text-white">
              <Marker label="Eng" color="bg-blue-600" />
              <Marker label="Library" color="bg-green-600" />
              <Marker label="Admin" color="bg-purple-600" />
              <Marker label="Cafe" color="bg-orange-600" />
              <Marker label="Mosque" color="bg-emerald-600" />
              <Marker label="Medical" color="bg-red-600" />
              <Marker label="Boys Hall" color="bg-teal-600" />
              <Marker label="Sports" color="bg-indigo-600" />
              <Marker label="Girls Hall" color="bg-pink-600" />
            </div>

            <button className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow">
              <Navigation size={20} />
            </button>
          </div>

          <div className="bg-white py-4 text-center text-sm text-slate-500">
            Interactive campus map • Tap markers for details
          </div>
        </div>

        <h2 className="mb-4 mt-7 text-xl font-bold">All Locations</h2>

        <div className="space-y-3">
          {filtered.map((location) => (
            <div key={location.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MapPin size={22} />
              </div>

              <div className="flex-1">
                <h3 className="font-bold">{location.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{location.description}</p>
              </div>

              <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                {location.category}
              </span>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}

function Marker({ label, color }) {
  return (
    <button className={`rounded-xl px-8 py-3 text-sm font-bold shadow ${color}`}>
      {label}
    </button>
  );
}