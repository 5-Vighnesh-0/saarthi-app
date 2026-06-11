import { Bus } from "lucide-react";

export default function StatusBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      <span>10:27</span>
      <span
        style={{
          marginLeft: "auto",
          background: "rgba(0,0,0,0.25)",
          padding: "3px 12px",
          borderRadius: 16,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Bus size={13} /> Transit
      </span>
      <span style={{ marginLeft: 12, fontSize: 13 }}>5G ●●</span>
    </div>
  );
}
