package com.example.data.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class Location(
    @Json(name = "latitude") val latitude: Double? = null,
    @Json(name = "longitude") val longitude: Double? = null,
    @Json(name = "address") val address: String? = null,
    @Json(name = "country") val country: String? = null,
    @Json(name = "state") val state: String? = null,
    @Json(name = "city") val city: String? = null,
    @Json(name = "zipCode") val zipCode: String? = null,
    @Json(name = "areaName") val areaName: String? = null
)

@JsonClass(generateAdapter = true)
data class User(
    @Json(name = "_id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "email") val email: String,
    @Json(name = "role") val role: String, // donor | requester | hospital | admin
    @Json(name = "bloodGroup") val bloodGroup: String? = null,
    @Json(name = "contactNumber") val contactNumber: String? = null,
    @Json(name = "location") val location: Location? = null,
    @Json(name = "status") val status: String? = null, // active | suspended | blocked
    @Json(name = "availability") val availability: Boolean? = null,
    @Json(name = "hospitalName") val hospitalName: String? = null,
    @Json(name = "registrationNumber") val registrationNumber: String? = null,
    @Json(name = "licenseNumber") val licenseNumber: String? = null,
    @Json(name = "hospitalAddress") val hospitalAddress: String? = null,
    @Json(name = "hospitalEmail") val hospitalEmail: String? = null,
    @Json(name = "hospitalPhone") val hospitalPhone: String? = null,
    @Json(name = "weightKg") val weightKg: Double? = null,
    @Json(name = "medicalConditions") val medicalConditions: List<String>? = null,
    @Json(name = "isVerified") val isVerified: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    @Json(name = "success") val success: Boolean = false,
    @Json(name = "token") val token: String? = null,
    @Json(name = "user") val user: User? = null,
    @Json(name = "message") val message: String? = null
)

@JsonClass(generateAdapter = true)
data class BloodRequest(
    @Json(name = "_id") val id: String,
    @Json(name = "patientName") val patientName: String,
    @Json(name = "hospitalName") val hospitalName: String,
    @Json(name = "requiredDate") val requiredDate: String,
    @Json(name = "expiresAt") val expiresAt: String? = null,
    @Json(name = "bloodGroup") val bloodGroup: String,
    @Json(name = "unitsRequired") val unitsRequired: Int,
    @Json(name = "urgency") val urgency: String, // low | medium | high | critical
    @Json(name = "location") val location: Location,
    @Json(name = "contactNumber") val contactNumber: String,
    @Json(name = "notes") val notes: String? = null,
    @Json(name = "status") val status: String = "pending", // pending | approved | fulfilled | cancelled
    @Json(name = "isEmergency") val isEmergency: Boolean? = null,
    @Json(name = "requester") val requester: String? = null,
    @Json(name = "createdAt") val createdAt: String? = null,
    @Json(name = "documentVerification") val documentVerification: DocumentVerification? = null
)

@JsonClass(generateAdapter = true)
data class DocumentVerification(
    @Json(name = "isVerified") val isVerified: Boolean,
    @Json(name = "confidence") val confidence: Double? = null,
    @Json(name = "hospitalName") val hospitalName: String? = null,
    @Json(name = "documentType") val documentType: String? = null,
    @Json(name = "patientName") val patientName: String? = null,
    @Json(name = "bloodGroup") val bloodGroup: String? = null,
    @Json(name = "details") val details: String? = null,
    @Json(name = "flags") val flags: List<String>? = null
)

@JsonClass(generateAdapter = true)
data class Stats(
    @Json(name = "totalUsers") val totalUsers: Int? = 0,
    @Json(name = "totalRequests") val totalRequests: Int? = 0,
    @Json(name = "totalDonors") val totalDonors: Int? = 0,
    @Json(name = "totalHospitals") val totalHospitals: Int? = 0,
    @Json(name = "pendingVerifications") val pendingVerifications: Int? = 0,
    @Json(name = "activeHospitals") val activeHospitals: Int? = 0,
    @Json(name = "fulfilledRequests") val fulfilledRequests: Int? = 0
)

@JsonClass(generateAdapter = true)
data class LeaderboardEntry(
    @Json(name = "user") val user: User,
    @Json(name = "donationCount") val donationCount: Int
)

@JsonClass(generateAdapter = true)
data class DonationHistory(
    @Json(name = "_id") val id: String,
    @Json(name = "requestId") val requestId: String,
    @Json(name = "donorId") val donorId: String,
    @Json(name = "status") val status: String,
    @Json(name = "createdAt") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class VerificationItem(
    @Json(name = "_id") val id: String,
    @Json(name = "hospitalDetails") val hospitalDetails: User,
    @Json(name = "documentUrl") val documentUrl: String? = null,
    @Json(name = "status") val status: String
)

@JsonClass(generateAdapter = true)
data class NotificationItem(
    @Json(name = "_id") val id: String,
    @Json(name = "message") val message: String,
    @Json(name = "isRead") val isRead: Boolean,
    @Json(name = "createdAt") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class ChatMessage(
    @Json(name = "_id") val id: String,
    @Json(name = "senderId") val senderId: String,
    @Json(name = "receiverId") val receiverId: String,
    @Json(name = "message") val message: String,
    @Json(name = "createdAt") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class AuditLog(
    @Json(name = "_id") val id: String,
    @Json(name = "action") val action: String,
    @Json(name = "performedBy") val performedBy: String,
    @Json(name = "details") val details: String,
    @Json(name = "createdAt") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class SuccessResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String? = null
)
