import { tool } from "ai";
import { z } from "zod";

async function geocodeLocation(query: string): Promise<{
  latitude: number;
  longitude: number;
  displayName: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "LioAI/1.0" } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

export async function executeGetMap(input: { query: string; zoom?: number }) {
  const { query, zoom = 13 } = input;
  const result = await geocodeLocation(query);
  if (!result) {
    return { error: `Could not find a location for "${query}". Try being more specific.` };
  }
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    displayName: result.displayName,
    query,
    zoom,
    embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.03},${result.latitude - 0.02},${result.longitude + 0.03},${result.latitude + 0.02}&layer=mapnik&marker=${result.latitude},${result.longitude}`,
    linkUrl: `https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}#map=${zoom}/${result.latitude}/${result.longitude}`,
  };
}

export const getMap = tool({
  description:
    "Show an interactive map for a location. Use this when the user asks to see a map, directions, or wants to find places nearby.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The place or address to show on the map (e.g. 'Paris, France', 'Times Square New York', 'coffee shops near Austin TX')"),
    zoom: z
      .number()
      .min(1)
      .max(18)
      .optional()
      .describe("Zoom level (1-18). Default 13 for cities, 16 for streets."),
  }),
  execute: async ({ query, zoom = 13 }) => {
    const result = await geocodeLocation(query);
    if (!result) {
      return { error: `Could not find a location for "${query}". Try being more specific.` };
    }
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
      query,
      zoom,
      embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.03},${result.latitude - 0.02},${result.longitude + 0.03},${result.latitude + 0.02}&layer=mapnik&marker=${result.latitude},${result.longitude}`,
      linkUrl: `https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}#map=${zoom}/${result.latitude}/${result.longitude}`,
    };
  },
});
