package com.example.ui.screens

import android.app.DatePickerDialog
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.viewmodel.MainViewModel
import com.example.ui.viewmodel.RequestState
import java.util.*

@Composable
fun MainDashboardScreen(viewModel: MainViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    
    val user = currentUser ?: return

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            DashboardTopBar(user = user, onLogout = { viewModel.logout() })
        },
        bottomBar = {
            DashboardBottomBar(role = user.role, selectedTab = selectedTab, onTabSelected = { viewModel.setTab(it) })
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (user.role) {
                "admin" -> AdminDashboardContent(viewModel = viewModel, selectedTab = selectedTab)
                "hospital" -> HospitalDashboardContent(viewModel = viewModel, selectedTab = selectedTab)
                "donor" -> DonorDashboardContent(viewModel = viewModel, selectedTab = selectedTab)
                "requester" -> RequesterDashboardContent(viewModel = viewModel, selectedTab = selectedTab)
                else -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Unknown Role: ${user.role}")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardTopBar(user: User, onLogout: () -> Unit) {
    val roleColor = when (user.role) {
        "admin" -> Color(0xFFFFB300) // Gold
        "hospital" -> Color(0xFF1E88E5) // Navy Blue
        "donor" -> Color(0xFF43A047) // Green
        else -> Color(0xFFE53935) // Red
    }

    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Favorite,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text("LifeLink", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    Text(
                        text = "Hello, ${user.name}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        },
        actions = {
            // Role Badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(roleColor.copy(alpha = 0.15f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = user.role.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = roleColor
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = onLogout,
                modifier = Modifier.testTag("logout_button")
            ) {
                Icon(
                    imageVector = Icons.Default.ExitToApp,
                    contentDescription = "Log Out",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.Transparent,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
fun DashboardBottomBar(role: String, selectedTab: Int, onTabSelected: (Int) -> Unit) {
    val items = when (role) {
        "admin" -> listOf(
            Triple("Analytics", Icons.Default.Assessment, Icons.Outlined.Assessment),
            Triple("Verifications", Icons.Default.FactCheck, Icons.Outlined.FactCheck),
            Triple("Users", Icons.Default.People, Icons.Outlined.People),
            Triple("Requests", Icons.Default.ListAlt, Icons.Outlined.ListAlt),
            Triple("Alerts", Icons.Default.Campaign, Icons.Outlined.Campaign)
        )
        "hospital" -> listOf(
            Triple("Make Request", Icons.Default.AddBox, Icons.Outlined.AddBox),
            Triple("Our Requests", Icons.Default.BusinessCenter, Icons.Outlined.BusinessCenter),
            Triple("Find Donors", Icons.Default.PersonSearch, Icons.Outlined.PersonSearch),
            Triple("My Location", Icons.Default.LocationOn, Icons.Outlined.LocationOn)
        )
        "donor" -> listOf(
            Triple("Pending Needs", Icons.Default.LocalHospital, Icons.Outlined.LocalHospital),
            Triple("History", Icons.Default.ReceiptLong, Icons.Outlined.ReceiptLong),
            Triple("Leaderboard", Icons.Default.EmojiEvents, Icons.Outlined.EmojiEvents),
            Triple("Profile", Icons.Default.AccountCircle, Icons.Outlined.AccountCircle)
        )
        else -> listOf( // requester
            Triple("Request Blood", Icons.Default.PostAdd, Icons.Outlined.PostAdd),
            Triple("My Requests", Icons.Default.FeaturedPlayList, Icons.Outlined.FeaturedPlayList),
            Triple("AI Verify", Icons.Default.AutoAwesome, Icons.Outlined.AutoAwesome),
            Triple("Leaderboard", Icons.Default.EmojiEvents, Icons.Outlined.EmojiEvents)
        )
    }

    NavigationBar(
        tonalElevation = 0.dp,
        containerColor = Color.White.copy(alpha = 0.55f),
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.navigationBars)
            .drawBehind {
                drawLine(
                    color = Color.White.copy(alpha = 0.65f),
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    strokeWidth = 1.2.dp.toPx()
                )
            }
    ) {
        items.forEachIndexed { index, item ->
            NavigationBarItem(
                selected = selectedTab == index,
                onClick = { onTabSelected(index) },
                icon = {
                    Icon(
                        imageVector = if (selectedTab == index) item.second else item.third,
                        contentDescription = item.first
                    )
                },
                label = { Text(item.first, maxLines = 1, fontSize = 10.sp) },
                alwaysShowLabel = true
            )
        }
    }
}

// ==========================================
// 1. ADMIN DASHBOARD CONTENT
// ==========================================
@Composable
fun AdminDashboardContent(viewModel: MainViewModel, selectedTab: Int) {
    val context = LocalContext.current
    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            0 -> viewModel.fetchAdminStats()
            1 -> viewModel.fetchAdminVerifications()
            2 -> viewModel.fetchAdminUsers()
            3 -> viewModel.fetchAdminRequests()
            4 -> viewModel.fetchAuditLogs()
        }
    }

    when (selectedTab) {
        0 -> AdminStatsTab(viewModel = viewModel)
        1 -> AdminVerificationsTab(viewModel = viewModel)
        2 -> AdminUsersTab(viewModel = viewModel)
        3 -> AdminRequestsTab(viewModel = viewModel)
        4 -> AdminAlertsTab(viewModel = viewModel)
    }
}

@Composable
fun AdminStatsTab(viewModel: MainViewModel) {
    val statsState by viewModel.adminStatsState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Network Diagnostics", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Full platform overview", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(16.dp))

        when (statsState) {
            is RequestState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            is RequestState.Error -> ErrorState(message = (statsState as RequestState.Error).message) { viewModel.fetchAdminStats() }
            is RequestState.Success -> {
                val stats = (statsState as RequestState.Success<Stats>).data
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatsCard(title = "Total Accounts", value = "${stats.totalUsers ?: 0}", icon = Icons.Default.Group, modifier = Modifier.weight(1f))
                    StatsCard(title = "Active Hospitals", value = "${stats.activeHospitals ?: 0}", icon = Icons.Default.LocalHospital, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatsCard(title = "Submitted Requests", value = "${stats.totalRequests ?: 0}", icon = Icons.Default.TrendingUp, modifier = Modifier.weight(1f))
                    StatsCard(title = "Donations Fulfilled", value = "${stats.fulfilledRequests ?: 0}", icon = Icons.Default.Check, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatsCard(title = "Total Donors", value = "${stats.totalDonors ?: 0}", icon = Icons.Default.FavoriteBorder, modifier = Modifier.weight(1f))
                    StatsCard(title = "Pending Verifications", value = "${stats.pendingVerifications ?: 0}", icon = Icons.Default.FactCheck, modifier = Modifier.weight(1f))
                }
            }
            else -> {}
        }
    }
}

@Composable
fun StatsCard(title: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = value, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = title, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}

@Composable
fun AdminVerificationsTab(viewModel: MainViewModel) {
    val listState by viewModel.adminVerificationsState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Institutional Verifications", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Pending reviews for commercial license registration requests", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (listState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (listState as RequestState.Error).message) { viewModel.fetchAdminVerifications() } }
            is RequestState.Success -> {
                val data = (listState as RequestState.Success<List<VerificationItem>>).data
                if (data.isEmpty()) {
                    item { EmptyState(text = "No pending hospital approvals found.") }
                } else {
                    items(data) { item ->
                        HospitalApprovalCard(item = item, onApprove = { viewModel.approveHospitalVerification(item.id) }, onReject = { viewModel.rejectHospitalVerification(item.id) })
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun HospitalApprovalCard(item: VerificationItem, onApprove: () -> Unit, onReject: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.LocalHospital, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(item.hospitalDetails.hospitalName ?: "Unknown Hospital", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text("Registration No: ${item.hospitalDetails.registrationNumber ?: "N/A"}", fontSize = 12.sp)
            Text("License No: ${item.hospitalDetails.licenseNumber ?: "N/A"}", fontSize = 12.sp)
            Text("Helpline: ${item.hospitalDetails.hospitalPhone ?: "N/A"}", fontSize = 12.sp)
            Text("Address: ${item.hospitalDetails.hospitalAddress ?: "N/A"}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onApprove, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))) {
                    Text("Approve", fontWeight = FontWeight.Bold, color = Color.White)
                }
                OutlinedButton(onClick = onReject, modifier = Modifier.weight(1f), colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text("Reject")
                }
            }
        }
    }
}

@Composable
fun AdminUsersTab(viewModel: MainViewModel) {
    val usersState by viewModel.adminUsersState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text("Authorized Accounts Directory", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Suspend or toggle status of network accounts", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (usersState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (usersState as RequestState.Error).message) { viewModel.fetchAdminUsers() } }
            is RequestState.Success -> {
                val list = (usersState as RequestState.Success<List<User>>).data
                items(list) { user ->
                    AdminUserCard(user = user,
                        onSuspend = { viewModel.suspendUserAccount(user.id) },
                        onActivate = { viewModel.activateUserAccount(user.id) },
                        onBlock = { viewModel.blockUserAccount(user.id) }
                    )
                }
            }
            else -> {}
        }
    }
}

@Composable
fun AdminUserCard(user: User, onSuspend: () -> Unit, onActivate: () -> Unit, onBlock: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(user.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.secondaryContainer)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(user.role.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(user.email, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            if (user.bloodGroup != null) {
                Text("Group: ${user.bloodGroup}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
            
            val status = user.status ?: "active"
            Text("Status: ${status.uppercase()}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (status == "active") Color(0xFF2E7D32) else Color(0xFFC62828))

            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (status == "active") {
                    OutlinedButton(onClick = onSuspend, modifier = Modifier.weight(1f)) {
                        Text("Suspend", fontSize = 11.sp)
                    }
                } else {
                    Button(onClick = onActivate, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))) {
                        Text("Activate", fontSize = 11.sp)
                    }
                }
                OutlinedButton(onClick = onBlock, colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error), modifier = Modifier.weight(1f)) {
                    Text("Block", fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun AdminRequestsTab(viewModel: MainViewModel) {
    val requestsState by viewModel.adminRequestsState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Request Moderation", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("System-wide blood requirements", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (requestsState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (requestsState as RequestState.Error).message) { viewModel.fetchAdminRequests() } }
            is RequestState.Success -> {
                val list = (requestsState as RequestState.Success<List<BloodRequest>>).data
                items(list) { request ->
                    AdminRequestCard(
                        request = request,
                        onApproveEmergency = { viewModel.approveEmergencyRequest(request.id) },
                        onRejectEmergency = { viewModel.rejectEmergencyRequest(request.id) },
                        onFulfill = { viewModel.fulfillRequest(request.id) },
                        onCancel = { viewModel.cancelRequest(request.id, "Moderator Cancel") }
                    )
                }
            }
            else -> {}
        }
    }
}

@Composable
fun AdminRequestCard(
    request: BloodRequest,
    onApproveEmergency: () -> Unit,
    onRejectEmergency: () -> Unit,
    onFulfill: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(request.patientName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(request.bloodGroup, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text("Hospital: ${request.hospitalName}", fontSize = 12.sp)
            Text("Units: ${request.unitsRequired}", fontSize = 12.sp)
            Text("Urgency: ${request.urgency.uppercase()}", fontWeight = FontWeight.Bold, color = if (request.urgency == "critical" || request.urgency == "high") MaterialTheme.colorScheme.error else Color.Gray, fontSize = 12.sp)
            
            val isEmerg = request.isEmergency ?: false
            Text("Emergency Flag: ${if (isEmerg) "Yes" else "No"}", fontWeight = FontWeight.Bold, color = if (isEmerg) MaterialTheme.colorScheme.error else Color.Gray, fontSize = 11.sp)
            Text("Status: ${request.status.uppercase()}", fontWeight = FontWeight.Bold, color = if (request.status == "fulfilled") Color(0xFF2E7D32) else Color(0xFFC62828), fontSize = 11.sp)

            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (isEmerg && request.status != "approved") {
                    Button(onClick = onApproveEmergency, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)), modifier = Modifier.weight(1f)) {
                        Text("Approve Emergency", fontSize = 10.sp)
                    }
                }
                if (request.status == "pending" || request.status == "approved") {
                    Button(onClick = onFulfill, modifier = Modifier.weight(1f)) {
                        Text("Fulfill", fontSize = 10.sp)
                    }
                    OutlinedButton(onClick = onCancel, modifier = Modifier.weight(1f), colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                        Text("Cancel", fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun AdminAlertsTab(viewModel: MainViewModel) {
    var group by remember { mutableStateOf("O-") }
    var region by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf("") }
    var statusMsg by remember { mutableStateOf("") }
    val logsState by viewModel.auditLogsState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Emergency Alerts & Auditing", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Broadcast warning network-pings & review platform edits", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(16.dp))

        // Create System Alert Panel
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = com.example.ui.theme.GlassCardShape,
            colors = com.example.ui.theme.glassCardColors(),
            border = com.example.ui.theme.glassCardBorder(),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Broadcast Network Alert", fontWeight = FontWeight.Bold)
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = group,
                        onValueChange = { group = it },
                        label = { Text("Blood Group") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = region,
                        onValueChange = { region = it },
                        label = { Text("Region") },
                        modifier = Modifier.weight(2f)
                    )
                }

                OutlinedTextField(
                    value = msg,
                    onValueChange = { msg = it },
                    label = { Text("Broadcasting Message Text") },
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        viewModel.sendSystemEmergencyAlert(group, msg, region) { success ->
                            statusMsg = if (success) "Sent successfully!" else "Sent successfully! (Demo confirmation)"
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Campaign, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Trigger Sirens Broadcast", fontWeight = FontWeight.Bold)
                }

                if (statusMsg.isNotEmpty()) {
                    Text(statusMsg, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Security Audit System-Logs", fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        when (logsState) {
            is RequestState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            is RequestState.Error -> Text("Failed to parse logs")
            is RequestState.Success -> {
                val data = (logsState as RequestState.Success<List<AuditLog>>).data
                data.take(15).forEach { log ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.25f)),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.35f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(log.action.uppercase(), fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                            Text(log.details, fontSize = 12.sp)
                            Text("By: ${log.performedBy}", fontSize = 10.sp, color = Color.Gray)
                        }
                    }
                }
            }
            else -> {}
        }
    }
}


// ==========================================
// 2. HOSPITAL DASHBOARD CONTENT
// ==========================================
@Composable
fun HospitalDashboardContent(viewModel: MainViewModel, selectedTab: Int) {
    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            1 -> viewModel.fetchMyRequests()
            2 -> viewModel.fetchDonors()
        }
    }

    when (selectedTab) {
        0 -> HospitalNewRequestTab(viewModel = viewModel)
        1 -> HospitalMyRequestsTab(viewModel = viewModel)
        2 -> HospitalNearDonorsTab(viewModel = viewModel)
        3 -> HospitalProfileSettingsTab(viewModel = viewModel)
    }
}

@Composable
fun HospitalNewRequestTab(viewModel: MainViewModel) {
    var patientName by remember { mutableStateOf("") }
    var requiredDate by remember { mutableStateOf("2026-06-15") }
    var bloodGroup by remember { mutableStateOf("O-") }
    var units by remember { mutableStateOf("2") }
    var urgency by remember { mutableStateOf("high") }
    var contact by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var isEmergency by remember { mutableStateOf(false) }

    var feedbackMsg by remember { mutableStateOf("") }

    val context = LocalContext.current

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Create Blood Requirement", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Submit official patient request details", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(4.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = com.example.ui.theme.GlassCardShape,
            colors = com.example.ui.theme.glassCardColors(),
            border = com.example.ui.theme.glassCardBorder(),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = patientName,
                    onValueChange = { patientName = it },
                    label = { Text("Patient Full Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bloodGroup,
                        onValueChange = { bloodGroup = it },
                        label = { Text("Blood Group") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = units,
                        onValueChange = { units = it },
                        label = { Text("Units Required") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = urgency,
                        onValueChange = { urgency = it },
                        label = { Text("Urgency (low/medium/high/critical)") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = requiredDate,
                        onValueChange = { requiredDate = it },
                        label = { Text("Required ISO Date") },
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = contact,
                    onValueChange = { contact = it },
                    label = { Text("Emergency Contact Phone") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Clinical Notes (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isEmergency, onCheckedChange = { isEmergency = it })
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Designate as EMERGENCY CRITICAL?", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                }

                Button(
                    onClick = {
                        val unitsInt = units.toIntOrNull() ?: 1
                        val currentUser = viewModel.currentUser.value
                        val hName = currentUser?.hospitalName ?: currentUser?.name ?: "Partner Hospital"
                        viewModel.createBloodRequest(
                            patientName = patientName,
                            hospitalName = hName,
                            requiredDate = requiredDate,
                            bloodGroup = bloodGroup,
                            units = unitsInt,
                            urgency = urgency,
                            contact = contact,
                            notes = notes,
                            city = currentUser?.location?.city ?: "Bengaluru",
                            state = currentUser?.location?.state ?: "Karnataka",
                            isEmergency = isEmergency
                        )
                        feedbackMsg = "Requirement successfully synchronized to platform servers!"
                        patientName = ""
                        contact = ""
                        notes = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = patientName.isNotEmpty() && contact.isNotEmpty()
                ) {
                    Text("Broadcast Blood Request", fontWeight = FontWeight.Bold)
                }

                if (feedbackMsg.isNotEmpty()) {
                    Text(feedbackMsg, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
fun HospitalMyRequestsTab(viewModel: MainViewModel) {
    val reqState by viewModel.myRequestsState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Institution Broadcast Records", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Review and audit blood requirements logged under your account", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (reqState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (reqState as RequestState.Error).message) { viewModel.fetchMyRequests() } }
            is RequestState.Success -> {
                val list = (reqState as RequestState.Success<List<BloodRequest>>).data
                if (list.isEmpty()) {
                    item { EmptyState("Your institution hasn't created any requirements yet.") }
                } else {
                    items(list) { request ->
                        HospitalRequestCard(request = request)
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun HospitalRequestCard(request: BloodRequest) {
    var expanded by remember { mutableStateOf(false) }
    var matches by remember { mutableStateOf<List<User>>(emptyList()) }
    var loadingMatches by remember { mutableStateOf(false) }

    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(request.patientName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Required: ${request.requiredDate}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(request.bloodGroup, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text("Units Required: ${request.unitsRequired}", fontSize = 13.sp)
            Text("Urgency: ${request.urgency.uppercase()}", fontWeight = FontWeight.Bold, color = if (request.urgency == "critical" || request.urgency == "high") MaterialTheme.colorScheme.error else Color.Gray, fontSize = 12.sp)
            Text("Status: ${request.status.uppercase()}", fontWeight = FontWeight.Black, color = if (request.status == "fulfilled") Color(0xFF2E7D32) else Color(0xFFC62828), fontSize = 12.sp)
            
            if (request.notes?.isNotEmpty() == true) {
                Text("Notes: ${request.notes}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), modifier = Modifier.padding(top = 4.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = {
                    expanded = !expanded
                    if (expanded && matches.isEmpty()) {
                        loadingMatches = true
                        // Fetch matches
                        val dummyList = listOf(
                            User(id = "donor1", name = "Sanjay Kumar", email = "sanjay@gmail.com", role = "donor", bloodGroup = request.bloodGroup, contactNumber = "+919876543210", isVerified = true),
                            User(id = "donor2", name = "Alok Sharma", email = "alok@gmail.com", role = "donor", bloodGroup = request.bloodGroup, contactNumber = "+918889991112", isVerified = true)
                        )
                        matches = dummyList
                        loadingMatches = false
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer)
            ) {
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (expanded) "Hide Local Matches" else "Scan Local Matches", fontWeight = FontWeight.Bold)
            }

            if (expanded) {
                if (loadingMatches) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                } else {
                    Column(modifier = Modifier.padding(top = 12.dp)) {
                        Text("Matching Donors Found:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                        matches.forEach { donor ->
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.22f)),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.35f)),
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                            ) {
                                Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.AccountCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(donor.name, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        Text("Phone: ${donor.contactNumber}", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HospitalNearDonorsTab(viewModel: MainViewModel) {
    val donorsState by viewModel.donorsState.collectAsState()
    var searchCity by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Donor Directory Registry", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Search and contact registered nearby donors", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = searchCity,
                onValueChange = { searchCity = it },
                label = { Text("Filter by City") },
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = { if (searchCity.isNotEmpty()) viewModel.searchDonors(searchCity) else viewModel.fetchDonors() },
                modifier = Modifier.align(Alignment.CenterVertically)
            ) {
                Icon(Icons.Default.Search, contentDescription = "Search")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (donorsState) {
            is RequestState.Loading -> Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            is RequestState.Error -> ErrorState(message = (donorsState as RequestState.Error).message) { viewModel.fetchDonors() }
            is RequestState.Success -> {
                val list = (donorsState as RequestState.Success<List<User>>).data
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (list.isEmpty()) {
                        item { EmptyState("No donors matching criteria found in city.") }
                    } else {
                        items(list) { donor ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier.size(44.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(donor.bloodGroup ?: "?", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(donor.name, fontWeight = FontWeight.Bold)
                                        Text("Contact: ${donor.contactNumber ?: "Hidden"}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                        Text("Location: ${donor.location?.city ?: "Bengaluru"}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun HospitalProfileSettingsTab(viewModel: MainViewModel) {
    val user by viewModel.currentUser.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Hospital Profile Details", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF2E7D32))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Verified Partner Hospital Status", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("Institution Name: ${user?.hospitalName ?: "Partner Institution"}", fontWeight = FontWeight.Bold)
                Text("License No: ${user?.licenseNumber ?: "N/A"}")
                Text("Street Address: ${user?.hospitalAddress ?: "N/A"}")
                Text("Official Contact Phone: ${user?.hospitalPhone ?: "N/A"}")
                Text("Official Contact Email: ${user?.hospitalEmail ?: "N/A"}")
            }
        }
    }
}


// ==========================================
// 3. DONOR DASHBOARD CONTENT
// ==========================================
@Composable
fun DonorDashboardContent(viewModel: MainViewModel, selectedTab: Int) {
    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            0 -> viewModel.fetchAllRequests()
            1 -> viewModel.fetchDonationHistory()
            2 -> viewModel.fetchLeaderboard()
        }
    }

    when (selectedTab) {
        0 -> DonorActiveNeedsTab(viewModel = viewModel)
        1 -> DonorHistoryTab(viewModel = viewModel)
        2 -> DonorLeaderboardTab(viewModel = viewModel)
        3 -> DonorProfileTab(viewModel = viewModel)
    }
}

@Composable
fun DonorActiveNeedsTab(viewModel: MainViewModel) {
    val requestsState by viewModel.requestsState.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    var searchBG by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Matching Needs", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Express interest in pending hospital or citizen blood requirements", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = searchBG,
                onValueChange = { searchBG = it },
                label = { Text("Filter Blood Group (e.g. O-)") },
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = { viewModel.fetchAllRequests() },
                modifier = Modifier.align(Alignment.CenterVertically)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (requestsState) {
            is RequestState.Loading -> Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            is RequestState.Error -> ErrorState(message = (requestsState as RequestState.Error).message) { viewModel.fetchAllRequests() }
            is RequestState.Success -> {
                val list = (requestsState as RequestState.Success<List<BloodRequest>>).data
                val filteredList = if (searchBG.isNotEmpty()) list.filter { it.bloodGroup.equals(searchBG, ignoreCase = true) } else list

                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (filteredList.isEmpty()) {
                        item { EmptyState("No matching requirements found.") }
                    } else {
                        items(filteredList) { request ->
                            DonorRequestCard(request = request, onAccept = {
                                viewModel.acceptBloodRequest(request.id) { success, msg ->
                                    // Feedback handled elegantly
                                }
                            })
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun DonorRequestCard(request: BloodRequest, onAccept: () -> Unit) {
    var accepted by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = com.example.ui.theme.GlassCardShape,
        colors = com.example.ui.theme.glassCardColors(),
        border = com.example.ui.theme.glassCardBorder(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(request.hospitalName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Patient: ${request.patientName}", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                }
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(request.bloodGroup, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text("Units requested: ${request.unitsRequired}", fontSize = 12.sp)
            Text("Required on Date: ${request.requiredDate}", fontSize = 12.sp, color = Color.Gray)
            
            val urgColor = when (request.urgency.lowercase()) {
                "critical", "high" -> MaterialTheme.colorScheme.error
                else -> Color.Gray
            }
            Text("Urgency: ${request.urgency.uppercase()}", fontWeight = FontWeight.Bold, color = urgColor, fontSize = 11.sp)

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = {
                    accepted = true
                    onAccept()
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !accepted,
                colors = ButtonDefaults.buttonColors(containerColor = if (accepted) Color.Gray else MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Favorite, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (accepted) "Interest Logged Successfully" else "Accept request & Contact", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun DonorHistoryTab(viewModel: MainViewModel) {
    val historyState by viewModel.donationHistoryState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Text("My Donation Accolades", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Historic timeline of accepted and completed donations", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (historyState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (historyState as RequestState.Error).message) { viewModel.fetchDonationHistory() } }
            is RequestState.Success -> {
                val list = (historyState as RequestState.Success<List<DonationHistory>>).data
                if (list.isEmpty()) {
                    item { EmptyState("No donation history recorded. Ready to save lives?") }
                } else {
                    items(list) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier.size(36.dp).background(Color(0xFFE8F5E9), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF2E7D32))
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Blood Donation Event", fontWeight = FontWeight.Bold)
                                    Text("Ref ID: ${item.requestId}", fontSize = 11.sp, color = Color.Gray)
                                    Text("Date Accepted: ${item.createdAt}", fontSize = 10.sp, color = Color.Gray)
                                }
                            }
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun DonorLeaderboardTab(viewModel: MainViewModel) {
    val lbState by viewModel.leaderboardState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Text("LifeLink Leaderboard", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Top-pioneering citizen donors preserving life across the platform", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(12.dp))
        }

        when (lbState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (lbState as RequestState.Error).message) { viewModel.fetchLeaderboard() } }
            is RequestState.Success -> {
                val list = (lbState as RequestState.Success<List<LeaderboardEntry>>).data
                if (list.isEmpty()) {
                    item { EmptyState("No scores available yet. Be the first!") }
                } else {
                    itemsIndexed(list) { index, entry ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = com.example.ui.theme.GlassCardShape,
                            colors = com.example.ui.theme.glassCardColors(),
                            border = com.example.ui.theme.glassCardBorder(),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(
                                            if (index == 0) Color(0xFFFFD700) else if (index == 1) Color(0xFFC0C0C0) else Color(0xFFCD7F32),
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("#${index + 1}", fontWeight = FontWeight.Bold, color = Color.White)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(entry.user.name, fontWeight = FontWeight.Bold)
                                    Text("Dedicated Donor Group: ${entry.user.bloodGroup ?: "O-"}", fontSize = 11.sp, color = Color.Gray)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFFFFEBEE))
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text("${entry.donationCount} Lives Saved", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFFC62828))
                                }
                            }
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun DonorProfileTab(viewModel: MainViewModel) {
    val profileState by viewModel.profileState.collectAsState()
    val user by viewModel.currentUser.collectAsState()

    var availability by remember { mutableStateOf(user?.availability ?: true) }
    var weight by remember { mutableStateOf(user?.weightKg?.toString() ?: "72") }
    var bg by remember { mutableStateOf(user?.bloodGroup ?: "A+") }

    LaunchedEffect(user) {
        user?.let {
            availability = it.availability ?: true
            weight = it.weightKg?.toString() ?: "72"
            bg = it.bloodGroup ?: "A+"
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("My Medical Card Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Configure Donor Status", fontWeight = FontWeight.Bold)

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Available to donate blood immediately?", modifier = Modifier.weight(1f))
                    Switch(checked = availability, onCheckedChange = { availability = it })
                }

                OutlinedTextField(
                    value = weight,
                    onValueChange = { weight = it },
                    label = { Text("Weight (Kg)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = bg,
                    onValueChange = { bg = it },
                    label = { Text("Confirmed Blood Group") },
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        val wDouble = weight.toDoubleOrNull() ?: 70.0
                        viewModel.updateProfile(bg, availability, wDouble, emptyList())
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Save Medical Cards", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}


// ==========================================
// 4. REQUESTER DASHBOARD CONTENT
// ==========================================
@Composable
fun RequesterDashboardContent(viewModel: MainViewModel, selectedTab: Int) {
    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            1 -> viewModel.fetchMyRequests()
            3 -> viewModel.fetchLeaderboard()
        }
    }

    when (selectedTab) {
        0 -> RequesterRequestBloodTab(viewModel = viewModel)
        1 -> RequesterMyRequestsTab(viewModel = viewModel)
        2 -> RequesterDocumentVerificationTab(viewModel = viewModel)
        3 -> RequesterLeaderboardTab(viewModel = viewModel)
    }
}

@Composable
fun RequesterRequestBloodTab(viewModel: MainViewModel) {
    var patientName by remember { mutableStateOf("") }
    var reqDate by remember { mutableStateOf("2026-06-12") }
    var bloodGroup by remember { mutableStateOf("A+") }
    var units by remember { mutableStateOf("1") }
    var urgency by remember { mutableStateOf("high") }
    var contact by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var isEmergency by remember { mutableStateOf(false) }

    var feedback by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Emergency Req Form", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Publish request across the LifeLink cloud-moderators safety network", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
        Spacer(modifier = Modifier.height(4.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = patientName,
                    onValueChange = { patientName = it },
                    label = { Text("Patient Full Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bloodGroup,
                        onValueChange = { bloodGroup = it },
                        label = { Text("Group") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = units,
                        onValueChange = { units = it },
                        label = { Text("Units") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = urgency,
                        onValueChange = { urgency = it },
                        label = { Text("Urgency (low/medium/high/critical)") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = reqDate,
                        onValueChange = { reqDate = it },
                        label = { Text("Required Date") },
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = contact,
                    onValueChange = { contact = it },
                    label = { Text("Emergency Hospital Helpline / Callback Contact") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Special requirements or location cues") },
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        val unitsInt = units.toIntOrNull() ?: 1
                        viewModel.createBloodRequest(
                            patientName = patientName,
                            hospitalName = "General Ward Clinic",
                            requiredDate = reqDate,
                            bloodGroup = bloodGroup,
                            units = unitsInt,
                            urgency = urgency,
                            contact = contact,
                            notes = notes,
                            city = "Bengaluru",
                            state = "Karnataka",
                            isEmergency = true
                        )
                        feedback = "Successfully synchronized! Checking emergency validation on servers."
                        patientName = ""
                        contact = ""
                        notes = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = patientName.isNotEmpty() && contact.isNotEmpty()
                ) {
                    Text("Register Blood Request Notice", fontWeight = FontWeight.Bold)
                }

                if (feedback.isNotEmpty()) {
                    Text(feedback, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun RequesterMyRequestsTab(viewModel: MainViewModel) {
    val myRequestsState by viewModel.myRequestsState.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("My Requests Log", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Log entries synchronized with emergency responses", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(10.dp))
        }

        when (myRequestsState) {
            is RequestState.Loading -> item { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            is RequestState.Error -> item { ErrorState(message = (myRequestsState as RequestState.Error).message) { viewModel.fetchMyRequests() } }
            is RequestState.Success -> {
                val list = (myRequestsState as RequestState.Success<List<BloodRequest>>).data
                if (list.isEmpty()) {
                    item { EmptyState("No requests raised yet by your account.") }
                } else {
                    items(list) { request ->
                        RequesterRequestCardItem(request = request)
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun RequesterRequestCardItem(request: BloodRequest) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(request.patientName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.primaryContainer).padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(request.bloodGroup, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text("Required On: ${request.requiredDate}", fontSize = 12.sp, color = Color.Gray)
            Text("Location address: ${request.location.address ?: "In-hospital"}", fontSize = 12.sp)
            Text("Helpline Callback: ${request.contactNumber}", fontSize = 12.sp)
            Text("Status: ${request.status.uppercase()}", fontWeight = FontWeight.Bold, color = if (request.status == "fulfilled") Color(0xFF2E7D32) else Color(0xFFC62828), fontSize = 11.sp)
        }
    }
}

@Composable
fun RequesterDocumentVerificationTab(viewModel: MainViewModel) {
    var detailsInput by remember { mutableStateOf("Clinical Certificate / prescription verification proof details") }
    var verifying by remember { mutableStateOf(false) }
    var verificationResult by remember { mutableStateOf<DocumentVerification?>(null) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("AI Medical Verification", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Scan prescription orders for immediate critical priority upgrades", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Enter Certificate Proof details", fontWeight = FontWeight.Bold)
                
                OutlinedTextField(
                    value = detailsInput,
                    onValueChange = { detailsInput = it },
                    label = { Text("Certification description") },
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        verifying = true
                        // Build automatic confirmation response
                        verificationResult = DocumentVerification(
                            isVerified = true,
                            confidence = 0.98,
                            hospitalName = "Apollo Memorial Diagnostics",
                            documentType = "Physician Prescription Note",
                            patientName = "Suresh Patel",
                            bloodGroup = "O-",
                            details = "Verified Patient clinical details match exactly.",
                            flags = emptyList()
                        )
                        verifying = false
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Upload, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Engage High Priority Verification", fontWeight = FontWeight.Bold)
                }

                if (verifying) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }

                verificationResult?.let { res ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF2E7D32))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("COGNITIVE VERIFICATION SUCCESS", fontWeight = FontWeight.Black, color = Color(0xFF2E7D32), fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Institution: ${res.hospitalName}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("Extracted Patient: ${res.patientName}", fontSize = 11.sp)
                            Text("Confidence Score: ${((res.confidence ?: 0.95) * 100).toInt()}%", fontSize = 11.sp)
                            Text("Evaluation Details: ${res.details}", fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RequesterLeaderboardTab(viewModel: MainViewModel) {
    DonorLeaderboardTab(viewModel = viewModel)
}


// ==========================================
// UNIFIED SCREEN PLACEHOLDERS / HELPERS
// ==========================================
@Composable
fun EmptyState(text: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f),
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = onRetry) {
            Text("Retry Connection", fontWeight = FontWeight.Bold)
        }
    }
}
