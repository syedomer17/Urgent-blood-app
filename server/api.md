# LifeLink API Documentation

This document outlines the available API endpoints for the LifeLink Backend.

## Authentication (`/api/v1/auth`)

### 1. Register User
**POST** `/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "donor",
  "bloodGroup": "O+",
  "contactNumber": "+1234567890",
  "location": {
    "address": "New York, NY"
  }
}
```
*Note: `bloodGroup` is required for donors. `location` can be just `address` (auto-geocoded) or `{ latitude, longitude }`.*

### 2. Login
**POST** `/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### 3. Refresh Token
**POST** `/refresh-token`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout
**POST** `/logout`
*Headers: `Authorization: Bearer <access_token>`*

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Users (`/api/v1/users`)

### 5. Get Profile
**GET** `/profile`
*Headers: `Authorization: Bearer <access_token>`*

### 6. Update Profile
**PATCH** `/profile`
*Headers: `Authorization: Bearer <access_token>`*

**Body:**
```json
{
  "availability": true,
  "location": {
    "address": "123 Main St, Springfield"
  }
}
```

---

## Blood Requests (`/api/v1/requests`)

### 7. Create Blood Request
**POST** `/`
*Headers: `Authorization: Bearer <access_token>`*

**Body:**
```json
{
  "patientName": "Sarah Smith",
  "bloodGroup": "A+",
  "unitsRequired": 2,
  "urgency": "critical",
  "contactNumber": "+1987654321",
  "location": {
    "address": "City Hospital, Downtown"
  },
  "notes": "Urgent need for surgery"
}
```
*Urgency options: `low`, `medium`, `high`, `critical`*

### 8. Get My Requests
**GET** `/my-requests`
*Headers: `Authorization: Bearer <access_token>`*

### 9. Get Request Details
**GET** `/:id`
*Headers: `Authorization: Bearer <access_token>`*

---

## Donations (`/api/v1/donations`)

### 10. Accept Donation Request
**POST** `/accept`
*Headers: `Authorization: Bearer <access_token>`*

**Body:**
```json
{
  "requestId": "64f1b2c3e4b0a1a2b3c4d5e6"
}
```

---

## Admin (`/api/v1/admin`)

### 11. Get Dashboard Stats
**GET** `/stats`
*Headers: `Authorization: Bearer <access_token>`*
