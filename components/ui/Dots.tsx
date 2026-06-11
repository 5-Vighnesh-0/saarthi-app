import { C } from "@/lib/theme";

interface Props {
  n?: number;
  color?: string;
}

export default function Dots({ n = 5, color = C.sub }: Props) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 4,
            background: color,
            opacity: 0.7,
          }}
        />
      ))}
    </span>
  );
}
