"use client";
import { X, Navigation } from "lucide-react";
import { C } from "@/lib/theme";
import { ROUTE_STOPS } from "@/lib/data/bengaluru";
import MetalButton from "@/components/ui/MetalButton";
import MetroIcon from "@/components/ui/MetroIcon";
import WalkIcon from "@/components/ui/WalkIcon";
import Badge from "@/components/ui/Badge";
import TransitMap from "@/components/map/TransitMap";
import type { Screen } from "@/components/AppShell";

const grabHandle: React.CSSProperties = {
  width: 42, height: 5, borderRadius: 5,
  background: "rgba(255,255,255,0.25)", margin: "0 auto 10px",
};

const iconBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 42, border: "none",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ── Walk segment ─────────────────────────────────────────────────── */
function WalkStep({ minutes }: { minutes: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)",
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <WalkIcon size={20} color="#9fc5ec" />
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{minutes} min walk</div>
        <div style={{ color: "rgba(159,197,236,0.6)", fontSize: 12 }}>~{minutes * 80}m</div>
      </div>
    </div>
  );
}

/* ── Metro/transit segment ────────────────────────────────────────── */
function TransitStep({
  badges, title, sub, onClick,
}: {
  badges: string[]; title: string; sub?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)",
      cursor: onClick ? "pointer" : "default",
    }}>
      {/* Metro icon + line badges */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 6, flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MetroIcon size={20} color="#9fc5ec" />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {badges.map((b) => <Badge key={b} k={b} />)}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {sub && <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
      {onClick && <span style={{ color: C.sub, fontSize: 18 }}>›</span>}
    </div>
  );
}

export default function MapScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div style={{ height: "100%", position: "relative", background: "#0c1622" }}>
      <TransitMap accent={C.blue} stops={ROUTE_STOPS} />

      {/* Top-right controls */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        display: "flex", flexDirection: "column", gap: 10, zIndex: 10,
      }}>
        <button onClick={() => go("results")} style={{ ...iconBtn, background: C.blue }}>
          <X size={20} color="#fff" />
        </button>
        <button style={{ ...iconBtn, background: C.blue }}>
          <Navigation size={18} color="#fff" />
        </button>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        background: C.blueDeep, borderTopLeftRadius: 18, borderTopRightRadius: 18,
        padding: 18, zIndex: 10,
      }}>
        <div style={grabHandle} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Leave at 10:32</div>
          <div style={{ marginLeft: "auto", color: C.sub, fontWeight: 700 }}>52 min</div>
        </div>
        <div style={{ color: "#9fc5ec", marginTop: 2, fontSize: 13 }}>Arrive at 11:23</div>

        {/* Journey progress bar */}
        <div style={{ display: "flex", gap: 6, marginTop: 14, alignItems: "center" }}>
          <WalkIcon size={15} color="#9fc5ec" />
          <div style={{ flex: 1, height: 6, background: C.blue, borderRadius: 6 }} />
          <MetroIcon size={15} color="#9fc5ec" />
          <div style={{ width: 32, height: 6, background: C.orange, borderRadius: 6 }} />
          <WalkIcon size={15} color="#9fc5ec" />
        </div>

        {/* Steps */}
        <WalkStep minutes={6} />
        <TransitStep
          badges={["PUR", "GRN"]}
          title="Trinity Metro"
          sub="Namma Metro · Purple Line interchange"
          onClick={() => go("live")}
        />
        <WalkStep minutes={5} />

        <MetalButton variant="blue" full onClick={() => go("ticket")} style={{ marginTop: 14 }}>
          🎫 Book ticket · ₹30
        </MetalButton>
      </div>
    </div>
  );
}
