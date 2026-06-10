package com.example.data.api

import com.example.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface LifeLinkService {

    // --- AUTHENTICATION ---
    @POST("api/v1/auth/register")
    suspend fun register(
        @Body body: Map<String, Any>
    ): Response<LoginResponse>

    @Multipart
    @POST("api/v1/auth/register-hospital")
    suspend fun registerHospitalMultipart(
        @PartMap fields: Map<String, @JvmSuppressWildcards RequestBody>,
        @Part document: MultipartBody.Part
    ): Response<LoginResponse>

    @POST("api/v1/auth/register-hospital")
    suspend fun registerHospitalJson(
        @Body body: Map<String, Any>
    ): Response<LoginResponse>

    @POST("api/v1/auth/login")
    suspend fun login(
        @Body body: Map<String, String>
    ): Response<LoginResponse>

    @POST("api/v1/auth/logout")
    suspend fun logout(
        @Body body: Map<String, String>
    ): Response<SuccessResponse>


    // --- USERS ---
    @GET("api/v1/users")
    suspend fun getAllUsers(): Response<List<User>>

    @GET("api/v1/users/donors")
    suspend fun getDonorsMap(): Response<List<User>>

    @GET("api/v1/users/profile")
    suspend fun getProfile(): Response<User>

    @PATCH("api/v1/users/profile")
    suspend fun updateProfile(
        @Body body: Map<String, Any>
    ): Response<User>


    // --- BLOOD REQUESTS ---
    @GET("api/v1/requests")
    suspend fun getAllRequests(): Response<List<BloodRequest>>

    @GET("api/v1/requests/map-data")
    suspend fun getPendingRequestsMap(): Response<List<BloodRequest>>

    @POST("api/v1/requests")
    suspend fun createRequest(
        @Body body: Map<String, Any>
    ): Response<BloodRequest>

    @Multipart
    @POST("api/v1/requests/verify-document")
    suspend fun verifyDocument(
        @Part document: MultipartBody.Part
    ): Response<DocumentVerification>

    @GET("api/v1/requests/my-requests")
    suspend fun getMyRequests(): Response<List<BloodRequest>>

    @GET("api/v1/requests/{id}/matches")
    suspend fun getRequestMatches(
        @Path("id") id: String
    ): Response<List<User>>

    @GET("api/v1/requests/{id}")
    suspend fun getRequestDetail(
        @Path("id") id: String
    ): Response<BloodRequest>


    // --- DONATIONS ---
    @POST("api/v1/donations/accept")
    suspend fun acceptRequest(
        @Body body: Map<String, String> // e.g {"requestId": "..."}
    ): Response<SuccessResponse>

    @GET("api/v1/donations/history")
    suspend fun getDonationHistory(): Response<List<DonationHistory>>

    @GET("api/v1/donations/leaderboard")
    suspend fun getLeaderboard(): Response<List<LeaderboardEntry>>


    // --- ADMIN ---
    @GET("api/v1/admin/stats")
    suspend fun getAdminStats(): Response<Stats>

    @GET("api/v1/admin/verifications")
    suspend fun getPendingVerifications(): Response<List<VerificationItem>>

    @PATCH("api/v1/admin/verifications/{id}/approve")
    suspend fun approveHospital(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/verifications/{id}/reject")
    suspend fun rejectHospital(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @GET("api/v1/admin/users")
    suspend fun getAdminUsers(): Response<List<User>>

    @PATCH("api/v1/admin/users/{id}/suspend")
    suspend fun suspendUser(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/users/{id}/activate")
    suspend fun activateUser(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/users/{id}/block")
    suspend fun blockUser(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @GET("api/v1/admin/requests")
    suspend fun getAdminRequests(): Response<List<BloodRequest>>

    @PATCH("api/v1/admin/requests/{id}/approve-emergency")
    suspend fun approveEmergency(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/requests/{id}/reject-emergency")
    suspend fun rejectEmergency(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/requests/{id}/fulfill")
    suspend fun fulfillRequest(
        @Path("id") id: String
    ): Response<SuccessResponse>

    @PATCH("api/v1/admin/requests/{id}/cancel")
    suspend fun cancelRequest(
        @Path("id") id: String,
        @Body body: Map<String, String> // optional reason e.g. {"reason": "..."}
    ): Response<SuccessResponse>

    @POST("api/v1/admin/alerts/emergency")
    suspend fun sendEmergencyAlert(
        @Body body: Map<String, String> // e.g. {"bloodGroup": "O-", "message": "...", "region": "..."}
    ): Response<SuccessResponse>

    @GET("api/v1/admin/audit-logs")
    suspend fun getAuditLogs(): Response<List<AuditLog>>


    // --- DONORS ---
    @GET("api/v1/donors")
    suspend fun getAllDonorsList(): Response<List<User>>

    @GET("api/v1/donors/near")
    suspend fun getNearDonors(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Double = 10000.0
    ): Response<List<User>>

    @GET("api/v1/donors/search")
    suspend fun searchDonorsByCity(
        @Query("city") city: String
    ): Response<List<User>>


    // --- CHAT ---
    @GET("api/v1/chat/inbox")
    suspend fun getChatInbox(): Response<List<User>> // Usually returns list of users peer has chatted with

    @GET("api/v1/chat/{peerId}")
    suspend fun getChatWithPeer(
        @Path("peerId") peerId: String
    ): Response<List<ChatMessage>>

    @POST("api/v1/chat/{peerId}")
    suspend fun sendChatMessage(
        @Path("peerId") peerId: String,
        @Body body: Map<String, String> // e.g. {"message": "..."}
    ): Response<ChatMessage>


    // --- NOTIFICATIONS ---
    @GET("api/v1/notifications")
    suspend fun getNotifications(): Response<List<NotificationItem>>

    @GET("api/v1/notifications/unread-count")
    suspend fun getUnreadNotificationsCount(): Response<Map<String, Int>>

    @PATCH("api/v1/notifications/{id}/read")
    suspend fun markNotificationRead(
        @Path("id") id: String
    ): Response<SuccessResponse>
}
