"use client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BUS_POSITIONS } from "@/lib/data/bengaluru";

export interface SmoothVehicle {
  vehicleId: string;
  routeId: string;
  lat: number;
  lng: number;
  heading: number;
  speed?: number;
}

interface AnimTarget {
  routeId: string;
  speed?: number;
  fromLat: number;
  fromLng: number;
  fromHeading: number;
  toLat: number;
  toLng: number;
  toHeading: number;
  startTime: number;
  duration: number;
}

type RawVehicle = { vehicleId: string; routeId: string; lat: number; lng: number; speed?: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const STEP_MS = 3000;

// Calculates compass bearing from point A → B (0 = north, clockwise)
function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = Math.PI / 180;
  const dLng = (lng2 - lng1) * r;
  const y = Math.sin(dLng) * Math.cos(lat2 * r);
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r)
    - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos(dLng);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

// Lerp across the 0/360 boundary (e.g. 350° → 10° goes clockwise, not all the way back)
function lerpAngle(from: number, to: number, t: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return (from + delta * t + 360) % 360;
}

// Smooth ease-in-out so markers accelerate out of old position and decelerate into new
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Per-bus drift direction for demo (roughly follows 500D corridor northeast)
const DEMO_DRIFT: [number, number][] = [
  [0.00014, 0.00011],
  [0.00011, 0.00016],
  [0.00017, 0.00009],
  [0.00009, 0.00013],
];

export function useSmoothVehicles() {
  const [vehicles, setVehicles] = useState<SmoothVehicle[]>([]);
  const [connected, setConnected] = useState(false);

  const targetsRef = useRef(new Map<string, AnimTarget>());
  const displayRef = useRef(new Map<string, SmoothVehicle>());
  const rafRef = useRef(0);
  const socketLiveRef = useRef(false);

  // ── 60fps interpolation loop ────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      let dirty = false;

      targetsRef.current.forEach((tgt, id) => {
        const raw = Math.min(1, (now - tgt.startTime) / tgt.duration);
        const t = easeInOut(raw);
        const lat = tgt.fromLat + (tgt.toLat - tgt.fromLat) * t;
        const lng = tgt.fromLng + (tgt.toLng - tgt.fromLng) * t;
        const heading = lerpAngle(tgt.fromHeading, tgt.toHeading, t);

        const prev = displayRef.current.get(id);
        if (
          !prev
          || Math.abs(prev.lat - lat) > 1e-8
          || Math.abs(prev.lng - lng) > 1e-8
          || Math.abs(prev.heading - heading) > 0.05
        ) {
          displayRef.current.set(id, { vehicleId: id, routeId: tgt.routeId, lat, lng, heading, speed: tgt.speed });
          dirty = true;
        }
      });

      if (dirty) setVehicles([...displayRef.current.values()]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Demo simulation — runs when socket not connected ────────────────────────
  useEffect(() => {
    // Seed initial positions from static data
    BUS_POSITIONS.forEach((b, i) => {
      const id = `demo-${i}`;
      const h = 40 + i * 55;
      displayRef.current.set(id, { vehicleId: id, routeId: "500D", lat: b.lat, lng: b.lng, heading: h });
      targetsRef.current.set(id, {
        routeId: "500D",
        fromLat: b.lat, fromLng: b.lng, fromHeading: h,
        toLat: b.lat, toLng: b.lng, toHeading: h,
        startTime: performance.now(), duration: STEP_MS,
      });
    });

    const interval = setInterval(() => {
      if (socketLiveRef.current) return;
      BUS_POSITIONS.forEach((_, i) => {
        const id = `demo-${i}`;
        const cur = displayRef.current.get(id);
        if (!cur) return;

        const [dlat, dlng] = DEMO_DRIFT[i % DEMO_DRIFT.length];
        // Small noise keeps movement organic, drift keeps it directional
        const newLat = cur.lat + dlat + (Math.random() - 0.5) * 0.00006;
        const newLng = cur.lng + dlng + (Math.random() - 0.5) * 0.00006;
        const toHeading = calcBearing(cur.lat, cur.lng, newLat, newLng);

        targetsRef.current.set(id, {
          routeId: "500D",
          fromLat: cur.lat, fromLng: cur.lng, fromHeading: cur.heading,
          toLat: newLat, toLng: newLng, toHeading,
          startTime: performance.now(), duration: STEP_MS,
        });
      });
    }, STEP_MS);

    return () => clearInterval(interval);
  }, []);

  // ── Real socket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!API_URL) return;

    const socket = io(API_URL, { transports: ["websocket"], reconnectionDelay: 2000, timeout: 4000 });

    const handleVehicle = (raw: RawVehicle) => {
      const cur = displayRef.current.get(raw.vehicleId);
      const fromLat = cur?.lat ?? raw.lat;
      const fromLng = cur?.lng ?? raw.lng;
      const fromHeading = cur?.heading ?? 0;
      const toHeading = (fromLat !== raw.lat || fromLng !== raw.lng)
        ? calcBearing(fromLat, fromLng, raw.lat, raw.lng)
        : fromHeading;

      targetsRef.current.set(raw.vehicleId, {
        routeId: raw.routeId, speed: raw.speed,
        fromLat, fromLng, fromHeading,
        toLat: raw.lat, toLng: raw.lng, toHeading,
        startTime: performance.now(), duration: STEP_MS,
      });

      // First real update: clear out demo markers
      if (!socketLiveRef.current) {
        socketLiveRef.current = true;
        for (const key of [...targetsRef.current.keys()]) {
          if (key.startsWith("demo-")) { targetsRef.current.delete(key); displayRef.current.delete(key); }
        }
      }
    };

    socket.on("connect", () => { setConnected(true); socket.emit("join", "all-vehicles"); });
    socket.on("disconnect", () => { setConnected(false); socketLiveRef.current = false; });
    socket.on("vehicles:bulk", (updates: RawVehicle[]) => updates.forEach(handleVehicle));
    socket.on("vehicle:update", handleVehicle);

    return () => { socket.disconnect(); };
  }, []);

  return { vehicles, connected };
}
