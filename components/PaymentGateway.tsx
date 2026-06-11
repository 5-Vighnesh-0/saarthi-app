"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ChevronRight, ChevronDown, Check, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  routeLabel: string;
  from: string;
  to: string;
  fare: number;
}

type Stage = "summary" | "method" | "upi-id" | "card" | "processing" | "success" | "failed";

// ── Deterministic QR renderer ─────────────────────────────────────────────────
function QRCode({ seed, size = 180 }: { seed: string; size?: number }) {
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
        rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#111" />);
  const Eye = ({ cx, cy }: { cx: number; cy: number }) => (
    <g transform={`translate(${cx * cell},${cy * cell})`}>
      <rect width={cell * 7} height={cell * 7} fill="#111" />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} fill="#111" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10, display: "block" }}>
      <rect width={size} height={size} fill="#fff" />
      {rects}
      <Eye cx={0} cy={0} /><Eye cx={N - 7} cy={0} /><Eye cx={0} cy={N - 7} />
    </svg>
  );
}

// ── Confetti burst ────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#f97316", "#4ade80", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
      <style>{`@keyframes confFall{0%{transform:translateY(-10%) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {Array.from({ length: 70 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: i % 3 === 0 ? 8 : 6, height: i % 2 === 0 ? 14 : 8,
          borderRadius: i % 4 === 0 ? "50%" : 2,
          left: `${(i * 137.5) % 100}%`, top: `${-5 - (i % 8) * 2}%`,
          background: colors[i % colors.length],
          transform: `rotate(${(i * 47) % 360}deg)`,
          animation: `confFall ${2 + (i % 5) * 0.5}s ${(i % 8) * 0.15}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
        }} />
      ))}
    </div>
  );
}

const UPI_APPS = [
  { id: "phonepe", name: "PhonePe",   color: "#5f259f", bg: "#f0eaff", emoji: "💜" },
  { id: "gpay",    name: "Google Pay", color: "#1a73e8", bg: "#e8f0fe", emoji: "🔵" },
  { id: "paytm",   name: "Paytm",     color: "#00BAF2", bg: "#e0f7fe", emoji: "💙" },
  { id: "bhim",    name: "BHIM",      color: "#ff5722", bg: "#fbe9e7", emoji: "🟠" },
];

export default function PaymentGateway({ isOpen, onClose, routeLabel, from, to, fare }: Props) {
  const [stage, setStage] = useState<Stage>("summary");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processingDot, setProcessingDot] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"upi-app" | "upi-id" | "card" | null>(null);

  const serviceFee = Math.round(fare * 0.02);
  const gst = Math.round(fare * 0.05);
  const total = fare + serviceFee + gst;
  const ticketCode = `TKT-${routeLabel.replace(/\W/g, "").toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const issueTime = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // Processing animation
  useEffect(() => {
    if (stage !== "processing") return;
    const t = setInterval(() => setProcessingDot(d => (d + 1) % 4), 400);
    const done = setTimeout(() => {
      // 90% success rate simulation
      setStage(Math.random() > 0.1 ? "success" : "failed");
    }, 3200);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [stage]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) { setTimeout(() => setStage("summary"), 400); }
  }, [isOpen]);

  const pay = () => setStage("processing");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="payment-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          fontFamily: "var(--font-sora, system-ui, sans-serif)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          style={{
            width: "100%", maxWidth: 480,
            background: "#fff", borderRadius: "24px 24px 0 0",
            maxHeight: "92vh", overflowY: "auto",
            position: "relative",
          }}
        >
          {stage === "success" && <Confetti />}

          {/* Handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
          </div>

          {/* ── SUMMARY STAGE ─────────────────────────────────── */}
          {stage === "summary" && (
            <div style={{ padding: "16px 20px 32px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Order Summary</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>BMTC Bus Ticket · {routeLabel}</div>
                </div>
                <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 36, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color="#374151" />
                </button>
              </div>

              {/* Journey card */}
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "#f97316", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{routeLabel}</div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>BMTC Bus</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{from || "Your location"}</span>
                  </div>
                  <div style={{ width: 2, height: 14, background: "#d1d5db", marginLeft: 3 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{to}</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: "8px 0 0", borderTop: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>
                  Valid for 1 journey · 120 minutes from issue
                </div>
              </div>

              {/* Fare breakdown */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1, marginBottom: 12 }}>FARE BREAKDOWN</div>
                {[
                  { label: "Base fare",    value: `₹${fare}` },
                  { label: "Service fee",  value: `₹${serviceFee}` },
                  { label: "GST (5%)",     value: `₹${gst}` },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: "#374151" }}>{row.label}</span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #d1d5db", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#f97316" }}>₹{total}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setStage("method")}
                style={{
                  width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)",
                  border: "none", borderRadius: 14, padding: "16px",
                  color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
                }}
              >
                <Lock size={16} /> Proceed to Pay ₹{total}
              </motion.button>
              <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", margin: "10px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Lock size={11} /> 256-bit SSL encrypted · Powered by BBPS
              </p>
            </div>
          )}

          {/* ── PAYMENT METHOD STAGE ───────────────────────────── */}
          {stage === "method" && (
            <div style={{ padding: "16px 20px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setStage("summary")} style={{ width: 36, height: 36, borderRadius: 36, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronDown size={18} color="#374151" style={{ transform: "rotate(90deg)" }} />
                </button>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Choose Payment</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Total: ₹{total}</div>
                </div>
                <button onClick={onClose} style={{ marginLeft: "auto", width: 36, height: 36, borderRadius: 36, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color="#374151" />
                </button>
              </div>

              {/* UPI Apps */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1, marginBottom: 10 }}>UPI APPS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {UPI_APPS.map(app => (
                    <motion.button
                      key={app.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => { setSelectedUpiApp(app.id); setPaymentMethod("upi-app"); pay(); }}
                      style={{
                        background: selectedUpiApp === app.id ? app.bg : "#f9fafb",
                        border: `2px solid ${selectedUpiApp === app.id ? app.color : "#e5e7eb"}`,
                        borderRadius: 14, padding: "12px 4px 8px",
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{app.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{app.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* UPI ID */}
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, marginBottom: 8 }}>
                <button
                  onClick={() => setStage("upi-id")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>UPI ID</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>yourname@upi · any bank</div>
                  </div>
                  <ChevronRight size={16} color="#9ca3af" />
                </button>
              </div>

              {/* Card */}
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, marginBottom: 8 }}>
                <button
                  onClick={() => setStage("card")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💳</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Debit / Credit Card</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Visa · Mastercard · RuPay</div>
                  </div>
                  <ChevronRight size={16} color="#9ca3af" />
                </button>
              </div>

              {/* Net Banking */}
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14 }}>
                <button
                  onClick={pay}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Net Banking</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>SBI · HDFC · ICICI · Axis</div>
                  </div>
                  <ChevronRight size={16} color="#9ca3af" />
                </button>
              </div>
            </div>
          )}

          {/* ── UPI ID STAGE ───────────────────────────────────── */}
          {stage === "upi-id" && (
            <div style={{ padding: "16px 20px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setStage("method")} style={{ width: 36, height: 36, borderRadius: 36, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronDown size={18} color="#374151" style={{ transform: "rotate(90deg)" }} />
                </button>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Pay via UPI ID</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>₹{total}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1, marginBottom: 8 }}>ENTER UPI ID</div>
                <div style={{ position: "relative" }}>
                  <input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@okaxis"
                    autoFocus
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "14px 16px", borderRadius: 12,
                      border: `2px solid ${upiId ? "#f97316" : "#e5e7eb"}`,
                      background: "#fff", color: "#111", fontSize: 15,
                      fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                  Format: name@bank (e.g., rahul@okhdfcbank)
                </div>
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <div style={{ fontSize: 12, color: "#166534" }}>
                  Your bank will send a payment request. Approve it from your UPI app. Do not share your PIN with anyone.
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={pay}
                disabled={!upiId.includes("@")}
                style={{
                  width: "100%",
                  background: upiId.includes("@") ? "linear-gradient(135deg, #f97316, #ea580c)" : "#e5e7eb",
                  border: "none", borderRadius: 14, padding: "16px",
                  color: upiId.includes("@") ? "#fff" : "#9ca3af",
                  fontWeight: 800, fontSize: 16, cursor: upiId.includes("@") ? "pointer" : "default",
                  fontFamily: "inherit", transition: "all 0.2s",
                  boxShadow: upiId.includes("@") ? "0 4px 20px rgba(249,115,22,0.4)" : "none",
                }}
              >
                Verify & Pay ₹{total}
              </motion.button>
            </div>
          )}

          {/* ── CARD STAGE ─────────────────────────────────────── */}
          {stage === "card" && (
            <div style={{ padding: "16px 20px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setStage("method")} style={{ width: 36, height: 36, borderRadius: 36, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronDown size={18} color="#374151" style={{ transform: "rotate(90deg)" }} />
                </button>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Card Details</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>₹{total}</div>
                </div>
              </div>

              {/* Card preview */}
              <div style={{
                background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
                borderRadius: 16, padding: "20px", marginBottom: 20,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                position: "relative", overflow: "hidden", minHeight: 100,
              }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ position: "absolute", right: 20, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>💳</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>DEBIT / CREDIT</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 3, marginBottom: 12, fontFamily: "monospace" }}>
                  {cardNumber ? cardNumber.padEnd(16, "·").replace(/(.{4})/g, "$1 ").trim() : "···· ···· ···· ····"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>CARDHOLDER</div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{cardName || "YOUR NAME"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>EXPIRES</div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{cardExpiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>

              {[
                { label: "Card Number", value: cardNumber, setter: (v: string) => setCardNumber(v.replace(/\D/g, "").slice(0, 16)), placeholder: "0000 0000 0000 0000", format: (v: string) => v.replace(/(.{4})/g, "$1 ").trim() },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>{f.label}</div>
                  <input
                    value={f.format(f.value)}
                    onChange={e => f.setter(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "2px solid #e5e7eb", background: "#f9fafb", fontSize: 14, fontFamily: "monospace", outline: "none" }}
                  />
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Expiry</div>
                  <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5}
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 10px", borderRadius: 12, border: "2px solid #e5e7eb", background: "#f9fafb", fontSize: 14, fontFamily: "monospace", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>CVV</div>
                  <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="•••" type="password" maxLength={3}
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 10px", borderRadius: 12, border: "2px solid #e5e7eb", background: "#f9fafb", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Name</div>
                  <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Full name"
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 10px", borderRadius: 12, border: "2px solid #e5e7eb", background: "#f9fafb", fontSize: 14, outline: "none" }} />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={pay}
                style={{ width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
              >
                <Lock size={16} /> Pay ₹{total} Securely
              </motion.button>
            </div>
          )}

          {/* ── PROCESSING STAGE ───────────────────────────────── */}
          {stage === "processing" && (
            <div style={{ padding: "40px 20px 60px", textAlign: "center" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ width: 72, height: 72, borderRadius: "50%", border: "5px solid #fde8d8", borderTopColor: "#f97316", margin: "0 auto 24px" }}
              />
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 8 }}>Processing Payment</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Please wait{".".repeat(processingDot + 1)}
              </div>
              <div style={{ marginTop: 20, background: "#f9fafb", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                ₹{total} · {routeLabel} Bus Ticket
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: "#9ca3af" }}>
                Do not press back or close the app
              </div>
            </div>
          )}

          {/* ── SUCCESS STAGE ──────────────────────────────────── */}
          {stage === "success" && (
            <div style={{ padding: "20px 20px 40px", textAlign: "center", position: "relative" }}>
              {/* Success header */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
              >
                <Check size={40} color="#fff" strokeWidth={3} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 4 }}>Payment Successful!</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Your ticket has been issued</div>
              </motion.div>

              {/* Ticket */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.1)", overflow: "hidden", marginBottom: 20,
                }}
              >
                {/* Ticket top */}
                <div style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", padding: "16px 20px", textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1 }}>BMTC BUS TICKET</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 2 }}>{routeLabel}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{from || "Your location"} → {to}</div>
                </div>

                {/* Dashed separator */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f3f4f6", marginLeft: -28, flexShrink: 0 }} />
                  <div style={{ flex: 1, borderTop: "2px dashed #e5e7eb", margin: "0 4px" }} />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f3f4f6", marginRight: -28, flexShrink: 0 }} />
                </div>

                {/* Ticket bottom */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>TICKET ID</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{ticketCode}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>AMOUNT PAID</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#22c55e" }}>₹{total}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>ISSUED ON</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{issueTime}</div>
                  </div>
                  {/* QR */}
                  <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                    <QRCode seed={ticketCode} size={160} />
                  </div>
                  <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 8, letterSpacing: 2 }}>{ticketCode}</div>
                  <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 4 }}>Scan at the gate · Valid for 120 min</div>
                </div>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ width: "100%", background: "#f97316", border: "none", borderRadius: 14, padding: "15px", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
              >
                Done
              </motion.button>
            </div>
          )}

          {/* ── FAILED STAGE ───────────────────────────────────── */}
          {stage === "failed" && (
            <div style={{ padding: "40px 20px 40px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertCircle size={36} color="#ef4444" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 8 }}>Payment Failed</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Your payment could not be processed. No money was deducted.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStage("method")}
                  style={{ flex: 1, background: "#f97316", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Try Again
                </button>
                <button onClick={onClose}
                  style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 12, padding: "14px", color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
