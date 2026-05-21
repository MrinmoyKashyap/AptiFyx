import { LocationRepository } from './repository';
import { IdentityRepository } from '../identity/repository';
import { eventBus } from '../../events/event-bus';
import { EventType } from '@aptifyx/shared-types';
import { logger } from '../../utils/logger';

export class LocationService {
  private repo = new LocationRepository();
  private identityRepo = new IdentityRepository(); // Need this to filter by skills

  async updateLocation(partnerId: string, longitude: number, latitude: number) {
    // Only update if they are marked as available
    const profile = await this.identityRepo.getPartnerProfile(partnerId);
    if (!profile || !profile.isAvailable) {
      throw new Error('Partner must be online to update location');
    }
    
    await this.repo.upsertPartnerLocation(partnerId, longitude, latitude);
    
    // Broadcast via Pub/Sub so websocket gateway can push to tracking customers
    await eventBus.publish({
      type: EventType.PARTNER_LOCATION_UPDATE,
      payload: { partnerId, longitude, latitude },
      timestamp: new Date().toISOString()
    });
  }

  async getNearbyPartners(longitude: number, latitude: number, radiusKm: number, categoryId?: string) {
    const nearby = await this.repo.findNearbyPartners(longitude, latitude, radiusKm);
    
    if (!categoryId) return nearby;

    // Fetch profiles to filter by skill
    const filtered = [];
    for (const match of nearby) {
      const profile = await this.identityRepo.getPartnerProfile(match.partnerId);
      if (profile && profile.skills.includes(categoryId)) {
        filtered.push({ ...match, profile });
      }
    }
    
    return filtered;
  }

  async broadcastJob(jobId: string, customerId: string, categoryId: string, longitude: number, latitude: number) {
    let radius = 5; // Initial 5km
    const maxRadius = 20;

    while (radius <= maxRadius) {
      const matches = await this.getNearbyPartners(longitude, latitude, radius, categoryId);
      
      if (matches.length > 0) {
        const partnerIds = matches.map(m => m.partnerId);
        
        await eventBus.publish({
          type: EventType.JOB_BROADCASTED,
          payload: { jobId, customerId, categoryId, matchedPartnerIds: partnerIds, radiusKm: radius },
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Broadcasted job ${jobId} to ${partnerIds.length} partners at ${radius}km radius`);
        return { success: true, matchedCount: partnerIds.length, radius };
      }
      
      // Expand radius if no matches (5 -> 10 -> 20)
      if (radius === 5) radius = 10;
      else if (radius === 10) radius = 20;
      else break;
    }

    logger.warn(`No partners found for job ${jobId} up to ${maxRadius}km`);
    return { success: false, matchedCount: 0, radius: maxRadius };
  }

  async removeLocation(partnerId: string) {
    await this.repo.removePartnerLocation(partnerId);
  }
}
