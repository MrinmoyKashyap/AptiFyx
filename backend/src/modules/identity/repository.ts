import { pgPool } from '../../config/postgres';
import { UserProfile, PartnerProfile, UserRole, ActiveMode } from '@aptifyx/shared-types';

export class IdentityRepository {
  async createUser(email: string, passwordHash: string, name: string, phone?: string): Promise<UserProfile> {
    const query = `
      INSERT INTO users (email, password_hash, name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, phone, avatar_url as "avatarUrl", active_mode as "activeMode", roles, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await pgPool.query(query, [email, passwordHash, name, phone]);
    return rows[0];
  }

  async getUserByEmail(email: string) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const { rows } = await pgPool.query(query, [email]);
    return rows[0]; // Includes password_hash
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT id, email, name, phone, avatar_url as "avatarUrl", active_mode as "activeMode", roles, created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE id = $1
    `;
    const { rows } = await pgPool.query(query, [id]);
    return rows[0] || null;
  }

  async updateActiveMode(userId: string, mode: ActiveMode): Promise<void> {
    await pgPool.query(`UPDATE users SET active_mode = $1, updated_at = NOW() WHERE id = $2`, [mode, userId]);
  }

  async createOrUpdatePartnerProfile(userId: string, skills: string[], bio?: string, hourlyRate?: number): Promise<PartnerProfile> {
    const query = `
      INSERT INTO partner_profiles (user_id, skills, bio, hourly_rate)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET 
        skills = EXCLUDED.skills, 
        bio = EXCLUDED.bio, 
        hourly_rate = EXCLUDED.hourly_rate,
        is_available = true
      RETURNING id, user_id as "userId", skills, bio, hourly_rate as "hourlyRate", rating, total_jobs as "totalJobs", total_ratings as "totalRatings", is_available as "isAvailable", created_at as "createdAt"
    `;
    const { rows } = await pgPool.query(query, [userId, skills, bio, hourlyRate]);
    
    // Ensure the user has the PARTNER role
    await pgPool.query(`
      UPDATE users 
      SET roles = array_append(roles, $1) 
      WHERE id = $2 AND NOT ($1 = ANY(roles))
    `, [UserRole.PARTNER, userId]);

    return rows[0];
  }

  async getPartnerProfile(userId: string): Promise<PartnerProfile | null> {
    const query = `
      SELECT id, user_id as "userId", skills, bio, hourly_rate as "hourlyRate", rating, total_jobs as "totalJobs", total_ratings as "totalRatings", is_available as "isAvailable", created_at as "createdAt"
      FROM partner_profiles WHERE user_id = $1
    `;
    const { rows } = await pgPool.query(query, [userId]);
    return rows[0] || null;
  }

  async setPartnerAvailability(userId: string, isAvailable: boolean): Promise<void> {
    await pgPool.query(`UPDATE partner_profiles SET is_available = $1 WHERE user_id = $2`, [isAvailable, userId]);
  }
}
