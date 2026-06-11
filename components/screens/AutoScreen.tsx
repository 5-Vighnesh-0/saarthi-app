"use client";
import { useState, useEffect, useRef } from "react";
import {
  X, Navigation, MapPin, IndianRupee, Plus, Minus,
  Star, Check, Phone, MessageSquare, Shield,
} from "lucide-react";
import { C } from "@/lib/theme";
import { AUTO_DRIVERS, PICKUP } from "@/lib/data/bengaluru";
import MetalButton from "@/components/ui/MetalButton";
import TransitMap from "@/components/map/TransitMap";
import type { AutoMarkerData } from "@/components/map/TransitMap";
import type { Screen } from "@/components/AppShell";
import type { AutoDriver } from "@/lib/data/bengaluru";

// Linear interpolation helper
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

type Stage = "setup" | "searching" | "offers" | "arriving" | "riding" | "payment";

// Generate a deterministic 4-digit OTP from driver plate + fare
function makeOTP(plate: string, fare: number): string {
  let h = fare;
  for (let i = 0; i < plate.length; i++) h = (h * 31 + plate.charCodeAt(i)) & 0xffff;
  return String((h % 9000) + 1000); // always 4 digits, 1000–9999
}

const grabHandle: React.CSSProperties = {
  width: 42, height: 5, borderRadius: 5,
  background: "rgba(255,255,255,0.25)", margin: "0 auto 12px",
};

function Field({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 12px",
    }}>
      {icon}
      <span style={{ color: "#fff", fontWeight: 600 }}>{text}</span>
    </div>
  );
}

/* ── OTP card shown after driver is confirmed ─────────────────────── */
function OTPCard({ otp, accent }: { otp: string; accent: string }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.35)", borderRadius: 16, padding: "18px 20px",
      border: `1px solid ${accent}55`, marginBottom: 14,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
        <Shield size={14} color={C.orange} />
        Share this code with your driver to start the ride
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {otp.split("").map((d, i) => (
          <div key={i} style={{
            width: 52, height: 64, borderRadius: 14,
            background: "linear-gradient(180deg,#2e2008,#1d1405)",
            border: `2px solid ${accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 900, color: "#fff",
            boxShadow: `0 4px 20px ${accent}44`,
          }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
        One-time pickup code · expires when ride starts
      </div>
    </div>
  );
}

/* ── Driver info card ─────────────────────────────────────────────── */
function DriverCard({ driver, eta, accent, showActions = false }: {
  driver: AutoDriver; eta: number; accent: string; showActions?: boolean;
}) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 52,
          background: `linear-gradient(135deg,${accent},#1d1405)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          border: `2px solid ${accent}88`, flexShrink: 0,
        }}>
          🛺
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{driver.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <Star size={13} color={C.orange} fill={C.orange} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>{driver.rating}</span>
            <span style={{ color: C.sub, fontSize: 12 }}>·</span>
            <span style={{ color: C.sub, fontWeight: 600, fontSize: 12, fontFamily: "monospace" }}>
              {driver.plate}
            </span>
          </div>
        </div>
        {/* ETA pill */}
        <div style={{
          background: eta <= 1 ? C.green : "rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "8px 14px", textAlign: "center",
          transition: "background 0.5s ease",
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
            {eta <= 0 ? "Here!" : eta}
          </div>
          {eta > 0 && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>min away</div>}
        </div>
      </div>

      {showActions && (
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button style={{
            flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, color: "#fff", fontWeight: 700,
            fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Phone size={16} /> Call
          </button>
          <button style={{
            flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, color: "#fff", fontWeight: 700,
            fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}>
            <MessageSquare size={16} /> Message
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Payment screen after ride ────────────────────────────────────── */
function PaymentStage({ driver, fare, tip, onDone }: {
  driver: AutoDriver; fare: number; tip: number; onDone: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "upi">("upi");
  const [paid, setPaid] = useState(false);
  const total = fare + tip;

  if (paid) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 64, background: C.green,
          margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={32} color="#fff" strokeWidth={3} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, marginTop: 14 }}>Ride complete!</div>
        <div style={{ color: C.sub, marginTop: 6 }}>₹{total} paid to {driver.name}</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Thanks for using Saarthi 🙏</div>
        <div style={{ marginTop: 20 }}>
          <MetalButton variant="green" full onClick={onDone}>Back to home</MetalButton>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fare breakdown */}
      <div style={{
        background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "16px",
        marginBottom: 14,
      }}>
        <div style={{ color: C.sub, fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>FARE SUMMARY</div>
        {[
          { l: "Meter fare", v: `₹${fare}` },
          { l: "Your tip", v: tip > 0 ? `₹${tip}` : "—" },
        ].map(({ l, v }) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
            <span style={{ color: C.sub }}>{l}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        <div style={{
          borderTop: "1px dashed rgba(255,255,255,0.12)", marginTop: 8, paddingTop: 10,
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 900, fontSize: 20, display: "flex", alignItems: "center" }}>
            <IndianRupee size={16} />{total}
          </span>
        </div>
      </div>

      {/* Payment method toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {(["upi", "cash"] as const).map((m) => (
          <button key={m} onClick={() => setMethod(m)} style={{
            borderRadius: 12, padding: "12px", fontFamily: "inherit", fontWeight: 700,
            fontSize: 15, cursor: "pointer",
            background: method === m ? "rgba(245,166,35,0.2)" : "rgba(0,0,0,0.3)",
            border: method === m ? `1.5px solid ${C.orange}` : "1.5px solid rgba(255,255,255,0.1)",
            color: method === m ? C.orange : "#fff",
          }}>
            {m === "upi" ? "📲 UPI" : "💵 Cash"}
          </button>
        ))}
      </div>

      {method === "upi" && (
        <div style={{
          background: "rgba(0,0,0,0.28)", borderRadius: 12, padding: "12px 14px",
          marginBottom: 14, border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>UPI ID</div>
          <input
            placeholder="yourname@okhdfcbank"
            defaultValue="nighteye@okhdfcbank"
            style={{
              width: "100%", boxSizing: "border-box", background: "transparent",
              border: "none", color: "#fff", fontSize: 15, fontFamily: "inherit",
              fontWeight: 600, outline: "none",
            }}
          />
        </div>
      )}
      {method === "cash" && (
        <div style={{
          background: "rgba(0,0,0,0.28)", borderRadius: 12, padding: "14px 16px",
          marginBottom: 14, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>💵</span>
          <div>
            <div style={{ fontWeight: 700 }}>Pay ₹{total} in cash</div>
            <div style={{ color: C.sub, fontSize: 12 }}>Hand over to {driver.name} directly</div>
          </div>
        </div>
      )}

      <MetalButton variant="gold" full onClick={() => setPaid(true)}>
        {method === "upi" ? `Pay ₹${total} via UPI` : `Confirm cash payment · ₹${total}`}
      </MetalButton>
    </>
  );
}

/* ── Main screen ──────────────────────────────────────────────────── */
export default function AutoScreen({ go }: { go: (s: Screen) => void }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [tip, setTip] = useState(0);
  const [picked, setPicked] = useState<AutoDriver | null>(null);
  const [eta, setEta] = useState(0);
  const [totalEta, setTotalEta] = useState(0); // seconds at time of picking
  const etaTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-search after 1.8s
  useEffect(() => {
    if (stage !== "searching") return;
    const id = setTimeout(() => setStage("offers"), 1800);
    return () => clearTimeout(id);
  }, [stage]);

  // Count ETA down to 0, then switch to "riding"
  useEffect(() => {
    if (stage !== "arriving") return;
    etaTimer.current = setInterval(() => {
      setEta((e) => {
        if (e <= 1) {
          clearInterval(etaTimer.current!);
          setStage("riding");
          return 0;
        }
        return e - 1;
      });
    }, 1000);
    return () => clearInterval(etaTimer.current!);
  }, [stage]);

  const meter = 65;
  const otp = picked ? makeOTP(picked.plate, meter + tip) : "";
  const accent = C.orange;

  const handlePickDriver = (d: AutoDriver) => {
    const secs = d.eta * 60;
    setPicked(d);
    setEta(secs);
    setTotalEta(secs);
    setStage("arriving");
  };

  // Interpolate driver position: 0 = at start, 1 = at pickup (PICKUP = MG Road)
  const autoMarker: AutoMarkerData | null = picked
    ? {
        lat: lerp(picked.startLat, PICKUP.lat, totalEta > 0 ? 1 - eta / totalEta : 1),
        lng: lerp(picked.startLng, PICKUP.lng, totalEta > 0 ? 1 - eta / totalEta : 1),
        driverName: picked.name,
        arrived: stage === "riding",
      }
    : null;

  return (
    <div style={{ height: "100%", position: "relative", background: "#160f04" }}>
      <TransitMap
        accent={accent}
        center={autoMarker
          ? { lat: (autoMarker.lat + PICKUP.lat) / 2, lng: (autoMarker.lng + PICKUP.lng) / 2 }
          : { lat: PICKUP.lat, lng: PICKUP.lng }
        }
        zoom={autoMarker ? 14 : 13}
        autoMarker={autoMarker}
        pickupMarker={stage === "arriving" || stage === "riding" ? PICKUP : null}
      />

      {/* Close button */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 10 }}>
        <button onClick={() => go("results")} style={iconBtn}>
          <X size={20} color="#fff" />
        </button>
      </div>

      {/* Top label */}
      {(stage === "setup" || stage === "searching" || stage === "offers") && (
        <div style={{ position: "absolute", top: 14, left: 16, zIndex: 10 }}>
          <div style={{
            background: "linear-gradient(180deg,#ffe39a,#e0950e)", color: "#3a2c00",
            fontWeight: 800, padding: "6px 14px", borderRadius: 20,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)", width: "fit-content",
          }}>
            🛺 Book an auto
          </div>
          <div style={{
            color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 8,
            maxWidth: 240, textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}>
            Direct to driver · 0% commission · pay after ride
          </div>
        </div>
      )}

      {/* Status badge when driver is en route */}
      {(stage === "arriving" || stage === "riding") && picked && (
        <div style={{ position: "absolute", top: 14, left: 16, zIndex: 10 }}>
          <div style={{
            background: stage === "riding" ? C.green : "rgba(255,255,255,0.95)",
            color: stage === "riding" ? "#fff" : "#1a1a1a",
            fontWeight: 800, padding: "6px 14px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
          }}>
            {stage === "riding" ? (
              <>
                <span style={{
                  width: 8, height: 8, borderRadius: 8, background: "#fff",
                  boxShadow: "0 0 0 3px rgba(255,255,255,0.3)",
                }} />
                Ride in progress
              </>
            ) : (
              <>🛺 Driver arriving · {Math.ceil(eta / 60)} min</>
            )}
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10,
        background: "linear-gradient(180deg,#2e2008,#1d1405)",
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: "10px 16px 20px",
        boxShadow: "0 -16px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        maxHeight: "65%", overflowY: "auto",
      }}>
        <div style={grabHandle} />

        {/* ── SETUP ─────────────────────────────────────────── */}
        {stage === "setup" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <Field icon={<Navigation size={16} color={accent} />} text="MG Road (current)" />
              <Field icon={<MapPin size={16} color={accent} />} text="Indiranagar Metro" />
            </div>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(0,0,0,0.3)", padding: "12px 14px", borderRadius: 12, marginBottom: 12,
            }}>
              <div>
                <div style={{ color: C.sub, fontSize: 12 }}>Govt meter fare (est.)</div>
                <div style={{ fontSize: 22, fontWeight: 800, display: "flex", alignItems: "center" }}>
                  <IndianRupee size={18} />{meter + tip}
                </div>
                <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>Pay after ride · cash or UPI</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Tip</span>
                <button onClick={() => setTip((t) => Math.max(0, t - 5))} style={stepBtn}>
                  <Minus size={16} color="#fff" />
                </button>
                <span style={{ fontWeight: 800, width: 36, textAlign: "center" }}>₹{tip}</span>
                <button onClick={() => setTip((t) => t + 5)} style={stepBtn}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>
            </div>

            <MetalButton variant="gold" full onClick={() => setStage("searching")}>
              Find autos nearby · ₹{meter + tip}
            </MetalButton>
          </>
        )}

        {/* ── SEARCHING ─────────────────────────────────────── */}
        {stage === "searching" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40 }}>🛺</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>Finding drivers…</div>
            <div style={{ color: C.sub, fontSize: 13, marginTop: 6 }}>
              Sending your request to nearby autos
            </div>
            <div style={{
              display: "flex", gap: 6, justifyContent: "center", marginTop: 16,
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: 8, background: accent,
                  animation: `pulse 1.2s ${i * 0.3}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── OFFERS ────────────────────────────────────────── */}
        {stage === "offers" && (
          <>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
              {AUTO_DRIVERS.length} drivers responded
            </div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>
              Pick one — you pay ₹{meter + tip} after the ride
            </div>
            {AUTO_DRIVERS.map((d, i) => (
              <div key={i} onClick={() => handlePickDriver(d)} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(0,0,0,0.3)", padding: "14px",
                borderRadius: 14, marginBottom: 10, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "border 0.2s",
              }}>
                <span style={{ fontSize: 28 }}>🛺</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12, color: C.sub }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={12} color={C.orange} fill={C.orange} />{d.rating}
                    </span>
                    <span>{d.eta} min away</span>
                    <span style={{ fontFamily: "monospace" }}>{d.plate}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 18, display: "flex", alignItems: "center" }}>
                    <IndianRupee size={15} />{d.fare + tip}
                  </div>
                  <div style={{ color: C.sub, fontSize: 11 }}>pay after</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── ARRIVING ────────────────────────────────────────── */}
        {stage === "arriving" && picked && (
          <>
            <DriverCard driver={picked} eta={Math.ceil(eta / 60)} accent={accent} showActions />
            <OTPCard otp={otp} accent={accent} />
            <div style={{ color: C.sub, fontSize: 12, textAlign: "center" }}>
              Your driver will ask for this code when they arrive
            </div>
          </>
        )}

        {/* ── RIDING ────────────────────────────────────────── */}
        {stage === "riding" && picked && (
          <>
            <div style={{
              background: `${C.green}22`, border: `1px solid ${C.green}55`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 40, background: C.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={22} color="#fff" strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>OTP verified — ride started!</div>
                <div style={{ color: C.sub, fontSize: 13 }}>You're on your way to Indiranagar</div>
              </div>
            </div>
            <DriverCard driver={picked} eta={0} accent={accent} showActions />
            <MetalButton variant="gold" full onClick={() => setStage("payment")}>
              Complete ride · Pay ₹{meter + tip}
            </MetalButton>
          </>
        )}

        {/* ── PAYMENT ─────────────────────────────────────────── */}
        {stage === "payment" && picked && (
          <PaymentStage
            driver={picked}
            fare={meter}
            tip={tip}
            onDone={() => go("search")}
          />
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 42,
  background: C.orange, border: "none",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

const stepBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 30,
  background: "rgba(255,255,255,0.12)", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
