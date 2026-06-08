export type UserRole = 'donor' | 'requester' | 'hospital' | 'admin';

export interface Location {
  type?: string;
  coordinates?: [number, number];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  areaName?: string;
  country?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  bloodGroup?: string;
  contactNumber?: string;
  availability?: boolean;
  trustRating?: number;
  totalDonations?: number;
  lastDonationDate?: string;
  location?: Location;
  accountStatus?: 'active' | 'suspended' | 'blocked';
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodRequest {
  _id: string;
  requesterid:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        contactNumber?: string;
        role?: string;
      };
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location?: Location;
  hospitalName?: string;
  requiredDate?: string;
  contactNumber: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Donor extends User {
  bloodGroup: string;
  availability: boolean;
  distance?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthPayload {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}
