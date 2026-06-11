export interface WalkRoute {
  durationSec: number;
  distanceM: number;
  geometry: GeoJSON.LineString;
}

export async function getWalkRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<WalkRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      durationSec: Math.round(route.duration),
      distanceM: Math.round(route.distance),
      geometry: route.geometry as GeoJSON.LineString,
    };
  } catch {
    return null;
  }
}

export async function getTransitRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
): Promise<WalkRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      durationSec: Math.round(route.duration),
      distanceM: Math.round(route.distance),
      geometry: route.geometry as GeoJSON.LineString,
    };
  } catch {
    return null;
  }
}

export function fmtWalk(durationSec: number, distanceM: number): string {
  const mins = Math.ceil(durationSec / 60);
  const dist = distanceM >= 1000
    ? `${(distanceM / 1000).toFixed(1)} km`
    : `${distanceM} m`;
  return `${mins} min walk · ${dist}`;
}
