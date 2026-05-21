import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { IdentityRepository } from './repository';
import { RegisterDTO, LoginDTO, AuthResponse, ActiveMode, EventType } from '@aptifyx/shared-types';
import { eventBus } from '../../events/event-bus';

export class IdentityService {
  private repo = new IdentityRepository();

  async register(data: RegisterDTO): Promise<AuthResponse> {
    const existing = await this.repo.getUserByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const hash = await bcrypt.hash(data.password || '', 10);
    const user = await this.repo.createUser(data.email, hash, data.name, data.phone);

    // Call ledger service to create wallet (this will be done synchronously via API or directly if monolithic)
    // Since we are monolithic right now, we can emit an event, or better yet, let the Ledger module listen to USER_CREATED
    // For now, we will handle wallet creation when they fetch it or via an explicit call to the Ledger module.
    
    const token = this.generateToken(user.id, user.activeMode, user.roles);
    return { token, user };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const userRecord = await this.repo.getUserByEmail(data.email);
    if (!userRecord) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password || '', userRecord.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const user = await this.repo.getUserById(userRecord.id);
    if (!user) throw new Error('User not found');

    const token = this.generateToken(user.id, user.activeMode, user.roles);
    return { token, user };
  }

  async switchMode(userId: string, mode: ActiveMode) {
    const user = await this.repo.getUserById(userId);
    if (!user) throw new Error('User not found');

    // If switching to partner, they must have the PARTNER role (i.e. completed setup)
    if (mode === ActiveMode.PARTNER && !user.roles.includes('partner' as any)) {
      throw new Error('Must complete partner setup before switching to partner mode');
    }

    await this.repo.updateActiveMode(userId, mode);
    
    // If switching back to customer, mark partner as offline
    if (mode === ActiveMode.CUSTOMER && user.roles.includes('partner' as any)) {
      await this.repo.setPartnerAvailability(userId, false);
      
      // Emit event so Location service can remove them from Redis
      await eventBus.publish({
        type: EventType.PARTNER_AVAILABILITY_CHANGED,
        payload: { partnerId: userId, isAvailable: false },
        timestamp: new Date().toISOString()
      });
    }

    return this.repo.getUserById(userId);
  }

  async setupPartner(userId: string, skills: string[], bio?: string, hourlyRate?: number) {
    const profile = await this.repo.createOrUpdatePartnerProfile(userId, skills, bio, hourlyRate);
    
    await eventBus.publish({
      type: EventType.PARTNER_AVAILABILITY_CHANGED,
      payload: { partnerId: userId, isAvailable: true },
      timestamp: new Date().toISOString()
    });

    return profile;
  }

  async getProfile(userId: string) {
    return this.repo.getUserById(userId);
  }

  async getPartnerProfile(userId: string) {
    return this.repo.getPartnerProfile(userId);
  }

  private generateToken(userId: string, activeMode: string, roles: string[]) {
    return jwt.sign(
      { userId, activeMode, roles },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }
}
