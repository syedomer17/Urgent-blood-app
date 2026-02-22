# Cookie-Based Authentication Guide

## Overview
This guide explains the cookie-based authentication system implemented for managing access tokens and refresh tokens securely.

## Installation
Packages installed:
```bash
pnpm add cookie-parser
pnpm add -D @types/cookie-parser
```

## Configuration

### Cookie Options

#### Access Token Cookie
- **Max Age**: 15 minutes
- **HttpOnly**: `true` (prevents JavaScript access)
- **Secure**: `true` (in production only)
- **SameSite**: `strict` (CSRF protection)

#### Refresh Token Cookie
- **Max Age**: 7 days
- **HttpOnly**: `true`
- **Secure**: `true` (in production only)
- **SameSite**: `strict`

### Setup in App

#### 1. Middleware Registration (app.ts)
```typescript
import cookieParser from 'cookie-parser';
import { config } from './config/env';

// Parse cookies with secret for signed cookies
app.use(cookieParser(config.jwt.secret));
```

#### 2. Auth Controller (auth.controller.ts)
Cookies are automatically set after successful authentication:

**Register/Login Response**:
```typescript
res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
res.cookie('refreshToken', result.refreshToken, cookieOptions);
```

**Logout Response**:
```typescript
res.clearCookie('accessToken');
res.clearCookie('refreshToken');
```

## Usage

### 1. Registration
**Request**:
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "bloodGroup": "O+",
  "role": "donor",
  "location": {
    "coordinates": [74.3055, 31.5497],
    "address": "Lahore, Pakistan"
  }
}
```

**Response**: (Tokens also set as cookies automatically)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { /* user details */ },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Cookies Set**:
- `accessToken` (HttpOnly, 15 min expiration)
- `refreshToken` (HttpOnly, 7 day expiration)

### 2. Login
**Request**:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**: (Tokens set as cookies)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user details */ },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Protected Routes
The auth middleware now checks for tokens in this order:
1. **Authorization Header**: `Authorization: Bearer <token>`
2. **Cookies**: `accessToken` cookie

**Request** (Option 1 - Header):
```bash
GET /api/users/profile
Authorization: Bearer eyJhbGc...
```

**Request** (Option 2 - Cookies, automatic):
```bash
GET /api/users/profile
# accessToken cookie sent automatically by browser
```

### 4. Token Refresh
**Request**:
```bash
POST /api/auth/refresh
# refreshToken cookie sent automatically, or:
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response**: (New tokens set as cookies)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 5. Logout
**Request**:
```bash
POST /api/auth/logout
Authorization: Bearer <accessToken>
# or cookies sent automatically
```

**Response**: (Cookies cleared)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared**:
- `accessToken` removed
- `refreshToken` removed

## Frontend Integration

### JavaScript/Fetch API

#### 1. Login with Automatic Cookie Handling
```javascript
// Credentials: 'include' ensures cookies are sent and stored
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: sends and stores cookies
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123'
  })
});

const data = await response.json();
console.log('Login successful:', data);
// Cookies are automatically stored by the browser
```

#### 2. Protected Request with Cookies
```javascript
// Cookies are automatically included with credentials: 'include'
const response = await fetch('http://localhost:3000/api/users/profile', {
  method: 'GET',
  credentials: 'include' // Sends stored cookies automatically
});

const data = await response.json();
console.log('User profile:', data);
```

#### 3. Logout
```javascript
const response = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();
console.log('Logged out:', data);
// Cookies are automatically cleared by the server
```

### React Example

```typescript
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Critical for cookies
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    setUser(data.data.user);
    return data;
  };

  const logout = async () => {
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  // Protected fetch helper
  const fetchProtected = (url: string, options = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include' // Automatically includes cookies
    });
  };

  return { user, login, logout, fetchProtected };
};

export default useAuth;
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true // Enables cookies for all requests
});

// Login
const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

// Protected request (cookies sent automatically)
const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};

// Logout
const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};
```

## Security Features

### 1. HttpOnly Flag
- Cookies cannot be accessed via JavaScript (`document.cookie`)
- Prevents XSS attacks from stealing tokens

### 2. Secure Flag (Production)
- Cookies only sent over HTTPS
- Prevents man-in-the-middle attacks

### 3. SameSite: Strict
- Cookies not sent with cross-site requests
- Prevents CSRF attacks

### 4. Token Rotation
- Refresh tokens are rotated on each use
- Old tokens replaced with new ones in database
- Limits impact of token theft

### 5. Hashed Refresh Tokens
- Refresh tokens stored as hashes in database
- Even if database is compromised, tokens can't be directly used

## Troubleshooting

### Cookies Not Being Set
1. Check CORS configuration allows credentials:
```typescript
cors({
  origin: 'http://localhost:3000',
  credentials: true // Must be true
})
```

2. Ensure frontend uses `credentials: 'include'` or `withCredentials: true`

3. Verify cookies are enabled in browser

### Cookies Not Being Sent
1. Make sure frontend uses `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios)

2. Check domain/port match between frontend and backend

3. Verify SameSite policy allows the request

### Token Expiration Issues
1. Access token expires after 15 minutes
2. Implement auto-refresh using refresh token endpoint
3. Refresh token expires after 7 days

### Production Deployment
1. Set `config.env = 'production'`
2. Secure flag automatically enabled
3. Use HTTPS/SSL certificates
4. Ensure same domain or properly configured CORS

## API Endpoints

| Method | Endpoint | Authentication | Description |
|--------|----------|-----------------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login user |
| POST | `/auth/refresh` | Optional | Refresh tokens |
| POST | `/auth/logout` | Required | Logout user |
| GET | `/users/profile` | Required | Get user profile |

## Environment Configuration

The cookie configuration uses values from `config.jwt`:

```typescript
// .env
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=development
```

## Migration from Bearer Tokens

If you want to continue supporting both Bearer tokens and cookies:
- ✅ Already supported by the updated `protect` middleware
- Both methods work simultaneously
- Clients can use either approach

## Best Practices

1. **Always use HTTPS in production**
   - Without HTTPS, Secure flag won't work

2. **Set appropriate CORS**
   ```typescript
   cors({
     origin: 'https://yourdomain.com',
     credentials: true
   })
   ```

3. **Rotate refresh tokens**
   - Already implemented in the system

4. **Clear cookies on logout**
   - ✅ Already implemented

5. **Use HttpOnly cookies**
   - ✅ Already configured

6. **Implement token refresh logic**
   - Frontend should auto-refresh before expiry
   - Use interceptors for transparent refresh

7. **Monitor token usage**
   - Check for suspicious refresh patterns
   - Log significant authentication events
