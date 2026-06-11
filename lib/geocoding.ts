export interface GeoResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

// ── Local Bengaluru places — instant results, no API ─────────────────────────
const LOCAL_PLACES: GeoResult[] = [
  // Areas & suburbs
  { name: "Hennur",              displayName: "Hennur, Bengaluru North",               lat: 13.0342, lng: 77.6495, type: "suburb" },
  { name: "Hennur Cross",        displayName: "Hennur Cross, Bengaluru North",          lat: 13.0259, lng: 77.6390, type: "suburb" },
  { name: "Byrathi",             displayName: "Byrathi, Bengaluru North",               lat: 13.0648, lng: 77.7096, type: "suburb" },
  { name: "Kothanur",            displayName: "Kothanur, Bengaluru North",              lat: 13.0576, lng: 77.6780, type: "suburb" },
  { name: "Thanisandra",         displayName: "Thanisandra, Bengaluru North",           lat: 13.0505, lng: 77.6560, type: "suburb" },
  { name: "Kalyan Nagar",        displayName: "Kalyan Nagar, Bengaluru North",          lat: 13.0239, lng: 77.6455, type: "suburb" },
  { name: "HBR Layout",          displayName: "HBR Layout, Bengaluru North",            lat: 13.0169, lng: 77.6321, type: "suburb" },
  { name: "Horamavu",            displayName: "Horamavu, Bengaluru North",              lat: 13.0196, lng: 77.6683, type: "suburb" },
  { name: "Indiranagar",         displayName: "Indiranagar, Bengaluru East",            lat: 12.9784, lng: 77.6408, type: "suburb" },
  { name: "Domlur",              displayName: "Domlur, Bengaluru East",                 lat: 12.9609, lng: 77.6387, type: "suburb" },
  { name: "Marathahalli",        displayName: "Marathahalli, Bengaluru East",           lat: 12.9591, lng: 77.6971, type: "suburb" },
  { name: "Whitefield",          displayName: "Whitefield, Bengaluru East",             lat: 12.9698, lng: 77.7499, type: "suburb" },
  { name: "KR Puram",            displayName: "KR Puram, Bengaluru East",               lat: 12.9940, lng: 77.6967, type: "suburb" },
  { name: "Bellandur",           displayName: "Bellandur, Bengaluru East",              lat: 12.9259, lng: 77.6710, type: "suburb" },
  { name: "Sarjapur",            displayName: "Sarjapur, Bengaluru East",               lat: 12.8614, lng: 77.7855, type: "suburb" },
  { name: "Hoskote",             displayName: "Hoskote, Bengaluru East",                lat: 13.0717, lng: 77.7990, type: "suburb" },
  { name: "Outer Ring Road",     displayName: "Outer Ring Road, Bengaluru East",        lat: 12.9347, lng: 77.6890, type: "road" },
  { name: "Koramangala",         displayName: "Koramangala, Bengaluru South",           lat: 12.9352, lng: 77.6245, type: "suburb" },
  { name: "HSR Layout",          displayName: "HSR Layout, Bengaluru South",            lat: 12.9116, lng: 77.6389, type: "suburb" },
  { name: "BTM Layout",          displayName: "BTM Layout, Bengaluru South",            lat: 12.9155, lng: 77.6101, type: "suburb" },
  { name: "Jayanagar",           displayName: "Jayanagar, Bengaluru South",             lat: 12.9276, lng: 77.5829, type: "suburb" },
  { name: "JP Nagar",            displayName: "JP Nagar, Bengaluru South",              lat: 12.9063, lng: 77.5858, type: "suburb" },
  { name: "Banashankari",        displayName: "Banashankari, Bengaluru South",          lat: 12.9259, lng: 77.5467, type: "suburb" },
  { name: "Electronic City",     displayName: "Electronic City, Bengaluru South",       lat: 12.8451, lng: 77.6602, type: "suburb" },
  { name: "Bannerghatta Road",   displayName: "Bannerghatta Road, Bengaluru South",     lat: 12.8937, lng: 77.5982, type: "road" },
  { name: "Anekal",              displayName: "Anekal, Bengaluru South",                lat: 12.7101, lng: 77.6953, type: "suburb" },
  { name: "Kengeri",             displayName: "Kengeri, Bengaluru South",               lat: 12.9091, lng: 77.4842, type: "suburb" },
  { name: "Malleshwaram",        displayName: "Malleshwaram, Bengaluru West",           lat: 13.0035, lng: 77.5673, type: "suburb" },
  { name: "Rajajinagar",         displayName: "Rajajinagar, Bengaluru West",            lat: 13.0028, lng: 77.5530, type: "suburb" },
  { name: "Yeshwantpur",         displayName: "Yeshwantpur, Bengaluru West",            lat: 13.0180, lng: 77.5536, type: "suburb" },
  { name: "Peenya",              displayName: "Peenya, Bengaluru North-West",           lat: 13.0281, lng: 77.5140, type: "suburb" },
  { name: "Hebbal",              displayName: "Hebbal, Bengaluru North",                lat: 13.0358, lng: 77.5970, type: "suburb" },
  { name: "Yelahanka",           displayName: "Yelahanka, Bengaluru North",             lat: 13.1006, lng: 77.5944, type: "suburb" },
  { name: "Devanahalli",         displayName: "Devanahalli, Bengaluru Rural",           lat: 13.2468, lng: 77.7116, type: "suburb" },
  { name: "Shivajinagar",        displayName: "Shivajinagar, Bengaluru Central",        lat: 12.9875, lng: 77.5986, type: "suburb" },
  { name: "MG Road",             displayName: "MG Road, Bengaluru Central",             lat: 12.9758, lng: 77.6096, type: "road" },
  { name: "Brigade Road",        displayName: "Brigade Road, Bengaluru Central",        lat: 12.9721, lng: 77.6071, type: "road" },
  { name: "Church Street",       displayName: "Church Street, Bengaluru Central",       lat: 12.9742, lng: 77.6077, type: "road" },
  { name: "Cubbon Park",         displayName: "Cubbon Park, Bengaluru Central",         lat: 12.9763, lng: 77.5929, type: "park" },
  { name: "Lalbagh",             displayName: "Lalbagh Botanical Garden, Bengaluru",    lat: 12.9507, lng: 77.5848, type: "park" },
  // Bus stations
  { name: "Kempegowda Bus Station", displayName: "Majestic Bus Stand, Bengaluru",       lat: 12.9767, lng: 77.5713, type: "bus_station" },
  { name: "Majestic",            displayName: "Kempegowda BS, Bengaluru",               lat: 12.9767, lng: 77.5713, type: "bus_station" },
  { name: "Shivajinagar Bus Stand", displayName: "Shivajinagar Bus Stand, Bengaluru",   lat: 12.9875, lng: 77.5986, type: "bus_station" },
  { name: "KR Market",           displayName: "KR Market Bus Stand, Bengaluru",         lat: 12.9674, lng: 77.5758, type: "bus_station" },
  { name: "Silk Board Junction", displayName: "Silk Board Junction, Bengaluru",         lat: 12.9170, lng: 77.6229, type: "bus_stop" },
  { name: "CRPF Camp",           displayName: "CRPF Camp Bus Stop, Hennur",             lat: 13.0480, lng: 77.6620, type: "bus_stop" },
  { name: "Jayamahal",           displayName: "Jayamahal, Bengaluru North",             lat: 13.0011, lng: 77.6082, type: "suburb" },
  // Metro stations
  { name: "MG Road Metro",       displayName: "MG Road Metro Station, Purple Line",     lat: 12.9758, lng: 77.6096, type: "subway" },
  { name: "Indiranagar Metro",   displayName: "Indiranagar Metro Station, Purple Line", lat: 12.9784, lng: 77.6408, type: "subway" },
  { name: "Baiyappanahalli Metro", displayName: "Baiyappanahalli Metro, Purple Line",   lat: 12.9870, lng: 77.6619, type: "subway" },
  { name: "Majestic Metro",      displayName: "Kempegowda Metro Station, Interchange",  lat: 12.9775, lng: 77.5714, type: "subway" },
  { name: "Silk Board Metro",    displayName: "Silk Board Metro Station, Green Line",   lat: 12.9170, lng: 77.6229, type: "subway" },
  { name: "Nagasandra Metro",    displayName: "Nagasandra Metro Station, Green Line",   lat: 13.0628, lng: 77.5163, type: "subway" },
  { name: "Yelahanka Metro",     displayName: "Yelahanka Metro Station, Green Line",    lat: 13.1006, lng: 77.5944, type: "subway" },
  // Malls & landmarks
  { name: "Orion Mall",          displayName: "Orion Mall, Rajajinagar, Bengaluru",     lat: 13.0028, lng: 77.5530, type: "mall" },
  { name: "Forum Mall",          displayName: "Forum Mall, Koramangala, Bengaluru",     lat: 12.9268, lng: 77.6103, type: "mall" },
  { name: "Phoenix Marketcity",  displayName: "Phoenix Marketcity, Whitefield",         lat: 12.9698, lng: 77.7499, type: "mall" },
  { name: "Bengaluru Airport",   displayName: "Kempegowda International Airport",       lat: 13.1986, lng: 77.7066, type: "suburb" },
];

function filterLocal(query: string): GeoResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return LOCAL_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q),
  ).slice(0, 6);
}

// Bounding box hint for Greater Bengaluru (SW → NE)
const BBOX = "77.3,12.7,77.9,13.3";

export async function searchBengaluru(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];

  const local = filterLocal(query);

  const params = new URLSearchParams({
    q: `${query}, Bengaluru, Karnataka, India`,
    format: "json",
    limit: "8",
    countrycodes: "in",
    viewbox: BBOX,
    bounded: "0",       // viewbox as preference, not hard filter
    addressdetails: "1",
    namedetails: "1",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "Saarthi/1.0 (transit-tracker nairvighnesh50@gmail.com)" },
    });
    const data: any[] = await res.json();

    const nominatim: GeoResult[] = data
      .filter((item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        // Keep only results inside Greater Bengaluru
        return lat > 12.7 && lat < 13.4 && lng > 77.3 && lng < 77.9;
      })
      .map((item) => ({
        name: item.namedetails?.name ?? item.name ?? item.display_name.split(",")[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type ?? item.class ?? "place",
      }));

    // Merge: local first, then Nominatim (deduplicated by proximity)
    const merged = [...local];
    for (const r of nominatim) {
      const duplicate = merged.some(
        (m) => Math.abs(m.lat - r.lat) < 0.003 && Math.abs(m.lng - r.lng) < 0.003,
      );
      if (!duplicate) merged.push(r);
    }
    return merged.slice(0, 10);
  } catch {
    return local; // fall back to local results on network error
  }
}

export function typeIcon(type: string): string {
  if (["bus_stop", "bus_station", "station"].includes(type)) return "🚌";
  if (["subway", "subway_entrance", "metro_station"].includes(type)) return "🚇";
  if (["restaurant", "cafe", "fast_food", "food_court"].includes(type)) return "🍽";
  if (["hospital", "clinic", "pharmacy"].includes(type)) return "🏥";
  if (["school", "university", "college"].includes(type)) return "🎓";
  if (["park", "garden", "forest"].includes(type)) return "🌳";
  if (["mall", "supermarket", "shop", "marketplace"].includes(type)) return "🛍";
  if (["road", "street", "residential"].includes(type)) return "🛣";
  if (["neighbourhood", "suburb", "quarter"].includes(type)) return "📍";
  return "📍";
}
