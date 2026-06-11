export interface GeoResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

// Bounding box for Greater Bengaluru (SW → NE)
const BBOX = "77.3,12.7,77.9,13.3";

export async function searchBengaluru(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: `${query}, Bengaluru`,
    format: "json",
    limit: "8",
    countrycodes: "in",
    viewbox: BBOX,
    bounded: "1",
    addressdetails: "1",
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "Saarthi/1.0 (transit tracker)" },
    });
    const data: any[] = await res.json();
    return data.map((item) => ({
      name: item.namedetails?.name ?? item.name ?? item.display_name.split(",")[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type ?? item.class ?? "place",
    }));
  } catch {
    return [];
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
