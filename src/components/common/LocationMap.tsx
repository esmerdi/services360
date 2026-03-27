import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { FilePlus2, Star } from 'lucide-react';
import { divIcon, latLngBounds, point } from 'leaflet';

export interface LocationMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  badgeText?: string;
  badgeTone?: 'new' | 'featured';
  description?: string;
  ratingText?: string;
  hasRating?: boolean;
  categoryText?: string;
  serviceText?: string;
  serviceTags?: string[];
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
  onVisibleMarkerIdsChange?: (markerIds: string[]) => void;
  fitBoundsTrigger?: number;
}

function FitMapBounds({ markers, fitBoundsTrigger = 0 }: { markers: LocationMapMarker[]; fitBoundsTrigger?: number }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 13, { animate: false });
      return;
    }

    const bounds = latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [fitBoundsTrigger, map, markers]);

  return null;
}

function TrackVisibleMarkers({
  markers,
  onVisibleMarkerIdsChange,
}: {
  markers: LocationMapMarker[];
  onVisibleMarkerIdsChange?: (markerIds: string[]) => void;
}) {
  const map = useMap();

  const emitVisibleMarkerIds = React.useCallback(() => {
    if (!onVisibleMarkerIdsChange) return;

    const bounds = map.getBounds();
    const visibleIds = markers
      .filter((marker) => bounds.contains([marker.latitude, marker.longitude]))
      .map((marker) => marker.id);

    onVisibleMarkerIdsChange(visibleIds);
  }, [map, markers, onVisibleMarkerIdsChange]);

  useMapEvents({
    moveend: emitVisibleMarkerIds,
    zoomend: emitVisibleMarkerIds,
    resize: emitVisibleMarkerIds,
  });

  useEffect(() => {
    emitVisibleMarkerIds();
  }, [emitVisibleMarkerIds]);

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
  onVisibleMarkerIdsChange,
  fitBoundsTrigger = 0,
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
        <FitMapBounds markers={markers} fitBoundsTrigger={fitBoundsTrigger} />
        <TrackVisibleMarkers markers={markers} onVisibleMarkerIdsChange={onVisibleMarkerIdsChange} />
        <MarkerContainer {...markerContainerProps}>
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={markerIcon(marker)}
            >
              <Popup>
                <div className="w-[200px] max-w-[200px] leading-tight sm:w-[220px] sm:max-w-[220px]">
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    {marker.imageUrl ? (
                      <img
                        src={marker.imageUrl}
                        alt={marker.label}
                        className="h-9 w-9 flex-shrink-0 rounded-full border border-slate-200 object-cover sm:h-10 sm:w-10"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{marker.label}</p>
                        {marker.badgeText ? (
                          <span
                            className={marker.badgeTone === 'featured'
                              ? 'inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700'
                              : 'inline-flex flex-shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600'}
                          >
                            {marker.badgeTone === 'featured' ? <Star className="h-2.5 w-2.5 fill-current" /> : null}
                            {marker.badgeText}
                          </span>
                        ) : null}
                      </div>
                      {marker.categoryText ? <p className="mt-0.5 truncate text-xs text-slate-500">{marker.categoryText}</p> : null}
                    </div>
                  </div>
                  {marker.ratingText ? (
                    <p className={`mt-1 text-xs font-medium ${marker.hasRating ? 'text-amber-600' : 'text-slate-400'}`}>
                      {marker.ratingText}
                    </p>
                  ) : null}
                  {marker.serviceText ? (
                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {marker.serviceText}
                    </span>
                  ) : null}
                  {marker.serviceTags && marker.serviceTags.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {marker.serviceTags.map((serviceTag) => (
                        <span
                          key={`${marker.id}-${serviceTag}`}
                          className={serviceTag.startsWith('+')
                            ? 'inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600'
                            : 'inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700'}
                        >
                          {serviceTag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {marker.description ? (
                    <p
                      className="mt-1 text-xs text-slate-600 sm:mt-1.5"
                      title={marker.description}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {marker.description}
                    </p>
                  ) : null}
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
                        className="btn-primary mt-2 flex w-full items-center justify-center gap-2 text-xs !text-white visited:!text-white hover:!text-white focus:!text-white no-underline disabled:opacity-70"
                        style={{ color: '#ffffff' }}
                      >
                        <FilePlus2 className="h-4 w-4" />
                        {actionLoadingMarkerId === marker.id ? '...' : marker.actionLabel}
                      </button>
                    ) : marker.actionUrl ? (
                      <a
                        href={marker.actionUrl}
                        className="btn-primary mt-2 flex w-full items-center justify-center gap-2 text-xs !text-white visited:!text-white hover:!text-white focus:!text-white no-underline"
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
