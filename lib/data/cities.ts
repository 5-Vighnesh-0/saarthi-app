// City registry — adding a new city = adding one entry here.
// Each city points to its GTFS feed URL (for when real API access is granted).

export interface CityConfig {
  id: string;
  name: string;
  accent: string;
  center: { lat: number; lng: number };
  zoom: number;
  gtfsUrl?: string;       // static GTFS zip
  gtfsRtUrl?: string;     // GTFS-RT protobuf feed (needs API key)
  timezone: string;
  operators: string[];
}

export const CITIES: CityConfig[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    accent: "#f97316",
    center: { lat: 12.9716, lng: 77.5946 },
    zoom: 12,
    gtfsUrl: "https://github.com/geohacker/bmtc/raw/master/gtfs/bmtc_gtfs.zip",
    timezone: "Asia/Kolkata",
    operators: ["BMTC", "Namma Metro"],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    accent: "#1f7fe0",
    center: { lat: 19.076, lng: 72.8777 },
    zoom: 12,
    timezone: "Asia/Kolkata",
    operators: ["BEST", "Mumbai Metro"],
  },
  {
    id: "delhi",
    name: "Delhi",
    accent: "#7b2d8e",
    center: { lat: 28.6139, lng: 77.209 },
    zoom: 11,
    timezone: "Asia/Kolkata",
    operators: ["DTC", "Delhi Metro"],
  },
  {
    id: "chennai",
    name: "Chennai",
    accent: "#f5a623",
    center: { lat: 13.0827, lng: 80.2707 },
    zoom: 12,
    timezone: "Asia/Kolkata",
    operators: ["MTC", "Chennai Metro"],
  },
];

export const DEFAULT_CITY = CITIES[0];
