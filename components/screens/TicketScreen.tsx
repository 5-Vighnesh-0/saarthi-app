"use client";
import { useState, useRef, useEffect } from "react";
import {
  X, Lock, CreditCard, Smartphone, Wallet, Calendar, Check,
  MapPin, Navigation, ArrowUpDown, Search, ChevronRight, Clock, ArrowLeft,
} from "lucide-react";
import { C } from "@/lib/theme";
import MetalButton from "@/components/ui/MetalButton";
import StatusBar from "@/components/ui/StatusBar";
import type { Screen } from "@/components/AppShell";

// ── Green palette for ticket UI ──────────────────────────────────────────────
const G = {
  dark:   "#065a27",
  mid:    "#0a8f3c",
  head:   "#12a868",
  bright: "#26d98c",
  glow:   "rgba(38,217,140,0.18)",
};

type Stage = "search" | "buses" | "confirm" | "checkout" | "paid";

interface RouteItem {
  id: string;
  number: string;
  type: "bus" | "metro" | "express";
  via: string;
  from: string;
  to: string;
  stops: string[];
  fare: number;
  eta: number;
  crowd: "Seats free" | "Filling up" | "Full";
  color: string;
}

const ALL_ROUTES: RouteItem[] = [
  {
    id: "500D", number: "500D", type: "bus",
    via: "via Domlur, Koramangala",
    from: "Shivajinagar", to: "Silk Board",
    stops: ["Shivajinagar", "Domlur", "Koramangala", "BTM Layout", "Silk Board", "Hosur Road"],
    fare: 28, eta: 4, crowd: "Seats free", color: "#ec1c3c",
  },
  {
    id: "335E", number: "335E", type: "bus",
    via: "via MG Road, Indiranagar",
    from: "Kempegowda Bus Stand", to: "Whitefield",
    stops: ["Kempegowda", "Majestic", "MG Road", "Indiranagar", "Marathahalli", "Whitefield"],
    fare: 35, eta: 8, crowd: "Filling up", color: "#ec1c3c",
  },
  {
    id: "G4", number: "G4", type: "bus",
    via: "via Hosur Road",
    from: "Kempegowda Bus Stand", to: "Electronic City",
    stops: ["Kempegowda", "Majestic", "BTM Layout", "Bommanahalli", "Electronic City"],
    fare: 30, eta: 12, crowd: "Seats free", color: "#16b39a",
  },
  {
    id: "201R", number: "201R", type: "bus",
    via: "via Rajajinagar, Yeshwantpur",
    from: "Jayanagar", to: "Yelahanka",
    stops: ["Jayanagar", "Rajajinagar", "Yeshwantpur", "Hebbal", "Yelahanka"],
    fare: 22, eta: 6, crowd: "Full", color: "#ec1c3c",
  },
  {
    id: "356", number: "356", type: "bus",
    via: "via Bellandur, Sarjapur",
    from: "Majestic", to: "Sarjapur",
    stops: ["Majestic", "Silk Board", "Bellandur", "Sarjapur Road", "Sarjapur"],
    fare: 32, eta: 15, crowd: "Seats free", color: "#16b39a",
  },
  {
    id: "METRO-P", number: "Purple", type: "metro",
    via: "Namma Metro · Purple Line",
    from: "Baiyappanahalli", to: "Mysuru Road",
    stops: ["Baiyappanahalli", "Indiranagar", "Trinity", "MG Road", "Cubbon Park", "Majestic", "Mysuru Road"],
    fare: 40, eta: 3, crowd: "Seats free", color: "#7b2d8e",
  },
  {
    id: "METRO-G", number: "Green", type: "metro",
    via: "Namma Metro · Green Line",
    from: "Nagasandra", to: "Silk Board",
    stops: ["Nagasandra", "Rajajinagar", "Majestic", "Shivajinagar", "KR Puram", "Whitefield", "Silk Board"],
    fare: 35, eta: 5, crowd: "Filling up", color: G.mid,
  },
  {
    id: "KIA", number: "KIA Shuttle", type: "express",
    via: "Airport Express Service",
    from: "Kempegowda Bus Stand", to: "Kempegowda Intl Airport",
    stops: ["Kempegowda", "Hebbal", "Yelahanka", "Airport"],
    fare: 220, eta: 20, crowd: "Seats free", color: "#f97316",
  },
];

const POPULAR = [
  "Indiranagar", "Whitefield", "MG Road", "Electronic City",
  "Koramangala", "Airport", "Silk Board", "Majestic",
];

const CROWD_COLOR: Record<string, string> = {
  "Seats free": G.bright,
  "Filling up": "#f97316",
  "Full": "#ec1c3c",
};

const TYPE_ICON: Record<string, string> = {
  bus: "🚌",
  metro: "🚇",
  express: "✈️",
};

// ── QR Code ──────────────────────────────────────────────────────────────────
function QRCode({ seed = "TKT", size = 200 }: { seed?: string; size?: number }) {
  const N = 25;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = (x: number, y: number) => {
    let v = (h ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
    v = (v ^ (v >> 13)) >>> 0;
    return v % 100 < 48;
  };
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const cell = size / N;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (!finder(x, y) && rnd(x, y))
        rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#000" />);
  const Eye = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * cell},${y * cell})`}>
      <rect width={cell * 7} height={cell * 7} fill="#000" />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} fill="#000" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 8 }}>
      <rect width={size} height={size} fill="#fff" />
      {rects}
      <Eye x={0} y={0} /> <Eye x={N - 7} y={0} /> <Eye x={0} y={N - 7} />
    </svg>
  );
}

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = [G.bright, G.mid, "#3b82f6", "#eab308", "#8b5cf6", "#f97316"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 40 }} aria-hidden>
      <style>{`@keyframes fall{0%{transform:translateY(-12%) rotate(0);opacity:1}100%{transform:translateY(900px) rotate(720deg);opacity:0}}`}</style>
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: 7, height: 12, borderRadius: 2,
          left: `${(i * 137.5) % 100}%`, top: `${-15 + (i % 10)}%`,
          background: colors[i % colors.length],
          transform: `rotate(${(i * 47) % 360}deg)`,
          animation: `fall ${2.4 + (i % 5) * 0.48}s ${(i % 8) * 0.188}s linear forwards`,
        }} />
      ))}
    </div>
  );
}

// ── Issued ticket ─────────────────────────────────────────────────────────────
function IssuedTicket({ line, fare, code }: { line: string; fare: number; code: string }) {
  const dt = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 330,
      background: "#fff", color: "#15171a", borderRadius: 22,
      boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      animation: "pop 0.5s cubic-bezier(0.2,0.8,0.2,1)",
    }}>
      <style>{`@keyframes pop{0%{transform:scale(0.94);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
      <div style={{ padding: "26px 24px 6px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 64, background: `rgba(10,143,60,0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 44, background: G.mid, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={26} color="#fff" strokeWidth={3} />
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>Ticket Issued!</div>
        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Your ticket has been issued successfully</div>
      </div>
      <div style={{ padding: "10px 24px 22px" }}>
        <div style={{ borderTop: "2px dashed #e5e7eb" }} />
        <div style={{ display: "flex", justifyContent: "space-between", margin: "16px 0" }}>
          <div>
            <div style={tLbl}>Ticket ID</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{code}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={tLbl}>Amount</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>₹{fare}.00</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={tLbl}>Date &amp; Time</div>
          <div style={{ fontWeight: 600 }}>{dt}</div>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 27, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
            <span style={{ fontWeight: 800, fontSize: 11, color: G.dark }}>UPI</span>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Paid via UPI</div>
            <div style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 13, letterSpacing: 1 }}>•••• 4291</div>
          </div>
          <span style={{ marginLeft: "auto", fontWeight: 700, color: G.mid, fontSize: 13 }}>Success</span>
        </div>
        <div style={{ borderTop: "2px dashed #e5e7eb" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16 }}>
          <QRCode seed={code} size={168} />
          <div style={{ color: "#6b7280", fontSize: 12, letterSpacing: 3, marginTop: 10 }}>{code}</div>
          <div style={{ color: "#9aa0a6", fontSize: 12, marginTop: 6, textAlign: "center" }}>{line} · scan at the gate</div>
        </div>
      </div>
      {(["left", "right"] as const).map((side) => (
        <div key={side} style={{
          position: "absolute", top: "52%", transform: "translateY(-50%)",
          [side]: -16, width: 32, height: 32, borderRadius: 32, background: C.bg,
        }} />
      ))}
    </div>
  );
}

// ── Checkout panel ────────────────────────────────────────────────────────────
function GlassCheckout({ amount, onPay, onBack }: { amount: number; onPay: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<"upi" | "card" | "wallet">("upi");
  const methodBtn = (on: boolean): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 2, height: 52, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
    border: on ? `1px solid ${G.bright}` : "1px solid rgba(255,255,255,0.12)",
    background: on ? `rgba(38,217,140,0.15)` : "rgba(0,0,0,0.25)",
    color: on ? G.bright : "#fff", transition: "all 0.18s",
  });
  const Field = ({ label, icon, placeholder }: { label: string; icon?: React.ReactNode; placeholder: string }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input placeholder={placeholder} style={{
          width: "100%", boxSizing: "border-box",
          padding: icon ? "11px 12px 11px 38px" : "11px 12px",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.28)", color: "#fff", fontSize: 14,
          fontFamily: "inherit", outline: "none",
        }} />
        {icon && <span style={{ position: "absolute", left: 12, top: 11, color: C.sub }}>{icon}</span>}
      </div>
    </div>
  );
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", width: 170, height: 170, borderRadius: 170, background: G.mid, filter: "blur(60px)", opacity: 0.35, top: -40, left: -20, zIndex: 0 }} />
      <div style={{ position: "absolute", width: 150, height: 150, borderRadius: 150, background: "#1f7fe0", filter: "blur(60px)", opacity: 0.3, bottom: -20, right: -10, zIndex: 0 }} />
      <div style={{
        position: "relative", zIndex: 1, borderRadius: 20, padding: 20,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)", animation: "slideup 0.4s ease",
      }}>
        <style>{`@keyframes slideup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Payment Details</div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>Complete your purchase securely</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMethod("upi")} style={methodBtn(method === "upi")}><Smartphone size={18} /><span style={{ fontSize: 11 }}>UPI</span></button>
          <button onClick={() => setMethod("card")} style={methodBtn(method === "card")}><CreditCard size={18} /><span style={{ fontSize: 11 }}>Card</span></button>
          <button onClick={() => setMethod("wallet")} style={methodBtn(method === "wallet")}><Wallet size={18} /><span style={{ fontSize: 11 }}>Wallet</span></button>
        </div>
        {method === "upi" && <Field label="UPI ID" icon={<Smartphone size={16} />} placeholder="yourname@okhdfcbank" />}
        {method === "card" && (
          <>
            <Field label="Card Number" icon={<CreditCard size={16} />} placeholder="0000 0000 0000 0000" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Expiry" icon={<Calendar size={16} />} placeholder="MM/YY" />
              <Field label="CVC" icon={<Lock size={16} />} placeholder="123" />
            </div>
            <Field label="Cardholder Name" placeholder="Your name" />
          </>
        )}
        {method === "wallet" && (
          <div style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={20} color={G.bright} />
            <div>
              <div style={{ fontWeight: 700 }}>Wallet balance ₹250</div>
              <div style={{ color: C.sub, fontSize: 12 }}>₹{amount} will be deducted</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          <MetalButton variant="green" full onClick={onPay}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Lock size={15} /> Pay ₹{amount}
            </span>
          </MetalButton>
        </div>
        <div style={{ color: C.sub, fontSize: 11, textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Lock size={12} /> Payments are secure and encrypted
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.sub, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared header ─────────────────────────────────────────────────────────────
function TicketHeader({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div style={{
      background: `linear-gradient(165deg, ${G.head}, ${G.dark})`,
      padding: "14px 16px 16px",
      boxShadow: `0 8px 24px rgba(6,90,39,0.4)`,
      zIndex: 1, flexShrink: 0,
    }}>
      <StatusBar />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ width: 42, height: 42, borderRadius: 42, background: "rgba(0,0,0,0.25)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={20} color="#fff" />
          </button>
        )}
        <span style={{ fontWeight: 800, fontSize: 18, flex: 1 }}>{title}</span>
        <button onClick={onClose} style={{ width: 42, height: 42, borderRadius: 42, background: "rgba(0,0,0,0.25)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Stage 1: Search ───────────────────────────────────────────────────────────
function SearchStage({
  from, to, onFromChange, onToChange, onSwap, onSearch, onClose,
}: {
  from: string; to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSwap: () => void;
  onSearch: () => void;
  onClose: () => void;
}) {
  const toRef = useRef<HTMLInputElement>(null);
  useEffect(() => { toRef.current?.focus(); }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "13px 14px 13px 40px",
    borderRadius: 12, border: `1px solid rgba(38,217,140,0.2)`,
    background: "rgba(255,255,255,0.06)", color: "#fff",
    fontSize: 15, fontFamily: "inherit", outline: "none",
  };

  return (
    <>
      <TicketHeader title="Book Ticket" onClose={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

        {/* From / To fields */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: G.bright, letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>FROM</div>
            <div style={{ position: "relative" }}>
              <Navigation size={16} color={G.bright} style={{ position: "absolute", left: 12, top: 15, zIndex: 1 }} />
              <input
                value={from}
                onChange={e => onFromChange(e.target.value)}
                placeholder="Current location"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={onSwap}
            style={{
              position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: 32, border: `1px solid rgba(38,217,140,0.3)`,
              background: "rgba(10,143,60,0.2)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowUpDown size={15} color={G.bright} />
          </button>

          <div>
            <div style={{ fontSize: 11, color: G.bright, letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>TO</div>
            <div style={{ position: "relative" }}>
              <Search size={16} color={G.bright} style={{ position: "absolute", left: 12, top: 15, zIndex: 1 }} />
              <input
                ref={toRef}
                value={to}
                onChange={e => onToChange(e.target.value)}
                placeholder="Search destination…"
                style={{ ...inputStyle, borderColor: to ? `rgba(38,217,140,0.5)` : "rgba(38,217,140,0.2)" }}
              />
            </div>
          </div>
        </div>

        {/* Popular chips */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Popular destinations</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR.map(p => (
              <button
                key={p}
                onClick={() => onToChange(p)}
                style={{
                  padding: "7px 14px", borderRadius: 20,
                  background: to === p ? G.glow : "rgba(255,255,255,0.07)",
                  border: to === p ? `1px solid ${G.bright}` : "1px solid rgba(255,255,255,0.1)",
                  color: to === p ? G.bright : "#fff",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Find buses CTA */}
        <MetalButton variant="green" full onClick={onSearch}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Search size={16} /> Find Buses
          </span>
        </MetalButton>
      </div>
    </>
  );
}

// ── Stage 2: Bus list ─────────────────────────────────────────────────────────
function BusListStage({
  from, to, routes,
  onFromChange, onToChange, onSwap,
  onSelect, onBack, onClose,
}: {
  from: string; to: string;
  routes: RouteItem[];
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSwap: () => void;
  onSelect: (r: RouteItem) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [editField, setEditField] = useState<"from" | "to" | null>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editField === "from") fromRef.current?.focus();
    if (editField === "to") toRef.current?.focus();
  }, [editField]);

  const fieldStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "9px 10px", borderRadius: 10,
    background: active ? "rgba(38,217,140,0.1)" : "rgba(255,255,255,0.07)",
    border: active ? `1px solid ${G.bright}` : "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontFamily: "inherit", fontSize: 13, outline: "none",
  });

  return (
    <>
      <TicketHeader
        title={to ? `Buses to ${to}` : "All buses"}
        onBack={onBack}
        onClose={onClose}
      />

      {/* Editable From/To strip */}
      <div style={{
        background: `linear-gradient(180deg, ${G.dark}cc, transparent)`,
        padding: "10px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Navigation size={12} color={G.bright} style={{ flexShrink: 0 }} />
              {editField === "from" ? (
                <input
                  ref={fromRef}
                  value={from}
                  onChange={e => onFromChange(e.target.value)}
                  onBlur={() => setEditField(null)}
                  style={fieldStyle(true)}
                />
              ) : (
                <button
                  onClick={() => setEditField("from")}
                  style={{ ...fieldStyle(false), textAlign: "left", cursor: "text" }}
                >
                  {from || "Current location"}
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={12} color="#f97316" style={{ flexShrink: 0 }} />
              {editField === "to" ? (
                <input
                  ref={toRef}
                  value={to}
                  onChange={e => onToChange(e.target.value)}
                  onBlur={() => setEditField(null)}
                  style={fieldStyle(true)}
                />
              ) : (
                <button
                  onClick={() => setEditField("to")}
                  style={{ ...fieldStyle(false), textAlign: "left", cursor: "text" }}
                >
                  {to || "All destinations"}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onSwap}
            style={{
              width: 32, height: 32, borderRadius: 32, flexShrink: 0,
              background: "rgba(10,143,60,0.2)", border: `1px solid rgba(38,217,140,0.3)`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowUpDown size={14} color={G.bright} />
          </button>
        </div>
        <div style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>
          Tap any field above to change your origin or destination
        </div>
      </div>

      {/* Bus list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 16px" }}>
        {routes.length === 0 ? (
          <div style={{ textAlign: "center", color: C.sub, padding: "40px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚌</div>
            <div style={{ fontWeight: 700 }}>No buses found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try a different destination</div>
          </div>
        ) : (
          routes.map(r => (
            <div key={r.id} style={{
              margin: "0 14px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "14px",
              cursor: "pointer", transition: "background 0.15s",
            }}
              onClick={() => onSelect(r)}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{TYPE_ICON[r.type]}</span>
                <div style={{
                  background: r.color, color: "#fff",
                  fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 20,
                }}>
                  {r.number}
                </div>
                <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>{r.via}</span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700, color: CROWD_COLOR[r.crowd],
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: 6, background: CROWD_COLOR[r.crowd] }} />
                  {r.crowd}
                </div>
              </div>

              {/* Route strip */}
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.5)",
                marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.stops.slice(0, 4).join(" → ")}
                {r.stops.length > 4 && " → …"}
              </div>

              {/* Bottom row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                  <Clock size={13} color={G.bright} />
                  <span style={{ fontWeight: 700, color: G.bright }}>{r.eta} min</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>{r.from} → {r.to}</div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>₹{r.fare}</span>
                  <div style={{
                    background: G.mid, color: "#fff", fontWeight: 700, fontSize: 12,
                    padding: "5px 12px", borderRadius: 20,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    Select <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ── Stage 3: Confirm ──────────────────────────────────────────────────────────
function ConfirmStage({
  route, from, to,
  onProceed, onBack, onClose,
}: {
  route: RouteItem; from: string; to: string;
  onProceed: () => void; onBack: () => void; onClose: () => void;
}) {
  const Row = ({ label, value, big }: { label: string; value: string; big?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
      <span style={{ color: C.sub, fontSize: big ? 16 : 14 }}>{label}</span>
      <span style={{ fontWeight: big ? 800 : 600, fontSize: big ? 20 : 15 }}>{value}</span>
    </div>
  );

  return (
    <>
      <TicketHeader title="Confirm Ticket" onBack={onBack} onClose={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Route badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{TYPE_ICON[route.type]}</span>
          <div style={{ background: route.color, color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 14px", borderRadius: 20 }}>
            {route.number}
          </div>
          <span style={{ color: C.sub, fontSize: 13 }}>{route.via}</span>
        </div>

        {/* Ticket details card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(38,217,140,0.15)",
          borderRadius: 16, padding: 18,
        }}>
          <Row label="Service" value={`${route.number} · ${route.type === "metro" ? "Metro" : route.type === "express" ? "Express" : "BMTC"}`} />
          <Row label="From" value={from || "Current location"} />
          <Row label="To" value={to || route.to} />
          <Row label="Via" value={route.via.replace("via ", "")} />
          <Row label="Valid for" value="120 minutes" />
          <div style={{ borderTop: `1px dashed rgba(38,217,140,0.2)`, margin: "10px 0" }} />
          <Row label="Fare" value={`₹${route.fare}`} big />
        </div>

        <MetalButton variant="green" full onClick={onProceed}>
          Proceed to Pay ₹{route.fare}
        </MetalButton>
        <div style={{ color: C.sub, fontSize: 12, textAlign: "center" }}>UPI · Card · Wallet accepted</div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TicketScreen({ go }: { go: (s: Screen) => void; line?: string; fare?: number }) {
  const [stage, setStage] = useState<Stage>("search");
  const [from, setFrom] = useState("Current location");
  const [to, setTo] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [busQuery, setBusQuery] = useState("");

  const code = selectedRoute
    ? `TKT-${selectedRoute.number.replace(/\W/g, "").slice(0, 4).toUpperCase()}${selectedRoute.fare}-7F3A`
    : "TKT-SAARTHI-7F3A";

  // Filter routes: match destination against all stop names
  const filteredRoutes = ALL_ROUTES.filter(r => {
    if (!busQuery.trim()) return true;
    const q = busQuery.toLowerCase();
    return r.stops.some(s => s.toLowerCase().includes(q))
      || r.to.toLowerCase().includes(q)
      || r.from.toLowerCase().includes(q)
      || r.via.toLowerCase().includes(q)
      || r.number.toLowerCase().includes(q);
  });

  const handleSearch = () => {
    setBusQuery(to);
    setStage("buses");
  };

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
    if (stage === "buses") setBusQuery(from);
  };

  const handleToChange = (v: string) => {
    setTo(v);
    if (stage === "buses") setBusQuery(v);
  };

  const closeToHome = () => go("home");

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: C.bg, color: "#fff", position: "relative", overflow: "hidden",
    }}>
      {stage === "paid" && <Confetti />}

      {stage === "search" && (
        <SearchStage
          from={from} to={to}
          onFromChange={setFrom}
          onToChange={handleToChange}
          onSwap={handleSwap}
          onSearch={handleSearch}
          onClose={closeToHome}
        />
      )}

      {stage === "buses" && (
        <BusListStage
          from={from} to={to}
          routes={filteredRoutes}
          onFromChange={setFrom}
          onToChange={handleToChange}
          onSwap={handleSwap}
          onSelect={r => { setSelectedRoute(r); setStage("confirm"); }}
          onBack={() => setStage("search")}
          onClose={closeToHome}
        />
      )}

      {stage === "confirm" && selectedRoute && (
        <ConfirmStage
          route={selectedRoute} from={from} to={to || selectedRoute.to}
          onProceed={() => setStage("checkout")}
          onBack={() => setStage("buses")}
          onClose={closeToHome}
        />
      )}

      {stage === "checkout" && selectedRoute && (
        <>
          <TicketHeader title="Payment" onBack={() => setStage("confirm")} onClose={closeToHome} />
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <GlassCheckout
              amount={selectedRoute.fare}
              onPay={() => setStage("paid")}
              onBack={() => setStage("confirm")}
            />
          </div>
        </>
      )}

      {stage === "paid" && selectedRoute && (
        <>
          <TicketHeader title="Your Ticket" onClose={() => { setStage("search"); go("home"); }} />
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <IssuedTicket
              line={`${selectedRoute.number} · ${selectedRoute.via.replace("via ", "")}`}
              fare={selectedRoute.fare}
              code={code}
            />
          </div>
        </>
      )}
    </div>
  );
}

const tLbl: React.CSSProperties = {
  fontSize: 11, color: "#9aa0a6", letterSpacing: 1, textTransform: "uppercase",
};
