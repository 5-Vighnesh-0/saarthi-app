"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface Props {
  onBack: () => void;
  label?: string;
}

function Particles({ x, y }: { x: number; y: number }) {
  return (
    <AnimatePresence>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "fixed",
            left: x,
            top: y,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#f97316",
            pointerEvents: "none",
            zIndex: 9999,
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (i % 2 ? 1 : -1) * (Math.random() * 40 + 15)],
            y: [0, -(Math.random() * 40 + 15)],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.55, delay: i * 0.06, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>
  );
}

export default function BackButton({ onBack, label }: Props) {
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setTimeout(() => setBurst(null), 700);
    }
    onBack();
  };

  return (
    <>
      {burst && <Particles x={burst.x} y={burst.y} />}

      <motion.button
        ref={btnRef}
        onClick={handleClick}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(10,13,18,0.82)",
          border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 24,
          padding: label ? "10px 18px 10px 12px" : "10px 14px",
          cursor: "pointer",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.1) inset",
          color: "#fff",
        }}
      >
        <motion.span
          whileTap={{ x: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <ChevronLeft size={18} color="#f97316" strokeWidth={2.5} />
        </motion.span>
        {label && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            {label}
          </span>
        )}
      </motion.button>
    </>
  );
}
