# LifeLink Frontend Development Guide

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── textarea.tsx
│   │   └── shared/                # Shared layout components
│   │       ├── Header.tsx         # Sticky top navigation
│   │       └── BottomNav.tsx      # Mobile bottom navigation
│   ├── pages/                     # Page components
│   │   ├── Router.tsx             # Main router component
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RequestsPage.tsx
│   │   ├── RequestBloodPage.tsx
│   │   ├── DonorsPage.tsx
│   │   ├── DonationsPage.tsx
│   │   └── UpdateAvailabilityPage.tsx
│   ├── context/
│   │   └── AuthContext.tsx        # Global auth state management
│   ├── hooks/
│   │   ├── useLocation.ts
│   │   └── useRouter.ts
│   ├── services/
│   │   └── api.ts                 # API client configuration
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (button, card, input, label, textarea)
- **Icons**: lucide-react
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
cd client
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Development Server

```bash
pnpm run dev
```

The app will run on `http://localhost:5173` by default.

### 4. Build for Production

```bash
pnpm run build
```

## Features Implemented

### Authentication
- ✅ User Registration (Donor/Requester)
- ✅ User Login
- ✅ JWT Token Management
- ✅ Protected Routes
- ✅ Logout

### Blood Requests
- ✅ View all blood requests
- ✅ Create new blood request (Requester only)
- ✅ Filter requests by status
- ✅ Accept blood donation request (Donor only)
- ✅ View request details

### User Profile
- ✅ View profile
- ✅ Update profile information
- ✅ Update availability status (Donor)
- ✅ View blood group and contact info

### Donors
- ✅ Browse available donors
- ✅ Filter by blood group
- ✅ Filter by availability status
- ✅ View donor ratings and donation count

### Donations
- ✅ View accepted/completed donations
- ✅ Track donation history
- ✅ View statistics on home page

## Mobile-First Design

The frontend is designed with a **mobile-first approach**:

- Default width: 428px (max-w-md)
- Fully responsive for all screen sizes
- Touch-friendly buttons and inputs
- Bottom navigation for mobile
- Clear, simple UI without animations
- Optimized for readability on small screens

### Responsive Breakpoints

- Mobile: < 640px ✅ Primary focus
- Tablet: 640px - 1024px
- Desktop: > 1024px (Optional enhancement)

## Design Philosophy

- **Clean & Simple**: Minimal design, no unnecessary animations
- **Fast Loading**: Optimized for mobile networks
- **Accessible**: Clear typography and high contrast
- **Consistent**: Unified color scheme (Red #DC2626 for primary actions)
- **User-Centric**: Clear CTAs and intuitive navigation

## API Integration

### API Endpoints Used

**Authentication Route** (`/api/v1/auth`)
- POST `/register` - Register new user
- POST `/login` - Login user
- POST `/refresh-token` - Refresh access token
- POST `/logout` - Logout user

**Users Route** (`/api/v1/users`)
- GET `/profile` - Get current user profile
- PATCH `/profile` - Update current user profile

**Requests Route** (`/api/v1/requests`)
- POST `/` - Create blood request
- GET `/` - Get all blood requests
- GET `/my-requests` - Get user's own requests
- GET `/:id` - Get specific request details

**Donations Route** (`/api/v1/donations`)
- POST `/accept` - Accept blood request

### API Error Handling

- Automatic token refresh
- Redirect to login on 401 (Unauthorized)
- User-friendly error messages
- Proper error logging

## State Management

### AuthContext
Manages global authentication state:
- `user` - Current logged-in user
- `isAuthenticated` - Auth status
- `isLoading` - Loading state
- `login()` - Login function
- `register()` - Register function
- `logout()` - Logout function
- `updateProfile()` - Update profile function

## Key User Flows

### 1. New User Registration
1. User visits app → Redirected to `/register`
2. Fills registration form
3. Selects role (Donor/Requester) and blood group
4. Account created → Auto-logged in → Redirected to home

### 2. Donor Finding Blood Request
1. Donor views `/requests` page
2. Sees all blood requests
3. Clicks "Donate Now" on request
4. Request accepted → Added to donations

### 3. Requester Creating Blood Request
1. Requester views `/request` page
2. Fills request form (patient name, blood group, units, urgency)
3. Request created → Appears in all requests list
4. Donors can see and accept it

### 4. Managing Profile
1. User views `/profile` page
2. Can update contact info and location
3. Donors can toggle availability
4. Changes saved immediately

## Color Scheme

- Primary: Red (#DC2626) - Blood donation theme
- Neutral: Gray (#111827, #6B7280, #E5E7EB)
- Success: Green (#16A34A)
- Warning: Orange (#EA580C)
- Error: Red (#DC2626)
- Background: Light Gray (#F9FAFB)

## Typography

- **Font**: System UI / Default sans-serif
- **Display**: Bold text for titles
- **Body**: Regular weight for content
- **Labels**: Small gray text for secondary info

## Performance Optimization

- Lazy loading of heavy components
- Minimal re-renders using proper hooks
- Optimized images (lucide icons)
- Efficient state management
- No unnecessary animations

## Browser Support

- Chrome/Brave (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. **Donors List**: Requires backend `GET /users` endpoint (not yet implemented)
2. **Donation History**: Uses requests with "accepted/fulfilled" status as proxy
3. **Real-time Updates**: Socket.io integration not yet implemented in frontend
4. **Chat/Messaging**: Not yet implemented
5. **Location Services**: Manual address entry only (GPS not integrated)

## Future Enhancements

1. Real-time notifications via Socket.io
2. Direct messaging between donors and requesters
3. GPS-based donor matching
4. Push notifications
5. Payment integration
6. Rating and review system
7. Admin dashboard
8. Analytics and statistics

## Deployment

### Development
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
pnpm run preview
```

### Deploy to Vercel
```bash
vercel
```

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `pnpm install` again

### Issue: API calls failing
**Solution**: Check VITE_API_URL environment variable and ensure backend is running

### Issue: Styling not applied
**Solution**: Check Tailwind CSS configuration in vite.config.ts

### Issue: Auth token not persisting
**Solution**: Check browser localStorage and cookie settings

## Support & Contact

For issues or questions, please refer to the main project README.
