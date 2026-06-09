import { apiRequest } from './client';
import type { AuthPayload, BloodRequest, Donor, User, AdminStats, AdminReports, AdminAuditLog } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  role: 'donor' | 'requester' | 'hospital';
  bloodGroup?: string;
  contactNumber?: string;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    areaName?: string;
  };
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

export function registerHospital(formData: FormData) {
  return apiRequest<AuthPayload>('/api/v1/auth/register-hospital', {
    method: 'POST',
    skipAuth: true,
    body: formData,
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
  return apiRequest<AdminStats>('/api/v1/admin/stats');
}

export function fetchAdminUsers() {
  return apiRequest<User[]>('/api/v1/admin/users');
}

export function fetchAdminRequests() {
  return apiRequest<BloodRequest[]>('/api/v1/admin/requests');
}

export function fetchActionableRequests() {
  return apiRequest<BloodRequest[]>('/api/v1/admin/requests/actionable');
}

export function fetchAdminReports() {
  return apiRequest<AdminReports>('/api/v1/admin/reports');
}

export function fetchAdminAuditLogs() {
  return apiRequest<AdminAuditLog[]>('/api/v1/admin/audit-logs');
}

export function fetchVerifications() {
  return apiRequest<User[]>('/api/v1/admin/verifications');
}

export function handleVerification(id: string, action: 'approve' | 'reject', reason?: string) {
  return apiRequest<unknown>(`/api/v1/admin/verifications/${id}/${action}`, {
    method: 'PATCH',
    body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
  });
}

export function updateUserStatus(id: string, status: 'active' | 'suspended' | 'blocked') {
  return apiRequest<unknown>(`/api/v1/admin/users/${id}/${status}`, {
    method: 'PATCH',
  });
}

export function handleEmergencyRequest(id: string, action: 'approve' | 'reject', reason?: string) {
  return apiRequest<BloodRequest>(`/api/v1/admin/requests/${id}/${action}-emergency`, {
    method: 'PATCH',
    body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
  });
}

export function fulfillRequest(id: string) {
  return apiRequest<BloodRequest>(`/api/v1/admin/requests/${id}/fulfill`, {
    method: 'PATCH',
  });
}

export function cancelRequest(id: string, reason?: string) {
  return apiRequest<BloodRequest>(`/api/v1/admin/requests/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export function sendEmergencyAlert(input: { bloodGroup: string; message: string; region?: string }) {
  return apiRequest<unknown>('/api/v1/admin/alerts/emergency', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchDonationHistory() {
  return apiRequest<any[]>('/api/v1/donations/history');
}

export function fetchLeaderboard() {
  return apiRequest<any[]>('/api/v1/donations/leaderboard');
}

export function updateProfile(input: Partial<User>) {
  return apiRequest<{ user?: User } | User>('/api/v1/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
