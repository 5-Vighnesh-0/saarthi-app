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

// Metro stations for the Purple line
export const METRO_STATIONS: Stop[] = [
  { id: "mg", name: "MG Road", sub: "Purple Line", lat: 12.9758, lng: 77.6096, lines: ["PUR"] },
  { id: "trinity", name: "Trinity", sub: "Purple Line", lat: 12.9716, lng: 77.6183, lines: ["PUR"] },
  { id: "halasuru", name: "Halasuru", sub: "Purple Line", lat: 12.9784, lng: 77.6274, lines: ["PUR"] },
  { id: "indiranagar", name: "Indiranagar", sub: "Purple Line", lat: 12.9784, lng: 77.6408, lines: ["PUR"] },
];
