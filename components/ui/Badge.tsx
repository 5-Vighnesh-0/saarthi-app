import { LINES } from "@/lib/data/bengaluru";
import { C } from "@/lib/theme";

interface Props {
  k: string;
  big?: boolean;
}

export default function Badge({ k, big }: Props) {
  const l = LINES[k] ?? { c: C.teal, label: k };
  return (
    <span
      style={{
        background: l.c,
        color: "#fff",
        fontWeight: 800,
        padding: big ? "8px 18px" : "3px 9px",
        borderRadius: 8,
        fontSize: big ? 18 : 13,
        letterSpacing: 0.3,
        display: "inline-block",
      }}
    >
      {l.label}
    </span>
  );
}
