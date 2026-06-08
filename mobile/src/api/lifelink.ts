import { apiRequest } from './client';
import type { AuthPayload, BloodRequest, Donor, User } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  role: 'donor' | 'requester';
  bloodGroup?: string;
  contactNumber?: string;
}

export function login(input: LoginInput) {
  return apiRequest<AuthPayload>('/api/v1/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthPayload>('/api/v1/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(input),
  });
}

export function fetchProfile() {
  return apiRequest<{ user?: User } | User>('/api/v1/users/profile');
}

export function logout(refreshToken?: string) {
  return apiRequest<unknown>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function fetchRequests() {
  return apiRequest<BloodRequest[]>('/api/v1/requests');
}

export function fetchMyRequests() {
  return apiRequest<BloodRequest[] | { requests: BloodRequest[] }>('/api/v1/requests/my-requests');
}

export interface CreateRequestInput {
  patientName: string;
  hospitalName: string;
  requiredDate: string;
  expiresAt?: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    city?: string;
    zipCode?: string;
  };
  contactNumber: string;
  notes?: string;
}

export function createBloodRequest(input: CreateRequestInput) {
  return apiRequest<BloodRequest>('/api/v1/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchDonors() {
  return apiRequest<Donor[]>('/api/v1/donors');
}

export function fetchUserDonors() {
  return apiRequest<Donor[]>('/api/v1/users/donors');
}

export function fetchNearbyDonors(lat: number, lng: number, radiusMetres: number) {
  return apiRequest<Donor[]>(
    `/api/v1/donors/near?lat=${lat}&lng=${lng}&radius=${radiusMetres}`,
  );
}

export function fetchAdminStats() {
  return apiRequest<Record<string, unknown>>('/api/v1/admin/stats');
}

export function updateProfile(input: Partial<User>) {
  return apiRequest<{ user?: User } | User>('/api/v1/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
