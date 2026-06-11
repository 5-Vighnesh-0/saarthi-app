"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation, X, ChevronRight, Clock, ArrowRight, Footprints, Ticket, Layers, Zap } from "lucide-react";
import MetroSvgIcon from "@/components/ui/MetroSvgIcon";
import LiquidGlassButton from "@/components/ui/LiquidGlassButton";
import PaymentGateway from "@/components/PaymentGateway";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicleSocket } from "@/lib/hooks/useVehicleSocket";
import { searchBengaluru, typeIcon, type GeoResult } from "@/lib/geocoding";
import { getWalkRoute, getTransitRoute, fmtWalk, type WalkRoute } from "@/lib/routing";
import { BUS_POSITIONS, ROUTE_STOPS, SCHEDULED_BUSES, METRO_STATIONS, AUTO_DRIVERS, type BusPosition } from "@/lib/data/bengaluru";
import { findMatchingRoutes, type MatchedRoute } from "@/lib/routeMatch";

type View = "buses" | "metro" | "auto" | "ticket";

const TransitMap = dynamic(() => import("@/components/map/TransitMap"), { ssr: false });

// ── Glassmorphism card helper ─────────────────────────────────────────
function GlassCard({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: boolean }) {
  return (
    <div style={{
      background: "rgba(10,13,20,0.88)",
      border: `1px solid ${glow ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 20,
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: glow
        ? "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.1) inset"
        : "0 8px 40px rgba(0,0,0,0.4)",
      ...style,
    }}>
      {/* Subtle top gradient line */}
      <div style={{
        position: "absolute", top: 0, left: 20, right: 20, height: 1, borderRadius: 1,
        background: glow
          ? "linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
      }} />
      {children}
    </div>
  );
}

export default function DesktopApp() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState<"from" | "to" | null>(null);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selIdx, setSelIdx] = useState(0);
  const [walkRoute, setWalkRoute] = useState<WalkRoute | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [walkInfo, setWalkInfo] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const [fromQuery, setFromQuery] = useState("");
  const [fromResults, setFromResults] = useState<GeoResult[]>([]);
  const [fromSearching, setFromSearching] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<GeoResult | null>(null);
  const fromDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScheduled, setShowScheduled] = useState(false);
  const [view, setView] = useState<View>("buses");
  const [autoStep, setAutoStep] = useState<"pick" | "otp" | "tracking">("pick");
  const [otpValue, setOtpValue] = useState("");
  const [ticketRoute, setTicketRoute] = useState("500D");
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [mapFlyTarget, setMapFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [matchedRoutes, setMatchedRoutes] = useState<MatchedRoute[]>([]);
  const [queryRoute, setQueryRoute] = useState<WalkRoute | null>(null);
  const [routeSearching, setRouteSearching] = useState(false);
  const [detailRoute, setDetailRoute] = useState<MatchedRoute | null>(null);
  const [payGatewayOpen, setPayGatewayOpen] = useState(false);
  const [payGatewayRoute, setPayGatewayRoute] = useState({ label: "500D", fare: 25 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { vehicles, connected } = useVehicleSocket();

  const liveBuses: BusPosition[] = vehicles.length > 0
    ? vehicles.filter((v) => v.routeId === "500D").map((v, i) => ({
        mins: BUS_POSITIONS[i]?.mins ?? 15 + i * 5,
        lat: v.lat, lng: v.lng,
        near: BUS_POSITIONS[i]?.near ?? "En route",
        crowd: (BUS_POSITIONS[i]?.crowd ?? "Seats free") as BusPosition["crowd"],
      }))
    : BUS_POSITIONS;

  const buses = liveBuses.length > 0 ? liveBuses : BUS_POSITIONS;

  // Get user location — validate it's actually in Bengaluru, else default to city center
  useEffect(() => {
    const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
    const inBengaluru = (lat: number, lng: number) =>
      lat > 12.7 && lat < 13.3 && lng > 77.3 && lng < 77.9;

    const useDefault = () => {
      setUserLocation(BENGALURU_CENTER);
      setUsingDefaultLocation(true);
    };

    if (!navigator.geolocation) { useDefault(); return; }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (inBengaluru(coords.latitude, coords.longitude)) {
          setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        } else {
          useDefault(); // outside Bengaluru (VPN / IP geolocation)
        }
      },
      useDefault,
      { timeout: 6000, maximumAge: 60000 },
    );
  }, []);

  // Debounced TO search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchBengaluru(query);
      setResults(r);
      setSearching(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Debounced FROM search
  useEffect(() => {
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (!fromQuery.trim()) { setFromResults([]); return; }
    fromDebounceRef.current = setTimeout(async () => {
      setFromSearching(true);
      const r = await searchBengaluru(fromQuery);
      setFromResults(r);
      setFromSearching(false);
    }, 350);
    return () => { if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current); };
  }, [fromQuery]);

  const handleSelectOrigin = useCallback((r: GeoResult) => {
    setSelectedOrigin(r);
    setFromQuery(r.name);
    setFocused(null);
    setFromResults([]);
    // Clear route results — user should re-select dest to refresh with new origin
    setMatchedRoutes([]);
    setQueryRoute(null);
    setWalkRoute(null);
    setWalkInfo(null);
  }, []);

  const handleSelectDest = useCallback(async (r: GeoResult) => {
    setSelectedDest(r);
    setQuery(r.name);
    setFocused(null);
    setResults([]);
    setWalkRoute(null);
    setWalkInfo(null);
    setMatchedRoutes([]);
    setQueryRoute(null);

    const from = selectedOrigin
      ? { lat: selectedOrigin.lat, lng: selectedOrigin.lng }
      : userLocation;

    if (!from) return;

    setRouteSearching(true);

    const [walkResult, transitResult] = await Promise.all([
      getWalkRoute(from.lat, from.lng, r.lat, r.lng),
      getTransitRoute(from.lat, from.lng, r.lat, r.lng),
    ]);

    const matches = findMatchingRoutes(from.lat, from.lng, r.lat, r.lng);
    setMatchedRoutes(matches);

    if (walkResult && walkResult.distanceM < 10000) {
      // Walkable — show walk strip regardless
      setWalkRoute(walkResult);
      setWalkInfo(fmtWalk(walkResult.durationSec, walkResult.distanceM));
    } else if (walkResult && matches.length === 0) {
      // Too far AND no transit found — tell the user
      setWalkInfo("Too far to walk · no routes found nearby");
    }
    // If too far but transit routes exist, the left panel already shows them — no strip needed

    if (transitResult) setQueryRoute(transitResult);
    setRouteSearching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, selectedOrigin]);

  const clearDest = () => {
    setSelectedDest(null);
    setQuery("");
    setWalkRoute(null);
    setWalkInfo(null);
    setMatchedRoutes([]);
    setQueryRoute(null);
    setDetailRoute(null);
  };

  const clearOrigin = () => {
    setSelectedOrigin(null);
    setFromQuery("");
    setWalkRoute(null);
    setWalkInfo(null);
  };

  const handleSelectBus = useCallback((i: number) => setSelIdx(i), []);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative", background: "#07090c", overflow: "hidden", fontFamily: "var(--font-sora, system-ui, sans-serif)" }}>

      {/* Full-screen map */}
      <div style={{ position: "absolute", inset: 0 }}>
        <TransitMap
          accent={view === "metro" ? "#7c3aed" : view === "auto" ? "#f59e0b" : "#f97316"}
          buses={selectedDest || view === "metro" || view === "ticket" ? [] : buses}
          stops={selectedDest ? [] : (view === "metro" ? METRO_STATIONS.map(s => ({ ...s, time: "", lines: s.lines })) : ROUTE_STOPS)}
          selected={selIdx}
          onSelectBus={handleSelectBus}
          center={{ lat: 12.9609, lng: 77.6200 }}
          zoom={12}
          walkRoute={walkRoute}
          queryRoute={queryRoute}
          originPin={selectedOrigin ? { lat: selectedOrigin.lat, lng: selectedOrigin.lng, label: selectedOrigin.name } : (userLocation && selectedDest) ? { lat: userLocation.lat, lng: userLocation.lng, label: usingDefaultLocation ? "Bengaluru centre" : "Your location" } : null}
          destPin={selectedDest ? { lat: selectedDest.lat, lng: selectedDest.lng, label: selectedDest.name } : null}
          userLocation={userLocation}
          scheduledBuses={(!selectedDest && showScheduled) ? SCHEDULED_BUSES : []}
          flyTarget={mapFlyTarget}
        />
      </div>

      {/* Top gradient fade */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 120, zIndex: 10,
        background: "linear-gradient(180deg, rgba(7,9,12,0.9) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        padding: "14px 20px",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>

        {/* Logo pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ flexShrink: 0 }}
        >
          <GlassCard glow style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 16, color: "#fff",
              boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
            }}>S</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1 }}>Saarthi</div>
              <div style={{ fontSize: 10, color: "rgba(249,115,22,0.7)", fontWeight: 600, marginTop: 1 }}>Bengaluru Transit</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* From / To search */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ flex: 1, maxWidth: 580, position: "relative" }}
        >
          <div style={{
            background: "rgba(10,13,20,0.92)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, overflow: "visible",
            backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            {/* FROM row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "18px 18px 0 0",
              background: focused === "from" ? "rgba(249,115,22,0.06)" : "transparent",
              transition: "background 0.2s",
            }}>
              <Navigation size={14} color={usingDefaultLocation && !selectedOrigin ? "rgba(255,255,255,0.35)" : "#f97316"} style={{ flexShrink: 0 }} />
              <input
                value={fromQuery}
                onChange={(e) => setFromQuery(e.target.value)}
                onFocus={() => setFocused("from")}
                onBlur={() => setTimeout(() => setFocused(null), 200)}
                placeholder={usingDefaultLocation ? "Bengaluru centre (tap to set origin)" : "Your location"}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "inherit" }}
              />
              {(fromQuery || selectedOrigin) && (
                <button onClick={clearOrigin} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                  <X size={13} color="rgba(255,255,255,0.4)" />
                </button>
              )}
            </div>

            {/* TO row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: "0 0 18px 18px",
              background: focused === "to" ? "rgba(249,115,22,0.06)" : "transparent",
              transition: "background 0.2s",
            }}>
              {searching
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: "2px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                : <Search size={14} color={focused === "to" ? "#f97316" : "rgba(255,255,255,0.4)"} style={{ flexShrink: 0 }} />
              }
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused("to")}
                onBlur={() => setTimeout(() => setFocused(null), 200)}
                placeholder="Search destination, stop or street…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "inherit" }}
              />
              {(query || selectedDest) && (
                <button onClick={clearDest} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                  <X size={13} color="rgba(255,255,255,0.4)" />
                </button>
              )}
            </div>
          </div>

          {/* Walk info strip */}
          <AnimatePresence>
            {walkInfo && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  margin: "6px 4px 0",
                  background: walkInfo.includes("far") ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.12)",
                  border: `1px solid ${walkInfo.includes("far") ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"}`,
                  borderRadius: 12, padding: "8px 14px",
                  display: "flex", alignItems: "center", gap: 8,
                  backdropFilter: "blur(16px)",
                }}
              >
                <Footprints size={14} color={walkInfo.includes("far") ? "#ef4444" : "#f97316"} />
                <span style={{ fontSize: 12, fontWeight: 600, color: walkInfo.includes("far") ? "#ef4444" : "#f97316" }}>{walkInfo}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>
                  {selectedOrigin ? `from ${selectedOrigin.name}` : usingDefaultLocation ? "from Bengaluru centre" : "from your location"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FROM dropdown — always visible while focused */}
          <AnimatePresence>
            {focused === "from" && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "rgba(10,13,20,0.97)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16, overflow: "hidden", backdropFilter: "blur(24px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.7)", zIndex: 50,
                }}
              >
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)" }} />

                {/* GPS / default option always visible */}
                <button
                  onClick={() => { clearOrigin(); setFocused(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.07)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📍</div>
                  <span style={{ color: "#f97316", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                    {usingDefaultLocation ? "Bengaluru centre (default)" : "Current location (GPS)"}
                  </span>
                </button>

                {/* Spinner */}
                {fromQuery.length > 0 && fromSearching && fromResults.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 16, height: 16, border: "2px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Searching…</span>
                  </div>
                )}

                {fromResults.map((r, i) => (
                  <button key={i} onClick={() => handleSelectOrigin(r)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.07)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {typeIcon(r.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.displayName}</div>
                    </div>
                  </button>
                ))}

                {fromQuery.length > 0 && !fromSearching && fromResults.length === 0 && (
                  <div style={{ padding: "14px 16px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No results for "{fromQuery}"</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TO dropdown — always visible while focused */}
          <AnimatePresence>
            {focused === "to" && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "rgba(10,13,20,0.97)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 18, overflow: "hidden",
                  backdropFilter: "blur(24px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", zIndex: 50,
                }}
              >
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)" }} />

                {/* Suggestions when empty */}
                {query.length === 0 && (
                  <div style={{ padding: "8px 0 8px" }}>
                    <div style={{ padding: "6px 16px 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>POPULAR IN BENGALURU</div>
                    {["Hennur", "Byrathi", "Whitefield", "Electronic City", "Indiranagar", "Koramangala"].map((name, i) => (
                      <button key={i} onClick={() => setQuery(name)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.07)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>{name}</div>
                        <ChevronRight size={13} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Spinner while searching */}
                {query.length > 0 && searching && results.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px" }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 16, height: 16, border: "2px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Searching Bengaluru…</span>
                  </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    <div style={{ padding: "8px 16px 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>PLACES</div>
                    {results.map((r, i) => (
                      <button key={i} onClick={() => handleSelectDest(r)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.07)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                          {typeIcon(r.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.displayName}</div>
                        </div>
                        <ArrowRight size={13} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {query.length > 0 && !searching && results.length === 0 && (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                    No places found for "{query}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Live status */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <motion.div
              animate={connected ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : { opacity: 0.4 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#f97316" : "#555", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: connected ? "#f97316" : "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                {connected ? `${buses.length} live` : "Offline"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>buses · 500D</div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Left panel ───────────────────────────────────────────── */}
      <motion.div
        initial={{ x: -340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
        style={{
          position: "absolute", left: 20, top: 90, bottom: 20, width: 310,
          zIndex: 20, display: "flex", flexDirection: "column", gap: 10,
          overflowY: "auto", paddingBottom: 4,
        }}
      >
        {/* Left panel — Transit App style 3 states */}
        <AnimatePresence mode="wait">

          {/* ── STATE 3: Journey detail — Transit App step-by-step ── */}
          {selectedDest && detailRoute ? (() => {
            const now = new Date();
            const walkToBoardMin = Math.max(1, Math.round(detailRoute.walkToBoardM / 72));
            const rideMin = detailRoute.rideStops * 3;
            const walkFromAlightMin = Math.max(1, Math.round(detailRoute.walkFromAlightM / 72));
            const departMs = now.getTime() + detailRoute.nextBusMin * 60000;
            const arriveMs = departMs + rideMin * 60000;
            const fmt = (ms: number) => new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

            return (
              <motion.div key="route-detail"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              >
                {/* Journey summary card */}
                <GlassCard glow style={{ padding: "14px 16px", position: "relative", marginBottom: 8 }}>
                  <button onClick={() => setDetailRoute(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "0 0 10px", color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "inherit" }}
                  >
                    <ChevronRight size={12} style={{ transform: "rotate(180deg)" }} /> All options
                  </button>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{detailRoute.totalMins} min</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      {fmt(now.getTime() + detailRoute.nextBusMin * 60000 - walkToBoardMin * 60000)} → {fmt(arriveMs + walkFromAlightMin * 60000)}
                    </span>
                  </div>

                  {/* Segment bar — Transit App style */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 10, height: 28 }}>
                    {/* Walk to board */}
                    {walkToBoardMin > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Footprints size={11} color="rgba(255,255,255,0.35)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{walkToBoardMin}m</span>
                        <div style={{ width: 16, height: 2, borderTop: "2px dashed rgba(255,255,255,0.2)", marginLeft: 2 }} />
                      </div>
                    )}
                    {/* Bus pill */}
                    <div style={{
                      flex: 1, height: 28, borderRadius: 8,
                      background: detailRoute.route.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 5, paddingInline: 10,
                      boxShadow: `0 2px 10px ${detailRoute.route.color}55`,
                    }}>
                      <span style={{ fontSize: 13 }}>🚌</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{detailRoute.route.label}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>· {detailRoute.rideStops} stops</span>
                    </div>
                    {/* Walk from alight */}
                    {walkFromAlightMin > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <div style={{ width: 16, height: 2, borderTop: "2px dashed rgba(255,255,255,0.2)", marginRight: 2 }} />
                        <Footprints size={11} color="rgba(255,255,255,0.35)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{walkFromAlightMin}m</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, padding: "2px 8px" }}>
                      ₹{detailRoute.route.fare}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Every ~{detailRoute.route.freqMin} min</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", marginLeft: "auto" }}>
                      Next in {detailRoute.nextBusMin} min
                    </span>
                  </div>
                </GlassCard>

                {/* Step-by-step timeline */}
                <GlassCard style={{ padding: "16px", position: "relative", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 14 }}>YOUR JOURNEY</div>

                  {/* Timeline */}
                  <div style={{ position: "relative", paddingLeft: 26 }}>
                    {/* Vertical line */}
                    <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #60a5fa, " + detailRoute.route.color + ", #f97316)", borderRadius: 2, opacity: 0.5 }} />

                    {/* Step 1 — Origin */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, position: "relative" }}>
                      <div style={{ position: "absolute", left: -26, top: 3, width: 10, height: 10, borderRadius: "50%", background: "#60a5fa", border: "2px solid #0a0d14", zIndex: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          {selectedOrigin?.name ?? (usingDefaultLocation ? "Bengaluru centre" : "Your location")}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          {fmt(now.getTime() + detailRoute.nextBusMin * 60000 - walkToBoardMin * 60000)}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 — Walk to stop */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                      <Footprints size={13} color="rgba(255,255,255,0.4)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Walk {walkToBoardMin} min ({detailRoute.walkToBoardM}m)</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>to {detailRoute.boardStop.name}</div>
                      </div>
                    </div>

                    {/* Step 3 — Board */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, position: "relative" }}>
                      <div style={{ position: "absolute", left: -26, top: 3, width: 12, height: 12, borderRadius: "50%", background: detailRoute.route.color, border: "2px solid #0a0d14", zIndex: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ background: detailRoute.route.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 900, color: "#fff" }}>
                            {detailRoute.route.label}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Board here</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{detailRoute.boardStop.name}</div>
                        <div style={{ fontSize: 11, color: "#f97316", fontWeight: 700, marginTop: 1 }}>
                          Departs {fmt(departMs)} · towards {detailRoute.route.to}
                        </div>
                      </div>
                    </div>

                    {/* Step 4 — Ride */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: detailRoute.route.color + "12", border: `1px solid ${detailRoute.route.color}33`, borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                      <span style={{ fontSize: 14 }}>🚌</span>
                      <div>
                        <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Ride {detailRoute.rideStops} stops · {rideMin} min</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{detailRoute.boardStop.name} → {detailRoute.alightStop.name}</div>
                      </div>
                    </div>

                    {/* Step 5 — Alight */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, position: "relative" }}>
                      <div style={{ position: "absolute", left: -26, top: 3, width: 12, height: 12, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0d14", zIndex: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Get off — {detailRoute.alightStop.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Arrives {fmt(arriveMs)}</div>
                      </div>
                    </div>

                    {/* Step 6 — Walk to dest */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                      <Footprints size={13} color="rgba(255,255,255,0.4)" />
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Walk {walkFromAlightMin} min ({detailRoute.walkFromAlightM}m)</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>to {selectedDest.name}</div>
                      </div>
                    </div>

                    {/* Step 7 — Destination */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, position: "relative" }}>
                      <div style={{ position: "absolute", left: -26, top: 3, width: 10, height: 10, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0d14", zIndex: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#f97316" }}>{selectedDest.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          {fmt(arriveMs + walkFromAlightMin * 60000)} · Arrive
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Buy Ticket CTA */}
                <GlassCard glow style={{ padding: "14px 16px", position: "relative", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10 }}>TICKET · BMTC ROUTE {detailRoute.route.label}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, textAlign: "center", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "10px" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#f97316" }}>₹{detailRoute.route.fare}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Single journey</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>₹{Math.round(detailRoute.route.fare * 1.8)}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Return</div>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                    setPayGatewayRoute({ label: detailRoute.route.label, fare: detailRoute.route.fare });
                    setPayGatewayOpen(true);
                  }}
                    style={{
                      width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)",
                      border: "none", borderRadius: 12, padding: "12px",
                      color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
                      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
                    }}>
                    <Ticket size={16} /> Buy Ticket · Pay via UPI
                  </motion.button>
                </GlassCard>

                {/* Book Auto alternative */}
                <GlassCard style={{ padding: "14px 16px", position: "relative" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10 }}>OR BOOK AN AUTO</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {AUTO_DRIVERS.slice(0, 2).map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.96 }} onClick={() => { setDetailRoute(null); setView("auto"); }}
                        style={{
                          flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                          borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit",
                        }}>
                        <div style={{ fontSize: 20 }}>🛺</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 4 }}>{d.name.split(" ")[0]}</div>
                        <div style={{ fontSize: 10, color: "#fbbf24" }}>★ {d.rating}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginTop: 2 }}>{d.eta} min · ₹{d.fare}</div>
                      </motion.button>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })() : selectedDest ? (
            /* ── STATE 2: Journey options — Transit App card style ── */
            <motion.div key="route-results"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              {/* Header */}
              <div style={{ padding: "4px 2px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    {selectedOrigin?.name ?? (usingDefaultLocation ? "Bengaluru centre" : "Your location")}
                    <span style={{ margin: "0 5px", color: "rgba(255,255,255,0.2)" }}>→</span>
                    {selectedDest.name}
                  </div>
                  {!routeSearching && matchedRoutes.length > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                      {matchedRoutes.length} route{matchedRoutes.length > 1 ? "s" : ""} found
                    </div>
                  )}
                </div>
              </div>

              {/* Loading */}
              {routeSearching && (
                <GlassCard style={{ padding: "24px", position: "relative", textAlign: "center" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 24, height: 24, border: "3px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Searching routes…</div>
                </GlassCard>
              )}

              {/* No results */}
              {!routeSearching && matchedRoutes.length === 0 && (
                <GlassCard style={{ padding: "20px 16px", position: "relative" }}>
                  <div style={{ textAlign: "center", paddingBlock: 8 }}>
                    <div style={{ fontSize: 30, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5 }}>No direct bus found</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                      No single bus connects these stops directly. Try booking an auto instead.
                    </div>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView("auto")}
                    style={{
                      width: "100%", background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      border: "none", borderRadius: 12, padding: "12px",
                      color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                    🛺 Book Auto Rickshaw
                  </motion.button>
                </GlassCard>
              )}

              {/* Journey cards — Transit App style */}
              {!routeSearching && matchedRoutes.map((m, i) => {
                const now = new Date();
                const walkToBoardMin = Math.max(1, Math.round(m.walkToBoardM / 72));
                const rideMin = m.rideStops * 3;
                const leaveIn = m.nextBusMin - walkToBoardMin;
                const departTime = new Date(now.getTime() + m.nextBusMin * 60000);
                const fmt12 = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                  <motion.button key={m.route.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setDetailRoute(m)}
                    style={{
                      width: "100%", background: "rgba(10,13,20,0.88)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                      borderRadius: 16, padding: "14px 14px",
                      marginBottom: 8, cursor: "pointer", textAlign: "left",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                    }}
                  >
                    {/* Top row: time + departure */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{m.totalMins} min</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>total</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: leaveIn <= 2 ? "#4ade80" : "#f97316" }}>
                          {leaveIn <= 0 ? "Leave now" : `Leave in ${leaveIn}m`}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Bus at {fmt12(departTime)}</div>
                      </div>
                    </div>

                    {/* Segment bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                      {walkToBoardMin > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          <Footprints size={10} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{walkToBoardMin}m</span>
                          <div style={{ width: 12, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                        </div>
                      )}
                      <div style={{
                        flex: 1, height: 26, borderRadius: 7,
                        background: m.route.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 5, boxShadow: `0 2px 8px ${m.route.color}44`,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{m.route.label}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>{m.rideStops} stops</span>
                      </div>
                      {Math.round(m.walkFromAlightM / 72) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          <div style={{ width: 12, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                          <Footprints size={10} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{Math.max(1, Math.round(m.walkFromAlightM / 72))}m</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom row: stops + fare */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {m.boardStop.name} → {m.alightStop.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>₹{m.route.fare}</span>
                    </div>
                  </motion.button>
                );
              })}

              {/* Book Auto — always shown as alternative */}
              {!routeSearching && matchedRoutes.length > 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView("auto")}
                  style={{
                    width: "100%", background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14,
                    padding: "12px 14px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                  <span style={{ fontSize: 22 }}>🛺</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Book Auto Rickshaw</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                      Drivers nearby · From ₹{AUTO_DRIVERS[0].fare}
                    </div>
                  </div>
                  <ChevronRight size={15} color="rgba(255,255,255,0.3)" />
                </motion.button>
              )}
            </motion.div>

          ) : (
            /* ── STATE 1: Home — nearby & quick destinations ── */
            <motion.div key="empty-prompt"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard style={{ padding: "16px 16px 14px", position: "relative" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 12 }}>WHERE TO?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {[
                    { name: "Byrathi", icon: "📍" },
                    { name: "Whitefield", icon: "🏢" },
                    { name: "Electronic City", icon: "💻" },
                    { name: "Hebbal", icon: "📍" },
                    { name: "Silk Board", icon: "🚦" },
                    { name: "KR Puram", icon: "🚌" },
                  ].map((p) => (
                    <button key={p.name} onClick={() => { setQuery(p.name); setFocused("to"); }}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                        color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.12)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    >
                      <span style={{ fontSize: 13 }}>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Quick access — Auto & Ticket */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setView("auto")}
                  style={{
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🛺</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Book Auto</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>3 drivers nearby</div>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setPayGatewayRoute({ label: "500D", fare: 25 }); setPayGatewayOpen(true); }}
                  style={{
                    background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
                    borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🎫</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Buy Ticket</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Scan & board</div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scheduled buses, Quick Access, Metro, Auto, Ticket — home screen only */}
        {!selectedDest && (<>
        <GlassCard style={{ padding: "14px 16px", position: "relative" }}>
          <button onClick={() => setShowScheduled((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} color="rgba(255,255,255,0.6)" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>Scheduled buses</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{SCHEDULED_BUSES.length} buses · next 35 min</div>
              </div>
            </div>
            <motion.div animate={{ rotate: showScheduled ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showScheduled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", marginTop: 12 }}
              >
                {SCHEDULED_BUSES.map((b, i) => (
                  <div key={b.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 8px",
                    borderBottom: i < SCHEDULED_BUSES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, background: "rgba(249,115,22,0.08)",
                      border: "1px solid rgba(249,115,22,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                    }}>🚌</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{b.routeLabel} · {b.from}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>→ {b.to} · ₹{b.fare}</div>
                    </div>
                    <div style={{
                      background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)",
                      borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 800, color: "#f97316", whiteSpace: "nowrap",
                    }}>
                      {b.departsIn}m
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Quick actions */}
        <GlassCard style={{ padding: "14px 16px", position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10 }}>QUICK ACCESS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([
              { icon: <MetroSvgIcon size={20} color="#a78bfa" />, label: "Metro map",  color: "#7c3aed", v: "metro"  as View },
              { icon: <span style={{ fontSize: 20 }}>🛺</span>,   label: "Book auto",  color: "#f59e0b", v: "auto"   as View },
              { icon: <span style={{ fontSize: 20 }}>🎫</span>,   label: "Buy ticket", color: "#f97316", v: "ticket" as View },
              { icon: <span style={{ fontSize: 20 }}>⚡</span>,   label: "Live ETAs",  color: "#ec1c3c", v: "buses"  as View },
            ] as const).map((q) => (
              <LiquidGlassButton
                key={q.label}
                color={q.color}
                active={view === q.v}
                onClick={() => {
                  if (q.v === "ticket") { setPayGatewayRoute({ label: "500D", fare: 25 }); setPayGatewayOpen(true); }
                  else { setView(q.v); if (q.v === "auto") setAutoStep("pick"); }
                }}
                style={{ flexDirection: "column", gap: 6, padding: "11px 8px", borderRadius: 13, width: "100%" }}
                icon={q.icon}
              >
                {q.label}
              </LiquidGlassButton>
            ))}
          </div>
        </GlassCard>

        {/* ── Metro panel ─────────────────────────────────────────── */}
        <AnimatePresence>
          {view === "metro" && (
            <motion.div key="metro-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <GlassCard style={{ padding: "16px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>NAMMA METRO</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 3 }}>Purple + Green Line</div>
                  </div>
                  <button onClick={() => setView("buses")} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>
                {METRO_STATIONS.map((s, i) => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 10px",
                    background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
                    borderRadius: 12, marginBottom: i < METRO_STATIONS.length - 1 ? 7 : 0,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, boxShadow: "0 0 0 3px rgba(124,58,237,0.25)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.sub}</div>
                    </div>
                    <MetroSvgIcon size={16} color="rgba(167,139,250,0.9)" />
                  </div>
                ))}
                <div style={{ marginTop: 12, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Frequency</div>
                  <div style={{ fontWeight: 800, color: "#a78bfa", fontSize: 14 }}>Every 5–8 min · ₹10–60</div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Auto booking panel ──────────────────────────────────── */}
        <AnimatePresence>
          {view === "auto" && (
            <motion.div key="auto-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <GlassCard style={{ padding: "16px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>AUTO RICKSHAW</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 3 }}>
                      {autoStep === "pick" ? "Nearby drivers" : autoStep === "otp" ? "Confirm OTP" : "Driver en route"}
                    </div>
                  </div>
                  <button onClick={() => { setView("buses"); setAutoStep("pick"); setOtpValue(""); }}
                    style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {autoStep === "pick" && AUTO_DRIVERS.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 13, padding: "11px 12px", marginBottom: i < AUTO_DRIVERS.length - 1 ? 7 : 12,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🛺</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>★ {d.rating}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>· {d.eta} min · ₹{d.fare}</span>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setAutoStep("otp")}
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 10, padding: "7px 14px", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      Book
                    </motion.button>
                  </div>
                ))}

                {autoStep === "otp" && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛺</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>Driver is on the way. Enter OTP to confirm pickup.</div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                      {[0,1,2,3].map((i) => (
                        <div key={i} style={{ width: 44, height: 52, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: `2px solid ${otpValue.length > i ? "#f59e0b" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff" }}>
                          {otpValue[i] ?? ""}
                        </div>
                      ))}
                    </div>
                    <input
                      maxLength={4} value={otpValue} onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g,"")); if (e.target.value.length === 4) setTimeout(() => setAutoStep("tracking"), 400); }}
                      placeholder="OTP"
                      style={{ width: 1, height: 1, opacity: 0, position: "absolute" }}
                      autoFocus
                    />
                    <div onClick={() => (document.querySelector('input[maxLength="4"]') as HTMLInputElement)?.focus()}
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>Tap here then type your 4-digit OTP</div>
                  </div>
                )}

                {autoStep === "tracking" && (
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 42, marginBottom: 10 }}>🛺</motion.div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 6 }}>Driver confirmed!</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Arriving in ~3 min · KA 01 9823</div>
                    <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "10px", display: "flex", justifyContent: "space-around" }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>3</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>min</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>₹78</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>fare</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>4.9</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>rating</div></div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Ticket panel ─────────────────────────────────────────── */}
        <AnimatePresence>
          {view === "ticket" && (
            <motion.div key="ticket-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <GlassCard glow style={{ padding: "16px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>BUY TICKET</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 3 }}>BMTC · Scan & board</div>
                  </div>
                  <button onClick={() => setView("buses")} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* Route selector */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 1, marginBottom: 7 }}>SELECT ROUTE</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {["500D","335E","G4","356"].map((r) => (
                      <motion.button key={r} whileTap={{ scale: 0.94 }}
                        onClick={() => setTicketRoute(r)}
                        style={{
                          background: ticketRoute === r ? "linear-gradient(135deg,#f97316,#ea580c)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${ticketRoute === r ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"}`,
                          borderRadius: 10, padding: "7px 14px", color: "#fff", fontWeight: 800, fontSize: 13,
                          cursor: "pointer", fontFamily: "inherit",
                          boxShadow: ticketRoute === r ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
                          transition: "all 0.15s",
                        }}
                      >{r}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Fare display */}
                <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 14, padding: "14px", marginBottom: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>FARE</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#f97316" }}>
                    ₹{ticketRoute === "335E" ? 35 : ticketRoute === "KIA" ? 60 : ticketRoute === "G4" ? 30 : 25}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Valid for 1 journey · No change needed</div>
                </div>

                <LiquidGlassButton color="#f97316" size="lg" full active>
                  🎫 Pay &amp; Get QR Ticket
                </LiquidGlassButton>
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Powered by UPI · Instant QR code
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
        </>)}
      </motion.div>

      {/* ── Map controls (bottom-right) ──────────────────────────── */}
      <div style={{
        position: "absolute", right: 20, bottom: 50, zIndex: 20,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {[
          { icon: <Navigation size={16} color={usingDefaultLocation ? "rgba(255,255,255,0.4)" : "#26d98c"} />, tip: "My location", onClick: () => userLocation && setMapFlyTarget({ ...userLocation, zoom: 15 }) },
          { icon: <Layers size={16} color="#fff" />,         tip: "Layers",      onClick: () => {} },
          { icon: <Zap size={16} color="#f97316" />,         tip: "Live mode",   onClick: () => {} },
        ].map(({ icon, tip, onClick }, i) => (
          <motion.button key={i} title={tip} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            onClick={onClick}
            style={{
              width: 42, height: 42, borderRadius: 42,
              background: "rgba(10,13,20,0.9)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(16px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}>
            {icon}
          </motion.button>
        ))}
      </div>

      {/* ── Payment Gateway overlay ──────────────────────────────── */}
      <PaymentGateway
        isOpen={payGatewayOpen}
        onClose={() => setPayGatewayOpen(false)}
        routeLabel={payGatewayRoute.label}
        from={selectedOrigin?.name ?? (usingDefaultLocation ? "Bengaluru centre" : "Your location")}
        to={selectedDest?.name ?? ""}
        fare={payGatewayRoute.fare}
      />
    </div>
  );
}
