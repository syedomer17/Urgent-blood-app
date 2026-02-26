# Authentication API Documentation

This document describes the authentication flow for the LifeLink app. The backend uses **HTTP-only cookies** for secure token management. This makes authentication easier for the frontend, as the browser handles cookie storage and transmission automatically.

## Base URL
`/api/v1/auth`

---

## 🔐 Cookie Details

The server sets the following cookies upon successful registration or login:

| Cookie Name | Usage | Expiration | Security |
|-------------|-------|------------|----------|
| `accessToken` | Used for authorized requests | **1 day** | `httpOnly`, `secure` (prod), `sameSite: strict` |
| `refreshToken`| Used to get a new access token | **7 days** | `httpOnly`, `secure` (prod), `sameSite: strict` |

> [!IMPORTANT]
> **Frontend Note:** Since tokens are stored in `httpOnly` cookies, they **cannot** be accessed via JavaScript (`document.cookie`). 
> To ensure cookies are sent with every request, the frontend must set:
> `axios.defaults.withCredentials = true;` or `fetch(url, { credentials: 'include' });`

### Token Expiration & Auto-Logout
- **accessToken** expires after 1 day
- **refreshToken** expires after 7 days
- If accessToken expires but refreshToken is valid, call `/refresh-token` to get a new accessToken
- If **both tokens expire**, the server automatically clears cookies and the user must log in again
- Tokens are **ONLY** sent via cookies (not in response body)

---

## 1. Register User
Create a new donor or requester account.

**POST** `/register`

### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "donor",
  "bloodGroup": "B+",
  "contactNumber": "+1234567890",
  "location": {
    "address": "123 Main St, New York, NY"
  }
}
```

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full name of the user |
| `email` | string | Valid email address (unique) |
| `password` | string | Password (min 8 characters) |
| `role` | string | User role: `"donor"` or `"requester"` |
| `bloodGroup` | string | Blood type (e.g., "A+", "O-", "B+") |
| `contactNumber` | string | Phone number |
| `location.address` | string | Physical address |

### Response
**201 Created**: User registered successfully. Tokens are set in cookies.
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "donor",
      "bloodGroup": "B+",
      "contactNumber": "+1234567890",
      "location": {
        "address": "123 Main St, New York, NY",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "createdAt": "2026-02-25T10:30:00.000Z"
    }
  }
}
```

**Note:** `accessToken` and `refreshToken` are **NOT** in the response body. They are **only** sent as httpOnly cookies.

### Error Responses
- **400 Bad Request**: Validation error (e.g., missing fields, weak password).
- **409 Conflict**: Email already exists.

---

## 2. Login User
Authenticate an existing user.

**POST** `/login`

### Request Body
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Registered email address |
| `password` | string | User's password |

### Response
**200 OK**: Login successful. Tokens are set in cookies.
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "donor",
      "bloodGroup": "B+",
      "contactNumber": "+1234567890",
      "isAvailable": true,
      "lastAvailable": "2026-02-25T10:30:00.000Z"
    }
  }
}
```

**Note:** `accessToken` and `refreshToken` are **NOT** in the response body. They are **only** sent as httpOnly cookies.

### Error Responses
- **401 Unauthorized**: Incorrect email or password.

---

## 3. Refresh Token
Get a new `accessToken` when the current one expires (after 1 day).

**POST** `/refresh-token`

### Authentication
- **No `accessToken` required** (since it's expired)
- **Requires valid `refreshToken`** in cookies

### Request Body
Optional. The server primarily looks for the `refreshToken` in the cookies.
```json
{
  "refreshToken": "..." 
}
```

### Response
**200 OK**: New `accessToken` and `refreshToken` set in cookies.
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokenRefreshed": true
  }
}
```

### Error Responses
**401 Unauthorized**: Both tokens expired - automatic logout
```json
{
  "success": false,
  "message": "Session expired. Please log in again.",
  "statusCode": 401
}
```

**Note:** When both tokens are expired, cookies are automatically cleared by the server. The frontend should redirect to the login page.

---

## 4. Logout
Clear authentication cookies and invalidate the session.

**POST** `/logout`

*Requires `Authorization: Bearer <access_token>` in headers.*

### Request Body
Required (for server-side token invalidation).
```json
{
  "refreshToken": "..."
}
```

### Responses
- **200 OK**: Logged out successfully. Cookies are cleared.
- **401 Unauthorized**: User not logged in.

---

## 🛠 Frontend Integration Guide

### 1. Automatic Authentication
You **don't need** to manually store JWTs in `localStorage`. The browser handles this automatically via httpOnly cookies.

### 2. Configure API Client
Always include credentials with every request:

```typescript
// Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9000/api/v1',
  withCredentials: true, // REQUIRED for cookies
});

// Fetch API
fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // REQUIRED for cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

### 3. Handle Token Expiry
Implement automatic token refresh on 401 errors:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/auth/refresh-token');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Both tokens expired - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 4. Role-Based Access
The backend uses role-based authentication. Some endpoints require specific roles:

- **Admin endpoints** (`/api/v1/admin/*`) require `role: "admin"`
- **Donor endpoints** may require `role: "donor"`
- **Public endpoints** don't require authentication

If a user tries to access an endpoint without proper role:
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

### 5. Session Management

```typescript
// Store user data in context/state after login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const userData = response.data.data.user;
  
  // Store in context/Redux (NOT tokens, just user info)
  setUser(userData);
  
  // Navigate to dashboard
  navigate('/dashboard');
};

// Logout
const logout = async () => {
  await api.post('/auth/logout');
  setUser(null);
  navigate('/login');
};

// Check if user is authenticated (on app load)
const checkAuth = async () => {
  try {
    // Call a protected endpoint to verify token
    const response = await api.get('/users/me');
    setUser(response.data.data);
  } catch (error) {
    // Not authenticated or token expired
    setUser(null);
  }
};
```

### 6. Token Expiry Timeline

```
Day 0: Login/Register
├─ accessToken valid (1 day)
└─ refreshToken valid (7 days)

Day 1: accessToken expires
├─ API call fails with 401
├─ Interceptor calls /refresh-token
├─ New accessToken issued (1 day)
└─ Original request retried successfully

Day 7: refreshToken expires
├─ accessToken also expired
├─ /refresh-token call fails with 401
├─ Server clears cookies
└─ User redirected to login page
```

### 7. Example: Protected Request

```typescript
// No manual token handling needed!
const getProfile = async () => {
  // Cookies are automatically sent
  const response = await api.get('/users/me');
  return response.data.data;
};

// Admin-only request
const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('Access denied: Admin role required');
    }
  }
};
```
