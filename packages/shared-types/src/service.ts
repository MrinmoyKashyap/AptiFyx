export interface ServiceCategory {
  id: string;
  name: string; // e.g. "Plumbing", "Electrical", "Cleaning"
  icon: string; // e.g. a URL or an icon name like "wrench", "bolt"
  isApproved: boolean; // Must be true to show up in the default list
  createdAt?: string;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  skills: string[]; // Array of ServiceCategory IDs
  bio?: string;
  hourlyRate?: number;
  rating: number; // 0.0 to 5.0
  totalJobs: number;
  totalRatings: number;
  isAvailable: boolean;
  createdAt: string;
}
