import { redisClient } from '../../config/redis';
import { GeoSearchResult } from '@aptifyx/shared-types';

const GEO_KEY = 'partners:geo';

export class LocationRepository {
  async upsertPartnerLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
    await redisClient.geoadd(GEO_KEY, longitude, latitude, partnerId);
  }

  async removePartnerLocation(partnerId: string): Promise<void> {
    await redisClient.zrem(GEO_KEY, partnerId);
  }

  async findNearbyPartners(longitude: number, latitude: number, radiusKm: number, count: number = 20): Promise<GeoSearchResult[]> {
    // Return distance in km
    const results = await redisClient.geosearch(
      GEO_KEY,
      'FROMLONLAT', longitude, latitude,
      'BYRADIUS', radiusKm, 'km',
      'ASC',
      'WITHDIST',
      'COUNT', count
    );
    
    return results.map((res: any) => ({
      partnerId: res[0],
      distance: parseFloat(res[1])
    }));
  }
}
