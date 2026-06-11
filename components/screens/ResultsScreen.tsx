"use client";
import {
  Navigation, MapPin, ArrowUpDown, RefreshCw, X,
  ChevronRight, Clock, IndianRupee,
} from "lucide-react";
import { C } from "@/lib/theme";
import { TRIPS } from "@/lib/data/bengaluru";
import type { Trip } from "@/lib/data/bengaluru";
import StatusBar from "@/components/ui/StatusBar";
import Badge from "@/components/ui/Badge";
import Dots from "@/components/ui/Dots";
import type { Screen } from "@/components/AppShell";

const pill: React.CSSProperties = {
  background: C.panel2,
  color: "#fff",
  border: "none",
  borderRadius: 20,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 42,
  background: C.panel2,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

function Field({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "11px 12px",
      }}
    >
      {icon}
      <span style={{ color: "#fff", fontWeight: 600 }}>{text}</span>
    </div>
  );
}

export default function ResultsScreen({
  go,
}: {
  go: (s: Screen, t?: Trip) => void;
}) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(165deg,#12a868,#076b43)",
          padding: "14px 16px 18px",
          boxShadow: "0 8px 24px rgba(7,107,67,0.35)",
        }}
      >
        <StatusBar />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <Field icon={<Navigation size={16} color={C.green} />} text="Current location" />
            <Field icon={<MapPin size={16} color={C.green} />} text="Indiranagar Metro" />
          </div>
          <ArrowUpDown size={22} color="#fff" />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <button style={pill}>Leave now ›</button>
        <button style={iconBtn}><RefreshCw size={18} color="#fff" /></button>
        <button
          onClick={() => go("search")}
          style={{ ...iconBtn, background: C.red, marginLeft: "auto" }}
        >
          <X size={20} color="#fff" />
        </button>
      </div>

      {/* Timeline ruler */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 16px 6px",
          color: C.sub,
          fontSize: 12,
        }}
      >
        <span>10:30</span><span>10:45</span><span>11:00</span><span>11:15</span>
      </div>

      {/* Trip list */}
      <div style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}>
        {TRIPS.map((t) => (
          <div
            key={t.id}
            onClick={() => go(t.legs.length === 1 ? "live" : "map", t)}
            style={{
              padding: "14px 16px",
              borderTop: `1px solid ${C.line}`,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dots n={4} />
              <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
                {t.legs.map((l, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge k={l} />
                    {i < t.legs.length - 1 && (
                      <div style={{ width: 22, height: 4, background: C.line, borderRadius: 4 }} />
                    )}
                  </span>
                ))}
              </div>
              <span
                style={{
                  background: C.panel2,
                  color: C.sub,
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {t.cost}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Go{" "}
                {t.depart === "now" ? (
                  <span style={{ color: C.green }}>now</span>
                ) : (
                  <>
                    in <span style={{ color: C.green }}>{t.depart}</span>
                  </>
                )}
              </span>
              <span style={{ color: C.sub, fontWeight: 600 }}>{t.dur}</span>
            </div>
          </div>
        ))}

        {/* Find more */}
        <div
          style={{
            margin: "16px",
            background: C.panel,
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 20 }}>🗺️</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Find more trips</span>
          <ChevronRight size={20} color="#fff" style={{ marginLeft: "auto" }} />
        </div>

        {/* Auto-rickshaw card */}
        <div
          onClick={() => go("auto")}
          style={{
            margin: "0 16px",
            background: "#2a1d08",
            borderRadius: 14,
            padding: "14px 18px",
            cursor: "pointer",
            border: `1px solid ${C.orange}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🛺</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Auto-rickshaw</div>
              <div style={{ color: C.sub, fontSize: 13 }}>Direct to driver · no commission</div>
            </div>
            <ChevronRight size={20} color={C.orange} style={{ marginLeft: "auto" }} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(245,166,35,0.25)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontWeight: 700,
              }}
            >
              <Clock size={15} color={C.orange} /> 18 min to dest.
            </span>
            <span style={{ color: C.sub, fontSize: 13 }}>2 min pickup</span>
            <span
              style={{
                marginLeft: "auto",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
              }}
            >
              <IndianRupee size={15} />78
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
