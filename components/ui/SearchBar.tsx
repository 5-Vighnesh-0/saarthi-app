"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Transit destinations shown as autocomplete suggestions
const SUGGESTIONS = [
  "Indiranagar Metro",
  "Kempegowda Bus Station",
  "Electronic City",
  "Silk Board",
  "Koramangala",
  "MG Road Metro",
  "Whitefield",
  "Hebbal",
  "Marathahalli",
  "Yeshwanthpur",
];

// Gooey SVG filter — makes the floating particles merge smoothly
const GooeyFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
    <defs>
      <filter id="gooey-saarthi">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelectSuggestion?: (place: string) => void;
}

export const SearchBar = ({
  placeholder = "Line or destination…",
  onSearch,
  onSelectSuggestion,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Safari / CriOS don't support SVG filter on DOM elements
  const isUnsupportedBrowser = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return (ua.includes("safari") && !ua.includes("chrome")) || ua.includes("crios");
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSuggestions(
      value.trim()
        ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
        : [],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isFocused) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 800);
  };

  useEffect(() => {
    if (isFocused) inputRef.current?.focus();
  }, [isFocused]);

  /* Floating ambient particles while focused */
  const particles = Array.from({ length: isFocused ? 14 : 0 }, (_, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{
        x: [0, (Math.random() - 0.5) * 36],
        y: [0, (Math.random() - 0.5) * 36],
        scale: [0, Math.random() * 0.7 + 0.3],
        opacity: [0, 0.7, 0],
      }}
      transition={{
        duration: Math.random() * 1.5 + 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      }}
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f97316, #fb923c)",
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        filter: "blur(2px)",
        pointerEvents: "none",
      }}
    />
  ));

  /* Click ripple particles */
  const clickParticles = isClicked
    ? Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`cp-${i}`}
          initial={{ x: mousePosition.x, y: mousePosition.y, scale: 0, opacity: 1 }}
          animate={{
            x: mousePosition.x + (Math.random() - 0.5) * 140,
            y: mousePosition.y + (Math.random() - 0.5) * 140,
            scale: Math.random() * 0.8 + 0.2,
            opacity: [1, 0],
          }}
          transition={{ duration: Math.random() * 0.8 + 0.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: `rgba(${Math.floor(Math.random() * 60 + 10)}, ${Math.floor(Math.random() * 120 + 130)}, ${Math.floor(Math.random() * 80 + 80)}, 0.85)`,
            boxShadow: "0 0 8px rgba(20,205,131,0.6)",
            pointerEvents: "none",
          }}
        />
      ))
    : null;

  const searchIconVariants = {
    initial: { scale: 1 },
    animate: {
      rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : (0 as number),
      scale: isAnimating ? [1, 1.3, 1] : (1 as number),
    },
  };

  const suggestionVariants = {
    hidden: (i: number) => ({
      opacity: 0, y: -8, scale: 0.95,
      transition: { duration: 0.15, delay: i * 0.04 },
    }),
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 15, delay: i * 0.06 },
    }),
    exit: (i: number) => ({
      opacity: 0, y: -4, scale: 0.9,
      transition: { duration: 0.1, delay: i * 0.02 },
    }),
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <GooeyFilter />

      <motion.form
        onSubmit={handleSubmit}
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
        animate={{ scale: isFocused ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onMouseMove={handleMouseMove}
      >
        <motion.div
          onClick={handleClick}
          animate={{
            boxShadow: isClicked
              ? "0 0 36px rgba(249,115,22,0.55), 0 0 14px rgba(20,205,131,0.6) inset"
              : isFocused
              ? "0 12px 32px rgba(0,0,0,0.35), 0 0 0 1.5px rgba(249,115,22,0.5)"
              : "0 4px 16px rgba(0,0,0,0.25)",
          }}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderRadius: 40,
            border: isFocused ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.12)",
            position: "relative",
            overflow: "hidden",
            background: isFocused
              ? "rgba(10,20,15,0.85)"
              : "rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            cursor: "text",
            transition: "border 0.2s, background 0.2s",
          }}
        >
          {/* Animated gradient overlay */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 0.08,
                background: [
                  "linear-gradient(90deg,#f97316,#fb923c,#076b43)",
                  "linear-gradient(90deg,#076b43,#f97316,#fb923c)",
                  "linear-gradient(90deg,#fb923c,#076b43,#f97316)",
                  "linear-gradient(90deg,#f97316,#fb923c,#076b43)",
                ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", inset: 0, zIndex: 0, borderRadius: 40 }}
            />
          )}

          {/* Gooey particles */}
          <div
            style={{
              position: "absolute", inset: 0, overflow: "hidden", borderRadius: 40, zIndex: 0,
              filter: isUnsupportedBrowser ? "none" : "url(#gooey-saarthi)",
            }}
          >
            {particles}
          </div>

          {/* Click ripples */}
          {isClicked && (
            <>
              <motion.div
                style={{ position: "absolute", inset: 0, borderRadius: 40, background: "rgba(249,115,22,0.12)", zIndex: 0 }}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
              <motion.div
                style={{ position: "absolute", inset: 0, borderRadius: 40, background: "rgba(20,205,131,0.15)", zIndex: 0 }}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </>
          )}
          {clickParticles}

          {/* Search icon */}
          <motion.div
            style={{ paddingLeft: 16, paddingTop: 12, paddingBottom: 12, position: "relative", zIndex: 1, flexShrink: 0 }}
            variants={searchIconVariants}
            initial="initial"
            animate="animate"
          >
            <Search
              size={20}
              strokeWidth={isFocused ? 2.5 : 2}
              color={isAnimating ? "#fb923c" : isFocused ? "#f97316" : "rgba(255,255,255,0.7)"}
              style={{ transition: "color 0.2s" }}
            />
          </motion.div>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            style={{
              width: "100%",
              padding: "12px 8px",
              background: "transparent",
              outline: "none",
              border: "none",
              color: isFocused ? "#fff" : "rgba(255,255,255,0.75)",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: isFocused ? 600 : 500,
              letterSpacing: isFocused ? 0.3 : 0,
              position: "relative",
              zIndex: 1,
            }}
          />

          {/* Search submit button */}
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8, x: -16 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -16 }}
                whileHover={{
                  scale: 1.05,
                  background: "linear-gradient(45deg,#0b6b46,#f97316)",
                  boxShadow: "0 8px 20px rgba(249,115,22,0.45)",
                }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "8px 18px",
                  marginRight: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 24,
                  background: "linear-gradient(135deg,#f97316,#076b43)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(249,115,22,0.35)",
                  fontFamily: "inherit",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Go
              </motion.button>
            )}
          </AnimatePresence>

          {/* Shimmer shine loop */}
          {isFocused && (
            <motion.div
              style={{ position: "absolute", inset: 0, borderRadius: 40, pointerEvents: "none", zIndex: 0 }}
              animate={{
                opacity: [0, 0.12, 0.22, 0.12, 0],
                background: "radial-gradient(circle at 50% 0%,rgba(255,255,255,0.9) 0%,transparent 70%)",
              }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: "loop" }}
            />
          )}
        </motion.div>
      </motion.form>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              zIndex: 50,
              width: "100%",
              marginTop: 8,
              overflow: "hidden",
              background: "rgba(15,20,18,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderRadius: 16,
              boxShadow: "0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(249,115,22,0.25)",
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            <div style={{ padding: 8 }}>
              {suggestions.map((s, index) => (
                <motion.div
                  key={s}
                  custom={index}
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => {
                    setSearchQuery(s);
                    onSelectSuggestion?.(s);
                    setIsFocused(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderRadius: 10,
                    transition: "background 0.15s",
                  }}
                  whileHover={{ background: "rgba(249,115,22,0.12)" }}
                >
                  <motion.div
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <CircleDot size={14} color="#f97316" />
                  </motion.div>
                  <motion.span
                    style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500 }}
                    initial={{ x: -4, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.07 }}
                  >
                    {s}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
