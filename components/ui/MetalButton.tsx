"use client";
import { useState, CSSProperties } from "react";
import { METAL, MetalVariant } from "@/lib/theme";

interface Props {
  children: React.ReactNode;
  variant?: MetalVariant;
  full?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  style?: CSSProperties;
}

export default function MetalButton({
  children,
  variant = "green",
  full,
  size,
  onClick,
  style,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const v = METAL[variant];
  const small = size === "sm";

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: "relative",
        display: full ? "block" : "inline-flex",
        width: full ? "100%" : "auto",
        borderRadius: 14,
        padding: 1.4,
        background: v.outer,
        transform: pressed ? "translateY(2px) scale(0.99)" : "none",
        boxShadow: pressed
          ? "0 1px 3px rgba(0,0,0,0.4)"
          : "0 8px 20px rgba(0,0,0,0.35)",
        transition: "all 0.18s cubic-bezier(0.1,0.4,0.2,1)",
        cursor: "pointer",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 1.4,
          borderRadius: 12.6,
          background: v.inner,
          opacity: 0.9,
        }}
      />
      <button
        onClick={onClick}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          border: "none",
          cursor: "pointer",
          borderRadius: 12,
          background: v.face,
          color: v.fg,
          fontWeight: 800,
          fontSize: small ? 14 : 16,
          padding: small ? "9px 20px" : "14px 18px",
          textShadow: v.ts,
          transform: pressed ? "scale(0.985)" : "none",
          transition: "all 0.18s",
          overflow: "hidden",
          fontStyle: small ? "italic" : "normal",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
            pointerEvents: "none",
            background: "linear-gradient(180deg,rgba(255,255,255,0.4),transparent)",
            borderRadius: "12px 12px 0 0",
          }}
        />
        <span style={{ position: "relative" }}>{children}</span>
      </button>
    </div>
  );
}
