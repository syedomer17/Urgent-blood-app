# Admin API Documentation

This document describes the admin endpoints for the LifeLink app. These endpoints provide analytics and management capabilities for administrators.

## Base URL
`/api/v1/admin`

---

## 🔐 Authentication & Authorization

All admin endpoints require:

1. **Authentication**: Valid access token (via `Authorization: Bearer <token>` header or `accessToken` cookie)
2. **Authorization**: User role must be `admin`

### Middleware Chain
- `protect`: Verifies JWT token (from header or cookie)
- `restrictTo('admin')`: Ensures the authenticated user has admin role

> [!IMPORTANT]
> **Frontend Note:** 
> - Set `axios.defaults.withCredentials = true;` to send cookies automatically
> - Include `Authorization: Bearer <token>` header if not using cookies
> - Admin-only routes will return **403 Forbidden** if the user is not an admin

---

## 1. Get Dashboard Statistics
Retrieve comprehensive analytics for the admin dashboard.

**GET** `/stats`

### Authentication Required
- Must be logged in as an admin
- Token can be sent via:
  - `Authorization: Bearer <token>` header, OR
  - `accessToken` cookie

### Request
No request body required.

```bash
# Example with header
curl -X GET https://api.example.com/api/v1/admin/stats \
  -H "Authorization: Bearer <your_access_token>"

# Example with cookie (automatic if withCredentials: true)
fetch('/api/v1/admin/stats', { 
  credentials: 'include' 
});
```

### Response
**200 OK**: Statistics retrieved successfully

```json
{
  "success": true,
  "message": "Admin stats retrieved successfully",
  "data": {
    "totalDonors": 1247,
    "activeRequests": 23,
    "completedDonations": 892,
    "bloodGroupDistribution": [
      {
        "_id": "O+",
        "count": 324
      },
      {
        "_id": "A+",
        "count": 298
      },
      {
        "_id": "B+",
        "count": 215
      },
      {
        "_id": "AB+",
        "count": 187
      },
      {
        "_id": "O-",
        "count": 98
      },
      {
        "_id": "A-",
        "count": 67
      },
      {
        "_id": "B-",
        "count": 42
      },
      {
        "_id": "AB-",
        "count": 16
      }
    ],
    "averageResponseTimeMinutes": "127.45"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalDonors` | number | Total count of users with role "donor" |
| `activeRequests` | number | Count of blood requests with status "pending" or "accepted" |
| `completedDonations` | number | Count of donation histories with status "completed" |
| `bloodGroupDistribution` | array | List of blood groups with their donor counts, sorted by count (descending) |
| `bloodGroupDistribution[]._id` | string | Blood group (e.g., "O+", "A-", "B+") |
| `bloodGroupDistribution[].count` | number | Number of donors with this blood group |
| `averageResponseTimeMinutes` | string | Average time (in minutes) from request creation to donation acceptance/completion. Format: decimal with 2 places |

### Error Responses

**401 Unauthorized**: Not logged in or invalid token
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access.",
  "statusCode": 401
}
```

**403 Forbidden**: User is not an admin
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

---

## 🛠 Frontend Integration Guide

### 1. Setup API Client
Configure your HTTP client to send credentials:

```typescript
// Using Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // Important for cookies
});

// Add auth header if using token from state
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // If you store it
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Fetch Dashboard Stats

```typescript
// API Service
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data.data;
};

// React Component
import { useEffect, useState } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (err.response?.status === 401) {
          setError('Please log in to continue.');
          // Redirect to login
        } else {
          setError('Failed to load statistics');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Donors</h3>
          <p>{stats.totalDonors}</p>
        </div>
        
        <div className="stat-card">
          <h3>Active Requests</h3>
          <p>{stats.activeRequests}</p>
        </div>
        
        <div className="stat-card">
          <h3>Completed Donations</h3>
          <p>{stats.completedDonations}</p>
        </div>
        
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <p>{stats.averageResponseTimeMinutes} min</p>
        </div>
      </div>

      <div className="blood-group-chart">
        <h2>Blood Group Distribution</h2>
        {stats.bloodGroupDistribution.map((group) => (
          <div key={group._id} className="group-bar">
            <span>{group._id}</span>
            <div className="bar" style={{ width: `${group.count / 5}px` }} />
            <span>{group.count} donors</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Error Handling

```typescript
// Handle 401 (Unauthorized) - Try refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/auth/refresh-token');
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      // User doesn't have admin privileges
      console.error('Access denied: Admin privileges required');
    }

    return Promise.reject(error);
  }
);
```

### 4. TypeScript Types

```typescript
interface BloodGroupDistribution {
  _id: string; // Blood group
  count: number;
}

interface AdminStats {
  totalDonors: number;
  activeRequests: number;
  completedDonations: number;
  bloodGroupDistribution: BloodGroupDistribution[];
  averageResponseTimeMinutes: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## 📊 Data Insights

### Average Response Time Calculation
The average response time is calculated as:
- **Start**: When a blood request is created (`bloodRequest.createdAt`)
- **End**: When a donation history record is created (`donationHistory.createdAt`)
- The system aggregates all completed donations and computes the average duration in minutes

### Blood Group Distribution
- Only includes users with role `donor`
- Sorted by count in descending order (most common blood type first)
- Useful for displaying inventory availability and matching potential

### Active Requests
- Includes requests with status: `pending` or `accepted`
- Excludes `completed`, `cancelled`, or `expired` requests

---

## 🔮 Future Endpoints (Coming Soon)

The admin module may be expanded with additional endpoints:
- `GET /admin/users` - List all users with filters
- `PUT /admin/users/:id` - Update user details or status
- `DELETE /admin/users/:id` - Deactivate/delete users
- `GET /admin/requests` - View all blood requests
- `GET /admin/donations` - View all donations
- `GET /admin/analytics` - Advanced analytics and reports

---

## 🧪 Testing

### Test with cURL
```bash
# Replace with your actual admin token
TOKEN="your_admin_access_token_here"

curl -X GET http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test with Postman
1. Set request type to `GET`
2. URL: `http://localhost:5000/api/v1/admin/stats`
3. Go to "Authorization" tab → Select "Bearer Token" → Enter your token
4. Send request

### Test Protected Route
```bash
# Without token (should fail with 401)
curl -X GET http://localhost:5000/api/v1/admin/stats

# With non-admin token (should fail with 403)
curl -X GET http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer <non_admin_token>"
```

---

## Support
For issues or questions, contact the backend team or refer to the main API documentation.
