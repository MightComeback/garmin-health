import { StyleSheet, ViewStyle, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from './Themed';

interface ActivityRowProps {
  icon: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  onPress?: () => void;
  style?: ViewStyle;
}

export function ActivityRow({ icon, title, subtitle, stats, onPress, style }: ActivityRowProps) {
  const content = (
    <>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon as any} size={20} color="#007AFF" />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.container, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  stat: {
    marginRight: 24,
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
