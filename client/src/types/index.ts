export interface User {
  _id: string;
  name: string;
  email: string;
  role: "donor" | "requester" | "admin";
  bloodGroup?: string;
  contactNumber?: string;
  availability?: boolean;
  trustRating?: number;
  ratingCount?: number;
  totalDonations?: number;
  lastDonationDate?: string;
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
  };
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: "low" | "medium" | "high" | "critical";
  location: Location;
  contactNumber: string;
  notes?: string;
  status: "pending" | "accepted" | "fulfilled" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalDonors: number;
  activeRequests: number;
  completedDonations: number;
  bloodGroupDistribution: { _id: string; count: number }[];
  averageResponseTimeMinutes: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
