"use client";
import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  color?: string;       // accent color (hex)
  size?: "sm" | "md" | "lg";
  full?: boolean;
  active?: boolean;
  style?: CSSProperties;
  icon?: ReactNode;
}

const SIZES = {
  sm:  { padding: "8px 14px",  fontSize: 11, iconSize: 14, gap: 6,  borderRadius: 20 },
  md:  { padding: "11px 20px", fontSize: 13, iconSize: 17, gap: 8,  borderRadius: 24 },
  lg:  { padding: "14px 26px", fontSize: 15, iconSize: 20, gap: 10, borderRadius: 28 },
};

export default function LiquidGlassButton({
  children, onClick, color = "#f97316", size = "md", full = false, active = false, style, icon,
}: Props) {
  const s = SIZES[size];
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.95, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        fontFamily: "inherit",
        width: full ? "100%" : undefined,
        borderRadius: s.borderRadius,
        cursor: "pointer",
        border: "none",
        outline: "none",
        overflow: "hidden",
        // Liquid glass base
        background: active
          ? `linear-gradient(145deg, rgba(${r},${g},${b},0.35) 0%, rgba(${r},${g},${b},0.18) 50%, rgba(${r},${g},${b},0.28) 100%)`
          : `linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.12) 100%)`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: active
          ? `0 2px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.3) inset, 0 6px 20px rgba(${r},${g},${b},0.35), 0 2px 8px rgba(0,0,0,0.3)`
          : `0 2px 0 rgba(255,255,255,0.2) inset, 0 -1px 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.2)`,
        color: active ? "#fff" : "rgba(255,255,255,0.9)",
        ...style,
      }}
    >
      {/* Glossy top reflection */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
        borderRadius: `${s.borderRadius}px ${s.borderRadius}px 60% 60%`,
        pointerEvents: "none",
      }} />

      {/* Colored border ring */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: s.borderRadius,
        border: active
          ? `1px solid rgba(${r},${g},${b},0.7)`
          : `1px solid rgba(255,255,255,0.25)`,
        pointerEvents: "none",
      }} />

      {/* Bottom edge shadow line */}
      <div style={{
        position: "absolute", bottom: 0, left: "15%", right: "15%", height: 1,
        background: "rgba(0,0,0,0.35)", borderRadius: 1,
        pointerEvents: "none",
      }} />

      {icon && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>}
      <span style={{ position: "relative", zIndex: 1, lineHeight: 1 }}>{children}</span>
    </motion.button>
  );
}
