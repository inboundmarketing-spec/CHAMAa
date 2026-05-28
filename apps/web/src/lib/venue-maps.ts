export function venueMapsUrl(venue: {
  name: string;
  address: string;
  mapUrl?: string | null;
}): string {
  if (venue.mapUrl) return venue.mapUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venue.name}, ${venue.address}`,
  )}`;
}
