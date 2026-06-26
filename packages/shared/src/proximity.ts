/** Distância em km entre dois pontos (Haversine). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export type GeoPoint = { latitude: number; longitude: number };

export function sortByDistance<T extends GeoPoint>(
  origin: GeoPoint,
  items: T[],
): (T & { distanceKm: number })[] {
  return items
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({
      ...i,
      distanceKm: haversineKm(
        origin.latitude,
        origin.longitude,
        i.latitude!,
        i.longitude!,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
