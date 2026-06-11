"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation, X, ChevronRight, ArrowRight, Footprints, Ticket, ChevronDown } from "lucide-react";
import PaymentGateway from "@/components/PaymentGateway";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicleSocket } from "@/lib/hooks/useVehicleSocket";
import { searchBengaluru, typeIcon, type GeoResult } from "@/lib/geocoding";
import { getWalkRoute, getTransitRoute, fmtWalk, type WalkRoute } from "@/lib/routing";
import {
  BUS_POSITIONS, ROUTE_STOPS, METRO_STATIONS, AUTO_DRIVERS,
  type BusPosition,
} from "@/lib/data/bengaluru";
import { findMatchingRoutes, type MatchedRoute } from "@/lib/routeMatch";

const TransitMap = dynamic(() => import("@/components/map/TransitMap"), { ssr: false });

type Tab = "bus" | "metro" | "auto" | "ticket";

const POPULAR = [
  { name: "Byrathi", icon: "📍" },
  { name: "Whitefield", icon: "🏢" },
  { name: "Electronic City", icon: "💻" },
  { name: "Hebbal", icon: "📍" },
  { name: "Silk Board", icon: "🚦" },
  { name: "MG Road", icon: "🚇" },
];

export default function MobileApp() {
  // ── Search state ──────────────────────────────────────────
  const [fromQuery, setFromQuery] = useState("");
  const [fromResults, setFromResults] = useState<GeoResult[]>([]);
  const [fromSearching, setFromSearching] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<GeoResult | null>(null);
  const fromDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toQuery, setToQuery] = useState("");
  const [toResults, setToResults] = useState<GeoResult[]>([]);
  const [toSearching, setToSearching] = useState(false);
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const toDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [focused, setFocused] = useState<"from" | "to" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Location + route state ────────────────────────────────
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [usingDefault, setUsingDefault] = useState(false);
  const [walkRoute, setWalkRoute] = useState<WalkRoute | null>(null);
  const [walkInfo, setWalkInfo] = useState<string | null>(null);
  const [queryRoute, setQueryRoute] = useState<WalkRoute | null>(null);
  const [matchedRoutes, setMatchedRoutes] = useState<MatchedRoute[]>([]);
  const [routeSearching, setRouteSearching] = useState(false);
  const [detailRoute, setDetailRoute] = useState<MatchedRoute | null>(null);
  const [mapFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // ── UI state ──────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("bus");
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selIdx, setSelIdx] = useState(0);
  const [autoStage, setAutoStage] = useState<"list" | "booked">("list");
  const [bookedDriver, setBookedDriver] = useState<typeof AUTO_DRIVERS[0] | null>(null);
  const [ticketStage, setTicketStage] = useState<"select" | "confirm" | "done">("select");
  const [payGatewayOpen, setPayGatewayOpen] = useState(false);
  const [payGatewayRoute, setPayGatewayRoute] = useState({ label: "500D", fare: 25 });

  const { vehicles, connected } = useVehicleSocket();
  const buses: BusPosition[] = vehicles.length > 0
    ? vehicles.filter(v => v.routeId === "500D").map((v, i) => ({
        mins: BUS_POSITIONS[i]?.mins ?? 15 + i * 5,
        lat: v.lat, lng: v.lng,
        near: BUS_POSITIONS[i]?.near ?? "En route",
        crowd: (BUS_POSITIONS[i]?.crowd ?? "Seats free") as BusPosition["crowd"],
      }))
    : BUS_POSITIONS;

  // ── Geolocation ──────────────────────────────────────────
  useEffect(() => {
    const CENTER = { lat: 12.9716, lng: 77.5946 };
    const inCity = (lat: number, lng: number) => lat > 12.7 && lat < 13.3 && lng > 77.3 && lng < 77.9;
    const fallback = () => { setUserLocation(CENTER); setUsingDefault(true); };
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => inCity(coords.latitude, coords.longitude)
        ? setUserLocation({ lat: coords.latitude, lng: coords.longitude })
        : fallback(),
      fallback,
      { timeout: 6000, maximumAge: 60000 },
    );
  }, []);

  // ── FROM debounce ─────────────────────────────────────────
  useEffect(() => {
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (!fromQuery.trim()) { setFromResults([]); return; }
    fromDebounceRef.current = setTimeout(async () => {
      setFromSearching(true);
      setFromResults(await searchBengaluru(fromQuery));
      setFromSearching(false);
    }, 350);
    return () => { if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current); };
  }, [fromQuery]);

  // ── TO debounce ───────────────────────────────────────────
  useEffect(() => {
    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
    if (!toQuery.trim()) { setToResults([]); return; }
    toDebounceRef.current = setTimeout(async () => {
      setToSearching(true);
      setToResults(await searchBengaluru(toQuery));
      setToSearching(false);
    }, 350);
    return () => { if (toDebounceRef.current) clearTimeout(toDebounceRef.current); };
  }, [toQuery]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSelectOrigin = useCallback((r: GeoResult) => {
    setSelectedOrigin(r);
    setFromQuery(r.name);
    setFocused("to");
    setFromResults([]);
    setMatchedRoutes([]);
    setQueryRoute(null);
  }, []);

  const handleSelectDest = useCallback(async (r: GeoResult) => {
    setSelectedDest(r);
    setToQuery(r.name);
    setFocused(null);
    setToResults([]);
    setSearchOpen(false);
    setSheetExpanded(true);
    setDetailRoute(null);

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
      setWalkRoute(walkResult);
      setWalkInfo(fmtWalk(walkResult.durationSec, walkResult.distanceM));
    }
    if (transitResult) setQueryRoute(transitResult);
    setRouteSearching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, selectedOrigin]);

  const clearSearch = () => {
    setSelectedDest(null);
    setSelectedOrigin(null);
    setToQuery(""); setFromQuery("");
    setMatchedRoutes([]); setQueryRoute(null);
    setWalkRoute(null); setWalkInfo(null);
    setDetailRoute(null);
    setSheetExpanded(false);
    setSearchOpen(false);
  };

  const originLabel = selectedOrigin?.name ?? (usingDefault ? "Bengaluru centre" : "Your location");

  // ── Panel height ──────────────────────────────────────────
  const panelHeight = detailRoute ? "88vh" : selectedDest ? "62vh" : sheetExpanded ? "50vh" : "200px";

  return (
    <div style={{
      width: "100vw", height: "100dvh", position: "relative",
      background: "#000", overflow: "hidden",
      fontFamily: "var(--font-sora, system-ui, sans-serif)",
    }}>

      {/* ── Full-screen black map ──────────────────────────── */}
      <div style={{ position: "absolute", inset: 0 }}>
        <TransitMap
          accent={tab === "metro" ? "#7c3aed" : tab === "auto" ? "#f59e0b" : "#f97316"}
          buses={selectedDest || tab === "metro" || tab === "ticket" ? [] : buses}
          stops={selectedDest ? [] : tab === "metro" ? METRO_STATIONS.map(s => ({ ...s, time: "", lines: s.lines })) : ROUTE_STOPS}
          selected={selIdx}
          onSelectBus={(i) => setSelIdx(i)}
          center={{ lat: 12.9609, lng: 77.6200 }}
          zoom={12}
          walkRoute={walkRoute}
          queryRoute={queryRoute}
          originPin={selectedDest && (selectedOrigin || userLocation)
            ? { lat: selectedOrigin?.lat ?? userLocation!.lat, lng: selectedOrigin?.lng ?? userLocation!.lng, label: originLabel }
            : null}
          destPin={selectedDest ? { lat: selectedDest.lat, lng: selectedDest.lng, label: selectedDest.name } : null}
          userLocation={userLocation}
          flyTarget={mapFlyTarget}
        />
      </div>

      {/* ── Dynamic Island ────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        width: 120, height: 34, background: "#000", borderRadius: 20, zIndex: 50,
        pointerEvents: "none",
      }} />

      {/* ── Top search bar ────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 54, left: 14, right: 14, zIndex: 40,
      }}>
        {!searchOpen && !selectedDest ? (
          /* Collapsed search pill */
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSearchOpen(true)}
            style={{
              width: "100%", background: "rgba(10,13,20,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18, padding: "13px 16px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Search size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", fontWeight: 600, flex: 1, textAlign: "left" }}>
              Where to in Bengaluru?
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#f97316" : "#555" }}
              />
            </div>
          </motion.button>
        ) : (
          /* Expanded From/To search */
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(10,13,20,0.97)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20, overflow: "visible",
              backdropFilter: "blur(24px)", boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            }}
          >
            {/* FROM row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: focused === "from" ? "rgba(249,115,22,0.05)" : "transparent",
              borderRadius: "20px 20px 0 0",
            }}>
              <Navigation size={14} color={selectedOrigin ? "#f97316" : "rgba(255,255,255,0.3)"} style={{ flexShrink: 0 }} />
              <input
                autoFocus={!selectedDest}
                value={fromQuery}
                onChange={e => setFromQuery(e.target.value)}
                onFocus={() => setFocused("from")}
                onBlur={() => setTimeout(() => setFocused(null), 200)}
                placeholder={usingDefault ? "Bengaluru centre (default)" : "Your location"}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14, fontFamily: "inherit",
                }}
              />
              {(fromQuery || selectedOrigin) && (
                <button onClick={() => { setSelectedOrigin(null); setFromQuery(""); setFromResults([]); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                  <X size={14} color="rgba(255,255,255,0.4)" />
                </button>
              )}
            </div>
            {/* TO row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: focused === "to" ? "rgba(249,115,22,0.05)" : "transparent",
              borderRadius: "0 0 20px 20px",
            }}>
              {toSearching
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 14, height: 14, border: "2px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                : <Search size={14} color={focused === "to" ? "#f97316" : "rgba(255,255,255,0.35)"} style={{ flexShrink: 0 }} />
              }
              <input
                value={toQuery}
                onChange={e => setToQuery(e.target.value)}
                onFocus={() => setFocused("to")}
                onBlur={() => setTimeout(() => setFocused(null), 200)}
                placeholder="Where to?"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14, fontFamily: "inherit",
                }}
              />
              <button onClick={clearSearch}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                <X size={14} color="rgba(255,255,255,0.4)" />
              </button>
            </div>

            {/* Dropdown results */}
            <AnimatePresence>
              {focused === "from" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "rgba(10,13,20,0.99)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16, overflow: "hidden", backdropFilter: "blur(24px)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.9)", zIndex: 60, maxHeight: "40vh", overflowY: "auto",
                  }}
                >
                  <button
                    onClick={() => { setSelectedOrigin(null); setFromQuery(""); setFocused("to"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📍</div>
                    <span style={{ color: "#f97316", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
                      {usingDefault ? "Bengaluru centre" : "Current location (GPS)"}
                    </span>
                  </button>
                  {fromResults.map((r, i) => (
                    <button key={i} onClick={() => handleSelectOrigin(r)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{typeIcon(r.type)}</div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>{r.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>{r.displayName}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {focused === "to" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "rgba(10,13,20,0.99)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16, overflow: "hidden", backdropFilter: "blur(24px)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.9)", zIndex: 60, maxHeight: "45vh", overflowY: "auto",
                  }}
                >
                  {toQuery.length === 0 && (
                    <>
                      <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>POPULAR</div>
                      {POPULAR.map((p, i) => (
                        <button key={i} onClick={() => setToQuery(p.name)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "none", border: "none", cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{p.icon}</div>
                          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>{p.name}</span>
                          <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
                        </button>
                      ))}
                    </>
                  )}
                  {toQuery.length > 0 && toSearching && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: 16, height: 16, border: "2px solid #f97316", borderTopColor: "transparent", borderRadius: "50%" }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Searching…</span>
                    </div>
                  )}
                  {toResults.map((r, i) => (
                    <button key={i} onClick={() => handleSelectDest(r)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{typeIcon(r.type)}</div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>{r.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>{r.displayName}</div>
                      </div>
                      <ArrowRight size={13} color="rgba(255,255,255,0.2)" />
                    </button>
                  ))}
                  {toQuery.length > 0 && !toSearching && toResults.length === 0 && (
                    <div style={{ padding: "20px 16px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No places found for "{toQuery}"</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Active dest pill — shown when search is closed but dest is set */}
        {selectedDest && !searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(10,13,20,0.95)", border: "1px solid rgba(249,115,22,0.25)",
              borderRadius: 18, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
              backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{originLabel}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>→ {selectedDest.name}</div>
            </div>
            <button onClick={clearSearch} style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} color="rgba(255,255,255,0.5)" />
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Bottom sheet ──────────────────────────────────── */}
      <motion.div
        animate={{ height: panelHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
          background: "rgba(10,13,20,0.97)",
          borderRadius: "22px 22px 0 0",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Handle bar */}
        <div
          onClick={() => setSheetExpanded(v => !v)}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 0 4px", cursor: "pointer", flexShrink: 0 }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* ── Tab bar ──────────────────────────────────────── */}
        {!detailRoute && (
          <div style={{
            display: "flex", gap: 6, padding: "6px 14px 10px", flexShrink: 0,
          }}>
            {([
              { key: "bus",    icon: "🚌", label: "Bus" },
              { key: "metro",  icon: "🚇", label: "Metro" },
              { key: "auto",   icon: "🛺", label: "Auto" },
              { key: "ticket", icon: "🎫", label: "Ticket" },
            ] as { key: Tab; icon: string; label: string }[]).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSheetExpanded(true); }}
                style={{
                  flex: 1, padding: "9px 4px", background: tab === t.key ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                  border: tab === t.key ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4, fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.key ? "#f97316" : "rgba(255,255,255,0.45)" }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Sheet content (scrollable) ───────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 34px" }}>

          {/* ── JOURNEY DETAIL ── */}
          <AnimatePresence mode="wait">
            {detailRoute && selectedDest ? (() => {
              const now = new Date();
              const walkToBoardMin = Math.max(1, Math.round(detailRoute.walkToBoardM / 72));
              const rideMin = detailRoute.rideStops * 3;
              const walkFromAlightMin = Math.max(1, Math.round(detailRoute.walkFromAlightM / 72));
              const departMs = now.getTime() + detailRoute.nextBusMin * 60000;
              const arriveMs = departMs + rideMin * 60000;
              const fmt = (ms: number) => new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

              return (
                <motion.div key="detail"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                >
                  {/* Back + summary */}
                  <button onClick={() => setDetailRoute(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "8px 0 12px", color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: "inherit" }}>
                    <ChevronDown size={14} /> All routes
                  </button>

                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{detailRoute.totalMins} min</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {fmt(departMs - walkToBoardMin * 60000)} → {fmt(arriveMs + walkFromAlightMin * 60000)}
                      </span>
                    </div>
                    {/* Segment bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 30, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Footprints size={11} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{walkToBoardMin}m</span>
                        <div style={{ width: 14, height: 2, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                      </div>
                      <div style={{
                        flex: 1, height: 30, borderRadius: 9,
                        background: detailRoute.route.color,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: `0 3px 12px ${detailRoute.route.color}55`,
                      }}>
                        <span style={{ fontSize: 13 }}>🚌</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{detailRoute.route.label}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>· {detailRoute.rideStops} stops</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <div style={{ width: 14, height: 2, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                        <Footprints size={11} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{walkFromAlightMin}m</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: "3px 10px" }}>₹{detailRoute.route.fare}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}>Every ~{detailRoute.route.freqMin} min</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316", marginLeft: "auto", display: "flex", alignItems: "center" }}>Next in {detailRoute.nextBusMin} min</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 14 }}>YOUR JOURNEY</div>
                    <div style={{ position: "relative", paddingLeft: 26 }}>
                      <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: `linear-gradient(to bottom, #60a5fa, ${detailRoute.route.color}, #f97316)`, borderRadius: 2, opacity: 0.5 }} />

                      {[
                        { dot: "#60a5fa", label: selectedOrigin?.name ?? originLabel, sub: fmt(departMs - walkToBoardMin * 60000) },
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative" }}>
                          <div style={{ position: "absolute", left: -26, top: 4, width: 10, height: 10, borderRadius: "50%", background: s.dot, border: "2px solid #0a0d14", zIndex: 1 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{s.sub}</div>
                          </div>
                        </div>
                      ))}

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                        <Footprints size={13} color="rgba(255,255,255,0.4)" />
                        <div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Walk {walkToBoardMin} min · {detailRoute.walkToBoardM}m</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>to {detailRoute.boardStop.name}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 4, width: 12, height: 12, borderRadius: "50%", background: detailRoute.route.color, border: "2px solid #0a0d14", zIndex: 1 }} />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                            <div style={{ background: detailRoute.route.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 900, color: "#fff" }}>{detailRoute.route.label}</div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Board here</span>
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{detailRoute.boardStop.name}</div>
                          <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginTop: 2 }}>Departs {fmt(departMs)} · towards {detailRoute.route.to}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: `${detailRoute.route.color}12`, border: `1px solid ${detailRoute.route.color}33`, borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                        <span style={{ fontSize: 14 }}>🚌</span>
                        <div>
                          <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Ride {detailRoute.rideStops} stops · {rideMin} min</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{detailRoute.boardStop.name} → {detailRoute.alightStop.name}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0d14", zIndex: 1 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Get off — {detailRoute.alightStop.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>Arrives {fmt(arriveMs)}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", marginLeft: -10 }}>
                        <Footprints size={13} color="rgba(255,255,255,0.4)" />
                        <div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Walk {walkFromAlightMin} min · {detailRoute.walkFromAlightM}m</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>to {selectedDest.name}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 4, width: 10, height: 10, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0d14", zIndex: 1 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{selectedDest.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{fmt(arriveMs + walkFromAlightMin * 60000)} · Arrive</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buy Ticket */}
                  <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 16, padding: "14px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10 }}>TICKET · {detailRoute.route.label}</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, textAlign: "center", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "10px" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#f97316" }}>₹{detailRoute.route.fare}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Single</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px" }}>
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
                        border: "none", borderRadius: 12, padding: "14px",
                        color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
                      }}>
                      <Ticket size={16} /> Buy Ticket · UPI
                    </motion.button>
                  </div>

                  {/* Book Auto */}
                  <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 16, padding: "14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10 }}>OR BOOK AN AUTO</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {AUTO_DRIVERS.slice(0, 2).map((d, i) => (
                        <motion.button key={i} whileTap={{ scale: 0.96 }} onClick={() => { setDetailRoute(null); setTab("auto"); setSheetExpanded(true); }}
                          style={{ flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                          <div style={{ fontSize: 22 }}>🛺</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>{d.name.split(" ")[0]}</div>
                          <div style={{ fontSize: 11, color: "#fbbf24" }}>★ {d.rating}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginTop: 2 }}>{d.eta} min · ₹{d.fare}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })() : null}
          </AnimatePresence>

          {/* ── ROUTE LIST (bus tab, dest selected, no detail) ── */}
          {!detailRoute && tab === "bus" && selectedDest && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ padding: "0 2px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    {originLabel} → {selectedDest.name}
                  </div>
                  {!routeSearching && matchedRoutes.length > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                      {matchedRoutes.length} route{matchedRoutes.length > 1 ? "s" : ""} found
                    </div>
                  )}
                </div>
                {walkInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, padding: "5px 10px" }}>
                    <Footprints size={12} color="#f97316" />
                    <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>{walkInfo}</span>
                  </div>
                )}
              </div>

              {routeSearching && (
                <div style={{ textAlign: "center", padding: "28px" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, border: "3px solid #f97316", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Searching routes…</div>
                </div>
              )}

              {!routeSearching && matchedRoutes.length === 0 && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No direct bus found</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 16 }}>Try booking an auto rickshaw instead.</div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setTab("auto")}
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 12, padding: "13px 20px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                    🛺 Book Auto Rickshaw
                  </motion.button>
                </div>
              )}

              {!routeSearching && matchedRoutes.map((m, i) => {
                const now = new Date();
                const walkToBoardMin = Math.max(1, Math.round(m.walkToBoardM / 72));
                const leaveIn = m.nextBusMin - walkToBoardMin;
                const departTime = new Date(now.getTime() + m.nextBusMin * 60000);
                const fmt12 = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                return (
                  <motion.button key={m.route.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setDetailRoute(m)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
                      padding: "14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{m.totalMins} min</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>total</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: leaveIn <= 2 ? "#4ade80" : "#f97316" }}>
                          {leaveIn <= 0 ? "Leave now" : `Leave in ${leaveIn}m`}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Bus at {fmt12(departTime)}</div>
                      </div>
                    </div>
                    {/* Segment bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, height: 28 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Footprints size={10} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{walkToBoardMin}m</span>
                        <div style={{ width: 10, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                      </div>
                      <div style={{
                        flex: 1, height: 28, borderRadius: 8, background: m.route.color,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        boxShadow: `0 2px 8px ${m.route.color}44`,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{m.route.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{m.rideStops} stops</span>
                      </div>
                      {Math.round(m.walkFromAlightM / 72) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                          <div style={{ width: 10, borderTop: "2px dashed rgba(255,255,255,0.2)" }} />
                          <Footprints size={10} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{Math.max(1, Math.round(m.walkFromAlightM / 72))}m</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.boardStop.name} → {m.alightStop.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>₹{m.route.fare}</span>
                    </div>
                  </motion.button>
                );
              })}

              {!routeSearching && matchedRoutes.length > 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setTab("auto"); }}
                  style={{ width: "100%", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 14, padding: "13px 14px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🛺</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Book Auto Rickshaw</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Nearby drivers · From ₹{AUTO_DRIVERS[0]?.fare}</div>
                  </div>
                  <ChevronRight size={15} color="rgba(255,255,255,0.3)" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── HOME / QUICK ACCESS (no dest, bus tab) ── */}
          {!detailRoute && tab === "bus" && !selectedDest && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 12 }}>POPULAR DESTINATIONS</div>
              {POPULAR.map((p, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSearchOpen(true); setToQuery(p.name); setFocused("to"); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{p.icon}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", flex: 1 }}>{p.name}</span>
                  <ChevronRight size={15} color="rgba(255,255,255,0.2)" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── METRO TAB ── */}
          {!detailRoute && tab === "metro" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 12 }}>NAMMA METRO STATIONS</div>
              {METRO_STATIONS.slice(0, 10).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚇</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                      {(s.lines ?? []).join(" · ") || "Metro Station"}
                    </div>
                  </div>
                  <div style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
                    Live
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── AUTO TAB ── */}
          {!detailRoute && tab === "auto" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {autoStage === "list" && (
                <>
                  <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🛺</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Auto Rickshaw</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                      {AUTO_DRIVERS.length} drivers nearby · Real-time tracking
                    </div>
                  </div>
                  {AUTO_DRIVERS.map((d, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 16, padding: "14px", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🛺</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 1 }}>★ {d.rating} · {d.plate}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#f59e0b" }}>₹{d.fare}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{d.eta} min away</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                          📍 ~1.2 km away
                        </div>
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => { setBookedDriver(d); setAutoStage("booked"); }}
                          style={{ flex: 1, background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          Book Now
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {autoStage === "booked" && bookedDriver && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: 48, marginBottom: 12 }}>🛺</motion.div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b" }}>Auto Booked!</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
                      {bookedDriver.name} is on the way
                    </div>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Driver</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{bookedDriver.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Plate</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{bookedDriver.plate}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>ETA</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{bookedDriver.eta} min</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Fare (est.)</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>₹{bookedDriver.fare}</span>
                    </div>
                  </div>
                  <button onClick={() => { setAutoStage("list"); setBookedDriver(null); }}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel Booking
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── TICKET TAB ── */}
          {!detailRoute && tab === "ticket" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {ticketStage === "select" && (
                <>
                  <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🎫</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Buy Ticket</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>BMTC Bus · Digital ticket via UPI</div>
                  </div>
                  {[
                    { label: "500D", name: "Majestic ↔ Indira Nagar", fare: 22, color: "#a855f7" },
                    { label: "335E", name: "Marathahalli ↔ Electronic City", fare: 45, color: "#3b82f6" },
                    { label: "401", name: "Majestic ↔ Hennur", fare: 30, color: "#ef4444" },
                    { label: "319", name: "Whitefield ↔ Byrathi", fare: 30, color: "#22d3ee" },
                  ].map((r, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: r.color, borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{r.label}</div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", flex: 1 }}>{r.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, textAlign: "center", background: "rgba(249,115,22,0.08)", borderRadius: 10, padding: "8px" }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#f97316" }}>₹{r.fare}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Single</div>
                        </div>
                        <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px" }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>₹{Math.round(r.fare * 1.8)}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Return</div>
                        </div>
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => { setPayGatewayRoute({ label: r.label, fare: r.fare }); setPayGatewayOpen(true); }}
                          style={{ flex: 1.2, background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: 10, padding: "8px", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          Buy
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {ticketStage === "confirm" && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>Ticket Booked!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, marginBottom: 24 }}>Present the QR at the bus</div>
                  <div style={{ width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: 16, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📲</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: 6, marginBottom: 20 }}>SA•7391</div>
                  <button onClick={() => setTicketStage("select")}
                    style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, padding: "12px 24px", color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    Done
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      </motion.div>

      {/* Tap-to-collapse map area overlay (when sheet is expanded) */}
      {sheetExpanded && !searchOpen && (
        <div
          onClick={() => { if (!selectedDest) setSheetExpanded(false); }}
          style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "auto" }}
        />
      )}

      {/* ── Saarthi logo pill ─────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: "calc(200px + 14px)", right: 14, zIndex: 25,
        background: "rgba(10,13,20,0.9)", border: "1px solid rgba(249,115,22,0.25)",
        borderRadius: 14, padding: "8px 12px", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>S</div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>Saarthi</span>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.3; }
        }
      `}</style>

      {/* ── Payment Gateway overlay ───────────────────────────── */}
      <PaymentGateway
        isOpen={payGatewayOpen}
        onClose={() => setPayGatewayOpen(false)}
        routeLabel={payGatewayRoute.label}
        from={selectedOrigin?.name ?? (usingDefault ? "Bengaluru centre" : "Your location")}
        to={selectedDest?.name ?? ""}
        fare={payGatewayRoute.fare}
      />
    </div>
  );
}
