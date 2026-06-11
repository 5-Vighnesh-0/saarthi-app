export const C = {
  green: "#f97316",
  greenDark: "#0b6b46",
  greenHead: "#ea580c",
  bg: "#000000",
  panel: "#15171a",
  panel2: "#1f2226",
  red: "#ec1c3c",
  redDeep: "#5c0f1a",
  blue: "#1f7fe0",
  blueDeep: "#0d2840",
  orange: "#f5a623",
  teal: "#16b39a",
  text: "#ffffff",
  sub: "#9aa0a6",
  line: "#2a2d31",
} as const;

export const METAL = {
  green: {
    outer: "linear-gradient(180deg,#063d2a,#f97316)",
    inner: "linear-gradient(180deg,#1be08f,#063d2a 55%,#13c97e)",
    face: "linear-gradient(180deg,#fb923c,#ea580c)",
    fg: "#eafff5",
    ts: "0 -1px 0 rgba(4,46,30,0.9)",
  },
  red: {
    outer: "linear-gradient(180deg,#3a0810,#ff4f68)",
    inner: "linear-gradient(180deg,#ff8a9c,#3a0810 55%,#ff5f78)",
    face: "linear-gradient(180deg,#ff4d66,#c00e2a)",
    fg: "#fff5f6",
    ts: "0 -1px 0 rgba(60,4,12,0.9)",
  },
  steel: {
    outer: "linear-gradient(180deg,#1a1a1a,#cfcfcf)",
    inner: "linear-gradient(180deg,#fafafa,#3e3e3e 55%,#e5e5e5)",
    face: "linear-gradient(180deg,#efefef,#9a9a9a)",
    fg: "#161616",
    ts: "0 1px 0 rgba(255,255,255,0.6)",
  },
  gold: {
    outer: "linear-gradient(180deg,#6b5300,#ead98f)",
    inner: "linear-gradient(180deg,#fffadd,#856807 55%,#fff1b3)",
    face: "linear-gradient(180deg,#ffe39a,#b8902f)",
    fg: "#3a2c00",
    ts: "0 1px 0 rgba(255,250,200,0.6)",
  },
  blue: {
    outer: "linear-gradient(180deg,#06243f,#4aa3ff)",
    inner: "linear-gradient(180deg,#bfe0ff,#06243f 55%,#7cc0ff)",
    face: "linear-gradient(180deg,#3f9bff,#0d63c4)",
    fg: "#eef6ff",
    ts: "0 -1px 0 rgba(6,36,63,0.9)",
  },
} as const;

export type MetalVariant = keyof typeof METAL;
