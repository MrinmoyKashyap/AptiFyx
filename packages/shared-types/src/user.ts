export enum UserRole {
  CUSTOMER = 'customer',
  PARTNER = 'partner',
  ADMIN = 'admin'
}

export enum ActiveMode {
  CUSTOMER = 'customer',
  PARTNER = 'partner'
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  activeMode: ActiveMode;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDTO {
  email: string;
  password?: string; // Optional if using OAuth later
  name: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}
