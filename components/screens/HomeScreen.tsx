"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, ChevronRight, Navigation, Zap } from "lucide-react";
import type { Screen } from "@/components/AppShell";

const SPOTS = [
  { name: "MG Road Metro",       sub: "Purple Line · 2 min walk",  icon: "🚇", mins: 8  },
  { name: "Indiranagar",         sub: "Bus 500D · 3 stops away",   icon: "🛍", mins: 12 },
  { name: "Koramangala",         sub: "Bus 500D · 6 stops away",   icon: "🍽", mins: 20 },
  { name: "Kempegowda Bus Stn",  sub: "Majestic · Hub",            icon: "🚌", mins: 35 },
  { name: "Electronic City",     sub: "Bus 335E · Tech park",      icon: "💻", mins: 48 },
];

const QUICK: { label: string; icon: string; to: Screen; color: string }[] = [
  { label: "Bus",    icon: "🚌", to: "live",   color: "#ec1c3c" },
  { label: "Metro",  icon: "🚇", to: "map",    color: "#7c3aed" },
  { label: "Auto",   icon: "🛺", to: "auto",   color: "#f59e0b" },
  { label: "Ticket", icon: "🎫", to: "ticket", color: "#f97316" },
];

interface Props {
  go: (s: Screen) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen({ go }: Props) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      background: "#07090c",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Hero gradient header ── */}
      <div style={{
        position: "relative",
        flexShrink: 0,
        height: 240,
        background: "linear-gradient(160deg, #1a0e05 0%, #2d1507 40%, #1a0c04 70%, #07090c 100%)",
        overflow: "hidden",
      }}>
        {/* Animated orb 1 */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: -40, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, #f9731644, transparent 70%)",
          }}
        />
        {/* Animated orb 2 */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          style={{
            position: "absolute", bottom: 20, left: -30,
            width: 160, height: 160, borderRadius: "50%",
            background: "radial-gradient(circle, #f9731633, transparent 70%)",
          }}
        />

        {/* Floating bus dots */}
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            animate={{ x: [0, 40 + i*20, 0], y: [0, -10+i*5, 0] }}
            transition={{ duration: 8+i*2, repeat: Infinity, ease: "easeInOut", delay: i*1.2 }}
            style={{
              position: "absolute",
              top: 60 + i * 40,
              left: 30 + i * 80,
              fontSize: 22,
              opacity: 0.25,
            }}
          >
            🚌
          </motion.div>
        ))}

        {/* Greeting + time */}
        <div style={{ position: "absolute", top: 44, left: 20, right: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
              Bengaluru
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              {greeting()} 👋
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4, fontWeight: 500 }}>
              Where are you heading today?
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "6px 12px",
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            fontWeight: 700,
            marginTop: 4,
          }}>
            {time}
          </div>
        </div>

        {/* Live indicator */}
        <div style={{
          position: "absolute", bottom: 20, left: 20,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            5 buses tracked live near you
          </span>
        </div>
      </div>

      {/* ── Search button ── */}
      <div style={{ padding: "0 16px", marginTop: -20, position: "relative", zIndex: 10 }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => go("search")}
          style={{
            width: "100%",
            background: "#12161c",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "15px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Search size={17} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>
              Where to in Bengaluru?
            </div>
          </div>
          <Navigation size={16} color="#f97316" />
        </motion.button>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
          Quick access
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {QUICK.map((q, i) => (
            <motion.button
              key={q.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => go(q.to)}
              style={{
                flex: 1,
                background: "#12161c",
                border: `1px solid ${q.color}28`,
                borderRadius: 14,
                padding: "12px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${q.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                {q.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
                {q.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Popular spots ── */}
      <div style={{ padding: "20px 16px 24px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <MapPin size={14} color="#f97316" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 1.5 }}>
              Popular nearby
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="#f97316" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>live ETAs</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SPOTS.map((spot, i) => (
            <motion.button
              key={spot.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 220, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => go("results")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#12161c",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {spot.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {spot.name}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                  {spot.sub}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: 8,
                  padding: "3px 9px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f97316",
                }}>
                  {spot.mins} min
                </div>
                <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
