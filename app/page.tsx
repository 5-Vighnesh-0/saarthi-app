"use client";
import { useEffect, useState } from "react";
import MobileApp from "@/components/MobileApp";
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

  if (isMobile) return <MobileApp />;
  return <DesktopApp />;
}
