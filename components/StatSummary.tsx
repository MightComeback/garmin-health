import { StyleSheet, ViewProps } from 'react-native';
import { Text, View } from './Themed';

interface StatSummaryProps extends ViewProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export function StatSummary({ label, value, change, positive, style, ...rest }: StatSummaryProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.change, positive ? styles.positive : styles.negative]}>
        {positive ? '↑' : '↓'} {change}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  change: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
});
