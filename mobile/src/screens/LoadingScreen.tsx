import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LifeLink</Text>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    flex: 1,
    gap: 24,
    justifyContent: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
  },
});
