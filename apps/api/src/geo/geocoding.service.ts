import { Injectable, Logger } from '@nestjs/common';

export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    const trimmed = address.trim();
    if (!trimmed) return null;

    const apiKey = process.env.GEOCODING_API_KEY;
    if (apiKey) {
      try {
        const url = new URL(
          'https://maps.googleapis.com/maps/api/geocode/json',
        );
        url.searchParams.set('address', trimmed);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('region', 'br');
        const res = await fetch(url.toString());
        const data = (await res.json()) as {
          results?: { geometry: { location: { lat: number; lng: number } } }[];
          status?: string;
        };
        const loc = data.results?.[0]?.geometry?.location;
        if (loc) {
          return { latitude: loc.lat, longitude: loc.lng };
        }
      } catch (e) {
        this.logger.warn(`Google geocode failed: ${e}`);
      }
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', trimmed);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'br');
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'CHAMA-Interunesp/1.0' },
      });
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data[0]) {
        return {
          latitude: Number.parseFloat(data[0].lat),
          longitude: Number.parseFloat(data[0].lon),
        };
      }
    } catch (e) {
      this.logger.warn(`Nominatim geocode failed: ${e}`);
    }

    return null;
  }
}
