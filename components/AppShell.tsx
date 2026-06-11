"use client";
import { useState } from "react";
import { C } from "@/lib/theme";
import type { Trip } from "@/lib/data/bengaluru";

export type Screen = "home" | "search" | "results" | "map" | "live" | "auto" | "ticket";

import HomeScreen    from "@/components/screens/HomeScreen";
import SearchScreen  from "@/components/screens/SearchScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";
import MapScreen     from "@/components/screens/MapScreen";
import LiveScreen    from "@/components/screens/LiveScreen";
import AutoScreen    from "@/components/screens/AutoScreen";
import TicketScreen  from "@/components/screens/TicketScreen";
import BackButton    from "@/components/ui/BackButton";

const BACK_TO: Partial<Record<Screen, Screen>> = {
  search:  "home",
  results: "search",
  map:     "results",
  live:    "results",
  auto:    "home",
};

const BACK_LABEL: Partial<Record<Screen, string>> = {
  search:  "Home",
  results: "Search",
  map:     "Trips",
  live:    "Trips",
  auto:    "Home",
};

// Pure screen content — no phone frame wrapper.
// The phone frame is the caller's responsibility (LandingPage on desktop,
// or a full-screen div on mobile).
export default function AppShell() {
  const [screen, setScreen] = useState<Screen>("home");
  const [trip, setTrip]     = useState<Trip | null>(null);

  const go = (s: Screen, t?: Trip) => {
    if (t) setTrip(t);
    setScreen(s);
  };

  const backScreen = BACK_TO[screen];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: C.bg,
      color: C.text,
      fontFamily: "'Sora', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Dynamic island notch */}
      <div style={{
        position: "absolute",
        top: 8, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: 120, height: 26,
        background: "#000",
        borderRadius: 16,
        pointerEvents: "none",
      }} />

      {/* Back button — bottom-left, all non-home screens */}
      {backScreen && (
        <BackButton onBack={() => go(backScreen)} label={BACK_LABEL[screen]} />
      )}

      {/* Screen routing */}
      {screen === "home"    && <HomeScreen    go={go} />}
      {screen === "search"  && <SearchScreen  go={go} />}
      {screen === "results" && <ResultsScreen go={go} />}
      {screen === "map"     && <MapScreen     go={go} />}
      {screen === "live"    && <LiveScreen    go={go} />}
      {screen === "auto"    && <AutoScreen    go={go} />}
      {screen === "ticket"  && <TicketScreen go={go} />}
    </div>
  );
}
