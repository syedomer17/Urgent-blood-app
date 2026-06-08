import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
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
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Create') icon = '➕';
          else if (route.name === 'Requests') icon = '📋';
          else if (route.name === 'Donors') icon = '❤️';
          else if (route.name === 'Nearby') icon = '📍';
          else if (route.name === 'Profile') icon = '👤';
          else if (route.name === 'Admin') icon = '⚙️';
          else if (route.name === 'Verifications') icon = '🛡️';
          else if (route.name === 'Hospital') icon = '🏥';
          else if (route.name === 'Requester') icon = '🆘';
          return <Text style={{ fontSize: size }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={getHomeComponent()} />
      <Tab.Screen name="Create" component={CreateRequestScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      
      {isAdmin && (
        <>
          <Tab.Screen name="Admin" component={AdminDashboardScreen} />
          <Tab.Screen name="Verifications" component={VerificationsScreen} />
        </>
      )}

      {isHospital && <Tab.Screen name="Hospital" component={HospitalDashboardScreen} />}
      {isRequester && <Tab.Screen name="Requester" component={RequesterDashboardScreen} />}

      {!isAdmin && !isHospital && !isRequester && (
        <>
          <Tab.Screen name="Donors" component={DonorsScreen} />
          <Tab.Screen name="Nearby" component={DonorsNearMeScreen} />
        </>
      )}
      
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
