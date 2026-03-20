import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';

export interface LocationMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  color?: string;
  radius?: number;
}

interface LocationMapProps {
  markers: LocationMapMarker[];
  heightClassName?: string;
}

function FitMapBounds({ markers }: { markers: LocationMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 13, { animate: false });
      return;
    }

    const bounds = latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, markers]);

  return null;
}

export default function LocationMap({ markers, heightClassName = 'h-80' }: LocationMapProps) {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 ${heightClassName}`}>
      <MapContainer
        center={[markers[0].latitude, markers[0].longitude]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapBounds markers={markers} />
        {markers.map((marker) => {
          const color = marker.color ?? '#0284c7';

          return (
            <CircleMarker
              key={marker.id}
              center={[marker.latitude, marker.longitude]}
              radius={marker.radius ?? 8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 2 }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-slate-900">{marker.label}</p>
                  {marker.description ? <p className="mt-1 text-sm text-slate-600">{marker.description}</p> : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}