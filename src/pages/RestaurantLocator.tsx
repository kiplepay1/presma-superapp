import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Phone, Globe, ExternalLink, Search, Plus, Database, Tag } from "lucide-react";
import { MALAYSIA_STATES, AREAS_BY_STATE } from "../data/malaysiaAreas";
import { geocodeArea, searchNearbyRestaurants, searchByName, googleSearchUrl, type PlaceResult } from "../lib/places";
import { findPossibleDuplicates, type DuplicateMatch } from "../lib/duplicateCheck";
import { createRestaurant, addOutlet, updateRestaurant } from "../lib/restaurants";
import { useRestaurants } from "../lib/useRestaurants";
import { useAuth } from "../lib/AuthContext";
import { overallStatusFor, type NewRestaurantInput, type Restaurant } from "../types";
import { StatusBadge } from "../components/Badges";
import RestaurantForm from "../components/RestaurantForm";
import DuplicateWarningModal from "../components/DuplicateWarningModal";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export default function RestaurantLocator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurants } = useRestaurants();

  const [state, setState] = useState<string>("Selangor");
  const [area, setArea] = useState<string>("Petaling Jaya");
  const [customArea, setCustomArea] = useState("");
  const [radius, setRadius] = useState(6000);
  const [nameQuery, setNameQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prospects, setProspects] = useState<PlaceResult[]>([]);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);

  const [addingResult, setAddingResult] = useState<PlaceResult | null>(null);
  const [editingExisting, setEditingExisting] = useState<Restaurant | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{ prospect: PlaceResult; matches: DuplicateMatch[] } | null>(null);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const areaOptions = AREAS_BY_STATE[state] ?? [];
  const targetArea = customArea.trim() || area;

  useEffect(() => {
    setArea(areaOptions[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (mapDivRef.current && !mapRef.current) {
      mapRef.current = L.map(mapDivRef.current).setView([3.139, 101.6869], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(mapRef.current);
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // --- Firebase-first: instant, free, no API call --------------------
  const inPipelineForArea = useMemo(() => {
  const areaLower = String(targetArea || "").toLowerCase();
  const stateLower = String(state || "").toLowerCase();

  return restaurants.filter((r) =>
    (r.outlets ?? []).some((o) =>
      String(o?.location || "").toLowerCase().includes(areaLower)
    ) ||
    (r.outlets ?? []).some((o) =>
      String(o?.location || "").toLowerCase().includes(stateLower)
    ) ||
    String(r.notes || "").toLowerCase().includes(areaLower)
  );
}, [restaurants, targetArea, state]);

  const nameMatchesInPipeline = useMemo(() => {
    if (!nameQuery.trim()) return [];
    const q = nameQuery.toLowerCase();
    return restaurants.filter((r) => r.name.toLowerCase().includes(q));
  }, [restaurants, nameQuery]);

  const clearMarkers = () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; };

  const plotResults = (places: PlaceResult[], centerLat: number, centerLon: number, zoom = 13) => {
    if (!mapRef.current) return;
    clearMarkers();
    mapRef.current.setView([centerLat, centerLon], zoom);
    const bounds = L.latLngBounds([[centerLat, centerLon]]);
    places.forEach((p) => {
      const marker = L.marker([p.lat, p.lon], { icon: markerIcon }).addTo(mapRef.current!).bindPopup(p.name);
      markersRef.current.push(marker);
      bounds.extend([p.lat, p.lon]);
    });
    if (places.length > 0) mapRef.current.fitBounds(bounds, { padding: [30, 30] });
  };

  // --- Explicit, deliberate Geoapify calls only -----------------------
  const discoverMore = async () => {
    if (!targetArea) { setError("Pick an area or type one in."); return; }
    setLoading(true); setError(null); setProspects([]);
    try {
      const point = await geocodeArea(`${targetArea}, ${state}, Malaysia`);
      if (!point) { setError("Couldn't find that area — try a nearby town or check the spelling."); setLoading(false); return; }
      setSearchedFor(`${targetArea}, ${state}`);
      const places = await searchNearbyRestaurants(point.lat, point.lon, radius);
      setProspects(places);
      setLoading(false);
      plotResults(places, point.lat, point.lon);
      if (places.length === 0) setError("No new prospects found — try a nearby town or a wider radius.");
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Something went wrong searching.");
    }
  };

  const searchGeoapifyByName = async () => {
    if (!nameQuery.trim()) { setError("Type a restaurant name to search for."); return; }
    setLoading(true); setError(null); setProspects([]);
    try {
      const areaContext = `${targetArea}, ${state}`;
      setSearchedFor(`"${nameQuery}" near ${areaContext}`);
      const places = await searchByName(nameQuery.trim(), areaContext);
      setProspects(places);
      setLoading(false);
      if (places.length > 0) plotResults(places, places[0].lat, places[0].lon, 14);
      else setError("No external matches for that name — try fewer words.");
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Something went wrong searching.");
    }
  };

  // --- Add to PRESMA, with duplicate check first ----------------------
  const handleAddClick = (prospect: PlaceResult) => {
    const matches = findPossibleDuplicates(prospect, restaurants);
    if (matches.length > 0) setDuplicateCheck({ prospect, matches });
    else setAddingResult(prospect);
  };

  const finalizeAdd = async (data: NewRestaurantInput) => {
    if (!addingResult) return;
    const created = await createRestaurant(
      { ...data, source: "locator", geoapifyPlaceId: addingResult.id, category: addingResult.category },
      user.email ?? "unknown"
    );
    await addOutlet(created, {
      location: addingResult.address, contactPerson: "", phone: addingResult.phone ?? "", status: "Active",
      lat: addingResult.lat, lon: addingResult.lon,
    }, user.email ?? "unknown");
    navigate(`/restaurants/${created.id}`);
  };

  const finalizeUpdateExisting = async (data: NewRestaurantInput) => {
    if (!editingExisting) return;
    await updateRestaurant(editingExisting, data, user.email ?? "unknown");
    navigate(`/restaurants/${editingExisting.id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Restaurant Locator</h1>
        <p className="text-sm text-ink-faint">Checks your PRESMA pipeline first — Geoapify is only called when you click "Discover more."</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className="w-44 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500">
            {MALAYSIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Area</label>
          <select value={area} onChange={(e) => { setArea(e.target.value); setCustomArea(""); }} className="w-48 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500">
            {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Or type any area/town</label>
          <input value={customArea} onChange={(e) => setCustomArea(e.target.value)} placeholder="e.g. Bukit Jalil" className="w-52 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Radius</label>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-28 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500">
            <option value={3000}>3 km</option><option value={6000}>6 km</option><option value={10000}>10 km</option><option value={20000}>20 km</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3 shadow-card">
        <p className="flex items-center gap-1.5 text-sm">
          <Database size={14} className="text-brand-600" /> <span className="font-semibold">{inPipelineForArea.length}</span> restaurant{inPipelineForArea.length === 1 ? "" : "s"} already in your PRESMA pipeline for {targetArea}, {state}
        </p>
        <span className="text-xs text-ink-faint">Loaded instantly from Firebase</span>
      </div>

      {inPipelineForArea.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {inPipelineForArea.map((r) => (
            <button key={r.id} onClick={() => navigate(`/restaurants/${r.id}`)} className="rounded border border-border bg-surface p-3 text-left shadow-card hover:border-brand-500">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">{r.name}</div>
                <StatusBadge status={overallStatusFor(r.stage)} />
              </div>
              <div className="mt-1 text-xs text-ink-faint">{r.outlets[0]?.location ?? "No outlet location on file"}</div>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        <button onClick={discoverMore} disabled={loading} className="inline-flex items-center gap-1.5 rounded border border-border-strong px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper disabled:opacity-60">
          <Search size={15} /> {loading ? "Searching…" : "Discover more restaurants (Geoapify)"}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4 shadow-card">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-ink-soft">Search by restaurant name</label>
          <input
            value={nameQuery} onChange={(e) => setNameQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") searchGeoapifyByName(); }}
            placeholder='e.g. "Pelita" or "Restoran Syed"'
            className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={searchGeoapifyByName} disabled={loading} className="flex items-center gap-1.5 rounded border border-border px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper disabled:opacity-60">
          <Search size={15} /> Search Geoapify by Name
        </button>
      </div>

      {nameMatchesInPipeline.length > 0 && (
        <div className="rounded border border-border bg-surface p-3 shadow-card">
          <p className="mb-2 text-xs font-medium text-ink-soft">Already in your pipeline, matching "{nameQuery}":</p>
          <div className="flex flex-wrap gap-2">
            {nameMatchesInPipeline.map((r) => (
              <button key={r.id} onClick={() => navigate(`/restaurants/${r.id}`)} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 hover:bg-brand-100">{r.name}</button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="rounded bg-status-redBg px-3 py-2 text-sm text-status-red">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded border border-border shadow-card">
          <div ref={mapDivRef} className="h-[420px] w-full bg-paper" />
        </div>
        <div className="max-h-[420px] space-y-2 overflow-y-auto">
          {searchedFor && !loading && (
            <p className="text-xs text-ink-faint">{prospects.length} new prospect(s) for "{searchedFor}"</p>
          )}
          {prospects.map((p) => {
            const matches = findPossibleDuplicates(p, restaurants);
            return (
              <div key={p.id} className="rounded border border-border bg-surface p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{p.name}</div>
                  <span className="shrink-0 rounded bg-status-amberBg px-2 py-0.5 text-[10px] font-medium text-status-amber">New Prospect</span>
                </div>
                {p.category && <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint"><Tag size={12} /> {p.category}</div>}
                <div className="mt-1 flex items-start gap-1.5 text-xs text-ink-faint"><MapPin size={13} className="mt-0.5 shrink-0" /> {p.address}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint"><Phone size={13} /> {p.phone ?? "Not listed on OpenStreetMap"}</div>
                {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-xs text-brand-600 hover:underline"><Globe size={13} /> Website</a>}
                <div className="mt-1 text-[10px] text-ink-faint">Source: Geoapify (OpenStreetMap){matches.length > 0 && <span className="ml-1 text-status-amber">· possibly already saved</span>}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => handleAddClick(p)} className="flex items-center gap-1 rounded bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
                    <Plus size={13} /> Add to PRESMA
                  </button>
                  <a href={googleSearchUrl(p.name, p.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-ink-faint hover:text-brand-600 hover:underline">
                    <ExternalLink size={12} /> Check on Google Maps
                  </a>
                </div>
              </div>
            );
          })}
          {!loading && prospects.length === 0 && !error && (
            <p className="rounded border border-border bg-surface px-3 py-6 text-center text-sm text-ink-faint shadow-card">Click "Discover more restaurants" to search Geoapify for this area.</p>
          )}
        </div>
      </div>

      {addingResult && (
        <RestaurantForm
          prefill={{ name: addingResult.name, notes: `Discovered via Restaurant Locator (Geoapify) — ${addingResult.address}` }}
          onClose={() => setAddingResult(null)}
          onSubmit={finalizeAdd}
        />
      )}

      {editingExisting && (
        <RestaurantForm
          initial={{
            ...editingExisting,
            notes: `${editingExisting.notes}\n\nExternal data found via Locator: ${duplicateCheck?.prospect.address ?? ""} ${duplicateCheck?.prospect.phone ?? ""}`.trim(),
          }}
          onClose={() => setEditingExisting(null)}
          onSubmit={finalizeUpdateExisting}
        />
      )}

      {duplicateCheck && (
        <DuplicateWarningModal
          prospectName={duplicateCheck.prospect.name}
          matches={duplicateCheck.matches}
          onClose={() => setDuplicateCheck(null)}
          onUpdateExisting={() => { setEditingExisting(duplicateCheck.matches[0].restaurant); setDuplicateCheck(null); }}
          onAddAnyway={() => { setAddingResult(duplicateCheck.prospect); setDuplicateCheck(null); }}
        />
      )}
    </div>
  );
}
