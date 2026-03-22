import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { FilePlus2 } from 'lucide-react';
import { divIcon, latLngBounds, point } from 'leaflet';

export interface LocationMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  ratingText?: string;
  hasRating?: boolean;
  categoryText?: string;
  serviceText?: string;
  actionUrl?: string;
  actionLabel?: string;
  actionRequestId?: string;
  actionServiceId?: string;
  actionProviderId?: string;
  color?: string;
  radius?: number;
  glyph?: string;
  imageUrl?: string;
}

interface LocationMapProps {
  markers: LocationMapMarker[];
  heightClassName?: string;
  enableClustering?: boolean;
  onMarkerActionClick?: (marker: LocationMapMarker) => void | Promise<void>;
  actionLoadingMarkerId?: string | null;
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

function markerIcon(marker: LocationMapMarker) {
  const color = marker.color ?? '#0284c7';
  const size = Math.max(24, (marker.radius ?? 8) * 2 + 10);
  const glyph = marker.glyph ?? '•';

  return divIcon({
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:999px;
      border:2px solid #ffffff;
      background:${color};
      color:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:${Math.max(11, Math.floor(size * 0.48))}px;
      font-weight:700;
      box-shadow:0 8px 18px rgba(15,23,42,0.25);
      line-height:1;
    ">${glyph}</div>`,
    className: '',
    iconSize: point(size, size),
    iconAnchor: point(size / 2, size / 2),
    popupAnchor: point(0, -size / 2),
  });
}

export default function LocationMap({
  markers,
  heightClassName = 'h-80',
  enableClustering = true,
  onMarkerActionClick,
  actionLoadingMarkerId = null,
}: LocationMapProps) {
  if (markers.length === 0) {
    return null;
  }

  const MarkerContainer = enableClustering ? MarkerClusterGroup : React.Fragment;
  const markerContainerProps = enableClustering ? { chunkedLoading: true } : {};

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
        <MarkerContainer {...markerContainerProps}>
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={markerIcon(marker)}
            >
              <Popup>
                <div className="w-full min-w-[160px] leading-tight">
                  {marker.imageUrl ? (
                    <img
                      src={marker.imageUrl}
                      alt={marker.label}
                      className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-slate-200 object-cover"
                    />
                  ) : null}
                  <p className="font-semibold text-slate-900 leading-tight">{marker.label}</p>
                  {marker.ratingText ? (
                    <p className={`mt-0.5 text-sm font-medium leading-tight ${marker.hasRating ? 'text-amber-600' : 'text-slate-400'}`}>
                      {marker.ratingText}
                    </p>
                  ) : null}
                  {marker.categoryText ? <p className="mt-0.5 text-sm leading-tight text-slate-600">{marker.categoryText}</p> : null}
                  {marker.serviceText ? (
                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium leading-tight text-blue-700">
                      {marker.serviceText}
                    </span>
                  ) : null}
                  {marker.description ? <p className="mt-1 text-sm leading-tight text-slate-600">{marker.description}</p> : null}
                  {marker.actionLabel ? (
                    onMarkerActionClick && (Boolean(marker.actionRequestId) || (Boolean(marker.actionServiceId) && Boolean(marker.actionProviderId))) ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void onMarkerActionClick(marker);
                        }}
                        disabled={actionLoadingMarkerId === marker.id}
                        className="btn-primary mt-2 flex w-full items-center justify-center gap-2 text-sm !text-white visited:!text-white hover:!text-white focus:!text-white no-underline disabled:opacity-70"
                        style={{ color: '#ffffff' }}
                      >
                        <FilePlus2 className="h-4 w-4" />
                        {actionLoadingMarkerId === marker.id ? '...' : marker.actionLabel}
                      </button>
                    ) : marker.actionUrl ? (
                      <a
                        href={marker.actionUrl}
                        className="btn-primary mt-2 flex w-full items-center justify-center gap-2 text-sm !text-white visited:!text-white hover:!text-white focus:!text-white no-underline"
                        style={{ color: '#ffffff' }}
                      >
                        <FilePlus2 className="h-4 w-4" />
                        {marker.actionLabel}
                      </a>
                    ) : null
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerContainer>
      </MapContainer>
    </div>
  );
}
