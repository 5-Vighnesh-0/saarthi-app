// Seeded Bengaluru transit data — static GTFS-style, no API needed.
// Coordinates are real Bengaluru locations.

export const LINES: Record<string, { c: string; label: string }> = {
  "500D": { c: "#ec1c3c", label: "500D" },
  "335E": { c: "#ec1c3c", label: "335E" },
  G4: { c: "#16b39a", label: "G4" },
  "356": { c: "#16b39a", label: "356" },
  PUR: { c: "#7b2d8e", label: "P" },
  GRN: { c: "#0a8f3c", label: "G" },
};

export interface Stop {
  id: string;
  name: string;
  sub?: string;
  lat: number;
  lng: number;
  lines: string[];
}

export interface Trip {
  id: string;
  legs: string[];
  depart: string;
  cost: string;
  dur: string;
  live: boolean;
}

export interface BusPosition {
  mins: number;
  lat: number;
  lng: number;
  near: string;
  crowd: "Seats free" | "Filling up" | "Full";
  heading?: number;
}

export interface RouteStop {
  name: string;
  time: string;
  lines: string[];
  lat: number;
  lng: number;
}

export interface AutoDriver {
  name: string;
  rating: number;
  eta: number;   // minutes
  fare: number;
  plate: string;
  startLat: number;  // driver's starting position (real Bengaluru coords)
  startLng: number;
}

// MG Road — the passenger's pickup point
export const PICKUP = { lat: 12.9758, lng: 77.6096 };

// Real Bengaluru coordinates for the 500D corridor
export const ROUTE_STOPS: RouteStop[] = [
  { name: "Indiranagar / 100 Ft Rd", time: "10:43", lines: ["201", "KIA-8"], lat: 12.9784, lng: 77.6408 },
  { name: "Domlur", time: "10:47", lines: [], lat: 12.9609, lng: 77.6387 },
  { name: "Koramangala", time: "10:53", lines: ["171"], lat: 12.9352, lng: 77.6245 },
  { name: "Silk Board", time: "11:04", lines: ["356", "G4"], lat: 12.9170, lng: 77.6229 },
];

export const BUS_POSITIONS: BusPosition[] = [
  { mins: 16, lat: 12.9784, lng: 77.6408, near: "Indiranagar", crowd: "Seats free" },
  { mins: 21, lat: 12.9609, lng: 77.6387, near: "Domlur", crowd: "Filling up" },
  { mins: 29, lat: 12.9352, lng: 77.6245, near: "Koramangala", crowd: "Seats free" },
];

export const TRIPS: Trip[] = [
  { id: "t1", legs: ["500D"], depart: "now", cost: "₹25", dur: "38 min", live: true },
  { id: "t2", legs: ["PUR", "356"], depart: "5 min", cost: "₹45", dur: "47 min", live: false },
  { id: "t3", legs: ["335E", "G4", "GRN"], depart: "5 min", cost: "₹40", dur: "51 min", live: true },
];

export const RECENTS: Pick<Stop, "name" | "sub">[] = [
  { name: "Indiranagar Metro", sub: "100 Feet Road" },
  { name: "Kempegowda Bus Station", sub: "Majestic" },
  { name: "Electronic City", sub: "Phase 1" },
];

export const AUTO_DRIVERS: AutoDriver[] = [
  // startLat/startLng = real Bengaluru positions the driver comes from
  { name: "Ramesh K.", rating: 4.9, eta: 3, fare: 78, plate: "KA 01 9823", startLat: 12.9763, startLng: 77.5929 }, // near Cubbon Park
  { name: "Suresh M.", rating: 4.7, eta: 5, fare: 75, plate: "KA 05 4471", startLat: 12.9637, startLng: 77.5756 }, // near Kalasipalya
  { name: "Anil P.",  rating: 4.8, eta: 6, fare: 80, plate: "KA 03 1290", startLat: 12.9799, startLng: 77.6218 }, // near Ulsoor
];

// Map route as GeoJSON LineString coordinates [lng, lat]
export const ROUTE_GEOJSON_COORDS: [number, number][] = [
  [77.6408, 12.9784],
  [77.6400, 12.9700],
  [77.6387, 12.9609],
  [77.6300, 12.9480],
  [77.6245, 12.9352],
  [77.6229, 12.9170],
];

export interface ScheduledBus {
  id: string;
  routeId: string;
  routeLabel: string;
  departsIn: number;   // minutes from now
  from: string;
  to: string;
  fare: number;
  startLat: number;
  startLng: number;
}

export const SCHEDULED_BUSES: ScheduledBus[] = [
  { id: "sch-500D-1", routeId: "500D", routeLabel: "500D", departsIn: 8,  from: "Majestic",        to: "Silk Board",      fare: 25, startLat: 12.9767, startLng: 77.5713 },
  { id: "sch-500D-2", routeId: "500D", routeLabel: "500D", departsIn: 22, from: "Majestic",        to: "Silk Board",      fare: 25, startLat: 12.9767, startLng: 77.5713 },
  { id: "sch-335E-1", routeId: "335E", routeLabel: "335E", departsIn: 12, from: "Majestic",        to: "Electronic City", fare: 35, startLat: 12.9767, startLng: 77.5713 },
  { id: "sch-335E-2", routeId: "335E", routeLabel: "335E", departsIn: 35, from: "Majestic",        to: "Electronic City", fare: 35, startLat: 12.9767, startLng: 77.5713 },
  { id: "sch-G4-1",   routeId: "G4",   routeLabel: "G4",   departsIn: 18, from: "Hebbal",          to: "Electronic City", fare: 30, startLat: 13.0358, startLng: 77.5970 },
  { id: "sch-356-1",  routeId: "356",  routeLabel: "356",  departsIn: 5,  from: "KR Market",       to: "Domlur",          fare: 20, startLat: 12.9674, startLng: 77.5758 },
  { id: "sch-201-1",  routeId: "201",  routeLabel: "201",  departsIn: 15, from: "Indiranagar",     to: "Marathahalli",    fare: 22, startLat: 12.9784, startLng: 77.6408 },
  { id: "sch-KIA-1",  routeId: "KIA",  routeLabel: "KIA",  departsIn: 30, from: "Kempegowda Intl", to: "Majestic",        fare: 60, startLat: 13.1986, startLng: 77.7066 },
];

// ── Bus route catalog with real stop coordinates ─────────────────────────
export interface BusRouteStop {
  name: string;
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  label: string;
  from: string;
  to: string;
  color: string;
  fare: number;
  freqMin: number;
  stops: BusRouteStop[];
}

export const ALL_BUS_ROUTES: BusRoute[] = [
  {
    id: "401", label: "401", from: "Kempegowda BS", to: "Byrathi",
    color: "#ec1c3c", fare: 28, freqMin: 20,
    stops: [
      { name: "Kempegowda BS",   lat: 12.9767, lng: 77.5713 },
      { name: "Shivajinagar",    lat: 12.9875, lng: 77.5986 },
      { name: "Jayamahal",       lat: 13.0011, lng: 77.6082 },
      { name: "Kalyan Nagar",    lat: 13.0239, lng: 77.6455 },
      { name: "Hennur Cross",    lat: 13.0259, lng: 77.6390 },
      { name: "Hennur",          lat: 13.0342, lng: 77.6495 },
      { name: "CRPF Camp",       lat: 13.0480, lng: 77.6620 },
      { name: "Kothanur",        lat: 13.0576, lng: 77.6780 },
      { name: "Byrathi",         lat: 13.0648, lng: 77.7096 },
    ],
  },
  {
    id: "333E", label: "333E", from: "Shivajinagar", to: "Hennur",
    color: "#f59e0b", fare: 22, freqMin: 15,
    stops: [
      { name: "Shivajinagar",   lat: 12.9875, lng: 77.5986 },
      { name: "Jayamahal",      lat: 13.0011, lng: 77.6082 },
      { name: "Hennur Road",    lat: 13.0110, lng: 77.6186 },
      { name: "HBR Layout",     lat: 13.0169, lng: 77.6321 },
      { name: "Hennur Cross",   lat: 13.0259, lng: 77.6390 },
      { name: "Hennur",         lat: 13.0342, lng: 77.6495 },
    ],
  },
  {
    id: "335K", label: "335K", from: "Majestic", to: "Byrathi",
    color: "#8b5cf6", fare: 32, freqMin: 25,
    stops: [
      { name: "Majestic",        lat: 12.9767, lng: 77.5713 },
      { name: "Shivajinagar",    lat: 12.9875, lng: 77.5986 },
      { name: "Hennur Road",     lat: 13.0110, lng: 77.6186 },
      { name: "Hennur Cross",    lat: 13.0259, lng: 77.6390 },
      { name: "Hennur",          lat: 13.0342, lng: 77.6495 },
      { name: "Thanisandra",     lat: 13.0505, lng: 77.6560 },
      { name: "Kothanur",        lat: 13.0576, lng: 77.6780 },
      { name: "Byrathi",         lat: 13.0648, lng: 77.7096 },
    ],
  },
  {
    id: "500D", label: "500D", from: "Majestic", to: "Silk Board",
    color: "#ec1c3c", fare: 25, freqMin: 12,
    stops: [
      { name: "Majestic",      lat: 12.9767, lng: 77.5713 },
      { name: "Indiranagar",   lat: 12.9784, lng: 77.6408 },
      { name: "Domlur",        lat: 12.9609, lng: 77.6387 },
      { name: "Koramangala",   lat: 12.9352, lng: 77.6245 },
      { name: "Silk Board",    lat: 12.9170, lng: 77.6229 },
    ],
  },
  {
    id: "G4", label: "G4", from: "Hebbal", to: "Electronic City",
    color: "#16b39a", fare: 30, freqMin: 25,
    stops: [
      { name: "Hebbal",           lat: 13.0358, lng: 77.5970 },
      { name: "Mekhri Circle",    lat: 13.0153, lng: 77.5838 },
      { name: "MG Road",          lat: 12.9758, lng: 77.6096 },
      { name: "Koramangala",      lat: 12.9352, lng: 77.6245 },
      { name: "HSR Layout",       lat: 12.9116, lng: 77.6389 },
      { name: "Electronic City",  lat: 12.8451, lng: 77.6602 },
    ],
  },
  {
    id: "335E", label: "335E", from: "KR Market", to: "Whitefield",
    color: "#3b82f6", fare: 30, freqMin: 20,
    stops: [
      { name: "KR Market",       lat: 12.9674, lng: 77.5758 },
      { name: "Richmond Circle", lat: 12.9636, lng: 77.5977 },
      { name: "Indiranagar",     lat: 12.9784, lng: 77.6408 },
      { name: "Marathahalli",    lat: 12.9591, lng: 77.6971 },
      { name: "Whitefield",      lat: 12.9698, lng: 77.7499 },
    ],
  },
  {
    id: "201R", label: "201R", from: "Shivajinagar", to: "KR Puram",
    color: "#a855f7", fare: 22, freqMin: 18,
    stops: [
      { name: "Shivajinagar",    lat: 12.9875, lng: 77.5986 },
      { name: "Indiranagar",     lat: 12.9784, lng: 77.6408 },
      { name: "Domlur",          lat: 12.9609, lng: 77.6387 },
      { name: "Old Madras Road", lat: 12.9758, lng: 77.6650 },
      { name: "KR Puram",        lat: 12.9940, lng: 77.6967 },
    ],
  },
  {
    id: "KIA", label: "KIA Express", from: "Majestic", to: "Airport",
    color: "#f59e0b", fare: 60, freqMin: 30,
    stops: [
      { name: "Majestic",        lat: 12.9767, lng: 77.5713 },
      { name: "Hebbal",          lat: 13.0358, lng: 77.5970 },
      { name: "Yelahanka",       lat: 13.1006, lng: 77.5944 },
      { name: "Devanahalli",     lat: 13.2468, lng: 77.7116 },
      { name: "Airport",         lat: 13.1986, lng: 77.7066 },
    ],
  },
];

// Metro stations for the Purple line
export const METRO_STATIONS: Stop[] = [
  { id: "mg", name: "MG Road", sub: "Purple Line", lat: 12.9758, lng: 77.6096, lines: ["PUR"] },
  { id: "trinity", name: "Trinity", sub: "Purple Line", lat: 12.9716, lng: 77.6183, lines: ["PUR"] },
  { id: "halasuru", name: "Halasuru", sub: "Purple Line", lat: 12.9784, lng: 77.6274, lines: ["PUR"] },
  { id: "indiranagar", name: "Indiranagar", sub: "Purple Line", lat: 12.9784, lng: 77.6408, lines: ["PUR"] },
];
