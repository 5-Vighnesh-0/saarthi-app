import type { BusRoute, BusRouteStop } from "@/lib/data/bengaluru";
import { ALL_BUS_ROUTES } from "@/lib/data/bengaluru";

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface MatchedRoute {
  route: BusRoute;
  boardStop: BusRouteStop & { idx: number };
  alightStop: BusRouteStop & { idx: number };
  walkToBoardM: number;
  walkFromAlightM: number;
  rideStops: number;
  totalMins: number;
  nextBusMin: number;
}

const BOARD_RADIUS_M = 2500;
const ALIGHT_RADIUS_M = 2500;
const WALK_SPEED_MPS = 1.2;
const AVG_STOP_SECS = 180;

export function findMatchingRoutes(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): MatchedRoute[] {
  const results: MatchedRoute[] = [];

  for (const route of ALL_BUS_ROUTES) {
    let bestBoard: (BusRouteStop & { idx: number }) | null = null;
    let bestBoardDist = Infinity;

    for (let i = 0; i < route.stops.length - 1; i++) {
      const d = haversineM(originLat, originLng, route.stops[i].lat, route.stops[i].lng);
      if (d < BOARD_RADIUS_M && d < bestBoardDist) {
        bestBoardDist = d;
        bestBoard = { ...route.stops[i], idx: i };
      }
    }
    if (!bestBoard) continue;

    let bestAlight: (BusRouteStop & { idx: number }) | null = null;
    let bestAlightDist = Infinity;

    for (let i = bestBoard.idx + 1; i < route.stops.length; i++) {
      const d = haversineM(destLat, destLng, route.stops[i].lat, route.stops[i].lng);
      if (d < ALIGHT_RADIUS_M && d < bestAlightDist) {
        bestAlightDist = d;
        bestAlight = { ...route.stops[i], idx: i };
      }
    }
    if (!bestAlight) continue;

    const rideStops = bestAlight.idx - bestBoard.idx;
    const walkToBoardSec = bestBoardDist / WALK_SPEED_MPS;
    const walkFromAlightSec = bestAlightDist / WALK_SPEED_MPS;
    const rideSec = rideStops * AVG_STOP_SECS;
    const totalSec = walkToBoardSec + rideSec + walkFromAlightSec;

    results.push({
      route,
      boardStop: bestBoard,
      alightStop: bestAlight,
      walkToBoardM: Math.round(bestBoardDist),
      walkFromAlightM: Math.round(bestAlightDist),
      rideStops,
      totalMins: Math.ceil(totalSec / 60),
      nextBusMin: Math.floor(Math.random() * route.freqMin) + 1,
    });
  }

  return results.sort((a, b) => a.totalMins - b.totalMins);
}
