"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface LiveVehicle {
  vehicleId: string;
  routeId: string;
  lat: number;
  lng: number;
  speed?: number;
  updatedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useVehicleSocket() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const storeRef = useRef<Map<string, LiveVehicle>>(new Map());

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket"], reconnectionDelay: 2000 });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", "all-vehicles");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("vehicles:bulk", (updates: LiveVehicle[]) => {
      updates.forEach((v) => storeRef.current.set(v.vehicleId, v));
      setVehicles([...storeRef.current.values()]);
    });

    socket.on("vehicle:update", (v: LiveVehicle) => {
      storeRef.current.set(v.vehicleId, v);
      setVehicles([...storeRef.current.values()]);
    });

    return () => { socket.disconnect(); };
  }, []);

  return { vehicles, connected };
}
