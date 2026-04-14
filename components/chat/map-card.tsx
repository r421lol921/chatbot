"use client";

import { ExternalLinkIcon, MapPinIcon } from "lucide-react";

type MapResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  query: string;
  zoom: number;
  embedUrl: string;
  linkUrl: string;
};

export function MapCard({ mapData }: { mapData: MapResult }) {
  const shortName = mapData.displayName.split(",").slice(0, 2).join(",");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="size-3.5 text-red-500" />
          <span className="font-medium text-[13px] text-foreground truncate max-w-[260px]">
            {shortName}
          </span>
        </div>
        <a
          href={mapData.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Open map
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>

      {/* Map embed */}
      <div className="relative w-full" style={{ height: 280 }}>
        <iframe
          src={mapData.embedUrl}
          className="h-full w-full border-0"
          title={`Map of ${mapData.query}`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 text-[11px] text-muted-foreground">
        Map data &copy;{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          OpenStreetMap contributors
        </a>
      </div>
    </div>
  );
}
