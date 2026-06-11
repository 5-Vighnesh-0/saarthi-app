"use client";
import { useRef, useEffect } from "react";
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef, LayerProps } from "react-map-gl/maplibre";
import type { BusPosition, RouteStop, ScheduledBus } from "@/lib/data/bengaluru";
import { ROUTE_GEOJSON_COORDS } from "@/lib/data/bengaluru";
import type { WalkRoute } from "@/lib/routing";
import BusIcon from "@/components/ui/BusIcon";
import "maplibre-gl/dist/maplibre-gl.css";

// OpenFreeMap "Liberty" dark style — free, no API key, works without rate-limit issues
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const routeLayer: LayerProps = {
  id: "route-line", type: "line",
  paint: { "line-color": ["get", "accent"], "line-width": 6, "line-opacity": 0.95, "line-blur": 1 },
  layout: { "line-join": "round", "line-cap": "round" },
};
const routeCasingLayer: LayerProps = {
  id: "route-casing", type: "line",
  paint: { "line-color": "#000", "line-width": 14, "line-opacity": 0.3 },
  layout: { "line-join": "round", "line-cap": "round" },
};
const walkLineLayer: LayerProps = {
  id: "walk-line", type: "line",
  paint: { "line-color": "#f97316", "line-width": 3, "line-opacity": 0.9, "line-dasharray": [2, 3] },
  layout: { "line-join": "round", "line-cap": "round" },
};
const walkCasingLayer: LayerProps = {
  id: "walk-casing", type: "line",
  paint: { "line-color": "#fff", "line-width": 7, "line-opacity": 0.12 },
  layout: { "line-join": "round", "line-cap": "round" },
};
const queryLineLayer: LayerProps = {
  id: "query-line", type: "line",
  paint: { "line-color": "#60a5fa", "line-width": 5, "line-opacity": 0.85 },
  layout: { "line-join": "round", "line-cap": "round" },
};
const queryCasingLayer: LayerProps = {
  id: "query-casing", type: "line",
  paint: { "line-color": "#000", "line-width": 11, "line-opacity": 0.18 },
  layout: { "line-join": "round", "line-cap": "round" },
};

export interface AutoMarkerData {
  lat: number; lng: number; driverName: string; arrived: boolean;
}

interface Props {
  accent: string;
  buses?: BusPosition[];
  stops?: RouteStop[];
  selected?: number;
  onSelectBus?: (i: number) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  autoMarker?: AutoMarkerData | null;
  pickupMarker?: { lat: number; lng: number } | null;
  walkRoute?: WalkRoute | null;
  queryRoute?: WalkRoute | null;
  originPin?: { lat: number; lng: number; label: string } | null;
  destPin?: { lat: number; lng: number; label: string } | null;
  userLocation?: { lat: number; lng: number } | null;
  scheduledBuses?: ScheduledBus[];
  flyTarget?: { lat: number; lng: number; zoom?: number } | null;
}

export default function TransitMap({
  accent,
  buses = [],
  stops = [],
  selected = 0,
  onSelectBus,
  center = { lat: 12.9609, lng: 77.6387 },
  zoom = 13,
  autoMarker = null,
  pickupMarker = null,
  walkRoute = null,
  queryRoute = null,
  originPin = null,
  destPin = null,
  userLocation = null,
  scheduledBuses = [],
  flyTarget = null,
}: Props) {
  const mapRef = useRef<MapRef>(null);

  const routeGeoJSON = {
    type: "FeatureCollection" as const,
    features: [{ type: "Feature" as const, properties: { accent }, geometry: { type: "LineString" as const, coordinates: ROUTE_GEOJSON_COORDS } }],
  };

  const walkGeoJSON = walkRoute ? {
    type: "Feature" as const,
    properties: {},
    geometry: walkRoute.geometry,
  } : null;

  const queryGeoJSON = queryRoute ? {
    type: "Feature" as const,
    properties: {},
    geometry: queryRoute.geometry,
  } : null;

  useEffect(() => {
    if (!buses[selected]) return;
    mapRef.current?.flyTo({ center: [buses[selected].lng, buses[selected].lat], zoom: 14, duration: 800 });
  }, [selected, buses]);

  useEffect(() => {
    if (!autoMarker || !pickupMarker) return;
    const midLat = (autoMarker.lat + pickupMarker.lat) / 2;
    const midLng = (autoMarker.lng + pickupMarker.lng) / 2;
    mapRef.current?.flyTo({ center: [midLng, midLat], zoom: 14, duration: 600 });
  }, [autoMarker?.lat, autoMarker?.lng]);

  // Fly to explicit target (e.g. "My location" button)
  useEffect(() => {
    if (!flyTarget) return;
    mapRef.current?.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: flyTarget.zoom ?? 14, duration: 900 });
  }, [flyTarget]);

  // Fly to show walk route when it appears
  useEffect(() => {
    if (!walkRoute || !userLocation) return;
    const lats = walkRoute.geometry.coordinates.map(c => c[1]);
    const lngs = walkRoute.geometry.coordinates.map(c => c[0]);
    mapRef.current?.fitBounds(
      [[Math.min(...lngs) - 0.002, Math.min(...lats) - 0.002], [Math.max(...lngs) + 0.002, Math.max(...lats) + 0.002]],
      { duration: 800, padding: 60 }
    );
  }, [walkRoute]);

  // Fit map to show transit query route (origin → destination)
  useEffect(() => {
    if (!queryRoute) return;
    const lats = queryRoute.geometry.coordinates.map(c => c[1]);
    const lngs = queryRoute.geometry.coordinates.map(c => c[0]);
    mapRef.current?.fitBounds(
      [[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01], [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]],
      { duration: 1000, padding: { top: 80, bottom: 80, left: 340, right: 80 } }
    );
  }, [queryRoute]);

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={{ latitude: center.lat, longitude: center.lng, zoom }}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {/* Static route corridor — hidden when a user query route is active */}
      {!queryRoute && (
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer {...routeCasingLayer} />
          <Layer {...routeLayer} />
        </Source>
      )}

      {/* Walking route overlay */}
      {walkGeoJSON && (
        <Source id="walk-route" type="geojson" data={walkGeoJSON}>
          <Layer {...walkCasingLayer} />
          <Layer {...walkLineLayer} />
        </Source>
      )}

      {/* Transit query route (origin → destination blue corridor) */}
      {queryGeoJSON && (
        <Source id="query-route" type="geojson" data={queryGeoJSON}>
          <Layer {...queryCasingLayer} />
          <Layer {...queryLineLayer} />
        </Source>
      )}

      {/* Origin pin */}
      {originPin && (
        <Marker latitude={originPin.lat} longitude={originPin.lng} anchor="bottom">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              background: "rgba(10,13,20,0.92)", border: "2px solid #60a5fa",
              borderRadius: 10, padding: "4px 9px",
              fontWeight: 700, fontSize: 11, color: "#60a5fa",
              boxShadow: "0 4px 14px rgba(96,165,250,0.35)", whiteSpace: "nowrap",
            }}>📍 {originPin.label}</div>
            <div style={{ width: 2, height: 8, background: "#60a5fa", borderRadius: 2 }} />
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#60a5fa" }} />
          </div>
        </Marker>
      )}

      {/* Destination pin */}
      {destPin && (
        <Marker latitude={destPin.lat} longitude={destPin.lng} anchor="bottom">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              background: "rgba(10,13,20,0.92)", border: "2px solid #f97316",
              borderRadius: 10, padding: "4px 9px",
              fontWeight: 700, fontSize: 11, color: "#f97316",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)", whiteSpace: "nowrap",
            }}>📍 {destPin.label}</div>
            <div style={{ width: 2, height: 8, background: "#f97316", borderRadius: 2 }} />
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316" }} />
          </div>
        </Marker>
      )}

      {/* User location dot */}
      {userLocation && (
        <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -8, borderRadius: "50%",
              background: "#3b82f6", opacity: 0.2, animation: "pulse 2s infinite",
            }} />
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: "#3b82f6", border: "3px solid #fff",
              boxShadow: "0 2px 8px rgba(59,130,246,0.6)",
              position: "relative", zIndex: 1,
            }} />
          </div>
        </Marker>
      )}

      {/* Stop dots */}
      {stops.map((s, i) => (
        <Marker key={`stop-${i}`} latitude={s.lat} longitude={s.lng} anchor="center">
          <div style={{
            width: i === 0 || i === stops.length - 1 ? 14 : 9,
            height: i === 0 || i === stops.length - 1 ? 14 : 9,
            borderRadius: "50%",
            background: i === stops.length - 1 ? accent : "#0b1620",
            border: "2.5px solid #fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }} />
        </Marker>
      ))}

      {/* Scheduled bus markers — dimmed, shown at departure point */}
      {scheduledBuses.map((b) => (
        <Marker key={b.id} latitude={b.startLat} longitude={b.startLng} anchor="center">
          <div style={{ position: "relative", cursor: "default" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(30,35,45,0.92)", border: "2px solid rgba(249,115,22,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              position: "relative", zIndex: 1,
            }}>
              <span style={{ fontSize: 14 }}>🚌</span>
            </div>
            <div style={{
              position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
              background: "rgba(249,115,22,0.85)", color: "#fff", fontWeight: 800, fontSize: 9,
              padding: "2px 5px", borderRadius: 6, whiteSpace: "nowrap",
            }}>
              {b.departsIn}m
            </div>
          </div>
        </Marker>
      ))}

      {/* Live bus markers */}
      {buses.map((b, i) => {
        const on = i === selected;
        const size = on ? 40 : 28;
        const heading = b.heading ?? 0;
        return (
          <Marker key={`bus-${i}`} latitude={b.lat} longitude={b.lng} anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); onSelectBus?.(i); }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              {/* ETA label — outside rotation wrapper so it stays upright */}
              {!on && (
                <div style={{
                  position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
                  background: "#fff", color: "#111", fontWeight: 800, fontSize: 10,
                  padding: "2px 6px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 2,
                }}>
                  {b.mins}′
                </div>
              )}

              {/* Pulse halo */}
              {on && (
                <div style={{
                  position: "absolute", inset: -10, borderRadius: "50%",
                  background: accent, opacity: 0.2, animation: "pulse 1.8s infinite",
                }} />
              )}

              {/* Direction + icon — this whole block rotates */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                transform: `scale(${on ? 1.2 : 1}) rotate(${heading}deg)`,
                transition: "transform 1s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}>
                {/* Directional arrow pointing in heading direction */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: `${on ? 5 : 4}px solid transparent`,
                  borderRight: `${on ? 5 : 4}px solid transparent`,
                  borderBottom: `${on ? 8 : 6}px solid ${accent}`,
                  marginBottom: 2,
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
                }} />

                {/* Bus circle — counter-rotates so icon stays readable */}
                <div style={{
                  width: size, height: size, borderRadius: "50%",
                  background: "#fff", border: `${on ? 4 : 3}px solid ${accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: on
                    ? `0 0 0 6px ${accent}33, 0 8px 20px rgba(0,0,0,0.5)`
                    : "0 4px 12px rgba(0,0,0,0.4)",
                  position: "relative", zIndex: 1,
                }}>
                  <div style={{
                    transform: `rotate(${-heading}deg)`,
                    transition: "transform 1s cubic-bezier(0.25,0.46,0.45,0.94)",
                    display: "flex",
                  }}>
                    <BusIcon size={on ? 22 : 16} color={accent} />
                  </div>
                </div>
              </div>
            </div>
          </Marker>
        );
      })}

      {/* Pickup pin */}
      {pickupMarker && (
        <Marker latitude={pickupMarker.lat} longitude={pickupMarker.lng} anchor="bottom">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              background: "#fff", borderRadius: 12, padding: "5px 10px",
              fontWeight: 800, fontSize: 11, color: "#111",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
            }}>📍 MG Road</div>
            <div style={{ width: 2, height: 10, background: "#fff", borderRadius: 2 }} />
            <div style={{ width: 8, height: 8, borderRadius: 8, background: "#fff" }} />
          </div>
        </Marker>
      )}

      {/* Moving auto marker */}
      {autoMarker && (
        <Marker latitude={autoMarker.lat} longitude={autoMarker.lng} anchor="center">
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -8, borderRadius: "50%",
              background: accent, opacity: 0.25,
              animation: autoMarker.arrived ? "none" : "pulse 1.5s infinite",
            }} />
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${accent}, #b36a00)`,
              border: "3px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: `0 0 0 4px ${accent}44, 0 8px 20px rgba(0,0,0,0.5)`,
              position: "relative", zIndex: 1,
              transition: "transform 0.4s ease",
              transform: autoMarker.arrived ? "scale(1.15)" : "scale(1)",
            }}>🛺</div>
            <div style={{
              position: "absolute", bottom: -26, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.8)", color: "#fff",
              fontWeight: 700, fontSize: 10, padding: "2px 8px",
              borderRadius: 8, whiteSpace: "nowrap",
              border: `1px solid ${accent}66`,
            }}>
              {autoMarker.arrived ? "Arrived!" : autoMarker.driverName.split(" ")[0]}
            </div>
          </div>
        </Marker>
      )}
    </Map>
  );
}
