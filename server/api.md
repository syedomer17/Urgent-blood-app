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
    "address": "123 Main Street, New York, NY 10001"
  }
}
```

**Location Field Details:**
- **address** (string, required for geocoding): Full address to be geocoded
- **latitude** (number, optional): Latitude coordinate (-90 to 90)
- **longitude** (number, optional): Longitude coordinate (-180 to 180)
- **state** (string, optional): State/Province (auto-populated if using address)
- **city** (string, optional): City name (auto-populated if using address)
- **zipCode** (string, optional): Postal/Zip code (auto-populated if using address)
- **areaName** (string, optional): Neighborhood or area name (auto-populated if using address)

**Examples:**

*Example 1: Using address (auto-geocoded)*
```json
{
  "location": {
    "address": "Times Square, New York, NY"
  }
}
```

*Example 2: Using precise coordinates*
```json
{
  "location": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "address": "Times Square, New York, NY"
  }
}
```

*Example 3: Providing all location details*
```json
{
  "location": {
    "address": "123 Main Street, New York, NY 10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "state": "New York",
    "city": "New York",
    "zipCode": "10001",
    "areaName": "Lower Manhattan"
  }
}
```

**Geolocation Process:**
- If only `address` is provided, the server will use OpenStreetMap to geocode and extract coordinates, state, city, zip code, and area information
- If `latitude` and `longitude` are provided, they will be used directly
- All location fields are optional; missing fields will be auto-populated during geocoding when an address is provided

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
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, Springfield, NY 10001",
    "state": "New York",
    "city": "Springfield",
    "zipCode": "10001",
    "areaName": "Downtown"
  }
}
```

**Update Location Options:**
- **Option 1:** Provide only `address` - coordinates and other details will be auto-geocoded
- **Option 2:** Provide `latitude` and `longitude` - precise location with optional address
- **Option 3:** Provide all fields manually for complete control

**Auto-Geolocation Features:**
- When address is provided alone, the system uses OpenStreetMap to extract:
  - Latitude and longitude coordinates
  - State/Province information
  - City information
  - Postal/Zip code
  - Neighborhood/Area name

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
    "address": "City Hospital, Downtown, New York, NY 10001",
    "state": "New York",
    "city": "New York",
    "zipCode": "10001",
    "areaName": "Downtown"
  },
  "notes": "Urgent need for surgery"
}
```

**Location Field Details:**
- **address** (string, required for geocoding): Full address of the hospital/facility
- **latitude** (number, optional): Latitude coordinate (-90 to 90)
- **longitude** (number, optional): Longitude coordinate (-180 to 180)
- **state** (string, optional): State/Province (auto-populated if using address)
- **city** (string, optional): City name (auto-populated if using address)
- **zipCode** (string, optional): Postal/Zip code (auto-populated if using address)
- **areaName** (string, optional): Area/Neighborhood name (auto-populated if using address)

**Location Examples:**

*Example 1: Auto-geocoded address*
```json
{
  "location": {
    "address": "St. Mary's Hospital, Manhattan, NY"
  }
}
```

*Example 2: With precise coordinates*
```json
{
  "location": {
    "latitude": 40.7505,
    "longitude": -73.9972,
    "address": "St. Mary's Hospital, Manhattan, NY"
  }
}
```

*Note: Urgency options: `low`, `medium`, `high`, `critical`*

### 8. Get My Requests
**GET** `/my-requests`
*Headers: `Authorization: Bearer <access_token>`*

### 9. Get Request Details
**GET** `/:id`
*Headers: `Authorization: Bearer <access_token>`*

---

## Donations (`/api/v1/donations`)

## Donors (`/api/v1/donors`)

### Get All Donors
**GET** `/`
*Headers: `Authorization: Bearer <access_token>`*

Returns an array of donors with location and basic profile data. Sensitive contact information is restricted: the `contactNumber` field is only included when the authenticated caller has the role `requester` (hospital) or `admin`. Callers with other roles (for example `donor`) will receive donor objects with `contactNumber` omitted.

Example (for `requester`/`admin`):
```json
{
  "success": true,
  "message": "Donors retrieved successfully",
  "data": [
    { "_id": "..", "name": "Alice", "bloodGroup": "A+", "contactNumber": "+123...", "location": { /* ... */ } }
  ]
}
```

### Get Nearby Donors
**GET** `/near?lat=&lng=&radius=`
*Headers: `Authorization: Bearer <access_token>`*

Returns donors within the specified radius (in metres). The same `contactNumber` access rule applies: only `requester` and `admin` receive phone numbers in the response.


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
