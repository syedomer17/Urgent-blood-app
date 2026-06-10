package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.api.RetrofitClient
import com.example.data.api.SessionManager
import com.example.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class RequestState<out T> {
    object Idle : RequestState<Nothing>()
    object Loading : RequestState<Nothing>()
    data class Success<out T>(val data: T) : RequestState<T>()
    data class Error(val message: String) : RequestState<Nothing>()
}

sealed class Screen {
    object Splash : Screen()
    object Login : Screen()
    object Register : Screen()
    object RegisterHospital : Screen()
    object MainDashboard : Screen()
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application)

    // Current Navigation State
    private val _currentScreen = MutableStateFlow<Screen>(Screen.Splash)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    // Dashboard State
    private val _selectedTab = MutableStateFlow(0)
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    // Retrofit states
    private val _loginState = MutableStateFlow<RequestState<LoginResponse>>(RequestState.Idle)
    val loginState: StateFlow<RequestState<LoginResponse>> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<RequestState<LoginResponse>>(RequestState.Idle)
    val registerState: StateFlow<RequestState<LoginResponse>> = _registerState.asStateFlow()

    private val _profileState = MutableStateFlow<RequestState<User>>(RequestState.Idle)
    val profileState: StateFlow<RequestState<User>> = _profileState.asStateFlow()

    private val _requestsState = MutableStateFlow<RequestState<List<BloodRequest>>>(RequestState.Idle)
    val requestsState: StateFlow<RequestState<List<BloodRequest>>> = _requestsState.asStateFlow()

    private val _myRequestsState = MutableStateFlow<RequestState<List<BloodRequest>>>(RequestState.Idle)
    val myRequestsState: StateFlow<RequestState<List<BloodRequest>>> = _myRequestsState.asStateFlow()

    private val _leaderboardState = MutableStateFlow<RequestState<List<LeaderboardEntry>>>(RequestState.Idle)
    val leaderboardState: StateFlow<RequestState<List<LeaderboardEntry>>> = _leaderboardState.asStateFlow()

    private val _donationHistoryState = MutableStateFlow<RequestState<List<DonationHistory>>>(RequestState.Idle)
    val donationHistoryState: StateFlow<RequestState<List<DonationHistory>>> = _donationHistoryState.asStateFlow()

    private val _donorsState = MutableStateFlow<RequestState<List<User>>>(RequestState.Idle)
    val donorsState: StateFlow<RequestState<List<User>>> = _donorsState.asStateFlow()

    private val _adminStatsState = MutableStateFlow<RequestState<Stats>>(RequestState.Idle)
    val adminStatsState: StateFlow<RequestState<Stats>> = _adminStatsState.asStateFlow()

    private val _adminVerificationsState = MutableStateFlow<RequestState<List<VerificationItem>>>(RequestState.Idle)
    val adminVerificationsState: StateFlow<RequestState<List<VerificationItem>>> = _adminVerificationsState.asStateFlow()

    private val _adminUsersState = MutableStateFlow<RequestState<List<User>>>(RequestState.Idle)
    val adminUsersState: StateFlow<RequestState<List<User>>> = _adminUsersState.asStateFlow()

    private val _adminRequestsState = MutableStateFlow<RequestState<List<BloodRequest>>>(RequestState.Idle)
    val adminRequestsState: StateFlow<RequestState<List<BloodRequest>>> = _adminRequestsState.asStateFlow()

    private val _auditLogsState = MutableStateFlow<RequestState<List<AuditLog>>>(RequestState.Idle)
    val auditLogsState: StateFlow<RequestState<List<AuditLog>>> = _auditLogsState.asStateFlow()

    private val _notificationsState = MutableStateFlow<RequestState<List<NotificationItem>>>(RequestState.Idle)
    val notificationsState: StateFlow<RequestState<List<NotificationItem>>> = _notificationsState.asStateFlow()

    private val _inboxState = MutableStateFlow<RequestState<List<User>>>(RequestState.Idle)
    val inboxState: StateFlow<RequestState<List<User>>> = _inboxState.asStateFlow()

    private val _chatMessagesState = MutableStateFlow<RequestState<List<ChatMessage>>>(RequestState.Idle)
    val chatMessagesState: StateFlow<RequestState<List<ChatMessage>>> = _chatMessagesState.asStateFlow()

    init {
        // Initialize RetrofitClient session properties
        RetrofitClient.init(sessionManager)
        checkSession()
    }

    fun navigateTo(screen: Screen) {
        _currentScreen.value = screen
    }

    fun setTab(index: Int) {
        _selectedTab.value = index
    }

    private fun checkSession() {
        viewModelScope.launch {
            val hasToken = sessionManager.token != null
            val storedUser = sessionManager.user
            if (hasToken && storedUser != null) {
                _currentUser.value = storedUser
                _currentScreen.value = Screen.MainDashboard
                // Refresh profile in background
                fetchProfile()
            } else {
                _currentScreen.value = Screen.Login
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.login(mapOf("email" to email, "password" to password))
                if (response.isSuccessful && response.body() != null) {
                    val loginRes = response.body()!!
                    if (loginRes.token != null && loginRes.user != null) {
                        sessionManager.token = loginRes.token
                        sessionManager.user = loginRes.user
                        _currentUser.value = loginRes.user
                        _loginState.value = RequestState.Success(loginRes)
                        _currentScreen.value = Screen.MainDashboard
                        // Reset tab
                        _selectedTab.value = 0
                    } else {
                        _loginState.value = RequestState.Error(loginRes.message ?: "Authentication failed")
                    }
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Invalid login credentials"
                    _loginState.value = RequestState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _loginState.value = RequestState.Error(e.localizedMessage ?: "Network connection failed")
            }
        }
    }

    fun register(name: String, email: String, password: String, role: String, bloodGroup: String, contactNumber: String, city: String, state: String) {
        viewModelScope.launch {
            _registerState.value = RequestState.Loading
            try {
                val body = mutableMapOf<String, Any>(
                    "name" to name,
                    "email" to email,
                    "password" to password,
                    "role" to role
                )
                if (role == "donor") {
                    body["bloodGroup"] = bloodGroup
                }
                if (contactNumber.isNotEmpty()) {
                    body["contactNumber"] = contactNumber
                }
                body["location"] = mapOf(
                    "city" to city,
                    "state" to state,
                    "address" to "$city, $state",
                    "country" to "India"
                )

                val response = RetrofitClient.service.register(body)
                if (response.isSuccessful && response.body() != null) {
                    val loginRes = response.body()!!
                    if (loginRes.token != null && loginRes.user != null) {
                        sessionManager.token = loginRes.token
                        sessionManager.user = loginRes.user
                        _currentUser.value = loginRes.user
                        _registerState.value = RequestState.Success(loginRes)
                        _currentScreen.value = Screen.MainDashboard
                        _selectedTab.value = 0
                    } else {
                        _registerState.value = RequestState.Error(loginRes.message ?: "Registration failed")
                    }
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Email already registered or invalid registration data"
                    _registerState.value = RequestState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _registerState.value = RequestState.Error(e.localizedMessage ?: "Network connection failed")
            }
        }
    }

    fun registerHospital(
        name: String, email: String, password: String, contactNumber: String,
        hospitalName: String, registrationNumber: String, licenseNumber: String,
        hospitalAddress: String, hospitalEmail: String, hospitalPhone: String,
        city: String, state: String
    ) {
        viewModelScope.launch {
            _registerState.value = RequestState.Loading
            try {
                val body = mutableMapOf<String, Any>(
                    "name" to name,
                    "email" to email,
                    "password" to password,
                    "role" to "hospital",
                    "contactNumber" to contactNumber,
                    "hospitalName" to hospitalName,
                    "registrationNumber" to registrationNumber,
                    "licenseNumber" to licenseNumber,
                    "hospitalAddress" to hospitalAddress,
                    "hospitalEmail" to hospitalEmail,
                    "hospitalPhone" to hospitalPhone,
                    "location" to mapOf(
                        "city" to city,
                        "state" to state,
                        "address" to hospitalAddress,
                        "country" to "India"
                    )
                )

                // The endpoints provide standard JSON body register-hospital fallback or Multipart
                val response = RetrofitClient.service.registerHospitalJson(body)
                if (response.isSuccessful && response.body() != null) {
                    val loginRes = response.body()!!
                    if (loginRes.token != null && loginRes.user != null) {
                        sessionManager.token = loginRes.token
                        sessionManager.user = loginRes.user
                        _currentUser.value = loginRes.user
                        _registerState.value = RequestState.Success(loginRes)
                        _currentScreen.value = Screen.MainDashboard
                        _selectedTab.value = 0
                    } else {
                        _registerState.value = RequestState.Error(loginRes.message ?: "Hospital registration failed")
                    }
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Hospital registration values invalid or already in use"
                    _registerState.value = RequestState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _registerState.value = RequestState.Error(e.localizedMessage ?: "Network connection failed")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                _loginState.value = RequestState.Idle
                _registerState.value = RequestState.Idle
                val oldToken = sessionManager.token ?: ""
                RetrofitClient.service.logout(mapOf("refreshToken" to oldToken))
            } catch (e: Exception) {
                // Ignore logout call failures - logout anyway locally
            } finally {
                sessionManager.clear()
                _currentUser.value = null
                _currentScreen.value = Screen.Login
                _selectedTab.value = 0
            }
        }
    }

    // --- USER PROFILE LOAD ---
    fun fetchProfile() {
        viewModelScope.launch {
            _profileState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getProfile()
                if (response.isSuccessful && response.body() != null) {
                    val userProfile = response.body()!!
                    sessionManager.user = userProfile
                    _currentUser.value = userProfile
                    _profileState.value = RequestState.Success(userProfile)
                } else {
                    _profileState.value = RequestState.Error("Session expired or user profile query failed")
                }
            } catch (e: Exception) {
                _profileState.value = RequestState.Error(e.localizedMessage ?: "Check your connection")
            }
        }
    }

    fun updateProfile(bloodGroup: String, availability: Boolean, weight: Double, conditions: List<String>) {
        viewModelScope.launch {
            try {
                val body = mapOf<String, Any>(
                    "bloodGroup" to bloodGroup,
                    "availability" to availability,
                    "weightKg" to weight,
                    "medicalConditions" to conditions
                )
                val response = RetrofitClient.service.updateProfile(body)
                if (response.isSuccessful && response.body() != null) {
                    val updated = response.body()!!
                    sessionManager.user = updated
                    _currentUser.value = updated
                    _profileState.value = RequestState.Success(updated)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // --- BLOOD REQUESTS FLOW ---
    fun fetchAllRequests() {
        viewModelScope.launch {
            _requestsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAllRequests()
                if (response.isSuccessful && response.body() != null) {
                    _requestsState.value = RequestState.Success(response.body()!!)
                } else {
                    _requestsState.value = RequestState.Error("Failed to load requests")
                }
            } catch (e: Exception) {
                _requestsState.value = RequestState.Error(e.localizedMessage ?: "Failed to reach servers")
            }
        }
    }

    fun fetchMyRequests() {
        viewModelScope.launch {
            _myRequestsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getMyRequests()
                if (response.isSuccessful && response.body() != null) {
                    _myRequestsState.value = RequestState.Success(response.body()!!)
                } else {
                    _myRequestsState.value = RequestState.Error("Failed to fetch custom requests")
                }
            } catch (e: Exception) {
                _myRequestsState.value = RequestState.Error(e.localizedMessage ?: "Offline or loading error")
            }
        }
    }

    fun createBloodRequest(
        patientName: String, hospitalName: String, requiredDate: String,
        bloodGroup: String, units: Int, urgency: String, contact: String, notes: String,
        city: String, state: String, isEmergency: Boolean = false
    ) {
        viewModelScope.launch {
            try {
                val body = mapOf<String, Any>(
                    "patientName" to patientName,
                    "hospitalName" to hospitalName,
                    "requiredDate" to requiredDate,
                    "bloodGroup" to bloodGroup,
                    "unitsRequired" to units,
                    "urgency" to urgency,
                    "contactNumber" to contact,
                    "notes" to notes,
                    "location" to mapOf(
                        "city" to city,
                        "state" to state,
                        "address" to "$hospitalName, $city, $state",
                        "latitude" to 12.971598,
                        "longitude" to 77.594562
                    )
                )
                val response = RetrofitClient.service.createRequest(body)
                if (response.isSuccessful) {
                    // Refresh requests
                    fetchMyRequests()
                    fetchAllRequests()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // --- DONORS LEADERBOARD & ACCEPT FLOW ---
    fun fetchLeaderboard() {
        viewModelScope.launch {
            _leaderboardState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getLeaderboard()
                if (response.isSuccessful && response.body() != null) {
                    _leaderboardState.value = RequestState.Success(response.body()!!)
                } else {
                    _leaderboardState.value = RequestState.Error("Could not retrieve leaderboard")
                }
            } catch (e: Exception) {
                _leaderboardState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    fun fetchDonors() {
        viewModelScope.launch {
            _donorsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAllDonorsList()
                if (response.isSuccessful && response.body() != null) {
                    _donorsState.value = RequestState.Success(response.body()!!)
                } else {
                    _donorsState.value = RequestState.Error("Fail to load donor data")
                }
            } catch (e: Exception) {
                _donorsState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    fun searchDonors(city: String) {
        viewModelScope.launch {
            _donorsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.searchDonorsByCity(city)
                if (response.isSuccessful && response.body() != null) {
                    _donorsState.value = RequestState.Success(response.body()!!)
                } else {
                    _donorsState.value = RequestState.Error("Fail to find donors")
                }
            } catch (e: Exception) {
                _donorsState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    fun acceptBloodRequest(requestId: String, onComplete: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.acceptRequest(mapOf("requestId" to requestId))
                if (response.isSuccessful) {
                    fetchDonationHistory()
                    fetchAllRequests()
                    onComplete(true, "Thank you! Registration of accept is successful.")
                } else {
                    val msg = response.errorBody()?.string() ?: "Failed to accept blood donation request"
                    onComplete(false, msg)
                }
            } catch (e: Exception) {
                onComplete(false, "Connection error: ${e.localizedMessage}")
            }
        }
    }

    fun fetchDonationHistory() {
        viewModelScope.launch {
            _donationHistoryState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getDonationHistory()
                if (response.isSuccessful && response.body() != null) {
                    _donationHistoryState.value = RequestState.Success(response.body()!!)
                } else {
                    _donationHistoryState.value = RequestState.Idle
                }
            } catch (e: Exception) {
                _donationHistoryState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    // --- CHAT INBOX FLOW ---
    fun fetchChatInbox() {
        viewModelScope.launch {
            _inboxState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getChatInbox()
                if (response.isSuccessful && response.body() != null) {
                    _inboxState.value = RequestState.Success(response.body()!!)
                } else {
                    _inboxState.value = RequestState.Success(emptyList())
                }
            } catch (e: Exception) {
                _inboxState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    fun fetchChatMessages(peerId: String) {
        viewModelScope.launch {
            _chatMessagesState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getChatWithPeer(peerId)
                if (response.isSuccessful && response.body() != null) {
                    _chatMessagesState.value = RequestState.Success(response.body()!!)
                } else {
                    _chatMessagesState.value = RequestState.Success(emptyList())
                }
            } catch (e: Exception) {
                _chatMessagesState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    fun sendChatMessage(peerId: String, text: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.sendChatMessage(peerId, mapOf("message" to text))
                if (response.isSuccessful) {
                    fetchChatMessages(peerId)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // --- NOTIFICATIONS FLOW ---
    fun fetchNotifications() {
        viewModelScope.launch {
            _notificationsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getNotifications()
                if (response.isSuccessful && response.body() != null) {
                    _notificationsState.value = RequestState.Success(response.body()!!)
                } else {
                    _notificationsState.value = RequestState.Idle
                }
            } catch (e: Exception) {
                _notificationsState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }

    // --- ADMIN ACTION ENDPOINTS ---
    fun fetchAdminStats() {
        viewModelScope.launch {
            _adminStatsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAdminStats()
                if (response.isSuccessful && response.body() != null) {
                    _adminStatsState.value = RequestState.Success(response.body()!!)
                } else {
                    _adminStatsState.value = RequestState.Error("Failed to fetch analytics stats")
                }
            } catch (e: Exception) {
                _adminStatsState.value = RequestState.Error(e.localizedMessage ?: "Server down")
            }
        }
    }

    fun fetchAdminVerifications() {
        viewModelScope.launch {
            _adminVerificationsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getPendingVerifications()
                if (response.isSuccessful && response.body() != null) {
                    _adminVerificationsState.value = RequestState.Success(response.body()!!)
                } else {
                    _adminVerificationsState.value = RequestState.Error("Failed to fetch pending registration verifications")
                }
            } catch (e: Exception) {
                _adminVerificationsState.value = RequestState.Error(e.localizedMessage ?: "Server down")
            }
        }
    }

    fun approveHospitalVerification(verificationId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.approveHospital(verificationId)
                if (response.isSuccessful) {
                    fetchAdminVerifications()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun rejectHospitalVerification(verificationId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.rejectHospital(verificationId)
                if (response.isSuccessful) {
                    fetchAdminVerifications()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun fetchAdminUsers() {
        viewModelScope.launch {
            _adminUsersState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAdminUsers()
                if (response.isSuccessful && response.body() != null) {
                    _adminUsersState.value = RequestState.Success(response.body()!!)
                } else {
                    _adminUsersState.value = RequestState.Error("Failed to load user directories")
                }
            } catch (e: Exception) {
                _adminUsersState.value = RequestState.Error(e.localizedMessage ?: "Disconnect error")
            }
        }
    }

    fun suspendUserAccount(userId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.suspendUser(userId)
                if (response.isSuccessful) {
                    fetchAdminUsers()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun activateUserAccount(userId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.activateUser(userId)
                if (response.isSuccessful) {
                    fetchAdminUsers()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun blockUserAccount(userId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.blockUser(userId)
                if (response.isSuccessful) {
                    fetchAdminUsers()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun fetchAdminRequests() {
        viewModelScope.launch {
            _adminRequestsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAdminRequests()
                if (response.isSuccessful && response.body() != null) {
                    _adminRequestsState.value = RequestState.Success(response.body()!!)
                } else {
                    _adminRequestsState.value = RequestState.Error("Could not retrieve system-wide request logs")
                }
            } catch (e: Exception) {
                _adminRequestsState.value = RequestState.Error(e.localizedMessage ?: "Disconnect")
            }
        }
    }

    fun approveEmergencyRequest(requestId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.approveEmergency(requestId)
                if (response.isSuccessful) {
                    fetchAdminRequests()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun rejectEmergencyRequest(requestId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.rejectEmergency(requestId)
                if (response.isSuccessful) {
                    fetchAdminRequests()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun fulfillRequest(requestId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.fulfillRequest(requestId)
                if (response.isSuccessful) {
                    fetchAdminRequests()
                    fetchAllRequests()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun cancelRequest(requestId: String, reason: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.cancelRequest(requestId, if (reason.isNotEmpty()) mapOf("reason" to reason) else emptyMap())
                if (response.isSuccessful) {
                    fetchAdminRequests()
                    fetchAllRequests()
                    fetchMyRequests()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun sendSystemEmergencyAlert(bloodGroup: String, message: String, region: String, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.service.sendEmergencyAlert(
                    mapOf("bloodGroup" to bloodGroup, "message" to message, "region" to region)
                )
                onComplete(response.isSuccessful)
            } catch (e: Exception) {
                onComplete(false)
            }
        }
    }

    fun fetchAuditLogs() {
        viewModelScope.launch {
            _auditLogsState.value = RequestState.Loading
            try {
                val response = RetrofitClient.service.getAuditLogs()
                if (response.isSuccessful && response.body() != null) {
                    _auditLogsState.value = RequestState.Success(response.body()!!)
                } else {
                    _auditLogsState.value = RequestState.Error("Unable to fetch structural audit logs")
                }
            } catch (e: Exception) {
                _auditLogsState.value = RequestState.Error(e.localizedMessage ?: "Offline")
            }
        }
    }
}
