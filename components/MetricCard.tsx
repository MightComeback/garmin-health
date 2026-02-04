import { StyleSheet, ViewProps } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from './Themed';

interface MetricCardProps extends ViewProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
  subtitle: string;
  color: string;
}

export function MetricCard({ icon, label, value, subtitle, color, style, ...rest }: MetricCardProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <FontAwesome name={icon} size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
});
