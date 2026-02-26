# Frontend Authentication Integration Guide

This guide explains how the frontend integrates with the cookie-based authentication system.

## 🔐 Authentication Flow

### Cookie-Based Authentication
The backend uses **httpOnly cookies** to store JWT tokens. This means:
- ✅ **More secure** - JavaScript cannot access tokens (prevents XSS attacks)
- ✅ **Automatic handling** - Browser sends cookies with every request
- ✅ **No manual storage** - No need to manage tokens in localStorage
- ✅ **CSRF protection** - With `sameSite: strict` cookies

### Token Expiry
- **accessToken**: 1 day
- **refreshToken**: 7 days

## 📁 File Structure

```
client/src/
├── services/
│   └── api.ts              # API client with auto token refresh
├── context/
│   └── AuthContext.tsx     # Auth state management
├── components/
│   └── shared/
│       └── ProtectedRoute.tsx  # Role-based route protection
├── utils/
│   └── authUtils.ts        # Auth helper functions
└── pages/
    ├── LoginPage.tsx
    ├── RegisterPage.tsx
    ├── AdminDashboardPage.tsx
    └── ...
```

## 🔧 Implementation Details

### 1. API Client (`services/api.ts`)

The API client automatically:
- Sends cookies with every request (`credentials: 'include'`)
- Handles 401 errors by attempting token refresh
- Redirects to login when both tokens expire
- Queues failed requests during token refresh

```typescript
// Example usage
import { authApi, userApi, adminApi } from '../services/api';

// Login (sets cookies automatically)
const response = await authApi.login(email, password);
const user = response.data.user; // No tokens in response

// Make authenticated requests
const profile = await userApi.getProfile(); // Cookies sent automatically

// Admin endpoint (requires admin role)
const stats = await adminApi.getStats();
```

### 2. Auth Context (`context/AuthContext.tsx`)

Manages authentication state across the app:

```typescript
const { user, isAuthenticated, login, logout, isLoading } = useAuth();

// Check if user has specific role
if (user?.role === 'admin') {
  // Show admin features
}
```

### 3. Protected Routes

Use `ProtectedRoute` component for role-based access:

```typescript
import { ProtectedRoute } from '../components/shared/ProtectedRoute';

<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={['admin']}>
      <AdminDashboardPage />
    </ProtectedRoute>
  }
/>
```

### 4. Auth Utilities (`utils/authUtils.ts`)

Helper functions for common auth operations:

```typescript
import { isAdmin, isDonor, hasRole, areBloodGroupsCompatible } from '../utils/authUtils';

// Check roles
if (isAdmin(user.role)) {
  // Admin-only features
}

// Check blood compatibility
if (areBloodGroupsCompatible('O-', 'A+')) {
  // Can donate
}
```

## 🔄 Automatic Token Refresh

The system automatically refreshes tokens when they expire:

```
User makes API call
     ↓
accessToken expired? (401)
     ↓
Call /auth/refresh-token
     ↓
refreshToken valid?
     ↓ Yes              ↓ No
New accessToken    Clear cookies
Retry request      Redirect to login
```

**No manual intervention required!**

## 📝 Common Patterns

### Login Flow

```typescript
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };
};
```

### Logout Flow

```typescript
const handleLogout = async () => {
  await logout(); // Clears cookies and user state
  navigate('/login');
};
```

### Check Authentication on App Load

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await userApi.getProfile();
      setUser(response.data);
    } catch (error) {
      // Not authenticated - handled by API client
    }
  };
  checkAuth();
}, []);
```

### Role-Based UI

```typescript
const Header = () => {
  const { user } = useAuth();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/profile">Profile</Link>
      
      {/* Show only for admin */}
      {isAdmin(user?.role) && (
        <Link to="/admin">Admin Dashboard</Link>
      )}
      
      {/* Show only for donors */}
      {isDonor(user?.role) && (
        <Link to="/donations">My Donations</Link>
      )}
    </nav>
  );
};
```

## 🚨 Error Handling

### API Errors

```typescript
try {
  const response = await api.post('/requests', data);
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - already handled by interceptor
    // User will be redirected to login
  } else if (error.response?.status === 403) {
    // Forbidden - user lacks required role
    toast.error('Access denied');
  } else {
    // Other errors
    toast.error(error.message);
  }
}
```

### Network Errors

```typescript
try {
  await authApi.login(email, password);
} catch (error) {
  if (!navigator.onLine) {
    toast.error('No internet connection');
  } else {
    toast.error(parseAuthError(error));
  }
}
```

## 🔒 Security Best Practices

### 1. Never Store Tokens Manually
❌ **DON'T**:
```typescript
localStorage.setItem('token', token); // BAD!
```

✅ **DO**: Let cookies handle it automatically

### 2. Always Use `withCredentials`
```typescript
const api = axios.create({
  baseURL: 'http://localhost:9000/api/v1',
  withCredentials: true, // REQUIRED
});
```

### 3. Validate User Roles
```typescript
// Check role before showing sensitive UI
if (!hasRole(user.role, ['admin'])) {
  return null; // Don't render admin features
}
```

### 4. Handle Session Expiry
The system automatically handles this, but you can add custom logic:

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Show session expired message
      toast.error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);
```

## 🧪 Testing

### Test Login

```typescript
it('should login successfully', async () => {
  const { result } = renderHook(() => useAuth());
  
  await act(async () => {
    await result.current.login('test@example.com', 'password123');
  });
  
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user).toBeDefined();
});
```

### Test Protected Route

```typescript
it('should redirect to login when not authenticated', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <ProtectedRoute requiredRoles={['admin']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    </MemoryRouter>
  );
  
  expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
});
```

## 📊 Admin Features

Admin users have access to:
- Dashboard with statistics
- Blood group distribution charts
- Active requests overview
- Completed donations count
- Average response time metrics

Access via `/admin` route (requires `role: 'admin'`)

## 🌐 Environment Variables

```env
# .env
VITE_API_URL=http://localhost:9000/api/v1
```

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Update VITE_API_URL if needed
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Login with test account**:
   - Email: `admin@example.com`
   - Password: `password123`
   - Role: `admin`

## 📚 API Endpoints

See [auth-api.md](../../server/docs/auth-api.md) for detailed API documentation.

### Quick Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/login` | POST | No | Login user |
| `/auth/register` | POST | No | Register user |
| `/auth/logout` | POST | Yes | Logout user |
| `/auth/refresh-token` | POST | RefreshToken | Get new access token |
| `/users/profile` | GET | Yes | Get user profile |
| `/admin/stats` | GET | Yes (Admin) | Get admin statistics |

## 🐛 Troubleshooting

### Cookies not being sent
- Ensure `withCredentials: true` is set
- Check CORS settings on backend
- Verify API URL matches backend

### 401 errors after login
- Check if token refresh is working
- Verify cookies are being set
- Check browser DevTools → Application → Cookies

### Role-based access not working
- Verify user role in AuthContext
- Check `requiredRoles` prop on ProtectedRoute
- Ensure backend is returning correct role

## 💡 Tips

1. **Use React DevTools** to inspect AuthContext state
2. **Check Network tab** to see cookie headers
3. **Enable browser console** to see API errors
4. **Use toast notifications** for user feedback
5. **Test edge cases** like expired tokens

## 🔗 Related Documentation

- [Authentication API](../../server/docs/auth-api.md)
- [Admin API](../../server/docs/admin-api.md)
- [Backend Setup](../../server/README.md)
