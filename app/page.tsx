"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import DesktopApp from "@/components/DesktopApp";

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile === null) return null;

  // Mobile / PWA: full-screen app shell
  if (isMobile) {
    return (
      <div style={{ width: "100vw", height: "100dvh", overflow: "hidden" }}>
        <AppShell />
      </div>
    );
  }

  // Desktop: full-screen map app interface
  return <DesktopApp />;
}
