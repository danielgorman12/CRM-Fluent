export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

// Server-side only: Nominatim's usage policy requires a descriptive User-Agent
// and a courtesy rate limit (~1 req/sec), and this is called once per
// prospect create/update rather than on every page render, so it stays well
// within policy at realistic M&A sourcing-list volumes.
export async function geocodeLocation(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): Promise<GeocodeResult | null> {
  const query = [parts.city, parts.region, parts.country].filter(Boolean).join(", ");
  if (!query) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CRM-Fluent/1.0 (Fluent Software Group M&A sourcing tool)",
      },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;

    return { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
