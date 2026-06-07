import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { DonorsNearMeScreen } from '../screens/DonorsNearMeScreen';
import { DonorsScreen } from '../screens/DonorsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { theme } from '../theme';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Create" component={CreateRequestScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Donors" component={DonorsScreen} />
      <Tab.Screen name="Nearby" component={DonorsNearMeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
