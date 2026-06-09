import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function Header({ title, subtitle, rightElement }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement && (
          <View style={styles.rightContainer}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  rightContainer: {
    marginLeft: 16,
  },
});
