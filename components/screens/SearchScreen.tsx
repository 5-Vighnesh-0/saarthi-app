"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Home, Briefcase, ChevronRight, ArrowUpDown, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "@/lib/theme";
import { searchBengaluru, typeIcon, type GeoResult } from "@/lib/geocoding";
import type { Screen } from "@/components/AppShell";

export default function SearchScreen({ go }: { go: (s: Screen) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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

  const recents = ["MG Road Metro", "Indiranagar", "Koramangala", "Kempegowda Bus Station", "Electronic City"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#07090c" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(165deg, #b45309 0%, #92400e 50%, #07090c 100%)",
        padding: "48px 16px 20px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Orb */}
        <div style={{
          position: "absolute", top: -30, right: -30, width: 160, height: 160,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.25), transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          Where to in Bengaluru?
        </div>

        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 14, padding: "12px 14px",
          backdropFilter: "blur(12px)",
        }}>
          {searching
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 17, height: 17, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
            : <Search size={17} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Street, stop, landmark…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={15} color="rgba(255,255,255,0.6)" />
            </button>
          )}
        </div>

        {/* Swap row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20, padding: "6px 14px",
            color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            <ArrowUpDown size={12} /> Swap
          </button>
          <button style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20, padding: "6px 14px",
            color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>Leave now ›</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

        {/* Quick picks */}
        {!query && (
          <>
            {[
              { icon: <MapPin size={17} color="#f97316" />, label: "Choose on map",  bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.2)" },
              { icon: <Home size={17} color="#7dd3fc" />,   label: "Set home",       bg: "rgba(125,211,252,0.08)", border: "rgba(125,211,252,0.15)" },
              { icon: <Briefcase size={17} color="#a78bfa" />, label: "Set work",    bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.15)" },
            ].map((r, i) => (
              <motion.div key={i} whileTap={{ scale: 0.97 }}
                onClick={() => go("results")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: r.bg, border: `1px solid ${r.border}`,
                  borderRadius: 14, padding: "13px 14px", marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#fff", fontFamily: "inherit" }}>{r.label}</span>
                <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: "auto" }} />
              </motion.div>
            ))}

            {/* Recents */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, margin: "16px 4px 10px" }}>RECENT</div>
            {recents.map((name, i) => (
              <motion.div key={i} whileTap={{ scale: 0.97 }}
                onClick={() => go("results")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 4px", cursor: "pointer",
                  borderBottom: i < recents.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <MapPin size={15} color="#f97316" />
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text, flex: 1 }}>{name}</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 17 }}>›</span>
              </motion.div>
            ))}
          </>
        )}

        {/* Search results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, margin: "4px 4px 10px" }}>RESULTS</div>
              {results.map((r, i) => (
                <motion.div key={i} whileTap={{ scale: 0.97 }}
                  onClick={() => go("results")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {typeIcon(r.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.displayName}</div>
                  </div>
                  <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {query.length > 0 && results.length === 0 && !searching && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
