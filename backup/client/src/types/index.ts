export interface User {
  _id: string;
  name: string;
  email: string;
  role: "donor" | "requester" | "hospital" | "admin";
  accountStatus?: "active" | "suspended" | "blocked";
  isVerified?: boolean;
  verification?: {
    documents?: Array<{ filename?: string; path?: string }>;
    aiSuggestedVerified?: boolean;
    aiConfidence?: number;
    aiDetails?: string;
    aiAutoApproved?: boolean;
  };
  bloodGroup?: string;
  contactNumber?: string;
  dateOfBirth?: string;
  weightKg?: number;
  medicalConditions?: string[];
  nextReminderAt?: string;
  reminderEnabled?: boolean;
  hospitalDetails?: {
    hospitalName?: string;
    registrationNumber?: string;
    licenseNumber?: string;
    gstNumber?: string;
    hospitalAddress?: string;
    hospitalEmail?: string;
    hospitalPhone?: string;
  };
  availability?: boolean;
  trustRating?: number;
  ratingCount?: number;
  totalDonations?: number;
  lastDonationDate?: string;
  achievements?: string[];
  location?: Location;
  createdAt: string;
  updatedAt: string;
}

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

export interface BloodRequest {
  _id: string;
  requesterid: {
    _id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    role?: string;
    accountStatus?: string;
  };
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: "low" | "medium" | "high" | "critical";
  location: Location;
  hospitalName?: string;
  requiredDate?: string;
  expiresAt?: string;
  contactNumber: string;
  notes?: string;
  status: "pending" | "accepted" | "fulfilled" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface DonationHistoryItem {
  _id: string;
  donorId: string;
  requestId: BloodRequest | string;
  donationDate: string;
  unitsDonated: number;
  status: 'completed' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonorLeaderboardEntry {
  donorId: string;
  name: string;
  bloodGroup?: string;
  availability?: boolean;
  trustRating?: number;
  totalDonations?: number;
  achievements?: string[];
  totalUnits: number;
  completedDonations: number;
  lastDonationDate?: string;
  rank: number;
  badge: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalDonors: number;
  activeDonors: number;
  activeRequests: number;
  completedDonations: number;
  bloodRequestsToday: number;
  emergencyRequests: number;
  fulfilledRequests: number;
  bloodGroupDistribution: { _id: string; count: number }[];
  requestStatusDistribution: { _id: string; count: number }[];
  averageResponseTimeMinutes: string;
}

export interface AdminReports {
  hospitalActivity: { _id: string; totalRequests: number; fulfilledRequests: number; cancelledRequests: number }[];
  requestFulfillment: { _id: string; count: number }[];
  donationHistory: { _id: string; count: number; unitsDonated: number }[];
}

export interface AdminAuditLog {
  _id: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  actorId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
