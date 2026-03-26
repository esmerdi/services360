import React from 'react';
import type LocationMap from './LocationMap';

const LocationMapLazy = React.lazy(() => import('./LocationMap'));

type LocationMapProps = React.ComponentProps<typeof LocationMap>;

export type { LocationMapMarker } from './LocationMap';

export default function LazyLocationMap(props: LocationMapProps) {
  const heightClassName = props.heightClassName ?? 'h-80';

  return (
    <React.Suspense
      fallback={<div className={`${heightClassName} w-full animate-pulse rounded-xl bg-slate-100`} />}
    >
      <LocationMapLazy {...props} />
    </React.Suspense>
  );
}
