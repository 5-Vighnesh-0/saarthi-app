"use client";
import { useState, useEffect } from "react";
import {
  X, Pin, Bell, Navigation, MapPin,
  Star, Clock, IndianRupee, Users,
} from "lucide-react";
import MetroIcon from "@/components/ui/MetroIcon";
import { C } from "@/lib/theme";
import { BUS_POSITIONS, ROUTE_STOPS } from "@/lib/data/bengaluru";
import { useSmoothVehicles } from "@/lib/hooks/useSmoothVehicles";
import MetalButton from "@/components/ui/MetalButton";
import TransitMap from "@/components/map/TransitMap";
import type { Screen } from "@/components/AppShell";

const iconBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 40, border: "none",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ── Small stat pill ─────────────────────────────────────────────── */
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{
      flex: 1, background: "rgba(0,0,0,0.28)",
      borderRadius: 12, padding: "10px 8px", textAlign: "center",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

/* ── Stop timeline row ───────────────────────────────────────────── */
function StopRow({ name, time, lines, active, last }: {
  name: string; time: string; lines: string[]; active: boolean; last: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, paddingBottom: last ? 0 : 4 }}>
      {/* Timeline column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
        <div style={{
          width: 12, height: 12, borderRadius: 12, flexShrink: 0,
          background: active ? C.red : "rgba(255,255,255,0.25)",
          border: `2px solid ${active ? "#fff" : "rgba(255,255,255,0.2)"}`,
          boxShadow: active ? `0 0 0 3px ${C.red}44` : "none",
          marginTop: 3,
        }} />
        {!last && (
          <div style={{
            flex: 1, width: 2, background: "rgba(255,255,255,0.1)",
            marginTop: 4, borderRadius: 2, minHeight: 18,
          }} />
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.55)", fontSize: 13 }}>
            {name}
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
            {time}
          </span>
        </div>
        {lines.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {lines.map((l) => (
              <span key={l} style={{
                background: C.orange, color: "#000", fontWeight: 800,
                fontSize: 10, padding: "1px 6px", borderRadius: 4,
              }}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveScreen({ go }: { go: (s: Screen) => void }) {
  const [sel, setSel] = useState(0);
  const [secs, setSecs] = useState(20);
  const { vehicles, connected } = useSmoothVehicles();

  // Merge smooth live positions over static fallback data (preserves mins/near/crowd metadata)
  const buses = vehicles.length > 0
    ? vehicles
        .filter((v) => v.routeId === "500D")
        .map((v, i) => ({
          mins: BUS_POSITIONS[i]?.mins ?? 15 + i * 5,
          lat: v.lat,
          lng: v.lng,
          heading: v.heading,
          near: BUS_POSITIONS[i]?.near ?? "En route",
          crowd: BUS_POSITIONS[i]?.crowd ?? ("Seats free" as const),
        }))
    : BUS_POSITIONS;

  useEffect(() => {
    setSecs(15 + sel * 8);
    const id = setInterval(() => setSecs((s) => (s <= 0 ? 30 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [sel]);

  const bus = buses[Math.min(sel, buses.length - 1)] ?? BUS_POSITIONS[0];

  return (
    <div style={{ height: "100%", position: "relative", background: "#160409" }}>
      <TransitMap
        accent={C.red}
        buses={buses}
        stops={ROUTE_STOPS}
        selected={Math.min(sel, buses.length - 1)}
        onSelectBus={setSel}
      />

      {/* Top-right controls */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        display: "flex", flexDirection: "column", gap: 8, zIndex: 10,
      }}>
        <button onClick={() => go("results")} style={{ ...iconBtn, background: C.red }}>
          <X size={18} color="#fff" />
        </button>
        <button style={{ ...iconBtn, background: "rgba(0,0,0,0.5)" }}>
          <Pin size={16} color="#fff" />
        </button>
        <button style={{ ...iconBtn, background: "rgba(0,0,0,0.5)" }}>
          <Bell size={16} color="#fff" />
        </button>
        <button style={{ ...iconBtn, background: "rgba(0,0,0,0.5)" }}>
          <Navigation size={16} color="#fff" />
        </button>
      </div>

      {/* Top-left: LIVE + route name */}
      <div style={{ position: "absolute", top: 14, left: 16, zIndex: 10 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.95)", color: connected ? C.red : "#888",
          fontWeight: 800, padding: "4px 12px", borderRadius: 20,
          fontSize: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 7,
            background: connected ? C.red : "#888",
            boxShadow: connected ? "0 0 0 3px rgba(236,28,60,0.3)" : "none",
          }} />
          {connected ? "LIVE" : "OFFLINE"}
        </div>
        <div style={{
          fontSize: 52, fontWeight: 900, fontStyle: "italic", color: "#fff",
          marginTop: 6, lineHeight: 1, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
        }}>
          500D
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 12,
        }}>
          <MetroIcon size={13} color="rgba(255,255,255,0.8)" /> BMTC
        </div>
      </div>

      {/* ── Bottom sheet ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10,
        background: "linear-gradient(180deg, #5c0f1a 0%, #3a0810 100%)",
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: "8px 16px 20px",
        boxShadow: "0 -16px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Grab handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 4,
          background: "rgba(255,255,255,0.2)", margin: "0 auto 14px",
        }} />

        {/* ── ZONE 1: Destination + status ───────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>↑ Towards Silk Board</div>
            {/* Single clean status line */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MapPin size={12} color="#ffa0b0" />
              <span style={{ color: "#ffa0b0", fontSize: 12, fontWeight: 600 }}>
                Near <span style={{ color: "#fff" }}>{bus.near}</span>
              </span>
              <span style={{
                background: bus.crowd === "Seats free" ? "rgba(15,174,110,0.3)" : "rgba(245,166,35,0.3)",
                color: bus.crowd === "Seats free" ? "#4ef0a8" : C.orange,
                fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20,
              }}>
                {bus.crowd}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{secs}s ago</span>
            </div>
          </div>
          <MetalButton variant="red" size="sm">GO</MetalButton>
        </div>

        {/* ── ZONE 2: Bus time selector ──────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {buses.map((b, i) => (
            <div key={i} onClick={() => setSel(i)} style={{
              flex: 1, borderRadius: 14, padding: "12px 8px", cursor: "pointer",
              textAlign: "center",
              background: i === sel ? "linear-gradient(180deg,#ff3d5a,#d4112e)" : "rgba(255,255,255,0.06)",
              border: i === sel ? "1.5px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: i === sel ? "0 8px 20px rgba(236,28,60,0.4)" : "none",
              transform: i === sel ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease",
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{b.mins}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>min</div>
            </div>
          ))}
        </div>

        {/* ── ZONE 3: Stats row ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Stat icon={<Star size={13} color={C.orange} fill={C.orange} />} value="4.8" label="Rating" />
          <Stat icon={<Clock size={13} color="#7dd3fc" />} value="67%" label="On time" />
          <Stat icon={<Users size={13} color="#86efac" />} value="~18" label="Seats" />
          <Stat icon={<IndianRupee size={13} color="#ffa0b0" />} value="15" label="Fare" />
        </div>

        {/* ── ZONE 4: Book ticket CTA ────────────────────────────── */}
        <MetalButton variant="red" full onClick={() => go("ticket")} style={{ marginBottom: 16 }}>
          🎫 Book ticket · ₹15
        </MetalButton>

        {/* ── ZONE 5: Stop timeline ──────────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: "14px 14px 10px",
        }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>
            UPCOMING STOPS
          </div>
          {ROUTE_STOPS.map((s, i) => (
            <StopRow
              key={i}
              name={s.name}
              time={s.time}
              lines={s.lines}
              active={s.name.startsWith(bus.near)}
              last={i === ROUTE_STOPS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
