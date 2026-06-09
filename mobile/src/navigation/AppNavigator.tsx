import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlusSquare, ClipboardList, Heart, MapPin, User as UserIcon, Settings, ShieldCheck, Hospital as HospitalIcon, AlertCircle } from 'lucide-react-native';
import { DonorDashboardScreen } from '../screens/DonorDashboardScreen';
import { RequesterDashboardScreen } from '../screens/RequesterDashboardScreen';
import { HospitalDashboardScreen } from '../screens/HospitalDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { DonorsNearMeScreen } from '../screens/DonorsNearMeScreen';
import { DonorsScreen } from '../screens/DonorsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { VerificationsScreen } from '../screens/VerificationsScreen';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthProvider';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  const { user } = useAuth();
  
  const getHomeComponent = () => {
    switch (user?.role) {
      case 'admin': return AdminDashboardScreen;
      case 'hospital': return HospitalDashboardScreen;
      case 'requester': return RequesterDashboardScreen;
      default: return DonorDashboardScreen;
    }
  };

  const isAdmin = user?.role === 'admin';
  const isHospital = user?.role === 'hospital';
  const isRequester = user?.role === 'requester';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarIcon: ({ color, size }) => {
          const iconSize = size - 2;
          switch (route.name) {
            case 'Home': return <Home size={iconSize} color={color} />;
            case 'Create': return <PlusSquare size={iconSize} color={color} />;
            case 'Requests': return <ClipboardList size={iconSize} color={color} />;
            case 'Donors': return <Heart size={iconSize} color={color} />;
            case 'Nearby': return <MapPin size={iconSize} color={color} />;
            case 'Profile': return <UserIcon size={iconSize} color={color} />;
            case 'Admin': return <Settings size={iconSize} color={color} />;
            case 'Verifications': return <ShieldCheck size={iconSize} color={color} />;
            case 'Hospital': return <HospitalIcon size={iconSize} color={color} />;
            case 'Requester': return <AlertCircle size={iconSize} color={color} />;
            default: return <Home size={iconSize} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={getHomeComponent()} 
        options={{ tabBarLabel: 'Home' }}
      />

      {(isRequester || isHospital || isAdmin) && (
        <Tab.Screen 
          name="Create" 
          component={CreateRequestScreen} 
          options={{ tabBarLabel: 'Request' }}
        />
      )}

      <Tab.Screen 
        name="Requests" 
        component={RequestsScreen} 
        options={{ tabBarLabel: 'Explore' }}
      />
      
      {isAdmin && (
        <>
          <Tab.Screen 
            name="Admin" 
            component={AdminDashboardScreen} 
            options={{ tabBarLabel: 'Stats' }}
          />
          <Tab.Screen 
            name="Verifications" 
            component={VerificationsScreen} 
            options={{ tabBarLabel: 'Verify' }}
          />
        </>
      )}

      {isHospital && (
        <Tab.Screen 
          name="Hospital" 
          component={HospitalDashboardScreen} 
          options={{ tabBarLabel: 'Hospital' }}
        />
      )}

      {!isAdmin && !isHospital && (
        <>
          <Tab.Screen 
            name="Donors" 
            component={DonorsScreen} 
            options={{ tabBarLabel: 'Donors' }}
          />
          <Tab.Screen 
            name="Nearby" 
            component={DonorsNearMeScreen} 
            options={{ tabBarLabel: 'Nearby' }}
          />
        </>
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
